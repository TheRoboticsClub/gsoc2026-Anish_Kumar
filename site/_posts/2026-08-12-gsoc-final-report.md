---
layout: post
title: "GSoC 2026 Final Report — Drone Cat-Mouse Chase with Two Concurrent Drones"
date: 2026-08-12 12:00:00+0530
description: "Drone Cat-Mouse Chase with Two Concurrent Drones · Multi-Robot Support for Robotics Academy"
tags: [gsoc, jderobot, ros2, multi-agent, robotics-academy]
categories: [weekly-update]
---

## About me

I'm Anish, a third-year student at IIT Mandi studying robotics and artificial intelligence. The area where software and physical systems meet — systems that must sense and navigate their surroundings, and the infrastructure that enables them to do so — is what most intrigues me. Open source is important to me, and I'm the type of person who would much prefer to spend a weekend troubleshooting a robot than practically anything else.

---

## About the project

Robotics Academy is a free platform for learning robotics. You write your program in the browser on one side of the screen, and a simulated robot does what you told it on the other side.

It had one limit. Only one robot could be in the world at a time.

> So a whole class of exercises was impossible. Two robots chasing each other. Two arms working on the same table. A group of robots cleaning a house together. None of these could be built, because the platform could only ever start one program and drive one robot.

My project was to remove that limit, and then build an exercise that proves it works.

---

## What exists now

Robotics Academy can now run many robots in the same world. Each robot runs its own program, and they all run at the same time.

To show it working, I built a new exercise called **Drone Cat and Mouse**. Two drones fly in a city. One drone runs away, and you write the code for the other one that has to catch it. There are three difficulty levels.

---

## The work

I will split this into four parts, because that is roughly how it happened.

### 1. Running more than one program at a time

The first problem was not the robots at all. It was that the part of the platform that runs your code, called the Robotics Application Manager, could only keep track of one running program.

I did not want to touch the real thing straight away, so I first built a small separate program of my own to test the idea. It started a few programs, watched them, and stopped them. Once that worked I moved the same approach into the real manager.

> Where the manager used to hold one program, it now holds a list. Almost everything around it assumed there was only one, so a lot of smaller things had to be fixed along with it.

Blog posts: [Integrating multi-process support into RAM](/gsoc2026-Anish_Kumar/blog/2026/ram-multiprocess-integration/), [Multi-process code execution](/gsoc2026-Anish_Kumar/blog/2026/multiprocess-code-execution/)

---

### 2. From one robot to many

Next was the simulation side. Even if you could run three programs, all three would end up talking to the same robot, because every robot was published on the same channels.

The fix was to give every robot its own name, and to make the launch files take that name as an input instead of having it written inside them.

The database also had to change. I proposed a many-to-many relationship between worlds and robots to the maintainers. The world used to say "put this robot here, this many times", which cannot describe where each copy goes. Now it says "here are the robots, and here is where each one starts". That is what lets one line in the database put five drones in five different places.

> After this, adding a second robot to a world stopped being a code change. It became a row in the database.

I tested this with two F1 cars first, before any drone existed, because cars are simpler and if it worked for them it would work for anything else. Seeing two cars spawn in one world, each listening to its own program, was the point where I knew the project would work.

Blog posts: [Moving from N users to N robots](/gsoc2026-Anish_Kumar/blog/2026/n-robots-support/), [N robots in RAM, tested end to end](/gsoc2026-Anish_Kumar/blog/2026/n-robots-in-ram-testing-end-to-end/)

---

### 3. The Drone Cat and Mouse exercise

With the platform able to hold two robots, I built the exercise.

The world is a city, which I modelled in Blender and then exported into Gazebo, and the drones fly using Aerostack2. One drone runs away on a fixed path. The other one is yours.

Then I added three levels. Easy is a straight line and the escaping drone ignores you completely. Medium flies a lap and dodges when you get close. Hard uses height as well, jukes harder, and hides behind things. Each level has its own clock, and you score based on how fast you catch it.

> All three levels run the same escape program. Which level it flies is decided by the world you picked.

Blog posts: [Gazebo city world](/gsoc2026-Anish_Kumar/blog/2026/gazebo-city-world-and-aerostack2-setup/), [Getting the exercise into Robotics Academy](/gsoc2026-Anish_Kumar/blog/2026/drone-cat-mouse-integration/), [Two drones, one manager](/gsoc2026-Anish_Kumar/blog/2026/two-drones-one-manager/), [Chase algorithms and the hard level](/gsoc2026-Anish_Kumar/blog/2026/chase-algorithms-and-evasive-mouse/)

---

### 4. Chasing with a camera, without ground truth

At first the chasing drone just read the other drone's real position from the simulator. That works, but it teaches nothing, because there is no problem left to solve.

So I took that away. The chasing drone now only has its camera. It has to find the other drone in the picture, turn until it is in the middle, and fly at it.

> This is where it got interesting, because a lot of things that seem obvious do not work. Turning towards where the target is now is always too late, because by the time you react it has already moved. You have to turn towards where it is going.

On the hard level this matters a lot. The escaping drone takes sharp turns around a tree, and if you chase it blindly you go straight into the trunk and lose.

Blog post: [From ground truth to the camera](/gsoc2026-Anish_Kumar/blog/2026/from-ground-truth-to-the-camera/)

---

## Demo video

<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;">
  <iframe src="https://www.youtube.com/embed/cPVsjWLAd_A" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;" allowfullscreen></iframe>
</div>

This is the whole project in one place: Robotics Academy could only run one robot before, and now it runs many, with the chase as the thing that proves it.

In the video I show what the project was for, using the two robot exercise. The Drone Cat and Mouse chase is played on all three levels, with the cat drone chasing the mouse drone (2 robots) and the score at the end of each run.

After that I show the same thing at a bigger size, because two robots was never the actual limit. There is a world with five drones flying together, and the existing Vacuum Cleaner exercise running with three robots in one house instead of one.

<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;margin-top:1rem;">
  <iframe src="https://www.youtube.com/embed/Jj9ORzrbMdQ" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;" allowfullscreen></iframe>
</div>

---

## Pull requests

| Date | Repository | PR | What it did |
|---|---|---|---|
| 24 Jun 2026 | RoboticsAcademy | [#3872](https://github.com/JdeRobot/RoboticsAcademy/pull/3872) | Drone Cat and Mouse moved to ROS 2 |
| 24 Jun 2026 | RoboticsInfrastructure | [#742](https://github.com/JdeRobot/RoboticsInfrastructure/pull/742) | The world, the robots and the launch files for the exercise |
| 23 Jul 2026 | RoboticsAcademy | [#3938](https://github.com/JdeRobot/RoboticsAcademy/pull/3938) | Two drones and two programs in one exercise |
| 24 Jul 2026 | RoboticsInfrastructure | [#781](https://github.com/JdeRobot/RoboticsInfrastructure/pull/781) | Colour option for the drone |
| 3 Aug 2026 | RoboticsAcademy | [#3954](https://github.com/JdeRobot/RoboticsAcademy/pull/3954) | Adding the difficulty levels |
| 3 Aug 2026 | RoboticsInfrastructure | [#787](https://github.com/JdeRobot/RoboticsInfrastructure/pull/787) | A launch file for each of the three levels |
| 4 Aug 2026 | RoboticsInfrastructure | [#789](https://github.com/JdeRobot/RoboticsInfrastructure/pull/789) | The chasing drone reuses the shared drone definition |
{: .table .table-bordered}

### Robotics Application Manager

The multi-program support in the manager repository came from my work, but it was not merged from my own pull request. After the review, the maintainer took part of it and opened [#298](https://github.com/JdeRobot/RoboticsApplicationManager/pull/298) himself, and that is the one that got merged. So what is running in the manager today is based on my initial contribution.

---

## Future work

Only Drone Cat and Mouse uses more than one robot so far. The platform can hold many now, so the interesting part is what gets built on top of it. Some of these already have everything they need in Robotics Academy:

| Exercise | What changes with multi-robot |
|---|---|
| **Pick and Place** | Two arms building the same pallet, working either side without getting in each other's way |
| **Warehouse** | A handful of robots working the same aisles, deciding who goes first and who waits |
| **Follow Line** | Four cars on one circuit, which turns a lap time into a race |
| **Rescue People** | Two drones splitting the search between them instead of one covering everything |
| **Swarms and formation flying** | Many drones holding a shape while they move — already tested with six drones in one world |
{: .table .table-bordered}

> None of these need new platform work. They only need someone to write them, and that is the part I am most happy about — the next exercise with more than one robot can come from anyone.

---

## Thank you

I could not have asked for better mentors than **Jose Maria Canas** and **Pedro Arias-Perez**. They were really very supportive throughout. The way they pick up a concept and explain it starting from the simplest form, and then take it slowly to the harder parts, is the thing I learned the most from. I made mistakes many times during this project, and every time they explained it patiently instead of just telling me it was wrong.

Thank you to JdeRobot for taking me in, and to Google Summer of Code.

I am not finished with this. I will keep maintaining what I built and help other developers who want to use it.