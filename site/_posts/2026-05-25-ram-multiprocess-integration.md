---
layout: post
title: "Integrating Multi-Process Support into RAM"
date: 2026-05-25 12:00:00+0530
description: How a small PoC called Anish Manager proved the concept, and how that concept got folded into the real RoboticsApplicationManager codebase.
tags: [gsoc, jderobot, ros2, ram, multi-agent]
categories: [weekly-update]
---

## First, a direction change

This week I integrated multi-process support into RAM and tested it end-to-end inside the actual Robotics Academy GUI.

Last post I had proposed a companions-list approach — a static config of pre-programmed group of processes that RAM would manage alongside the student's code. That got put on hold after the mentor sync. The mentor had a cleaner direction: RAM should handle **N applications** generically, driven by the frontend payload, so RAM doesn't need to know anything about the exercise topology upfront. More flexible, and no static config needed.

The mentor also suggested proving the concept offline first with a small PoC before touching the real codebase — that became Anish Manager.

---

## So I built Anish Manager first

Before touching RAM, I built the PoC — Anish Manager — to answer one question cleanly:

> Can a single Python program manage N child processes the way RAM needs to, using just standard Linux signals?

Two dummy processes (`anish.py` and `pedro.py`) printed a counter every second. The coordinator could run, pause, resume, and stop both simultaneously. No custom protocol. Just three OS signals:

- **SIGSTOP** — freezes a process (stays in memory, gets no CPU)
- **SIGCONT** — resumes it
- **SIGKILL** — kills it

SIGSTOP + SIGCONT are the important pair. You can SIGSTOP all processes, unpause Gazebo, then SIGCONT all of them — every process sees the simulator already running at the moment it starts ticking. Clean sync, no custom handshake.

The mentor wanted this proved offline first, then folded into RAM. This week was the folding part.

---

## Folding it into RAM

RAM currently has one variable, `self.application_process`, holding a single subprocess. Everywhere — pause, resume, terminate, disconnect — it operates on that one handle.

To support N processes, I flipped it to a dict:

```python
self.application_processes = {}   # name → Popen
```

Six methods got updated:

- **`on_run_application`** — Popen the user code, store in dict. Added SIGSTOP → unpause sim → SIGCONT sync block. Wrapped in `try/finally` so no process gets left frozen if unpausing fails.
- **`on_pause`** — iterate dict, SIGSTOP each process and its children, then pause sim.
- **`on_resume`** — iterate dict, SIGCONT each, then unpause sim.
- **`on_terminate_application` / `on_disconnect`** — call a new `_kill_all_applications()` helper that loops through and SIGKILLs everything.
- **SIGINT handler** — also routes through the helper now.

Once the dict exists, the rest is just for-loops. Adding a 2nd or 3rd process later is one dict insertion — sync, pause, resume, kill all already work on whatever is in there.

---

## Does it actually work?

To verify all four operations work (not just in isolation), I added a temporary test hook inside `on_run_application`. After launching the editor code as `processA`, it also spawns `processB.py` — a standalone script that prints `pB: 0, pB: 1, ...` every second.

Ran `follow_line` in the browser, wrote a `pA: n` loop in the editor, hit Run:

```
pA: 6
pB: 6
pA: 7
pB: 7
pA: 8
pB: 8
```

Both counters climbing together. Pause — both froze. Resume — both continued from where they stopped. Stop — both dead, console silent.

All four operations confirmed working across the full dict, not just one process.

Here's the demo:

<div style="margin: 1.5rem 0;">
  <video width="100%" controls style="border-radius: 8px;">
    <source src="{{ '/assets/video/ram-multiprocess-demo.webm' | relative_url }}" type="video/webm">
  </video>
</div>

---

## What's next

The test hook is hardcoded for now — RAM spawns `processB` on its own, not from any external input. The process management layer itself is done and verified. Further integration work is ongoing.
