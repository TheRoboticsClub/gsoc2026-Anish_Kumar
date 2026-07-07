---
layout: about
title: about
permalink: /
subtitle: GSoC 2026 Contributor @ <a href='https://jderobot.github.io/'>JdeRobot</a> · Drone Cat-Mouse Chase Exercise

profile:
  align: right
  image: prof_pic.jpg
  image_circular: true
  more_info: >
    <p>GSoC 2026 · JdeRobot · Robotics Academy</p>

selected_papers: false
social: true

announcements:
  enabled: false

latest_posts:
  enabled: true
  scrollable: true
  limit: 3
---

I'm Anish Kumar, a GSoC 2026 contributor working with [JdeRobot](https://jderobot.github.io/) on multi-agent robotics infrastructure for RoboticsAcademy.

---

This project scales JdeRobot's RoboticsAcademy to support multi-agent exercises — moving the platform from one robot per simulation to N robots working (and competing) in the same world. Built during Google Summer of Code 2026.

At the infrastructure level, it extends RoboticsAcademy's Robot Application Manager from a single-robot to an N-robot architecture: spawning, controlling, pausing, and resetting an arbitrary number of robots in one simulation, each with its own namespaced, collision-free topics. Robots spawn in parallel, so both launch and reset stay fast as the number of agents grows.

The flagship exercise built on top of this is **Drone Cat-and-Mouse**. Two drones share one simulation: a "mouse" drone flies fast, evasive paths while a "cat" drone — programmed by the learner — has to chase it down and intercept it. Learners write only the cat's control logic against a clean, high-level API; the drones, cameras, and full Play / Pause / Reset lifecycle run in the backend on ROS 2, Gazebo, and Aerostack2. The mouse's difficulty scales across levels — from slow, predictable motion to fast racing lines, zig-zags, and evasive dodging — so each stage naturally motivates a more capable pursuit algorithm: pure pursuit, Proportional Navigation, and image-based visual servoing.

Together, the multi-agent infrastructure and the exercise turn RoboticsAcademy into a place where students can learn autonomous pursuit, guidance, and multi-robot coordination — hands-on, in the browser.

**Built with:** ROS 2 · Gazebo · Aerostack2 · Python · RoboticsAcademy  
**Mentors:** José María Cañas, Pedro Arias-Perez

Follow the weekly progress in the [blog](/gsoc2026-Anish_Kumar/blog/).
