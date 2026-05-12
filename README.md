# gsoc2026-Anish_Kumar

# Getting Started with GSoC 2026 — Drone Cat-Mouse Chase

So I got selected for Google Summer of Code 2026 with JdeRobot. This is going to be my first GSoC and I will be working on the **Drone Cat-Mouse Chase Exercise** under the Robotics Academy project. Writing this first blog mostly to introduce myself and what I'll be doing over the summer, and also to keep a small log for myself as the project moves along.

## About Me

I'm Anish Kumar, a second year B.Tech student at IIT Mandi. My branch is General Engineering and I'm doing my majors in Robotics and AI. Most of my time outside coursework goes into **Team Deimos**, the Mars Rover team at IIT Mandi.

A lot of what I do is around ROS2, navigation, manipulation and simulators. I have spent a fair amount of time inside Gazebo Harmonic, PyBullet, AirSim and MuJoCo.

## About the Project

The full project is **Project #4 — Drone Cat-Mouse Chase Exercise: Two Controlled Robots at the Same Time**.

The idea of the exercise is simple to explain. There are two drones in the same Gazebo world. One is the **mouse** — it flies around autonomously in some 3D pattern. The other is the **cat** — the student writes the chasing code for this one. The student's job is to catch the mouse.

The exercise actually existed earlier in Robotics Academy but on the old stack — ROS1 + Gazebo Classic + PX4/MAVROS. That version does not work anymore. My job for this summer is to bring it back, but on the new stack:

- **ROS2 Humble**
- **Gazebo Harmonic**
- **Aerostack2**

But the real interesting part is not just the migration. Right now every single drone exercise in Robotics Academy works with only one drone. The whole architecture — `academy.py`, RAM, HAL — was built around the assumption that there is one user code file talking to one drone. For this exercise we need **two drones running their full stack at the same time inside one Gazebo world**, each with its own namespace, its own Aerostack2 nodes and its own bridges. So a good chunk of the work is figuring out how to make Robotics Academy support that cleanly, in a way that future multi-agent exercises (formation flying, cooperative search, multi-robot warehouse) can also reuse it.

## Why I Wanted This Project

Honestly the multi-agent part is what pulled me in. I have been building robot systems for a while now and one drone is something I have done before. Two drones, running their full stacks in the same world, without their topics stepping on each other — that felt like a real architecture problem and not just code writing.

Also, I had already been contributing to JdeRobot before applying. My pre-GSoC contribution was migrating the **Pick & Place exercise to Gazebo Harmonic**. That one took me deep into the RAM state machine, the RADI container, the launch chain, the bridge layer — basically all the same internals I will need again for this project. So when I read the cat-mouse problem statement, the path forward felt clear in my head from day one.

## Rough Plan for the Summer

I will write more detailed posts later as each phase starts, but the broad shape of the work looks like this:

1. Get two drones flying independently in Gazebo Harmonic with Aerostack2, each in their own namespace.
2. Build the autonomous mouse node with configurable flight paths and difficulty levels.
3. Build the cat chase logic and catch detection.
4. Build the HAL layer for the excersice.
5. Integrate everything into RoboticsAcademy and RoboticsInfrastructure properly, ship a RADI Docker image, write the reference solution and the theory page.

Most of weeks 1 to 6 will be local development. Weeks 7 onwards is where it all gets pulled into the actual RA and RI repos and turned into a proper browser-based exercise.

## Mentors

I'll be working under:

- **José María Cañas**
- **Pedro Arias-Perez**

Both have been really helpful already during the proposal phase, and I am looking forward to working with them over the next few months.

## What's Next

I am in the **community bonding** period right now. The plan for the next couple of weeks is to finalize the architecture document with the mentors before I start writing real code, and make sure my local dev setup matches what RADI uses so there are no surprises later.

I will be putting up weekly posts here once coding officially begins. The posts will mostly be a log of what I worked on that week, what broke, what I fixed, and what is coming up next.

That's it for the first post. More to come once Week 1 begins.

---

*Project: Drone Cat-Mouse Chase Exercise — Two Controlled Robots at the Same Time*
*Organization: JdeRobot*