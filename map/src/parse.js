// map/src/parse.js
// Converts raw OSM JSON → internal tile grid → map.json
// Called by map/build.js

const fs = require('fs');
const path = require('path');
const { isCollidable } = require('./collision');

// ── Grid configuration ──────────────────────────────────────────────────────
const GRID_CONFIG = {
  tileSize: 64,
  gridWidth: 225,
  gridHeight: 225,
  originLat: 41.2650,   // NW corner
  originLng: -96.0660,  // NW corner
  metersPerTile: 8,
  metersPerDegLat: 111320,
  metersPerDegLng: 111320 * Math.cos(41.257 * Math.PI / 180),
};

// ── OSM highway tag → road width in tiles ──────────────────────────────────
const ROAD_WIDTHS = {
  motorway:     4,
  trunk:        4,
  primary:      3,
  secondary:    2,
  tertiary:     2,
  residential:  2,
  service:      1,
  footway:      1,
  path:         1,
  cycleway:     1,
  unclassified: 2,
};

// ── Tile IDs ────────────────────────────────────────────────────────────────
const TILE = {
  VOID:         0,
  ASPHALT:      1,
  INTERSECTION: 2,
  SIDEWALK:     3,
  GRASS:        4,
  DIRT_PATH:    5,
  PARKING_LOT:  6,
  BUILDING:     7,
  TREE_CLUSTER: 8,
  CURB:         10,
};

// Tile render priority (higher = wins over lower)
const TILE_PRIORITY = { 0: 0, 4: 1, 5: 1, 3: 2, 6: 3, 1: 4, 2: 4, 10: 4, 7: 5, 8: 5 };

function latLngToTile(lat, lng) {
  const { originLat, originLng, metersPerTile, metersPerDegLat, metersPerDegLng } = GRID_CONFIG;
  const metersNorth = (originLat - lat) * metersPerDegLat;
  const metersEast  = (lng - originLng) * metersPerDegLng;
  return {
    tileX: Math.floor(metersEast / metersPerTile),
    tileY: Math.floor(metersNorth / metersPerTile),
  };
}

function setTile(tiles, x, y, tileId) {
  const { gridWidth, gridHeight } = GRID_CONFIG;
  if (x < 0 || x >= gridWidth || y < 0 || y >= gridHeight) return;
  const idx = y * gridWidth + x;
  const existingPrio = TILE_PRIORITY[tiles[idx]] ?? 0;
  const newPrio = TILE_PRIORITY[tileId] ?? 0;
  if (newPrio >= existingPrio) tiles[idx] = tileId;
}

function drawRoadSegment(tiles, markings, x1, y1, x2, y2, width, tileId) {
  const { gridWidth } = GRID_CONFIG;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return;

  const steps = Math.ceil(len) * 2;
  const half = Math.floor(width / 2);

  for (let s = 0; s <= steps; s++) {
    const t = s / steps;
    const cx = Math.round(x1 + dx * t);
    const cy = Math.round(y1 + dy * t);
    const px = -dy / len;
    const py = dx / len;

    for (let w = -half; w <= half; w++) {
      const tx = Math.round(cx + px * w);
      const ty = Math.round(cy + py * w);
      setTile(tiles, tx, ty, tileId);
      if (w === 0 && width >= 3) {
        const idx = ty * gridWidth + tx;
        if (idx >= 0 && idx < markings.length) markings[idx] = true;
      }
    }
  }
}

function fillPolygon(tiles, points, tileId) {
  if (points.length < 3) return;
  const { gridWidth, gridHeight } = GRID_CONFIG;
  const ys = points.map(p => p.y);
  const minY = Math.max(0, Math.floor(Math.min(...ys)));
  const maxY = Math.min(gridHeight - 1, Math.ceil(Math.max(...ys)));

  for (let y = minY; y <= maxY; y++) {
    const intersections = [];
    for (let i = 0; i < points.length; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % points.length];
      if ((p1.y <= y && p2.y > y) || (p2.y <= y && p1.y > y)) {
        intersections.push(p1.x + (y - p1.y) / (p2.y - p1.y) * (p2.x - p1.x));
      }
    }
    intersections.sort((a, b) => a - b);
    for (let i = 0; i < intersections.length - 1; i += 2) {
      const x1 = Math.max(0, Math.floor(intersections[i]));
      const x2 = Math.min(gridWidth - 1, Math.floor(intersections[i + 1]));
      for (let x = x1; x <= x2; x++) setTile(tiles, x, y, tileId);
    }
  }
}

function buildNodeMap(elements) {
  const nodes = new Map();
  for (const el of elements) {
    if (el.type === 'node') nodes.set(el.id, { lat: el.lat, lng: el.lon });
  }
  return nodes;
}

function parseOSMData(osmData) {
  const { gridWidth, gridHeight, tileSize, originLat, originLng, metersPerTile } = GRID_CONFIG;
  const total = gridWidth * gridHeight;

  const tiles    = new Array(total).fill(TILE.GRASS);
  const collision = new Array(total).fill(false);
  const markings  = new Array(total).fill(false);

  const nodes = buildNodeMap(osmData.elements);
  const ways  = osmData.elements.filter(el => el.type === 'way');

  for (const way of ways) {
    const tags = way.tags || {};
    const nodeCoords = (way.nodes || [])
      .map(id => nodes.get(id))
      .filter(Boolean)
      .map(({ lat, lng }) => latLngToTile(lat, lng));

    if (tags.building) {
      fillPolygon(tiles, nodeCoords.map(c => ({ x: c.tileX, y: c.tileY })), TILE.BUILDING);
      continue;
    }

    if (tags.amenity === 'parking' || tags.landuse === 'parking') {
      fillPolygon(tiles, nodeCoords.map(c => ({ x: c.tileX, y: c.tileY })), TILE.PARKING_LOT);
      continue;
    }

    if (tags.landuse === 'grass' || tags.landuse === 'meadow' ||
        tags.natural === 'wood' || tags.natural === 'grassland' ||
        tags.leisure === 'park' || tags.leisure === 'garden') {
      const tId = tags.natural === 'wood' ? TILE.TREE_CLUSTER : TILE.GRASS;
      fillPolygon(tiles, nodeCoords.map(c => ({ x: c.tileX, y: c.tileY })), tId);
      continue;
    }

    if (tags.highway) {
      const hw = tags.highway;
      const width = ROAD_WIDTHS[hw] || 1;
      const isFootway = hw === 'footway' || hw === 'path' || hw === 'cycleway';
      const tId = isFootway ? TILE.DIRT_PATH : TILE.ASPHALT;

      for (let i = 0; i < nodeCoords.length - 1; i++) {
        const { tileX: x1, tileY: y1 } = nodeCoords[i];
        const { tileX: x2, tileY: y2 } = nodeCoords[i + 1];
        drawRoadSegment(tiles, markings, x1, y1, x2, y2, width, tId);
      }

      if (nodeCoords.length > 2 && !isFootway) {
        for (let i = 1; i < nodeCoords.length - 1; i++) {
          setTile(tiles, nodeCoords[i].tileX, nodeCoords[i].tileY, TILE.INTERSECTION);
        }
      }
    }
  }

  // Build collision array
  for (let i = 0; i < total; i++) collision[i] = isCollidable(tiles[i]);

  // Void border
  for (let x = 0; x < gridWidth; x++) {
    tiles[x] = TILE.VOID;
    tiles[(gridHeight - 1) * gridWidth + x] = TILE.VOID;
  }
  for (let y = 0; y < gridHeight; y++) {
    tiles[y * gridWidth] = TILE.VOID;
    tiles[y * gridWidth + gridWidth - 1] = TILE.VOID;
  }

  return {
    meta: { tileSize, gridWidth, gridHeight, originLat, originLng, metersPerTile },
    tiles,
    collision,
    markings,
  };
}

module.exports = { parseOSMData, TILE, GRID_CONFIG };
