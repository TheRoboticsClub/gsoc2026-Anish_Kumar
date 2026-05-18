---
layout: post
title: "Community Bonding: Platform Architecture & Multi-Agent Proposal"
date: 2026-05-18 12:00:00+0530
description: Deep dive into JdeRobot's three-repo platform architecture and a concrete proposal for multi-agent support in RAM.
tags: [gsoc, community-bonding, jderobot, ros2, ram]
categories: [weekly-update]
---

GSoC 2026 community bonding week — spent time deep diving into JdeRobot's platform architecture before touching any exercise code.

---

## Three repos, one platform

JdeRobot splits into three clean layers.

**RoboticsAcademy (RA)** is the web interface — Django backend, React frontend, PostgreSQL.

**RoboticsInfrastructure (RI)** is the simulation substrate — Gazebo worlds, SDF models, ROS 2 launch files, drone packages.

**RoboticsApplicationManager (RAM)** is the conductor — a Python state machine on WebSocket port 7163 that drives the full exercise lifecycle from `Launch` to `Stop` to `Reset`.

---

## The exercise: Drone Cat-Mouse Chase

Two drones in the same Gazebo world. Student programs the cat. Mouse follows a pre-programmed path. Cat has to catch it.

The challenge is making two independent agents — one student-controlled, one pre-programmed — work together cleanly inside a platform that currently assumes a **single agent per exercise**.

---

## Multi-agent architecture proposal

Current RAM has one `application_process` — the student's code. For cat-mouse, the mouse needs to run alongside the student's cat code, starting and stopping together on every Play/Stop cycle.

**Proposal:** add a `companions` list to RAM. Companions are pre-programmed agent processes that start when the student clicks Run and stop when they click Stop. Mouse node becomes a companion. Config comes from the exercise universe entry — no RAM state machine changes needed, fully backward compatible with all existing exercises.

This generalises cleanly to any future multi-agent exercise:

| Exercise | Student controls | Companions |
|---|---|---|
| Drone Cat-Mouse | cat drone | `mouse_node` |
| Formation Flying | leader drone | `follower × N` |
| Multi-robot Warehouse | planner | `executor × N` |
| Cooperative Search | coordinator | `searcher × N` |

Same pattern every time — one student agent, N pre-programmed peers. The companions mechanism handles the N peers uniformly regardless of robot type or domain.

---

## Exercise lifecycle end-to-end

### Launch click
- Gazebo loads → both `drone0` and `drone1` models spawn in world
- Both AS2 stacks start (platform + state estimator + motion controller for each)
- Both drones sitting on ground, armed, ready

### Run click
- RAM starts companions list → `mouse_node` starts as companion process
- RAM starts `academy.py` (student cat code)
- `mouse_node`: takeoff `drone1` → reaches target height → begins pre-programmed path
- `academy.py`: student cat code runs → takeoff `drone0` → starts chasing mouse position

### Chase
- `mouse_node` drives `drone1` via `/drone1/*` topics → circle / sin wave / figure-8 path
- Student cat code reads `/drone1/odometry` for mouse position → computes pursuit → drives `drone0` via `/drone0/*` topics
- Fully decoupled, namespace-isolated, no interference

### Stop click
- RAM kills `academy.py` **and** all `companion_processes` together
- Both drones stop
- `gz reset` → both snap to spawn positions
- Back to `tools_ready`

### Play again
- RAM spawns fresh `companion_processes` → `mouse_node` restarts, `t=0`, path from beginning
- RAM spawns fresh `academy.py` → cat code restarts clean
- No stale timer, no stale state anywhere

---

## Why not put mouse_node in the launcher?

The old approach — mouse_node inside the Gazebo launcher — means RAM never gets a handle on it. It never gets killed on Stop, never restarts cleanly on Play.

The companions list gives RAM **full ownership of the lifecycle**: killed and restarted on every Play/Stop cycle, same as the student's code. No stale state. No manual cleanup. Works the same way for any future multi-agent exercise with any number of companion agents.
