# 🏎️ Top-Down Drifting Simulator — Project Spec (16-Bit Edition)

**Project Type:** Browser-based 2D game  
**Tech Stack:** HTML, CSS, JavaScript (Canvas API) — single file, no frameworks  
**Class:** Vibe Coding Capstone  
**Build Style:** Iterative, phase-by-phase — each phase is playable before moving on  
**Hosting:** GitHub Pages (or equivalent static host)  
**Canvas Size:** Fills the entire browser window (dynamically sized)

---

## 📐 Overview

A polished top-down drifting simulator where the player drives a car around a real-world map of the **University of Nebraska at Omaha's Dodge Campus and Elmwood Park**, earning points by pulling off sustained, high-angle drifts. The map is rendered on an HTML5 Canvas using 64×64px tiles in a GTA 1-style top-down perspective.

The map is **recognizable but loose** — real streets and landmarks should be identifiable, but exact geometry may be simplified for playability.

---

## 🗂️ File Structure

```
drift-game/
│
├── index.html             ← Single-file game (HTML + CSS + JS all in one)
├── spec.md                ← This document
│
└── map/
    ├── data/
    │   ├── raw_osm.json   ← Raw output from Overpass API (intermediate, not loaded by game)
    │   └── map.json       ← Baked static map data (output of build script, loaded by game)
    ├── src/
    │   ├── fetch.js       ← Overpass API query + raw OSM data fetcher
    │   ├── parse.js       ← Converts OSM JSON → internal tile grid format
    │   ├── render.js      ← Draws tile grid to HTML5 Canvas
    │   └── collision.js   ← Tile ID → collidable boolean lookup (called by parse.js)
    ├── tiles/
    │   ├── tileset.png    ← 16-bit style spritesheet (64×64px per tile, 16×4 = 1024×256px)
    │   └── tilemap.js     ← Tile ID → spritesheet offset lookup table
    └── build.js           ← Entry point: runs fetch → parse → outputs map.json
```

All game code lives in one `index.html` file. Internally organized into clearly commented sections:

```
[CONFIG]       ← All tunable constants live here
[STATE]        ← Global game state
[MAP]          ← Tile grid, placeholder map definition
[CAR]          ← Car object, physics update
[INPUT]        ← Keyboard handler
[SCORING]      ← Drift detection & scoring
[RENDERER]     ← All canvas drawing (tiles + car + markings + tire marks)
[HUD]          ← Overlay UI (speed, score, combo)
[LOOP]         ← requestAnimationFrame game loop
```

---

## 🏗️ Build Order

Phases are built in this order — each must be fully working before the next begins:

1. **Phase 3 — Map Rendering** ← build first
2. **Phase 1 — Car Physics** ← then drop the car onto the map
3. **Phase 2 — Drift Mechanics** ← then add drift on top of physics

---

## ⚙️ Tuning Config Object

At the very top of the JS, before anything else, a `CONFIG` object exposes every tunable value:

```js
const CONFIG = {
  // Engine
  torque:           0.4,
  brakeForce:       0.6,
  maxSpeed:         8.0,
  reverseMaxSpeed:  3.0,

  // Steering
  steerSpeed:       0.045,   // Radians per frame at full lock
  steerReturn:      0.85,    // How fast steering self-centers (0–1)

  // Grip & Drift
  gripFront:        0.88,    // Front lateral grip (0 = ice, 1 = glue)
  gripRear:         0.82,    // Rear lateral grip
  handbrakeGrip:    0.30,    // Rear grip when handbrake held
  driftThreshold:   0.35,    // Slip angle (rad) that triggers drift state
  tractionRegain:   0.04,    // How fast grip returns after drift ends

  // Surface friction
  offTrackFriction: 0.92,    // Velocity multiplier per frame on slow surfaces
  onTrackFriction:  0.995,   // Velocity multiplier per frame on asphalt

  // Scoring
  scorePerFrame:    0.5,
  angleMultiplier:  80,
  comboWindow:      90,      // Frames before combo resets after drift ends
  maxCombo:         8,
};
```

---

## 🗺️ Map System — UNO Dodge Campus & Elmwood Park

### Placeholder Map (Phase 3 starting point)

The initial map is **hardcoded in JavaScript** — a hand-authored tile grid that roughly approximates the UNO/Elmwood area. No external files, no server required. It ships inline in `index.html` so the game works on GitHub Pages with zero setup.

The placeholder captures:
- Dodge Street running east-west across the northern edge (3 tiles wide)
- Elmwood Ave running north-south as a connector (2 tiles wide)
- A loose approximation of the Elmwood Park loop road (winding, 2 tiles wide)
- Open grass fields in the park interior
- Rough building footprints for the UNO campus zone
- Parking lot areas on the campus east side

Once the OSM pipeline is built, `map.json` replaces the hardcoded grid with no other changes needed.

### Geographic Scope (for OSM pipeline)

| Property | Value |
|---|---|
| Area | UNO Dodge Campus + Elmwood Park, Omaha NE |
| Bounding box | `41.2490, -96.0660` (SW) → `41.2650, -96.0460` (NE) |
| Real-world coverage | ~1.8km × ~1.8km |
| Tile size | 64 × 64 px |
| Meters per tile | ~8m |
| Grid dimensions | ~225 × ~225 tiles |
| Coordinate origin | `(0,0)` = NW corner; X east, Y south |

### Tile Types

| ID | Name | Driveable | Collidable | Speed Modifier | Notes |
|---|---|---|---|---|---|
| 0 | Void | No | Yes | — | Black / out of bounds |
| 1 | Asphalt | Yes | No | 1.0× | Main surface |
| 2 | Intersection | Yes | No | 1.0× | Road crossings |
| 3 | Sidewalk | Yes | No | 0.6× | Reduced speed |
| 4 | Grass | Yes | No | 0.4× | Heavy penalty |
| 5 | Dirt Path | Yes | No | 0.7× | Park interior |
| 6 | Parking Lot | Yes | No | 0.9× | Slightly slower |
| 7 | Building | No | Yes | — | Solid collision |
| 8 | Tree Cluster | No | Yes | — | Impassable |
| 10 | Curb | No | Yes | — | Road edge |

Tiles 3–6 apply `CONFIG.offTrackFriction` as a speed penalty. Tiles 0, 7, 8, 10 are hard-collidable (velocity reflected/zeroed on contact).

### Road Classification (OSM pipeline)

| OSM Tag | Road Type | Width (tiles) |
|---|---|---|
| `motorway`, `trunk` | Highway | 4 |
| `primary` | Major arterial (Dodge St) | 3 |
| `secondary` | Secondary arterial | 2 |
| `residential`, `tertiary` | Local streets | 2 |
| `service` | Parking aisles, driveways | 1 |
| `footway`, `path` | Pedestrian / park path | 1 |

### Map Data Format (`data/map.json`)

```json
{
  "meta": {
    "tileSize": 64,
    "gridWidth": 225,
    "gridHeight": 225,
    "originLat": 41.2650,
    "originLng": -96.0660,
    "metersPerTile": 8
  },
  "tiles": [0, 0, 1, 1, 2, ...],
  "collision": [true, true, false, false, false, ...],
  "markings": [false, false, true, false, false, ...]
}
```

All three arrays are row-major: `index = y * gridWidth + x`.

### Key Landmarks to Preserve

| Landmark | Type | Notes |
|---|---|---|
| Dodge Street | Primary road | Main E-W artery, northern map edge |
| UNO Arts & Sciences Hall | Building cluster | Central campus zone |
| UNO Weber Fine Arts | Building | Distinctive shape |
| Elmwood Park loop road | Road | Winding park drive, key driving feature |
| Elmwood Park open fields | Grass | Large driveable open area |
| UNO Parking structures / lots | Parking | East side of campus |
| Elmwood Ave | Secondary road | N-S connector between campus and park |

---

## 🎨 Tileset

**Tileset is procedurally generated in JavaScript** — drawn to an offscreen canvas at startup, no external image file needed. This works on GitHub Pages with zero assets.

- Each tile: **64 × 64 px**, 16-bit pixel art aesthetic
- Limited palette (~32 colors), chunky shading, no anti-aliasing
- Spritesheet layout: 16 tiles wide × 4 rows tall = 1024 × 256 px

Required tiles:
- Asphalt variants (N/S straight, E/W straight, 4 corners, 4 T-junctions, cross) — 10 tiles
- Sidewalk — 1 tile
- Grass (plain, with tree, with path) — 3 tiles
- Parking lot (plain, with stripe) — 2 tiles
- Building tops (small / medium / large, flat GTA-1 style fills) — 3 tiles
- Curb — 1 tile
- Tree Cluster — 1 tile
- Void — 1 tile
- **~22 tiles total**, plenty of room in the 64-slot sheet

Tilemap lookup (`tiles/tilemap.js` or inlined in `index.html`):

```js
const TILEMAP = {
  0:  { x: 0,   y: 0 },  // Void
  1:  { x: 64,  y: 0 },  // Asphalt
  2:  { x: 128, y: 0 },  // Intersection
  3:  { x: 192, y: 0 },  // Sidewalk
  4:  { x: 256, y: 0 },  // Grass
  5:  { x: 320, y: 0 },  // Dirt Path
  6:  { x: 384, y: 0 },  // Parking Lot
  7:  { x: 448, y: 0 },  // Building
  8:  { x: 512, y: 0 },  // Tree Cluster
  10: { x: 576, y: 0 },  // Curb
};
```

---

## 🖥️ Canvas & Camera

- Canvas fills the entire browser window (`width = window.innerWidth`, `height = window.innerHeight`)
- Resizes on `window.resize`
- Camera is centered on the car at all times — only the visible portion of the tile grid is drawn each frame
- Draw call: `drawMap(ctx, cameraX, cameraY)` where camera is the world position of the screen center

### Render Z-order

1. Ground — Void, Grass
2. Surfaces — Asphalt, Parking Lot, Sidewalk, Dirt Path
3. Road markings — drawn procedurally over tiles flagged in `markings[]`
4. Tire marks — persistent layer, never cleared
5. Obstacles — Curb, Tree Cluster
6. Buildings — flat colored tops, no height
7. Car sprite
8. HUD overlay

---

## 🚗 Car Physics Model

### Core Principle
Two separate vectors:
- **`heading`** — direction the car is pointing (radians)
- **`velocity`** — direction the car is actually moving (vx, vy)

Drift occurs when these diverge past `CONFIG.driftThreshold`.

### Physics Update (per frame)

```
1.  Read input (W/S/A/D/Space)
2.  Apply torque to speed along heading
3.  Rotate heading by steer input (scaled by current speed)
4.  Resolve velocity → forward component + lateral component
5.  Apply grip to lateral:
      normal:     lateral *= gripRear
      handbrake:  lateral *= handbrakeGrip
6.  Reconstruct velocity from forward + damped lateral
7.  Apply surface friction multiplier based on current tile type
8.  Integrate: position += velocity
9.  Calculate slip angle = angleDiff(velocity direction, heading)
10. If slipAngle > driftThreshold → drifting = true
```

### Collision
Per-frame tile lookup in `collision[]`. On collidable tile:
- Velocity multiplied by `offTrackFriction` (no instant stop — car can recover)

### Car Sprite
Pixel-art car drawn programmatically on a 12×20 grid, scaled 3× (36×60px rendered). Palette-swaps to a highlight color while `drifting === true`.

---

## 💨 Drift Mechanics

- **Slip angle** calculated every frame as the angular difference between velocity direction and heading
- `drifting = slipAngle > CONFIG.driftThreshold`
- Handbrake (Space) forces `drifting = true` by dropping rear grip to `handbrakeGrip`
- Traction regains gradually at `CONFIG.tractionRegain` per frame after handbrake released
- **Tire marks**: 3×3 px dots at rear wheel positions, color `#181818`, drawn to a persistent background canvas layer (never cleared)
- **Visual flash**: car sprite swaps to drift palette while drifting (no alpha blending)

---

## 🏆 Scoring

- Points accumulate every frame while `drifting === true`
- Formula: `points = CONFIG.scorePerFrame + (slipAngle * CONFIG.angleMultiplier)`
- **Combo multiplier**: if a new drift begins within `CONFIG.comboWindow` frames of the last one ending, combo increments (max `CONFIG.maxCombo`)
- Combo resets if the gap exceeds `comboWindow`
- HUD displays: current score, combo multiplier, current speed

---

## 📋 Phase Plan

### Phase 3 — Map Rendering ← BUILD FIRST
**Goal:** Full-window canvas showing the placeholder UNO/Elmwood tile map. No car yet.

**Deliverables:**
- Tileset generated procedurally to offscreen canvas at startup
- Hardcoded placeholder tile grid approximating UNO/Elmwood area
- Camera system rendering only the visible viewport portion
- Road markings drawn procedurally over marked tiles
- Canvas resizes correctly with the window

**Done when:** You can see the map and it looks like the UNO/Elmwood area.

---

### Phase 1 — Car Physics ← BUILD SECOND
**Goal:** Drivable car on the map. No drift scoring yet.

**Deliverables:**
- Pixel-art car sprite drawn programmatically
- W/S accelerate/brake, A/D steer
- Momentum — no instant stops
- Heading and velocity are separate vectors
- Camera follows car, map scrolls correctly
- Tile-based collision: collidable tiles apply heavy friction

**Done when:** Car feels weighty, drives around the map, slows on grass/sidewalk.

---

### Phase 2 — Drift Mechanics ← BUILD THIRD
**Goal:** Real sliding. Tire marks. Combo scoring.

**Deliverables:**
- Front/rear lateral grip simulation
- Slip angle calculation + `drifting` boolean
- Handbrake (Space) triggers rear slip
- Gradual traction regain
- Persistent tire marks on background canvas layer
- Car sprite palette-swaps while drifting
- Drift scoring + combo multiplier
- HUD: score, combo, speed

**Done when:** You can handbrake into a corner, feel the rear kick out, rack up a combo.

---

## 🔮 Future / Out of Scope

- **OSM pipeline** (`fetch.js` / `parse.js` / `build.js`) — builds the real `map.json` to replace the placeholder
- **Dynamic entities** — parked cars, NPCs, trees (entity system, separate from map)
- **Map editor** — browser-based tile editor for post-OSM corrections
- **Minigame stops** — `stops[]` array in map format reserved for Phase 5+
- **Multiple maps** — architecture already supports it by swapping the tile grid
