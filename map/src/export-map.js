// map/src/export-map.js
// Exports the UNO campus map layout as map.json for use by render.js
// Usage: node map/src/export-map.js
// Output: map/data/map.json

const path = require('path');
const fs   = require('fs');

const OUT_PATH = path.join(__dirname, '..', 'data', 'map.json');

const T = {
  VOID:         0,
  ASPHALT:      1,
  INTERSECTION: 2,
  SIDEWALK:     3,
  GRASS:        4,
  DIRT:         5,
  PARKING:      6,
  BUILDING:     7,
  TREE:         8,
  CURB:         10,
};

const TILE_COLLIDABLE = {
  0: true, 1: false, 2: false, 3: false, 4: false,
  5: false, 6: false, 7: true, 8: true, 10: true,
};

function buildMap() {
  const W = 90, H = 70;
  const tiles     = new Array(W * H).fill(T.GRASS);
  const collision = new Array(W * H).fill(false);
  const markings  = new Array(W * H).fill(false);

  function idx(x, y) { return y * W + x; }

  function fillRect(x, y, w, h, tileId) {
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        const tx = x + dx, ty = y + dy;
        if (tx >= 0 && tx < W && ty >= 0 && ty < H) tiles[idx(tx, ty)] = tileId;
      }
    }
  }

  function drawHRoad(x, y, len, roadWidth) {
    fillRect(x, y - 1, len, 1, T.SIDEWALK);
    fillRect(x, y + roadWidth, len, 1, T.SIDEWALK);
    fillRect(x, y, len, roadWidth, T.ASPHALT);
    if (roadWidth >= 3) {
      const cy = y + Math.floor(roadWidth / 2);
      for (let mx = x; mx < x + len; mx++) markings[idx(mx, cy)] = true;
    }
  }

  function drawVRoad(x, y, len, roadWidth) {
    fillRect(x - 1, y, 1, len, T.SIDEWALK);
    fillRect(x + roadWidth, y, 1, len, T.SIDEWALK);
    fillRect(x, y, roadWidth, len, T.ASPHALT);
  }

  function drawSegment(x1, y1, x2, y2, tileId, width) {
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len === 0) return;
    const steps = Math.ceil(len * 2);
    const half = Math.floor(width / 2);
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const cx = Math.round(x1 + dx * t);
      const cy = Math.round(y1 + dy * t);
      const px = -dy / len, py = dx / len;
      for (let w = -half; w <= half; w++) {
        const tx = Math.round(cx + px * w);
        const ty = Math.round(cy + py * w);
        if (tx >= 0 && tx < W && ty >= 0 && ty < H) tiles[idx(tx, ty)] = tileId;
      }
    }
  }

  // Dodge Street: east-west, rows 3-5 (3 tiles wide)
  drawHRoad(0, 3, W, 3);
  fillRect(34, 3, 3, 3, T.INTERSECTION);

  // Elmwood Ave: north-south, cols 35-36 (2 tiles wide)
  drawVRoad(35, 0, H, 2);
  fillRect(35, 3, 2, 3, T.INTERSECTION);

  // Elmwood Park loop road
  drawSegment(6, 12, 30, 12, T.ASPHALT, 2);
  drawSegment(30, 12, 32, 35, T.ASPHALT, 2);
  drawSegment(32, 35, 28, 52, T.ASPHALT, 2);
  drawSegment(28, 52, 10, 55, T.ASPHALT, 2);
  drawSegment(10, 55, 6, 40, T.ASPHALT, 2);
  drawSegment(6, 40, 6, 12, T.ASPHALT, 2);
  drawSegment(18, 14, 18, 53, T.DIRT, 1);
  drawSegment(10, 33, 30, 33, T.DIRT, 1);

  // Park tree clusters
  const treePosns = [
    [9,15],[12,18],[15,22],[8,28],[20,20],[24,16],[11,40],[16,36],
    [22,42],[26,38],[14,47],[20,50],[28,44],[8,50],[25,28],
  ];
  for (const [tx, ty] of treePosns) fillRect(tx, ty, 2, 2, T.TREE);

  // Park dirt paths connecting Elmwood Ave to loop
  drawSegment(35, 15, 30, 15, T.DIRT, 1);
  drawSegment(35, 35, 32, 35, T.DIRT, 1);

  // UNO Campus internal road grid
  drawHRoad(40, 10, 35, 2);
  drawHRoad(40, 28, 35, 2);
  drawHRoad(40, 45, 35, 2);
  drawVRoad(42, 8, 40, 2);
  drawVRoad(55, 8, 40, 2);
  drawVRoad(70, 8, 40, 2);

  // Campus intersections
  fillRect(42, 10, 2, 2, T.INTERSECTION);
  fillRect(55, 10, 2, 2, T.INTERSECTION);
  fillRect(70, 10, 2, 2, T.INTERSECTION);
  fillRect(42, 28, 2, 2, T.INTERSECTION);
  fillRect(55, 28, 2, 2, T.INTERSECTION);
  fillRect(70, 28, 2, 2, T.INTERSECTION);
  fillRect(42, 45, 2, 2, T.INTERSECTION);
  fillRect(55, 45, 2, 2, T.INTERSECTION);
  fillRect(70, 45, 2, 2, T.INTERSECTION);

  // Connect campus to Dodge Street
  fillRect(42, 3, 2, 7, T.ASPHALT);
  fillRect(55, 3, 2, 7, T.ASPHALT);
  fillRect(70, 3, 2, 7, T.ASPHALT);

  // Connect campus to Elmwood Ave
  fillRect(35, 10, 7, 2, T.ASPHALT);
  fillRect(35, 28, 7, 2, T.ASPHALT);
  fillRect(35, 45, 7, 2, T.ASPHALT);

  // UNO Buildings
  fillRect(44, 12, 9, 14, T.BUILDING); // Arts & Sciences Hall
  fillRect(57, 12, 11, 8, T.BUILDING); // Weber Fine Arts
  fillRect(44, 30, 9, 13, T.BUILDING); // Library / Admin
  fillRect(57, 31, 7, 11, T.BUILDING); // Science Hall
  fillRect(65, 12, 3, 6, T.BUILDING);
  fillRect(72, 12, 4, 8, T.BUILDING);
  fillRect(65, 30, 4, 9, T.BUILDING);
  fillRect(72, 31, 4, 7, T.BUILDING);
  fillRect(44, 47, 6, 7, T.BUILDING); // South campus
  fillRect(57, 47, 8, 7, T.BUILDING);

  // Parking lots
  fillRect(62, 22, 7, 5, T.PARKING);
  fillRect(72, 22, 6, 5, T.PARKING);
  fillRect(62, 38, 7, 6, T.PARKING);
  fillRect(72, 38, 6, 6, T.PARKING);
  for (let py = 22; py < 27; py++) markings[idx(65, py)] = true;
  for (let py = 22; py < 27; py++) markings[idx(75, py)] = true;
  for (let py = 38; py < 44; py++) markings[idx(65, py)] = true;
  for (let py = 38; py < 44; py++) markings[idx(75, py)] = true;

  // Void border
  for (let x = 0; x < W; x++) {
    tiles[idx(x, 0)] = T.VOID;
    tiles[idx(x, H - 1)] = T.VOID;
  }
  for (let y = 0; y < H; y++) {
    tiles[idx(0, y)] = T.VOID;
    tiles[idx(W - 1, y)] = T.VOID;
  }

  // Build collision array
  for (let i = 0; i < W * H; i++) collision[i] = TILE_COLLIDABLE[tiles[i]] === true;

  return {
    meta: { tileSize: 64, gridWidth: W, gridHeight: H },
    tiles,
    collision,
    markings,
  };
}

const mapData = buildMap();
fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
fs.writeFileSync(OUT_PATH, JSON.stringify(mapData));

const { meta } = mapData;
console.log(`Map exported: ${OUT_PATH} (${meta.gridWidth}×${meta.gridHeight} tiles)`);
