# 🏎️ Top-Down Drifting Simulator — Project Spec (16-Bit Edition)

**Project Type:** Browser-based 2D game  
**Tech Stack:** HTML, CSS, JavaScript (Canvas API) — single file, no frameworks  
**Class:** Vibe Coding Capstone  
**Build Style:** Iterative, phase-by-phase — each phase is playable before moving on

---

## 📐 Overview

A polished top-down drifting simulator where the player drives a car around a custom map, earning points by pulling off sustained, high-angle drifts. The map is built from a user-provided screenshot and encoded as a data structure so it can be swapped, extended, and decorated with minigame stops in later phases.

---

## 🗂️ File Structure

```
drift-game/
│
├── index.html         ← Single-file game (HTML + CSS + JS all in one)
│
└── spec.md            ← This document
```

All game code lives in one `index.html` file. Internally it is organized into clearly commented sections:

```
[CONFIG]       ← All tunable constants live here
[STATE]        ← Global game state
[MAP]          ← Track geometry & zones
[CAR]          ← Car object, physics update
[INPUT]        ← Keyboard handler
[SCORING]      ← Drift detection & scoring
[RENDERER]     ← All canvas drawing
[HUD]          ← Overlay UI (speed, score, combo)
[LOOP]         ← requestAnimationFrame game loop
```

---

## ⚙️ Tuning Config Object

At the very top of the JS, before anything else, a `CONFIG` object exposes every physics value so tweaking never requires hunting through code:

```js
const CONFIG = {
  // Engine
  torque:           0.4,     // Acceleration force
  brakeForce:       0.6,     // Braking deceleration
  maxSpeed:         8.0,     // Max velocity magnitude (px/frame)
  reverseMaxSpeed:  3.0,

  // Steering
  steerSpeed:       0.045,   // Radians per frame at full lock
  steerReturn:      0.85,    // How fast steering centers (0–1)

  // Grip & Drift
  gripFront:        0.88,    // Front lateral grip (0 = ice, 1 = glue)
  gripRear:         0.82,    // Rear lateral grip
  handbrakeGrip:    0.30,    // Rear grip when handbrake is held
  driftThreshold:   0.35,    // Slip angle (rad) that triggers drift state
  tractionRegain:   0.04,    // How fast grip returns after drift

  // Off-track penalty
  offTrackFriction: 0.92,    // Velocity multiplier per frame off-track
  onTrackFriction:  0.995,   // Velocity multiplier per frame on-track

  // Scoring
  scorePerFrame:    0.5,     // Base points per frame while drifting
  angleMultiplier:  80,      // Slip angle contribution to score
  comboWindow:      90,      // Frames before combo resets after drift ends
  maxCombo:         8,       // Combo cap
};
```

---

## 🗺️ Map Data Format

The track is stored as a JS object so it can be replaced or extended without touching physics code:

```js
const MAP = {
  width:  1400,          // Canvas width
  height: 900,           // Canvas height
  background: '#2d4a1e', // Grass color
  trackColor: '#4a4a4a', // Asphalt color
  lineColor:  '#ffffff', // Track markings

  // Outer boundary — polygon point array [x, y, x, y, ...]
  outerBoundary: [ /* generated from map screenshot */ ],

  // Inner boundary (if there's an island/infield)
  innerBoundary: [ /* generated from map screenshot */ ],

  // Track surface zones (for soft-limit off-track detection)
  // Each zone: { type: 'track'|'grass'|'gravel', polygon: [...] }
  zones: [],

  // Spawn point
  spawn: { x: 700, y: 800, angle: -Math.PI / 2 },

  // Minigame stops (Phase 5+)
  // Each stop: { id, x, y, radius, label, unlocked }
  stops: [],
};
```

> **Note:** When the map screenshot is provided, the outer/inner boundary polygons will be traced by hand from the image and encoded as normalized coordinate arrays scaled to the canvas size.

---

## 🚗 Car Physics Model

### Core Principle
The car has two separate vectors:
- **`heading`** — the direction the car is *pointing* (angle in radians)
- **`velocity`** — the direction the car is *actually moving* (vx, vy)

Steering rotates the heading. Drift happens when these two diverge beyond `driftThreshold`.

### Physics Update (per frame)

```
1. Read input (W/S/A/D/Space)
2. Apply torque to speed along heading
3. Rotate heading by steer input (scaled by speed)
4. Resolve velocity into forward + lateral components
5. Apply grip to lateral component:
     - Normal: lateral *= gripRear  (kills sideways slide)
     - Handbrake: lateral *= handbrakeGrip  (allows big slide)
6. Reconstruct velocity from forward + damped lateral
7. Apply on/off-track friction to velocity magnitude
8. Integrate: position += velocity
9. Calculate slip angle = angle between velocity and heading
10. If slipAngle > driftThreshold → drifting = true
```

### Collision (Soft Limits)
Each frame, a point-in-polygon test checks whether the car's center is inside the track surface. If off-track:
- Multiply velocity by `offTrackFriction` (heavy drag)
- No hard stop — car can recover

---

## 📋 Phase Plan

---

### ✅ Phase 1 — Car Physics Prototype
**Goal:** A drivable car on a blank canvas. No map, no scoring. Just feel.

**Deliverables:**
- Canvas renders a pixel-art style car sprite (programmatic, 12×20 grid scaled 3×)
- W/S accelerate and brake
- A/D steer (heading rotates, not velocity)
- Car has momentum — doesn't stop instantly
- Velocity vector is separate from heading
- Car wraps at canvas edges (temporary, replaced in Phase 3)

**Done when:** The car feels weighty and responsive. You can feel the difference between the heading and where you're actually going.

---

### ✅ Phase 2 — Drift Mechanics
**Goal:** Add real drifting. The car should slide, not just turn.

**Deliverables:**
- Lateral grip simulation (front and rear separately)
- Slip angle calculation
- `drifting` boolean state on car
- Handbrake (Space) drops rear grip dramatically
- Gradual traction regain after drift ends
- Tire marks drawn on canvas when `drifting === true`
  - Tire marks are 3×3 pixel dots drawn at rear wheel positions in `#181818`
  - They persist on a background canvas layer (don't clear each frame)
- Visual indicator: car flashes (palette-swap style, no blending) when drifting

**Done when:** You can handbrake-turn into a corner, feel the rear kick out, and watch tire marks appear.

---

### ✅ Phase 3 — Map Rendering
**Goal:** Replace the blank canvas with the real track.

**Deliverables:**
- Map screenshot analyzed and boundaries traced into polygon arrays
- Grass rendered as 16×16 checkerboard tiles (`#50a820` / `#3c8018`) outside track
- Track rendered using Canvas `clip()` path from boundary polygons
- Track markings (center dashes, edge lines) rendered
- Soft-limit collision: off-track detection using point-in-polygon
- Off-track friction penalty applied
- Car spawn position set to track start
- Camera follows car (canvas pans so car stays centered)

**Done when:** The track looks like the screenshot and you can drive it end-to-end.

---
