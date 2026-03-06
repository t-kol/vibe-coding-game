// map/src/collision.js
// Tile ID → collidable boolean + speed multiplier lookup
// Imported by parse.js

// Tile IDs:
// 0  = Void         (collidable — out of bounds)
// 1  = Asphalt      (driveable)
// 2  = Intersection (driveable)
// 3  = Sidewalk     (driveable, slow)
// 4  = Grass        (driveable, slow)
// 5  = Dirt Path    (driveable, slow)
// 6  = Parking Lot  (driveable, slightly slow)
// 7  = Building     (collidable)
// 8  = Tree Cluster (collidable)
// 10 = Curb         (collidable)

const COLLIDABLE = {
  0:  true,
  1:  false,
  2:  false,
  3:  false,
  4:  false,
  5:  false,
  6:  false,
  7:  true,
  8:  true,
  10: true,
};

const SPEED_MOD = {
  0:  0.0,
  1:  1.0,
  2:  1.0,
  3:  0.6,
  4:  0.4,
  5:  0.7,
  6:  0.9,
  7:  0.0,
  8:  0.0,
  10: 0.0,
};

function isCollidable(tileId) {
  return COLLIDABLE[tileId] === true;
}

function getSpeedMod(tileId) {
  return SPEED_MOD[tileId] ?? 1.0;
}

module.exports = { isCollidable, getSpeedMod, COLLIDABLE, SPEED_MOD };
