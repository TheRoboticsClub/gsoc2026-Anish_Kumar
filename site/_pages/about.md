---
layout: about
title: about
permalink: /
subtitle: GSoC 2026 Contributor @ <a href='https://jderobot.github.io/'>JdeRobot</a> · Drone Cat-Mouse Chase with Two Concurrent Drones

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

I'm Anish Kumar, a GSoC 2026 contributor working with [JdeRobot](https://jderobot.github.io/) on multi-robot support for RoboticsAcademy.

---

This project takes RoboticsAcademy from one robot per simulation to many robots sharing the same world — working together, or competing against each other. Built during Google Summer of Code 2026.

Most of the work is in the infrastructure. The Robotics Application Manager could only ever start one program and drive one robot, so it was extended to handle any number of them: spawning, controlling, pausing and resetting several robots in a single simulation, each with its own name so their commands and sensor data never get mixed up. The robots spawn in parallel, so starting and resetting a world does not get slower as you add more of them.

The exercise built on top of it is **Drone Cat-and-Mouse**. Two drones share one simulation. The mouse drone flies fast, evasive paths, and the cat drone — the one you program — has to chase it down and catch it. You write only the cat's control logic against a simple API; the drones, the cameras and the whole Play, Pause and Reset lifecycle run in the backend on ROS 2, Gazebo and Aerostack2.

The mouse gets harder across three levels, from a slow straight line to fast laps, sharp turns and dodging when you get close. Each level pushes you towards a better chasing strategy, and the cat has no access to the mouse's real position — it has to work entirely from what its camera can see.

Together, the multi-robot infrastructure and the exercise make RoboticsAcademy a place to learn pursuit, guidance and multi-robot coordination, hands-on, in the browser.

**Built with:** ROS 2 · Gazebo · Aerostack2 · Python · OpenCV · RoboticsAcademy  
**Mentors:** José María Cañas, Pedro Arias-Perez

Follow the weekly progress in the [blog](/gsoc2026-Anish_Kumar/blog/).
