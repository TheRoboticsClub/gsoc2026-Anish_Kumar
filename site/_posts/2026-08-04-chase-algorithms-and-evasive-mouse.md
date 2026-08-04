---
layout: post
title: "Chase Algorithms, an Evasive Mouse, and the Hard Level"
date: 2026-08-04 12:00:00+0530
description: Three difficulty levels, five tracking ideas, one evasive drone that actually fights back, and the tuning decisions behind all of it.
tags: [gsoc, jderobot, ros2, aerostack2, computer-vision, multi-agent]
categories: [weekly-update]
---

This week was the part of the project I've been looking forward to the most — the algorithms. Two PRs landed, all three difficulty levels came together end to end, and the mouse stopped being a moving target and started being an actual opponent.

---

## Two merges

**[RoboticsAcademy #3954](https://github.com/JdeRobot/RoboticsAcademy/pull/3954)** — exercise assets, mouse code, and student template for the cat-and-mouse exercise in RoboticsAcademy.

**[RoboticsInfrastructure #787](https://github.com/JdeRobot/RoboticsInfrastructure/pull/787)** — three separate launchers for the exercise, one per difficulty level.

---

## Three levels, one mouse

{% include figure.liquid path="assets/img/levels_image.png" caption="Easy, Medium, and Hard — same mouse code, three personalities." class="img-fluid rounded" %}

The exercise ships three worlds — Easy, Medium, and Hard — and a single mouse program that handles all three. Which mode it flies is determined by which world the student launched. The world publishes that over a ROS topic when it starts up, and the mouse reads it and picks its behaviour accordingly.

| | Speed | Reacts to cat | Jukes | Timer |
|---|---|---|---|---|
| Easy | 1.8 m/s | No | No | 30 s |
| Medium | 2.2 m/s | Yes | Yes (every 2.0 s) | 60 s |
| Hard | 2.2 m/s | Yes, harder | Yes (every 1.6 s) | 90 s |

Easy ignores the cat completely. Hard uses altitude as well as the ground plane. Same code, three different personalities set by a config.

---

## How the cat tracks the mouse

The cat only gets a 320×240 camera at around 20 frames per second. Everything below is about turning that image into a speed and direction.

### Spotting the mouse

The detector never changed across any of the algorithm iterations — everything else did.

Convert the frame to HSV colour space, then look for magenta. Magenta wraps around the ends of the hue range, so you need two overlapping masks combined. Apply a small morphological open to remove noise, then a close to fill in the gaps the spinning rotors leave in the blob. Take the biggest contour. That's the whole detector — about 15 lines.

The blob's **width** tells you how far away the mouse is. The quadrotor is 0.47 m across and the camera covers 59° over 320 pixels:

```
width_px ≈ 0.47 × 283 / distance
  33 px  ->  4.0 m   (comfortable following distance)
  74 px  ->  1.8 m   (catch radius)
```

The city has red brick and red cars everywhere. Magenta doesn't appear anywhere in the world, which is exactly why it was chosen.

### The simplest tracker — works on Easy, breaks on Medium

```python
yaw  = -K_YAW * (blob_x - cx)
vz   = -K_VZ  * (blob_y - cy)
vx   = CRUISE
```

Three lines. If the mouse is left of centre, turn left. If it's above centre, climb. Always move forward. That's enough to catch Easy, which just flies a steady lap without doing anything tricky. Medium is harder — the mouse is turning, and by the time the cat reacts, it's already behind. That failure is intentional. Each level is designed so the simplest thing that worked on the previous one isn't enough.

### Smoothing the signal

The raw blob centre shimmers frame to frame — the bounding box breathes a little as the rotors spin, and the detector picks that up. A controller that reacts to every tiny flicker makes the drone jitter.

I tried a Kalman filter first — a standard way to smooth noisy readings while also estimating how fast the target is moving. It didn't work well here. When the mouse is far away the blob is tiny and its centre is unreliable; when it's close the blob is large and very precise. A single filter tuned for one case behaves badly in the other. Worse, when the mouse makes a sudden dodge, the filter's built-in "things don't change abruptly" assumption works against you — it smooths right through the moment you most needed to see.

What I used instead is much simpler:

```python
smooth_u = smooth_u + 0.35 * (u - smooth_u)
drift    = 0.8 * drift + 0.2 * (smooth_u - prev_u)
```

`smooth_u` is just an exponential moving average of the blob's horizontal position — each frame it moves 35% of the way toward the new reading. `drift` tracks how fast `smooth_u` is changing, which is essentially an estimate of how fast the mouse is moving across the frame. Two numbers, no setup, and it handles the tiny-blob case fine because it doesn't try to be confident about anything.

### Turning ahead of where the mouse is — works on Medium

```python
yaw = clamp(-K_YAW * (smooth_u - cx) - K_LEAD * drift, MAX_YAW)
```

Instead of turning based only on where the blob is right now, I also factor in `drift` — which direction the blob is already moving. So the cat starts turning *before* the mouse reaches the edge of frame, not after it's already gone. That's enough to stay on Medium through its loops. Hard is a different problem because now the mouse is actively trying to throw the cat off.

### When the mouse disappears from frame

When the blob leaves the frame, the obvious move is to turn toward where it was last seen. But that's always too late — the mouse kept moving while the cat was figuring out it had gone. So instead, I project the last known position forward a few frames:

```python
exit_u = last_u + last_drift * 8   # where it probably is now
side   = +1 if exit_u < cx else -1
yaw    = side * (YAW_MIN + urgency * (YAW_MAX - YAW_MIN))
vx     = CRUISE * 0.4              # slow down — flying blind
```

If the mouse slid off the right edge fast, turn right hard and slow down. If it drifted off the centre top, turn gently and keep moving. The idea is to sweep the target back into frame rather than spin in place hoping it comes back.

### Slowing down for turns — avoiding trees without detecting them

This is the idea I enjoyed most this week. The Hard course sends the mouse wrapping around a tree. If the cat just follows the blob, it flies straight into the trunk. The cat has no depth sensor and no map — but it doesn't need either:

```python
turning = min(1, abs(drift) / TURN_DRIFT)
vx      = vx * (1 - (1 - TURN_BRAKE) * turning)
```

If the blob is sliding fast across the frame, the mouse is turning sharply. And if the mouse is turning sharply, there's probably something it's turning around. So the cat backs off the throttle proportionally — fast blob drift means slow down. The tree is never detected. The collision just stops happening.

### A bug that was keeping the cat from ever catching anything

I spotted this late. The speed law was:

```python
vx = CRUISE + K_VX * (TARGET_WIDTH - width)
```

The idea is to speed up when far and slow down when close. But `TARGET_WIDTH = 33 px` corresponds to 4 m, so this term goes negative inside 4 m. At the actual catch distance of 1.8 m the cat was commanding *less* speed than the mouse. It had been hovering at a comfortable 4 m distance and never actually going in. The fix:

```python
vx = CRUISE + K_VX * max(0, TARGET_WIDTH - width)  # only ever speeds up

if width > LUNGE_WIDTH:   # inside ~6 m
    vx  = MAX_VX
    yaw = yaw * LUNGE_YAW
```

Inside six metres, slow and cautious is what loses it.

---

## How the mouse fights back

The mouse isn't a fixed recording. It reads the cat's live position from a ROS topic every loop and decides what to do about it. The two drones never communicate directly — each only sees the other through the simulator, which is the same limitation the cat faces with its camera.

### The juke

When the cat gets close enough, the mouse starts blending its normal lap-following with a sideways push — perpendicular to the line between the two drones. It flips which side it pushes toward on a timer, so the cat can't just mirror it:

```python
push = (THREAT_RADIUS - d) / THREAT_RADIUS
away = normalise(position - cat)
side = perpendicular(away) * juke_side

want = (1 - push) * course_vel + push * (side + 0.4 * away) * DODGE_GAIN
```


### Fixing the lap

Originally the mouse switched to the next gate when it got close enough by distance. At speed it would overshoot, find itself outside the gate radius, and turn back — flying the whole lap as a series of U-turns.

One extra check fixed it:

```python
behind = dot(gate - position, gate - prev_gate) < 0
if dist(position, gate) < GATE_RADIUS or behind:
    advance to next gate
```

If the gate is now behind us along the direction we came from, move on.

---

## Hard level

<video width="100%" controls>
  <source src="{{ '/assets/video/hard.webm' | relative_url }}" type="video/webm">
</video>

---

## How the courses were designed

The gate positions aren't guessed. The city is a 7 MB 3D model file, and I wrote a script to read the geometry out of it, convert the coordinates into Gazebo's system, and compute a clearance function — minimum distance from any point to the nearest obstacle. Checking whether a proposed leg is flyable becomes sampling that function every 0.3 m along the path.

That caught a corridor that looked clear on paper but had a 2.9 m gap in the middle of it. It's also how the Hard course's tree wrap exists at all — there's exactly one tall pylon in the whole city, 11.7 m at roughly (25.5, −1.2), and the Hard course was designed specifically around it.

---

## Tuning notes

A few things that weren't obvious until something broke:

**Running both drones at 4.6 m/s was too fast to track.** The mouse crossed 16 pixels per frame sideways during a juke and the detector lost it every time. Halving both speeds made the chase actually winnable.

**A low vertical speed limit meant the cat never followed the mouse upward.** It would just hover underneath and watch the mouse climb away. Both a higher vertical speed and tracking the vertical blob drift were needed together — one without the other didn't help.

---

## Next

Testing all three levels against the tuned reference solutions, then the scoring model. The mouse is capable enough now that the question has shifted from "can the cat catch it" to "how long should it take, and what does that mean for a score."
