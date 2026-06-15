---
layout: post
title: "Getting the Drone Cat-and-Mouse Exercise into Robotics Academy"
date: 2026-06-13 12:00:00+0530
description: Full integration of a two-drone chase exercise into RAM — database wiring, multi-process launch, and seven bugs debugged in order.
tags: [gsoc, jderobot, ros2, aerostack2, debugging, multi-agent]
categories: [weekly-update]
---

I've been working on this integration for the past few weeks — getting the drone cat-and-mouse exercise properly wired into Robotics Academy has been one of the bigger pieces of the project. Along the way I ran into a bunch of bugs, some obvious and some not at all, and I wanted to document them here as I worked through them.

The goal was straightforward: get the exercise running inside Robotics Academy, wired into RAM, launchable from the UI. In reality that meant seeding the database, fixing the launch files, and working through bugs that only reveal themselves once both drones are actually running at the same time.

Here's what it looks like now:

<video width="100%" controls>
  <source src="{{ '/assets/video/drone_cat_chase.webm' | relative_url }}" type="video/webm">
</video>

---

## How exercises actually plug into RAM

Before getting into the bugs, it helps to understand how Robotics Academy works under the hood. You don't run exercise code directly — the browser uploads a zip to RAM, and RAM handles everything: launch the world, spawn the robots, start the GUI tools, then run your code as a managed process. 

For cat-and-mouse I used RAM's two-process model that we built in the previous weeks. The **cat** is the student's code (`academy.py`), and the **mouse** is a pre-programmed agent RAM launches from a `processB/` folder. RAM extracts the zip into `/workspace/code`, starts `academy.py` as agentA, and if `processB/academy.py` exists it starts that as agentB.

## Getting the database to recognise the exercise

The first step before anything else is seeding the database — if Robotics Academy doesn't know the exercise exists, nothing else matters. I wrote an idempotent `copy_drone_cat_mouse.sh` script that creates the full chain of linked rows: an **exercise** row (`id=27`, `exercise_id='drone_cat_mouse'`, tagged `MULTI-AGENT`), a **world** row pointing at the launch file, a **universe** row linking the world, an **exercises_universes** row marking it the default, and **exercises_tools** enabling the console, simulator, and web GUI. The script ends with a join query that prints the whole chain so I can see in one glance that the exercise actually resolves to the right launch file.

## One rule that kept things sane

Don't touch the shared packages. `drone_wrapper.py`, the RAM state machine, and the AS2 stack are used by every other drone exercise. Any change I made there could break something that was already working. So I kept all exercise-specific logic inside cat-and-mouse's own `HAL.py` files and made any RAM edits exercise-agnostic — changes that work for N agents and any world name, not changes hardcoded for this one exercise.

---

## The bugs (in the order they hit me)

### The second drone was driving the first drone's motors

Both drones armed. Both showed FLYING. Rotors on both were spinning. But drone1 just sat there on the ground and didn't move.

I ran `ros2 node info /drone1/platform` and looked at its publishers. It was publishing to `/gz/drone0/cmd_vel` — drone0's Gazebo plugin — not its own `/gz/drone1/cmd_vel`. Drone1 was working fine, it was just sending all its effort to the wrong place.

After digging through the aerostack2 launch files and spending some time searching through ROS2 launch system docs and community threads, I found the cause. The `platform_gazebo_launch.py` declares `cmd_vel_topic` via `DeclareLaunchArgument` inside an `OpaqueFunction`. What I didn't realise is that all included launch files share one global `LaunchContext` — it's essentially a single dictionary for the entire launch tree. `DeclareLaunchArgument` behaves like `dict.setdefault`: it only sets the value if the key doesn't already exist. So drone0 runs first, writes `cmd_vel_topic = /gz/drone0/cmd_vel` into the dict, and when drone1 tries to register its own value, the key already exists and the assignment is silently skipped. Drone1 ends up with drone0's topic.

This is genuinely easy to miss because the ROS2 runtime namespace system (what gives you `/drone0/` and `/drone1/` isolated topics and nodes) works completely correctly. It's only the launch argument dict that has this shared-global behaviour. Most people never hit it because multi-robot setups usually run each robot as a separate `ros2 launch` command — separate processes, separate dicts, no collision.

Fix: I modified `as2_default_gazebo_sim.launch.py` to launch `as2_platform_gazebo_node` directly from inside an `OpaqueFunction`, computing the topic names as plain Python strings and passing them straight into `Node(parameters=[...])`. They never enter the global launch dict at all. I'm also raising this upstream as a scalability issue in aerostack2's Humble launch files.

---

### The mouse process died immediately on import

As soon as RAM launched agentB, it crashed: `ModuleNotFoundError: No module named 'hal_interfaces'`.

I checked the extracted folder layout. `hal_interfaces` lives at `/workspace/code/` — but `processB/academy.py` runs from `/workspace/code/processB/`. Python adds the script's own directory to `sys.path`, not its parent. From `processB/`, the shared commons in the parent folder are invisible.

Fix: in `manager.py` I inject `PYTHONPATH=/workspace/code` into agentB's environment when creating its `Popen`. Same import experience as agentA, no changes to the exercise files themselves.

---

### Takeoff was throwing "Task got bad yield"

Both agents were crashing during `takeoff()` with a `RuntimeError: Task got bad yield`. The traceback pointed at `asyncio.run()` wrapping a state-machine service call. rclpy Futures use `yield self` in their `__await__`, which asyncio's event loop doesn't know how to drive.

Fix: in the exercise's `HAL.py` I wrote a small `_call_state_event()` that calls the service with `call_async()` and polls `future.done()` in a plain loop, letting DroneWrapper's 20 Hz spin thread do the resolving. No asyncio, no crash. The shared `DroneWrapper` stays untouched.

---

### The cat reached FLYING but never moved toward the mouse

This one took the longest to figure out.

The cat armed, took off, reached the correct altitude, state machine said FLYING — and then just hovered there. `ros2 topic hz /drone0/motion_reference/twist` showed nothing being published. `ros2 topic echo /drone0/controller/info` showed the controller stuck in HOVER mode. The process wasn't dead — I checked `/proc/<pid>/task/*/wchan` and the main thread was just sleeping in its loop.

To narrow it down, I killed the cat code entirely and ran a small standalone script: create a fresh `DroneWrapper("drone0")`, call `set_cmd_vel`. It switched to SPEED mode in 0.7 seconds, no problem. So the drone stack was fine. The problem was something specific to the cat exercise setup. The only thing cat had that the working mouse didn't was a mouse-position subscriber.

Here's what was happening. When I added mouse tracking I gave it a dedicated `MultiThreadedExecutor` with `.spin()` running in its own thread — the reasoning being "the pose topic publishes at ~80 Hz, better give it a dedicated worker so it never misses an update." In C++ that would be reasonable. In Python, the GIL means only one thread runs Python at a time. `MultiThreadedExecutor.spin()` is a blocking, full-speed loop with no sleep. So that thread was holding the GIL almost continuously, starving DroneWrapper's 20 Hz background thread — the one that receives `controller/info` callbacks. AS2's motion handler won't publish velocity commands until its internal `current_mode_` (which gets updated by that callback) reads SPEED. With the callback starved, `current_mode_` stayed at HOVER, the mode-switch wait timed out after 5 seconds, and `set_cmd_vel` returned silently without doing anything. The "stuck in HOVER" symptom was a consequence, not the root cause.

Fix: moved the mouse tracker onto the cameras' existing executor, which uses `spin_once(timeout_sec=0) + time.sleep(1/30)`. It yields the GIL every cycle. DroneWrapper's thread gets to run, `controller/info` flows, and `set_cmd_vel` publishes immediately. The lesson: it wasn't the executor type that was the problem, it was the greedy `.spin()` with no yield.

---

### The cat was chasing a fixed point in space

Once the cat was actually moving, it flew toward a single fixed location rather than tracking the mouse.

I ran `ros2 topic echo /drone1/self_localization/pose` — nothing. Added `--qos-reliability best_effort` — data started printing. Then `ros2 topic info /drone1/self_localization/pose -v` confirmed it: the publisher was BEST_EFFORT. My subscriber was using the default QoS profile which is RELIABLE. Those two are incompatible; zero messages were delivered, and `get_mouse_position()` kept returning its initialised default coordinates.

Fix: subscribe with `qos_profile_sensor_data` (BEST_EFFORT). After that the position updated live with every frame.

---

### Stop left both drones coasting

Pressing Stop in the GUI didn't actually stop the drones — they kept moving on their last velocity command.

The issue was in `on_terminate_application`: the order was kill the processes, then pause the simulator. Between those two steps the drones still had momentum from their last command and Gazebo's physics kept running. Swapping the order — pause the sim first, then kill processes, then reset — freezes everything instantly at the moment Stop is hit. Works for any exercise, not just this one.

---

### Pause and Reset were silently doing nothing

Pause appeared to work but didn't actually freeze the drones. Reset only reset drone0.

I ran `gz service -l` and compared it against what the code was calling. The gz control calls in `launcher_gzsim.py` were hardcoded to `/world/default/control`. This exercise's world is `my_city_world`. The calls were hitting a service that didn't exist and failing silently. And `reset()` was hardcoded to call `/drone0/...` services — drone1 was completely ignored.

Fix: I added `_find_drone_namespaces()` which scans `ros2 service list` for all `*/platform/state_machine/_reset` services and resets every one — it doesn't care how many drones are running or what the world is named.

---

## Files changed

- `RoboticsAcademy/exercises/drone_cat_mouse/python_template/HAL.py`
- `RoboticsAcademy/exercises/drone_cat_mouse/python_template/academy.py`
- `RoboticsAcademy/exercises/drone_cat_mouse/python_template/processB/{HAL.py,academy.py}`
- `RoboticsApplicationManager/.../manager/manager.py`
- `RoboticsApplicationManager/.../manager/launcher/launcher_gzsim.py`
- `RoboticsInfrastructure/jderobot_drones/launch/as2_default_gazebo_sim.launch.py`
- `RoboticsInfrastructure/Launchers/drone_cat_mouse.launch.py`

---

## Where it stands

The exercise launches cleanly from the Robotics Academy UI, both drones spawn and take off, the cat tracks and chases the live mouse, and Stop / Pause / Reset all behave correctly for both drones.

Updated PRs with the latest commits:

- **[RoboticsAcademy #3872](https://github.com/JdeRobot/RoboticsAcademy/pull/3872)**
- **[RoboticsApplicationManager #284](https://github.com/JdeRobot/RoboticsApplicationManager/pull/284)**
- **[RoboticsInfrastructure #742](https://github.com/JdeRobot/RoboticsInfrastructure/pull/742)**
