---
layout: post
title: "A Bit of a Mixed Bag (But a Good One)"
date: 2026-07-07 12:00:00+0530
description: Chase algorithms, difficulty levels, a deep dive into video production, and finally cracking the N-robot parallel spawn.
tags: [gsoc, jderobot, ros2, ram, multi-agent, aerostack2]
categories: [weekly-update]
---

This week was two very different halves. One was deep in guidance algorithms and robotics math. The other was me basically becoming a part-time video editor. Both ate way more time than I expected — but in a good way.

---

## Building out the chase algorithms

Last week the cat could sort of follow the mouse. This week I wanted it to actually mean something, so I built out a proper ladder of pursuit algorithms.

Started with plain **pure pursuit** — just aim at the target and go. Then **proportional navigation**, where the cat leads the target instead of chasing its tail. Then **augmented PN**, and finally a **predictive intercept** that solves for where the two drones will actually meet given their current velocities. I also added a **visual servoing** version that chases using only the camera feed — no coordinates, no GPS.

The mouse got a real upgrade too. I gave it eight difficulty levels, from slow and predictable up to fast racing lines, zig-zags, spirals, and figure-eights. I tuned them on purpose so each level quietly breaks the previous algorithm, which makes the next one feel like the natural fix. The "failure is the lesson" structure turned out really well.

On the student side, I pushed all the boilerplate — camera setup, recovery logic, crash handling — into the backend so a student only writes the actual chasing logic against a clean API.

---

## The video

<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;">
  <iframe src="https://www.youtube.com/embed/Jj9ORzrbMdQ" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;" allowfullscreen></iframe>
</div>

Then came the video, which kind of took over my week.

I had the clips — the chase, play/pause/reset, everything in motion — but stitching it into something that looks good is a different skill. I made an animated intro and title card with the GSoC × JdeRobot, built diagrams for the IBVS and PN math (and double-checked the equations are actually correct, not just pretty), designed a thumbnail, and wrote the titles and description from the organisation's point of view.

Then there were a hundred small fiddly things — colors, fixing a BGR/RGB swap on the camera feed, getting the drone to look the way I wanted in frame. The kind of work where you spend an hour and have almost nothing visible to show for it, but it adds up. The final thing looks clean.

---

## Closing the mentor feedback loop

Javier had flagged earlier that instead of adding a separate `robots` variable, the existing `robot` field should just become the array — one field, one source of truth. This week I went and did that properly, top to bottom: `views.py`, the frontend API, the IDE interface, and the manager in RAM. Now `robot` is a list everywhere. Single-robot exercises are just a list of one, and nothing in the codebase treats it as a singular object anymore. Felt good to close that cleanly.

---

## Cracking the parallel spawn

The N-robot spawning worked, but sequentially — each robot had to fully come up before the next one started. Since reset respawns the whole group, every reset was slow too. We'd tried parallelising it before and it just hung, and nobody was quite sure why.

This week I sat down and traced it properly. The launch was never the problem — the waiting was. Each robot was polling Gazebo with a blocking call to check if it had spawned, and when you run that inside worker threads, the blocking call holds Python's GIL and starves all the other threads. Classic.

The fix was to stop threading it entirely. I split the logic into two phases: **start the launch** (fast, fire and forget) and **wait until it spawns** (the slow poll). The manager now starts all the launches first, then waits for all of them together on the main thread. No threads, no GIL contention. Robots come up in roughly one spawn time instead of N, and reset got the exact same speedup for free since it goes through the same path.

---

## Where things stand

The N-robots refactor is almost there, the mentor comments are resolved, the algorithms are in good shape, and the video is nearly done. Next week is finishing and verifying the N-robot changes end to end, a couple of small cleanups, and drafting the pr's.
