// map/src/render.js
// Renders map.json to a small PNG preview for visual inspection (not used by game)
// Usage: node map/src/render.js
// Requires: npm install canvas
// Output: map/data/preview.png

const path = require('path');
const fs = require('fs');

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

const MAP_PATH    = path.join(__dirname, '..', 'data', 'map.json');
const OUTPUT_PATH = path.join(__dirname, '..', 'data', 'preview.png');

async function renderPreview() {
  let createCanvas;
  try {
    ({ createCanvas } = require('canvas'));
  } catch (e) {
    console.error('node-canvas not installed. Run: npm install canvas');
    return;
  }

  if (!fs.existsSync(MAP_PATH)) {
    console.error(`map.json not found at ${MAP_PATH}. Run build.js first.`);
    process.exit(1);
  }

  const mapData = JSON.parse(fs.readFileSync(MAP_PATH, 'utf8'));
  const { gridWidth, gridHeight } = mapData.meta;
  const PX = 4; // pixels per tile in preview

  const canvas = createCanvas(gridWidth * PX, gridHeight * PX);
  const ctx = canvas.getContext('2d');

  for (let y = 0; y < gridHeight; y++) {
    for (let x = 0; x < gridWidth; x++) {
      const tileId = mapData.tiles[y * gridWidth + x];
      ctx.fillStyle = TILE_COLORS[tileId] ?? '#FF00FF';
      ctx.fillRect(x * PX, y * PX, PX, PX);
    }
  }

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(OUTPUT_PATH, buffer);
  console.log(`Preview saved: ${OUTPUT_PATH} (${gridWidth * PX}×${gridHeight * PX}px)`);
}

renderPreview().catch(console.error);
