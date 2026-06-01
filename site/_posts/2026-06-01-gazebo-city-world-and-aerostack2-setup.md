---
layout: post
title: "Gazebo City World & Aerostack2 Setup"
date: 2026-06-01 12:00:00+0530
description: Built a custom city environment in Gazebo Harmonic, spawned drones, and set up Aerostack2 as the flight control framework for the Cat-Mouse exercise.
tags: [gsoc, jderobot, gazebo, aerostack2, ros2, drone-simulation]
categories: [weekly-update]
---

This week I worked on getting the simulation environment ready — built a custom city world, got drones flying in it, and wired up Aerostack2 as the flight stack.

---

## Building My City

The Cat-Mouse exercise needs a visually rich environment, not just a flat ground plane. So I modeled a full urban city in **Blender** and exported it as a `.glb` mesh for **Gazebo Harmonic**. I'm calling it **my_city_v3**.

I added buildings of varying heights, a road network with highways and intersections, parking lots, a river cutting through the city, trees scattered around, schools, and even cars on the roads. Basically I wanted a miniature city that gives the drones something meaningful to fly around in.

I loaded the mesh as a static model in the SDF world — static so Gazebo doesn't waste physics cycles on it, but with a collision mesh so drones bounce off buildings if they crash.

---

## Drones Spawned

I spawned two quadrotors in the city — one for the cat, one for the mouse. Both use the **quadrotor_base** model which I set up with four rotors, an IMU with realistic noise parameters, and a forward-facing camera (1280×720, 30 Hz, 90° FOV).

I made the drones namespace-isolated — all cat topics go through `/drone_cat/*`, all mouse topics through `/drone_mouse/*`. Only `/clock` is shared so both drones see the same simulation time.

---

## Aerostack2 — Why I Went With It

With drones in the world, the next thing I needed was a flight stack. Raw velocity commands work for quick testing, but for a proper exercise with takeoff sequences, state estimation, and motion control, I needed something more structured.

I went with **Aerostack2** — it's a ROS 2 framework for autonomous multi-aerial-robot systems, developed at Universidad Politécnica de Madrid. It's natively built on ROS 2, designed for multi-drone scenarios, and has clean modularity — I can swap any component without touching the rest.

Why I picked it for the Cat-Mouse exercise:

- **Multi-drone native** — built for N drones from the start, not retrofitted
- **Platform independent** — same code works in sim and on real hardware
- **Fully modular** — state estimator, motion controller, and platform layer are all swappable plugins
- **Clean Python API** — students interact through simple calls like `takeoff()`, `get_position()`, `set_cmd_vel()` without touching raw ROS 2 topics

I gave each drone its own independent AS2 stack: a **platform layer** that bridges to Gazebo, a **PID motion controller** that tracks velocity references, a **state estimator** that publishes localization from ground truth, and a **behaviors layer** that handles arming and takeoff/land sequences. Both stacks run in parallel, fully isolated by namespace.

---

## Initial Setup Demo

Here's a quick video of the initial Gazebo city world with the drones spawned and ready:

<div style="margin: 1.5rem 0;">
  <video width="100%" controls style="border-radius: 8px;">
    <source src="{{ '/assets/video/gazebo-city-initial-setup.webm' | relative_url }}" type="video/webm">
  </video>
</div>

---

## What's Next

The simulation substrate is ready — city world loaded, drones spawned, Aerostack2 configured. Next I'll be working on the **chase algorithms and logic** — the mouse's autonomous path generation and the cat's pursuit controller.
