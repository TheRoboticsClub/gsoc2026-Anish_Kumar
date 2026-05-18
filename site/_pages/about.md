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

I'm Anish Kumar, a GSoC 2026 contributor working with **JdeRobot Robotics Academy** on the **Drone Cat-Mouse Chase Exercise**.

This project introduces **first-ever multi-agent collaboration** in JdeRobot's Robotics Academy — two autonomous drones (cat and mouse) operating simultaneously in a shared simulation environment. This is a novel milestone for the platform, pushing ROS2 + Gazebo simulation into multi-agent territory.

**Project goals:**
- Implement a cat-drone that autonomously chases a mouse-drone
- Implement a mouse-drone with evasion behavior
- Integrate both agents into Robotics Academy's exercise framework

Currently exploring the best architecture for multi-agent support: whether the existing RAM (Robot Application Manager) needs extension, can be reused as-is, or if a cleaner approach exists without modifying it. The goal is a general solution that works not just for this exercise but as a reusable pattern for all future multi-agent exercises in the Robotics Academy ecosystem.

Follow my weekly progress in the [blog](/gsoc2026-Anish_Kumar/blog/).
