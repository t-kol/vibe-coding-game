# Map System — UNO Dodge Campus & Elmwood Park

## Overview

A top-down GTA 1-style driving map covering the University of Nebraska at Omaha's Dodge Campus and Omaha's Elmwood Park. The map is generated from OpenStreetMap data via the Overpass API and rendered on an HTML5 Canvas using 64x64px tiles.

The map is **recognizable but loose** — real streets and landmarks should be identifiable, but exact geometry may be simplified for playability.

---

## Folder Structure

```
map/
├── map.md               # This file
├── data/
│   ├── raw_osm.json     # Raw output from Overpass API (intermediate, not loaded by game)
│   └── map.json         # Baked static map data (output of build script, loaded by game)
├── src/
│   ├── fetch.js         # Overpass API query + raw OSM data fetcher
│   ├── parse.js         # Converts OSM JSON → internal tile grid format
│   ├── render.js        # Draws tile grid to HTML5 Canvas
│   └── collision.js     # Tile ID → collidable boolean lookup (called by parse.js)
├── tiles/
│   ├── tileset.png      # 16-bit style spritesheet (64x64px per tile, 16 tiles wide × 4 tall = 1024×256px)
│   └── tilemap.js       # Tile ID → spritesheet offset lookup table
└── build.js             # Entry point: runs fetch → parse → outputs map.json
```

---

## Geographic Scope

| Property | Value |
|---|---|
| Area | UNO Dodge Campus + Elmwood Park, Omaha NE |
| Approximate bounding box | `41.2490, -96.0660` (SW) → `41.2650, -96.0460` (NE) |
| Real-world coverage | ~1.8km (E-W) × ~1.8km (N-S) |
| Tile size | 64 × 64 px |
| Meters per tile | ~8m (approximate) |
| Grid dimensions | ~225 × ~225 tiles |
| Coordinate origin | `(0, 0)` = NW corner (top-left); X increases eastward, Y increases southward |

> Dodge Street (~41.263°N) sits near the northern edge of the bounding box and must remain inside it. Elmwood Park's southern end (~41.249°N) anchors the southern edge.

---

## Data Pipeline

### Step 1 — Fetch (`src/fetch.js`)
- Query the **Overpass API** (`https://overpass-api.de/api/interpreter`) with a bounding box covering both areas
- Pull the following OSM feature types:
  - `highway=*` — all road types
  - `building=*` — building footprints
  - `leisure=park`, `landuse=grass`, `natural=wood` — green zones
  - `amenity=parking`, `landuse=parking` — parking lots
- Output: raw OSM JSON saved to `data/raw_osm.json`

### Step 2 — Parse (`src/parse.js`)
- Project geo coordinates → pixel/tile coordinates using a simple linear transform based on the bounding box
- Walk every OSM way/node and classify it into a **tile type** (see Tile Types below)
- Rasterize vector features onto a 2D tile grid array
- Road width is approximated by highway class (see Road Classification)
- Output: `data/map.json` — a flat tile grid array + metadata

### Step 3 — Render (`src/render.js`)
- Reads `data/map.json`
- Draws each tile to an HTML5 Canvas by mapping tile IDs → sprite offsets via `tiles/tilemap.js`
- Supports a camera/viewport offset so only the visible portion is drawn each frame
- Exports a single function: `drawMap(ctx, cameraX, cameraY)` for use by the game's main loop
- Z-order / draw passes:
  1. **Ground** — Void, Grass
  2. **Surfaces** — Asphalt, Parking Lot, Sidewalk, Dirt Path
  3. **Road markings** — Lane lines and crosswalks are drawn procedurally on top of Asphalt/Intersection tiles at render time, not stored as tile IDs. The parse step flags which asphalt tiles should carry markings via a separate `markings` array in `map.json`
  4. **Obstacles** — Curb, Tree Cluster
  5. **Buildings** — Drawn as flat colored tops (GTA 1 style), no height

### Step 4 — Collision (build-time, inside `src/parse.js`)
- Collision data is derived from the tile grid **at build time** as part of the parse step, not a separate runtime module
- The `collision` boolean array is written directly into `map.json` alongside `tiles`
- `src/collision.js` is a helper module exported by and called from `parse.js` — it contains the tile ID → collidable lookup logic so it can be independently tested
- At runtime, the game reads `collision` straight from `map.json` with no further processing needed

---

## Tile Types

| ID | Name | OSM Source | Driveable | Collidable | Speed Modifier | Notes |
|---|---|---|---|---|---|---|
| 0 | Void | (unmapped area) | No | Yes | — | Black / out of bounds |
| 1 | Asphalt | `highway=*` (road surface) | Yes | No | 1.0× | Main driveable surface |
| 2 | Intersection | Road crossings | Yes | No | 1.0× | Special tile for turns |
| 3 | Sidewalk | `highway=footway`, `footway=sidewalk` | Yes | No | 0.6× | Off-road feel, reduced speed |
| 4 | Grass | `landuse=grass`, `leisure=park` | Yes | No | 0.4× | Soft surface, heavy speed penalty |
| 5 | Dirt Path | Park interior paths | Yes | No | 0.7× | Bumpy, moderate speed penalty |
| 6 | Parking Lot | `amenity=parking` | Yes | No | 0.9× | Flat asphalt, slightly slower |
| 7 | Building | `building=*` | No | Yes | — | Solid wall collision |
| 8 | Tree Cluster | `natural=wood`, dense park areas | No | Yes | — | Impassable |
| 10 | Curb | Road edge | No | Yes | — | Thin collision band |

---

## Road Classification

OSM highway tags are mapped to tile widths (in tiles):

| OSM Tag | Road Type | Width (tiles) |
|---|---|---|
| `motorway`, `trunk` | Highway | 4 |
| `primary` | Major arterial (Dodge St) | 3 |
| `secondary` | Secondary arterial | 2 |
| `residential`, `tertiary` | Local streets | 2 |
| `service` | Parking aisles, driveways | 1 |
| `footway`, `path` | Pedestrian / park path | 1 |

---

## Map Data Format (`data/map.json`)

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

- `tiles` — flat array of tile IDs, row-major order (length = gridWidth × gridHeight)
- `collision` — parallel boolean array: `true` = blocked, `false` = passable (same length as `tiles`)
- `markings` — parallel boolean array: `true` = this asphalt/intersection tile should have road markings drawn over it at render time (same length as `tiles`)
- All arrays are row-major: index = `y * gridWidth + x`, where `(0,0)` is the NW corner

---

## Tileset Spec (`tiles/tileset.png`)

- Each tile is **64 × 64 px**
- Spritesheet is a single PNG arranged as a **16-tile-wide × 4-tile-tall grid = 1024 × 256 px total**
- 16-bit aesthetic: limited palette (~32 colors), chunky pixel shading, no anti-aliasing
- Required tiles (minimum viable):
  - Asphalt (straight N/S, straight E/W, 4 corner curves, T-junction ×4, cross intersection) — 10 tiles
  - Sidewalk — 1 tile
  - Grass (plain, with tree, park path) — 3 tiles
  - Parking lot (plain, with stripe marking) — 2 tiles
  - Building tops (small, medium, large — flat color fills for GTA 1 style) — 3 tiles
  - Curb — 1 tile
  - Tree Cluster — 1 tile
  - Void / out-of-bounds — 1 tile
  - **Total: ~22 tiles** (leaves room to grow within the 64-tile sheet)

---

## Tilemap Format (`tiles/tilemap.js`)

Maps each tile ID to its pixel offset within `tileset.png`:

```js
// tiles/tilemap.js
export const TILEMAP = {
  0:  { x: 0,   y: 0   },  // Void
  1:  { x: 64,  y: 0   },  // Asphalt (straight N/S)
  2:  { x: 128, y: 0   },  // Intersection
  3:  { x: 192, y: 0   },  // Sidewalk
  4:  { x: 256, y: 0   },  // Grass
  5:  { x: 320, y: 0   },  // Dirt Path
  6:  { x: 384, y: 0   },  // Parking Lot
  7:  { x: 448, y: 0   },  // Building
  8:  { x: 512, y: 0   },  // Tree Cluster
  10: { x: 576, y: 0   },  // Curb
  // Additional road variant tiles go in row 2 (y: 64) and beyond
};
```

Usage in `render.js`:
```js
import { TILEMAP } from '../tiles/tilemap.js';
const { x, y } = TILEMAP[tileId];
ctx.drawImage(tileset, x, y, 64, 64, screenX, screenY, 64, 64);
```

---

## Build Script (`build.js`)

Running `node build.js` should:

1. Call `fetch.js` to pull fresh OSM data for the bounding box → writes `data/raw_osm.json`
2. Call `parse.js` to rasterize OSM data into tile, collision, and markings arrays
3. Write `data/map.json` with all three arrays + metadata
4. Log grid dimensions, tile type counts, and any OSM features that couldn't be classified

The game loads `data/map.json` at runtime — no live OSM calls during gameplay. Re-run `build.js` any time the map needs to be refreshed from OSM.

---

## Key Landmarks to Preserve

These should be recognizable in the final map:

| Landmark | Type | Notes |
|---|---|---|
| Dodge Street | Primary road | Main east-west artery, northern border of map |
| UNO Arts & Sciences Hall | Building cluster | Central campus zone |
| UNO Weber Fine Arts | Building | Distinctive shape |
| Elmwood Park main loop road | Road | Winding park drive, key driving feature |
| Elmwood Park open fields | Grass | Large driveable open area |
| UNO Parking structures / lots | Parking | Multiple lots on campus east side |
| Elmwood Ave | Secondary road | North-south connector between areas |

---

## Open Questions / Future Considerations

- **Tileset art**: Will tileset.png be hand-drawn, procedurally generated, or sourced from a free 16-bit asset pack?
- **Dynamic objects**: Trees, parked cars, and NPCs are out of scope for the map system — handled by the game's entity system (see `spec.md`)
- **Map editor**: A browser-based tile editor for manual corrections post-OSM-parse would be useful given the "recognizable but loose" fidelity goal
- **Multiple maps**: This structure supports additional maps by swapping `data/map.json` — no changes needed to the render or collision systems
