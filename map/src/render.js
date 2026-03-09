// map/src/render.js
// Renders map.json to a PNG preview using map_tiles.png tileset (not used by game)
// Usage: node map/src/render.js
// Requires: npm install canvas
// Output: map/data/preview.png

const path = require('path');
const fs = require('fs');
const { TILEMAP } = require('../tiles/tilemap');

const TILE_SIZE    = 64;
const PX           = 4; // pixels per tile in preview (64px tile → 4px in preview)
const TILESET_PATH = path.join(__dirname, '..', '..', 'assets', 'tiles', 'map_tiles.png');
const MAP_PATH     = path.join(__dirname, '..', 'data', 'map.json');
const OUTPUT_PATH  = path.join(__dirname, '..', 'data', 'preview.png');

// Fallback solid colors if tileset PNG can't be loaded
const TILE_COLORS = {
  0:  '#111111',  // Void
  1:  '#333340',  // Asphalt
  2:  '#4444AA',  // Intersection
  3:  '#B8A878',  // Sidewalk
  4:  '#3A7A2A',  // Grass
  5:  '#8B6914',  // Dirt Path
  6:  '#404050',  // Parking Lot
  7:  '#6B5B4B',  // Building
  8:  '#1A5A0A',  // Tree Cluster
  10: '#888870',  // Curb
};

async function renderPreview() {
  let createCanvas, loadImage;
  try {
    ({ createCanvas, loadImage } = require('canvas'));
  } catch (e) {
    console.error('node-canvas not installed. Run: npm install canvas');
    return;
  }

  if (!fs.existsSync(MAP_PATH)) {
    console.error(`map.json not found at ${MAP_PATH}. Run build.js or export-map.js first.`);
    process.exit(1);
  }

  const mapData = JSON.parse(fs.readFileSync(MAP_PATH, 'utf8'));
  const { gridWidth, gridHeight } = mapData.meta;

  const canvas = createCanvas(gridWidth * PX, gridHeight * PX);
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  // Try to load the actual tileset PNG
  let tileset = null;
  if (fs.existsSync(TILESET_PATH)) {
    try {
      tileset = await loadImage(TILESET_PATH);
      console.log('Rendering with map_tiles.png tileset');
    } catch (e) {
      console.warn('Failed to load map_tiles.png, falling back to solid colors:', e.message);
    }
  } else {
    console.warn(`map_tiles.png not found at ${TILESET_PATH}, falling back to solid colors`);
  }

  for (let y = 0; y < gridHeight; y++) {
    for (let x = 0; x < gridWidth; x++) {
      const tileId = mapData.tiles[y * gridWidth + x];

      if (tileset) {
        const tm = TILEMAP[tileId] || TILEMAP[0];
        ctx.drawImage(tileset, tm.sx, tm.sy, TILE_SIZE, TILE_SIZE, x * PX, y * PX, PX, PX);
      } else {
        ctx.fillStyle = TILE_COLORS[tileId] ?? '#FF00FF';
        ctx.fillRect(x * PX, y * PX, PX, PX);
      }
    }
  }

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(OUTPUT_PATH, buffer);
  console.log(`Preview saved: ${OUTPUT_PATH} (${gridWidth * PX}×${gridHeight * PX}px)`);
}

renderPreview().catch(console.error);
