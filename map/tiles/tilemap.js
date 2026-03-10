// map/tiles/tilemap.js
// Tile ID → spritesheet {sx, sy} offset
// Sheet: assets/tiles/map_tiles.png — 4 columns × 4 rows, each tile 64×64px (256×256px total)
//
//   col →  0         1             2           3
//   row 0: VOID      ASPHALT       SIDEWALK    GRASS
//   row 1: TREE      INTERSECTION  DIRT        PARKING
//   row 2: BUILDING  CURB          —           —

const TILEMAP = {
  0:  { sx: 0,   sy: 0   },  // VOID
  1:  { sx: 64,  sy: 0   },  // ASPHALT
  2:  { sx: 64,  sy: 64  },  // INTERSECTION
  3:  { sx: 128, sy: 0   },  // SIDEWALK
  4:  { sx: 192, sy: 0   },  // GRASS
  5:  { sx: 128, sy: 64  },  // DIRT
  6:  { sx: 192, sy: 64  },  // PARKING
  7:  { sx: 0,   sy: 128 },  // BUILDING
  8:  { sx: 0,   sy: 64  },  // TREE
  10: { sx: 64,  sy: 128 },  // CURB
};

module.exports = { TILEMAP };
