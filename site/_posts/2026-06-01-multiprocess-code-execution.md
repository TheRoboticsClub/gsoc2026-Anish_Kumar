---
layout: post
title: "Week 2 — Multi-Process Code Execution in RoboticsAcademy"
date: 2026-06-01 12:00:00+0530
description: Making RAM manage two independent agent processes from a single exercise session — the foundation for Drone Cat-Mouse.
tags: [gsoc, jderobot, ros2, ram, multi-agent]
categories: [weekly-update]
---

This week's goal was proving that RAM can manage two independent agent processes from a single exercise session — the foundation needed for the Drone Cat-Mouse exercise.

---

## Why the browser sends the zip

One design decision worth noting: the exercise code — including `processB/` — is bundled and sent from the browser, not fetched from a database on the RAM side (which was one option considered).

The reason comes down to future use. RoboticsAcademy feeds into **Unibotics**, where students will eventually share and load each other's code. In that model, code lives with the client and gets pushed to RAM at run time — not pulled from a server-side store. Keeping the zip in the browser payload keeps that path clean and avoids coupling RAM to any particular storage backend.

The mentor flagged this as a good design point for long-term compatibility.

---

## How the Play flow works now

{% include figure.liquid path="assets/img/architect_image.png" caption="Zip merge architecture — how both agents land in /workspace/code/" class="img-fluid rounded" %}

The browser doesn't just send the student's code — it builds a **finalZip** by merging three sources:

1. **userZip** — the student's `academy.py` from the browser editor (cat code, autosaved)
2. **helperZip** — fetched from the filesystem: `HAL.py`, `WebGUI.py`, and the entire `processB/` folder (pre-programmed mouse + its own `HAL.py`)
3. The two zips are merged client-side into **finalZip** and sent to RAM

RAM receives the merged payload, extracts everything to `/workspace/code/`:

```
/workspace/code/
├── academy.py              ← student code (cat, drone0)
├── HAL.py                  ← drone0 interface
├── hal_interfaces/
├── gui_interfaces/
├── console_interfaces/
└── processB/
    ├── academy.py          ← pre-programmed mouse
    └── HAL.py              ← drone1 interface
```

RAM then launches both:

```
python3 /workspace/code/academy.py           ← agentA (cat, drone0)
python3 /workspace/code/processB/academy.py  ← agentB (mouse, drone1)
```

Both go into the `application_processes` dict. Pause sends SIGSTOP to both. Resume sends SIGCONT. Stop kills both.

Verified both running simultaneously from their extracted paths:

```
11255  python3 /workspace/code/academy.py
11256  python3 /workspace/code/processB/academy.py
```

One process for the cat, one for the mouse — confirmed live. Each HAL resolves to a different drone namespace — same import name, different process context, different physical drone.

Slowly heading towards the goal.

---

## What this means for the project

The pattern is exercise-agnostic. Any future exercise needing N agents follows the same structure: add a `processB/`, `processC/` folder to the exercise template. RAM detects and launches them. The `application_processes` dict handles lifecycle for all uniformly.


