---
layout: post
title: "From Ground Truth to the Camera"
date: 2026-07-28 12:00:00+0530
description: Camera-based chase, two merges, paintable drones, three worlds, and RAM getting smaller.
tags: [gsoc, jderobot, ros2, aerostack2, computer-vision, ibvs]
categories: [weekly-update]
---

The first working chase used `HAL.get_mouse_position()` — the mouse's real coordinates, straight from the simulator. Subtract, normalise, fly toward it. It caught the mouse every time and it was a terrible exercise: there's no perception in it, just a subtraction.

This week I swapped the ground truth out for what the cat's own cameras can actually see.

---

## Why the easy approaches kept breaking

The first thing I tried was lead prediction — predict where the mouse will be from its current velocity and aim there instead of at where it is. That fixed overshooting on straight legs. Then the mouse flew a figure-eight and the prediction aimed at the wrong side of the loop on every single pass, because a constant-velocity guess is exactly wrong when the target is always turning.

The real issue wasn't the algorithm, it was what I was feeding it. A real drone doesn't get handed the target's GPS coordinates. An exercise that does that isn't teaching anything useful. So I changed the rule: the only input the cat gets is what its own cameras can see.

The mouse is magenta. The cat is orange. The cat never accidentally detects itself.

---

## Detecting the mouse

Convert the frame to HSV and threshold on hue. Magenta sits at both ends of the 0–180 hue range, so you need two masks OR'd together to catch it reliably. Apply an open-then-close to kill noise, find the biggest contour, read off its centroid and bounding box. That's the whole detector — maybe 15 lines.

---

## Getting distance from a regular camera

The frontal camera has no depth sensor, so I used blob width as a distance proxy. If you know the real-world width of the object and the focal length of the camera in pixels, the math is straightforward:

```
distance ≈ (real_width × focal_px) / blob_width_px
```

At 320×240 with a 59° horizontal FOV the focal length comes out around 283 px. Good enough to maintain a comfortable following distance without either crashing into the mouse or losing it.

---

## Turning image error into velocity

Since the camera faces forward on the drone, the error you read off the image maps directly onto what direction to fly — the axes basically decouple:

```
horizontal blob offset  ->  yaw rate    (turn left/right to centre it)
vertical blob offset    ->  vz          (climb or descend)
blob width              ->  vx          (move closer or back off)
```

Three separate proportional controllers, each reading one thing from the same blob. None of them needs to know where the mouse actually is in the world.

---

## When the mouse disappears

The tracking part is the easy bit. The hard part is what happens when the blob is gone — mouse went behind a tree, or flew out of frame on a tight turn. If you just freeze and hold the last position you'll drift off and lose it. What works better is to keep yawing in the direction the mouse was moving when you last saw it, so it sweeps back into view instead of you flying in the wrong direction.

---

## Trees were a bigger problem than expected

The early failures looked like altitude bugs — the cat climbing or descending at the wrong moment — and they weren't. It was hitting tree canopy. I went through the city model, found where the trees actually are, and redesigned the mouse courses so every leg has clearance. Not just at the waypoints — I sampled the whole path in between to make sure nothing was sticking up in the middle of a leg.

---

## Three courses, three different algorithms

This is the part I'm actually happy with.

**Patrol** — the mouse flies a slow, predictable rectangle. Reacting to the current frame is enough. Lead prediction is slightly smoother but not required.

**Figure-eight** — the mouse loops continuously and reverses direction twice each lap. Lead prediction helps on the straight sections and aims at the wrong half of the loop on every turn. What you actually need is to track the turn rate, not just the velocity.

**Evasive** — the mouse watches where the cat is and actively runs the other way. Pure reaction can never close the gap. You have to predict where it's going to escape to and get there first.

`HAL.get_mouse_position()` is still in the API — not for chasing, but so students can sanity-check their visual tracker against the real answer while debugging. Once it's working, you're not supposed to need it.

The progression is intentional: each course breaks the simplest thing that worked on the previous one, and the fix is always the next idea up the stack.

---

## Two merges this week

**[RoboticsAcademy #3938](https://github.com/JdeRobot/RoboticsAcademy/pull/3938)** — the frontend now scans an exercise's folders for any directory with its own entrypoint and sends a list, instead of assuming there's always just one `academy.py`.

**[RoboticsInfrastructure #781](https://github.com/JdeRobot/RoboticsInfrastructure/pull/781)** — a `color` argument on the quadrotor model.

---

## Getting the drones different colours

The cat and mouse need to look different from a 320×240 feed, so I added colour as a parameter on the drone model. The first attempt just defaulted to blue — which repainted every drone in every existing exercise, since they all share the same model file.

The fix is an empty default with a conditional:

```xml
<xacro:if value="${color != ''}">
  <material name="${color}"/>
</xacro:if>
```

No colour argument, no override, the mesh keeps its original texture. There are three places that all need the same empty default — the xacro arg, the macro parameter, and the launch argument — and if you miss any one of them, something quietly gets repainted blue. `scale` works the same way.

Neither gets parsed by RAM. Both just ride along in `extra_config` and get passed to `ros2 launch` as-is.

---

## Three worlds in the database

Cat-and-mouse now has three universes, all using the same city but with a different mouse behaviour each:

- **patrol** — steady speed, fixed lap
- **figure_eight** — constant turning, reverses twice per lap
- **evasive** — actively runs from the cat

Same three courses as above, now each its own selectable world. Which one launches is determined by the launch file, not the exercise code — same pattern the F1 exercises use for different circuits. RAM doesn't know or care which one is running.

---

## RAM got smaller

I'd built a small class to hold the running agent processes, keyed by name, so individual ones could be looked up and controlled. While rewriting it I noticed nothing ever actually looked one up individually. Every operation was "do this to all of them" — kill all, pause all, resume all. A dictionary you always iterate over completely is just a list with more code.

```python
self.application_processes = []
```

Same result, one line.

A real bug turned up too: if an exercise had both a C++ and a Python entrypoint, only the first one ever ran. The old code looked at `entrypoints[0]`, decided what kind it was, and returned. Fixing it meant changing `return` to `continue` so each entrypoint goes through its own dispatch. I also tried to be clever about `colcon` — restructured the build step so two C++ entrypoints would only trigger one build. Colcon is incremental, so the second call is essentially a no-op anyway, and the restructuring touched control flow that other exercises rely on. Reverted. The "duplicate" build stays.

---

## A guard that stopped working in July

Something that cost me most of a day. There's a line in `manager.py`:

```python
if robot_cfg["type"] is not None:
```

That check hasn't been reachable since July 14. RoboticsAcademy used to send a placeholder config with `type: None` to signal "this world has no robot". On July 14 it switched to just sending an empty list instead. RAM's side never got updated, so the guard is there protecting against a value that nobody sends anymore.

Reading only the RAM codebase there's no way to know this — it looks like a normal active check.

## The camera chase in action

<video width="100%" controls>
  <source src="{{ '/assets/video/vision.webm' | relative_url }}" type="video/webm">
</video>

---

## The bigger picture: RAM

Getting the visual tracking to work is satisfying, but the RAM side is really where the project sits. Everything in this post — the multi-world setup, the colour arguments, the N-entrypoint dispatch — only makes sense because RAM now treats robots and agents as lists, not singletons. The camera exercise runs on top of the same infrastructure that lets any exercise define any number of robots and agents without touching the core. That's the part I'm working through in review right now, and getting it merged cleanly is the main thing left.
