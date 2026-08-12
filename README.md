# GSoC 2026 — Anish Kumar @ JdeRobot

**Multi-Robot Support for Robotics Academy**
**Drone Cat-Mouse Chase with Two Concurrent Drones**

Blog: [theroboticsclub.github.io/gsoc2026-Anish_Kumar](https://theroboticsclub.github.io/gsoc2026-Anish_Kumar/)

---

## About

This project takes Robotics Academy from one robot per simulation to many robots sharing the same world — working together, or competing against each other.

Most of the work is in the infrastructure. The Robotics Application Manager could only ever start one program and drive one robot, so it was extended to handle any number of them: spawning, controlling, pausing and resetting several robots in a single simulation, each with its own name so their commands and sensor data never get mixed up. The robots spawn in parallel, so starting and resetting a world does not get slower as you add more of them.

The exercise built on top of it is **Drone Cat-and-Mouse**. Two drones share one simulation. The mouse drone flies fast, evasive paths, and the cat drone — the one you program — has to chase it down and catch it. You write only the cat's control logic against a simple API; the drones, the cameras and the whole Play, Pause and Reset lifecycle run in the backend on ROS 2, Gazebo and Aerostack2.

The mouse gets harder across three levels, from a slow straight line to fast laps, sharp turns and dodging when you get close. Each level pushes you towards a better chasing strategy, and the cat has no access to the mouse's real position — it has to work entirely from what its camera can see.

## Pull Requests

| Repository | PR | What it did |
|---|---|---|
| RoboticsAcademy | [#3872](https://github.com/JdeRobot/RoboticsAcademy/pull/3872) | Drone Cat and Mouse moved to ROS 2 |
| RoboticsInfrastructure | [#742](https://github.com/JdeRobot/RoboticsInfrastructure/pull/742) | The world, the robots and the launch files for the exercise |
| RoboticsAcademy | [#3938](https://github.com/JdeRobot/RoboticsAcademy/pull/3938) | Two drones and two programs in one exercise |
| RoboticsInfrastructure | [#781](https://github.com/JdeRobot/RoboticsInfrastructure/pull/781) | Colour option for the drone |
| RoboticsAcademy | [#3954](https://github.com/JdeRobot/RoboticsAcademy/pull/3954) | Adding the difficulty levels |
| RoboticsInfrastructure | [#787](https://github.com/JdeRobot/RoboticsInfrastructure/pull/787) | A launch file for each of the three levels |
| RoboticsInfrastructure | [#789](https://github.com/JdeRobot/RoboticsInfrastructure/pull/789) | The chasing drone reuses the shared drone definition |
| RoboticsApplicationManager | [#298](https://github.com/JdeRobot/RoboticsApplicationManager/pull/298) | Multi-process support in RAM (based on my contribution) |

## Built with

ROS 2 · Gazebo · Aerostack2 · Python · OpenCV · RoboticsAcademy

## Mentors

José María Cañas · Pedro Arias-Perez
