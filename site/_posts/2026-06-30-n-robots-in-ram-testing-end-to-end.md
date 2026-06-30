---
layout: post
title: "N Robots in RAM — Testing It End to End"
date: 2026-06-30 12:00:00+0530
description: Last week I designed the N-robots list approach. This week I wired it through the full stack, tested it with two F1 cars, and fought through every bug along the way.
tags: [gsoc, jderobot, ros2, ram, multi-robot, namespacing]
categories: [weekly-update]
---

Last week I laid out the design — turn RAM's single robot launcher into a list, fan out every lifecycle action over that list. This week I actually wired it through the full stack (database → Django → React → ide-interface → RAM), tested it with two F1 cars on a circuit, and hit every bug the system had to offer. Here's the full story.

---

## Where I started

The **N users** side was done — I had fully tested it and the PRs got merged successfully. That part was solved.

What it did *not* do was put **N robots inside one simulation**. One world, one robot. If I wanted two cars on the same track, or a cat drone chasing a mouse drone, the only way was to hand-edit the world file and bolt the second robot in manually. No automation, no config, no way for the manager to know there was more than one robot to launch, pause, reset, or kill.

This is the story of moving from *N users* to *N robots* — the bugs I hit, how I chased them down, and how the final design ended up clean.

---

## The mental model first

Before I get into the bugs, let me lay out the shape of the system. A robot showing up in the simulation is the end of a chain that starts in the database. There are basically five layers, and **only one of them needed to grow a loop**:

1. **Database** — a *universe* points at one robot *type* and a world. The world carries a `start_pose`. I decided: **N poses in `start_pose` = N robots.** No new robot table, no per-robot rows. Just a list of poses.
2. **`views.py`** (`get_docker_universe_data`) — reads those poses, and instead of returning one robot, returns a `robots` **list**: same type for every entry, but each gets its own `entity` (`f1_0`, `f1_1`, …) and its own single pose.
3. **`api.ts`** (React frontend) — forwards `universe.robots` through to the launch message.
4. **`jderobot-ide-interface`** — the package that actually assembles the `launch_world` websocket message. It had to learn to carry the `robots` list.
5. **RAM (the manager)** — receives `launch_world`, and **this is the only place that loops.** One launcher per robot, spawned one after another.

The reason I kept the loop in exactly one place is the finite state machine. RAM is a state machine (`idle → connected → world_ready → tools_ready → application_running → paused`). I did **not** want to touch the states. So instead of a single `robot_launcher` and a single `robot_config`, RAM now holds a **list** of launchers and a **list** of configs, and every lifecycle action — launch, reset, pause, terminate — just fans out over the list. The states never knew anything changed.

That symmetry is the whole trick: the same way RAM already handled a *group of agents* (N user applications) on the software side, it now handles a *list of robots* on the simulation side. Same idea, mirrored.

---

## The bugs, in the order they hurt

### 1. The robot list vanished before it ever reached RAM

First test with two robots: only one car spawned. The database had two poses. `views.py` was correctly building a two-entry `robots` list. But the second car simply never existed.

The list was being **dropped on the way through the frontend.** `api.ts` returned `world`, `robot`, `tools` — but not `robots`. And even after I added it there, the `jderobot-ide-interface` package was assembling the final `launch_world` message *without* the `robots` field. Two separate layers were silently discarding it.

**How I debugged it:** I logged the actual `launch_world` payload arriving at RAM. The `robots` key wasn't there at all — which meant the problem was upstream of RAM, not inside it. Then I walked the value backwards: present in `views.py`, present after `api.ts`, *gone* after `ide-interface`. That pinned the culprit.

**Fix:** I added `robots: response.data.universe.robots` in `api.ts`, and patched `ide-interface` to copy `robots: universeConfig.robots` into the `universe_config` it builds. (The `ide-interface` fix is a separate JdeRobot package — locally it's a `node_modules` patch, and the real fix has to land upstream.)


### 2. Spawning robots in parallel hung the whole launch

The naive optimization I tried: if I have N robots, spawn them all at once in threads. I wrote a `_run_robots_parallel` that fired each launcher on its own thread.

It hung. The launch never finished, the state machine sat in `world_ready` forever.

The launch path is not thread-safe — `ros2 launch`, the gz spawn handshake, the bridge bring-up all stepping on each other. **Fix: I reverted to sequential.** `_run_all_robots()` just loops and runs each launcher one after the other, waiting for each robot's entity to actually appear in the scene before moving to the next. Slower, but correct, and "correct" wins when the alternative is a deadlock.

### 3. Two poses on a *real* exercise broke that exercise

This is the one that ate a full day. After the multi-robot plumbing was in, *follow_line* — a normal single-car exercise — started failing. The car spawned but the student HAL couldn't talk to it.

I was *sure* it was the new code. It wasn't. The root cause: I had set **Simple Circuit (world 23)**, follow_line's actual production world, to **two poses** while testing. Two poses means `views.py` names the robots `f1_0` and `f1_1`. But the follow_line HAL is hard-wired to talk to `/f1/`. Rename the entity to `f1_0` and every topic the student code expects (`/f1/cmd_vel`, `/f1/odom`, camera) is suddenly under `/f1_0/` instead. The car was fine. The *namespace* moved out from under the HAL.

**Fix, and the lesson:** never repurpose a real exercise's world for multi-robot testing. I reverted world 23 to a single pose and created a **dedicated "F1 Two Cars Test" universe (id 73)** for all two-car work. Rule of thumb I've baked into my notes now: *a real exercise world must always have exactly the number of poses its HAL expects.*

### 4. Namespacing — making N robots not stomp on each other

Once the list reached RAM and N launchers fired, all N robots published to the **same topics**. Two cars both publishing `/F1ROS/cmd_vel`, both spawning a model named `f1`, both running a `robot_state_publisher` with no namespace. Total collision.

This was the actual *robotics* problem and not just plumbing, so it's worth explaining properly:

- **`entity` becomes the namespace.** Each robot's `entity` (`f1_0`, `f1_1`) is used as both its gz model name *and* its ROS namespace. One value, one identity, everywhere.
- **I render the xacro once per robot**, with a `namespace` argument passed in. It's *not* a loop inside the xacro — I render the whole robot description fresh for each instance, substituting the namespace. So the camera topic becomes `/$(arg namespace)/cam_f1/image_raw`, the laser becomes `/$(arg namespace)/f1/laser/scan`, cmd_vel and odom become `/$(arg namespace)/F1ROS/...`.
- **I render the bridge YAML per namespace too** — every topic in `f1_renault.yaml` gets prefixed with `/<ns>` before the ROS↔gz bridge starts.
- **The spawn uses `-name <ns>` and `-topic /<ns>/robot_description`**, and `robot_state_publisher` runs under `namespace=ns`.

Result: `/f1_0/...` and `/f1_1/...`, fully isolated, no collisions. `ros2 node list` shows each car with its own `robot_state_publisher`, `ros_gz_bridge`, and `ros_gz_image`. I rewrote the launch file to take `entity` as a launch argument and thread it through all of the above.

RAM passes this down with a single addition in `launcher_robot_ros2_api.py`: `entity:=<entity>` on the `ros2 launch` command. I checked that this is safe even for robots whose launch files don't declare `entity` — `ros2 launch` ignores undeclared arguments — so it didn't break any existing single-robot exercise.

### 5. Reset with N robots would have segfaulted

This was the subtlest design question, and it's why the *list of launchers* matters and not just a list of configs.

I can't reset robots by telling gz to reset the world. Runtime-spawned entities don't survive a gz world reset cleanly — it **segfaults**. The way single-robot reset already worked was: the `robot_launcher` runs the ROS launch on *start*, and runs it *again* on reset, respawning the robot fresh. So reset is really "tear down, then re-launch."

For N robots, the only honest generalization is: keep a **list** of robot launchers. On reset:
1. Loop the list and **terminate every robot.**
2. Do the world reset (now safe — nothing runtime-spawned is left to choke on).
3. Loop the list and **re-launch every robot** via `_run_all_robots()`.

If I'd only kept a list of *configs* and a single launcher, I couldn't tear down and rebuild each robot independently. The launcher *is* the per-robot handle. So `manager.py` holds `self.robot_launchers = []` and `self.robot_configs = []`, and `reset_sim`, `terminate_universe`, `disconnect`, and `shutdown` all just loop the list. The FSM's `reset` rule never changed — it still calls one `reset_sim`; that method just does N things now.

---

## How it finally works

Two F1 cars, on `follow_line`, via the "F1 Two Cars Test" universe:

1. **DB**: universe 73 → world with **two poses** in `start_pose`.
2. **`views.py`** reads two poses → builds `robots = [{entity: f1_0, pose: …}, {entity: f1_1, pose: …}]`, same type for both. (`robot = robots[0]` is kept for backward compatibility with single-robot exercises.)
3. **`api.ts`** forwards `robots`. **`ide-interface`** packs it into `universe_config`. The `launch_world` message arrives at RAM carrying the full list.
4. **RAM `on_launch_world`** reads `robots`, builds one `LauncherRobot` per entry into `self.robot_launchers`, then `_run_all_robots()` spawns them **sequentially**, each waiting until its entity is in the scene.
5. Each launch renders the **f1 xacro and bridge YAML with its own namespace** (`entity`), spawns the model, brings up a namespaced bridge and state publisher.
6. Result: `/f1_0/*` and `/f1_1/*`, two cars on the track, no collisions. Pause, resume, reset, and shutdown all loop the list. The state machine is untouched.

I staggered the two starting poses along the straight (same lane, 3 m apart in the track direction) so both cars sit on the road instead of one ending up in the grass.

---

## What's left

- Right now spawning is **sequential** — works fine for two robots, but it won't scale. Imagine 1000 robots spawning one after another. Next I want to figure out the thread-safety issues and move this to **parallel** spawning.
- The current design ships **one robot type for all N robots**, which matches my immediate use cases (two identical cars, two drones). Mixed types per universe would be a future extension.

---

## Footnote: a broken legacy solution I tripped over

While cross-checking the cat-and-mouse solutions in `RoboticsAcademy-solutions`, the legacy ROS1 mouse (`teleoperated_mouse.py`) is broken as-is:

- **Mixed tabs and spaces** in the main loop → `IndentationError`.
- **`Frequency` is never imported**, yet `Frequency.tick()` is called.
- It's written against **ROS1 `DroneWrapper`, not the HAL** the current RADI exercise uses.

It's the old ROS1 file, superseded by the RADI web-template version — but worth flagging since it won't run if anyone picks it up by mistake.
