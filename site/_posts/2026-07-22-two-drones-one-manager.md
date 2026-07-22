---
layout: post
title: "Two Drones, One Manager, and a Lot of Things That Were Only Pretending to Work"
date: 2026-07-22 12:00:00+0530
description: Week 12 — finding the parts of the pipeline quietly held together by assumptions, and fixing them one by one.
tags: [gsoc, jderobot, ros2, ram, multi-agent, gazebo]
categories: [weekly-update]
---

This week was less about writing new features and more about finding out which parts of the pipeline were quietly held together by assumptions. By the end, two drones are flying from two independent agent processes, and the path that gets them there doesn't care whether it's two or ten.

---

## We launched cat-and-mouse and got three drones

Two of them sitting inside each other.

The world SDF baked into the container image still had `cat_mouse_drone0` and `cat_mouse_drone1` as `<include>` entries, while the database was also asking for two quadrotors — so we ended up with four total.

---

## The review that actually made the design better

I'd put the multi-robot logic in `manager.py`: uniquify the entity names, start every launch, then one polling loop waiting for all the entities to appear in Gazebo. It worked. Javier's review came back with three comments, and each one was right.

**"The main file of the RAM is sim agnostic. These imports must not be here."**

I had `from gz.transport13 import Node` at the top of the manager. The manager orchestrates; it isn't supposed to know Gazebo exists. That import quietly made the whole state machine Gazebo-only.

**"Inside of launcher_robots not here."**

The waiting and the renaming belong to the layer that owns robots, not to the orchestrator calling it.

**"Use entrypoint to add the processB stuff. This should just be treated as another entrypoint."**

This was the big one. I'd been detecting a `processB/` folder by probing the filesystem — one hardcoded path, capped at exactly two agents.

I moved the Gazebo polling into `launcher_robot_ros2_api.py` and gave each robot its own `wait()`. He came back again: one loop per robot means N sequential loops, which quietly undoes the parallelism the whole design was built for. The final shape:

```
manager              -> LauncherRobot.wait_for(launchers)   # one call, no gz
LauncherRobot        -> gathers every entity, delegates once
LauncherRobotRos2Api -> single poll loop ticking off the list
```

Start every launch, then wait for all of them together. Spawn time is `max(one robot)` instead of `sum(all robots)`, and the manager never imports a simulator.

---

## The namespace that wasn't where I thought it was

Two identical quadrotors arrive from the database as two identical configs. The entity is a top-level field, so uniquifying it is straightforward: `drone`, `drone_1`. I shipped that and both drones spawned fine.

Then I looked at the ROS topics. Both were publishing to `/model/drone/cmd_vel`.

The namespace isn't a field — it lives buried inside a string:

```
extra_config: "sensor:=camera namespace:=drone"
```

My uniquify loop was looking for a `namespace` key, found nothing, and silently did nothing every single time. The Gazebo models were distinct, but the ROS graph was a collision. Now it pulls the value out with a regex and writes it back, with entity and namespace uniquified independently — a robot can have one and not the other, and a clash in one doesn't imply a clash in the other.

---

## The schema moved under me

Mid-week, upstream replaced `instances` (a count) with `poses` (a list) on the world-robot relation, and dropped `start_pose` from scenes. It's a better model — the number of poses is the number of robots, so the count and the placement can never disagree. They also independently fixed a dict-aliasing bug I'd found in `views.py`, where every instance was sharing one dict and every robot ended up with the last pose — which is exactly why my two drones had been spawning on top of each other.

---

## Making N actually mean N

The last piece was removing all the hardcoded twos. The browser now scans the exercise's helper folders for any directory carrying its own copy of the entrypoint, and sends an entrypoint list. RAM launches one process per entrypoint and names each agent after its folder:

```
/workspace/code/academy.py           -> academy   (the student's cat)
/workspace/code/drone_1/academy.py   -> drone_1   (the mouse)
```

`processA` / `processB` are gone as concepts. Adding a third robot is now two data edits — one more pose in the database, one more folder in the exercise — with no code change in RAM or the frontend.

---

The pipeline is cleaner than it was at the start of the week, and the assumptions are a lot more explicit. Two drones, one manager, and N is actually N now.
