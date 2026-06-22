---
layout: post
title: "Moving from N Users to N Robots"
date: 2026-06-22 12:00:00+0530
description: RAM now handles multiple user applications — this week the work shifted to making the robot side symmetric too.
tags: [gsoc, jderobot, ros2, ram, multi-agent]
categories: [weekly-update]
---

This week the work shifted from supporting multiple users to supporting multiple robots — making RAM symmetric on both sides. Here's where things stand.

---

## Where we started: N applications (AgentGroup)

A couple of weeks back I added support for running multiple user applications at once — the cat-and-mouse exercise needs two programs running together (the cat the student writes, and a pre-programmed mouse). Instead of teaching RAM's state machine about "two agents," I wrapped the agent processes in a small `AgentGroup`. The state machine still fires one trigger — play, pause, reset, stop — and the group fans that operation out over every process inside it.

So one application or five, the lifecycle code is the same: `pause_all`, `resume_all`, `kill_all`. The finite state machine never had to change. That kept things clean and meant single-agent exercises kept working exactly as before.

---

## Cleaning up the PR review

The cat-and-mouse PRs went through review and a few good points came back from the maintainers. The big one: the drone was being defined inline inside the world file (hundreds of lines), and the mentors wanted it as its own model that the world just includes.Fixed moved the drone model out into its own files, and the world file dropped from ~370 lines to ~75.

There was also a round of merge conflicts as upstream kept moving — mostly database id clashes (a new exercise upstream grabbed the same id as mine), which I resolved by bumping the cat-mouse ids out of the way.

---

## Now: N robots

RAM handles N user programs, but robots were still added by hand, one at a time, in the world file. So I started on the robot side.

The approach mirrors the agent one, but the mentors suggested keeping it as a list rather than a wrapper class: turn the single robot launcher + config into a list of robot launchers + configs. Each robot in the list has its own entity, `launch_file_path`, and `start_pose`, while the robot type stays shared across all of them. The manager just loops the list. And since spawning N robots one by one is slow, the spawn runs in parallel — a thread per robot.

---

## The tricky part: Gazebo reset

The interesting problem here is reset. If you spawn a robot into Gazebo at runtime and then call the world reset, Gazebo wipes anything that wasn't in the world at load time — so the robot disappears and never comes back. And you can't reset the robot entity directly either; doing that segfaults.

The clean answer is already baked into how RAM is structured: robots are spawned by the `robot_launcher`, and RAM re-runs the `robot_launcher` on reset. So reset becomes: kill each robot's launcher → reset the (now empty) world → relaunch each robot. The robot comes back fresh, no direct entity reset, no segfault. Moving from one robot launcher to a list of them means this same proven reset flow just loops over all N robots — nothing about the logic changes, it only fans out.

---

## What's next

- The robots config comes from the database — so the next piece is letting a universe describe several robots (shared type, per-robot entity + start pose) and the backend handing RAM a robots list.
- Testing with the F1 car on a circuit (simpler than drones — no full autonomy stack), spawning two cars and checking play / pause / reset all behave for both.
The end goal is full symmetry — N applications running against N robots, all driven from config, with the state machine left untouched.
