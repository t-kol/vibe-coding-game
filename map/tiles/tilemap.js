// map/tiles/tilemap.js
// Tile ID → spritesheet {sx, sy} offset
// Each tile is 64×64px; spritesheet is 1024×256px (16 tiles wide × 4 rows)

const TILEMAP = {
  0:  { sx: 0,   sy: 0 },   // Void
  1:  { sx: 64,  sy: 0 },   // Asphalt
  2:  { sx: 128, sy: 0 },   // Intersection
  3:  { sx: 192, sy: 0 },   // Sidewalk
  4:  { sx: 256, sy: 0 },   // Grass
  5:  { sx: 320, sy: 0 },   // Dirt Path
  6:  { sx: 384, sy: 0 },   // Parking Lot
  7:  { sx: 448, sy: 0 },   // Building
  8:  { sx: 512, sy: 0 },   // Tree Cluster
  10: { sx: 576, sy: 0 },   // Curb
};

module.exports = { TILEMAP };
