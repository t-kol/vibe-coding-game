// Hole 5: "Tornado Alley"
// Theme: Nebraska Plains storm — tornado drifts and pulls the ball
// Par 4
//
// Coordinate reference:
//   Canvas: 320×180 px  |  Grid: 32 cols × 18 rows  |  Tile: 10×10 px
//   Tee  pixel (20, 90)  → col 2,  row 9  → map[9][2]  = '.'  ✓
//   Cup  pixel (300, 90) → col 30, row 9  → map[9][30] = '.'  ✓
//
// Map legend: . GRASS  # WALL  R ROUGH
//
// Normal mode design — split-fork storm layout:
//   Wide left entrance opens into two paths around the central storm zone.
//   Upper path: rows 3-7, relatively clear — but wind-exposed on top.
//   Lower path: rows 11-15, sheltered below — slightly more ROUGH.
//   Storm center: rows 7-11 flanked by ROUGH; narrow GRASS channel at row 9.
//   Both paths merge at cols 25-30 for the final approach to the cup.
//   Tornado entity applies dynamic pull — ROUGH tiles add visual storm texture.
//
// Blizzard mode design:
//   Dense ROUGH coverage everywhere except the row-9 GRASS channel.
//   Two tornadoes for greater hazard. Almost no safe route above/below.
//
// Row length verification — all rows are exactly 32 chars:
//   Normal map:
//     row 0,1,16,17 : 32 × '#'                                    = 32
//     row 2         : '#'(8) + '.'(23) + '#'(1)                   = 32
//     row 3,4,14,15 : '#'(1) + '.'(29) + '##'(2)                  = 32
//     row 5,13      : '#'(1) + '.'(24) + 'RRRR'(4) + '###'(3)     = 32
//     row 6,12      : '#'(1) + '.'(15) + 'RRRRRRRR'(8) + '.'(6) + '##'(2) = 32
//     row 7,11      : '#'(1) + '.'(7) + 'R'(16) + '.'(7) + '#'(1) = 32
//     row 8,10      : '#'(1) + 'R'(6) + '.'(18) + 'R'(6) + '#'(1) = 32
//     row 9         : '#'(1) + '.'(30) + '#'(1)                    = 32
//
//   Blizzard map:
//     row 0,1,16,17 : 32 × '#'                                    = 32
//     row 2         : '#'(8) + 'R'(23) + '#'(1)                   = 32
//     row 3,4,14,15 : '#'(1) + 'R'(30) + '#'(1)                   = 32
//     row 5,13      : '#'(1) + 'R'(5) + '.'(20) + 'R'(5) + '#'(1) = 32
//     row 6,12      : '#'(1) + 'R'(12) + '.'(13) + 'R'(5) + '#'(1) = 32
//     row 7,11      : '#'(1) + 'R'(10) + '.'(15) + 'R'(5) + '#'(1) = 32
//     row 8,10      : '#'(1) + 'R'(8) + '.'(17) + 'R'(5) + '#'(1) = 32
//     row 9         : '#'(1) + '.'(30) + '#'(1)                    = 32

export default {
  number: 5,
  name: 'Tornado Alley',
  par: 4,
  theme: 'storm',
  wind: { baseStrength: 0.6, baseAngle: 315, variable: true },

  normal: {
    map: [
      '################################',
      '################################',
      '########.......................#',
      '#.............................##',
      '#.............................##',
      '#........................RRRR###',
      '#...............RRRRRRRR......##',
      '#.......RRRRRRRRRRRRRRRR.......#',
      '#RRRRRR..................RRRRRR#',
      '#..............................#',
      '#RRRRRR..................RRRRRR#',
      '#.......RRRRRRRRRRRRRRRR.......#',
      '#...............RRRRRRRR......##',
      '#........................RRRR###',
      '#.............................##',
      '#.............................##',
      '################################',
      '################################',
    ],
    tee:  { x: 20,  y: 90 },
    cup:  { x: 300, y: 90 },
    entities: [
      { type: 'tornado', x: 160, y: 90, radius: 35, speed: 15, pullForce: 0.08 },
    ],
    powerups: [
      { type: 'lasso', x: 240, y: 70 },
    ],
  },

  blizzard: {
    map: [
      '################################',
      '################################',
      '########RRRRRRRRRRRRRRRRRRRRRRR#',
      '#RRRRRRRRRRRRRRRRRRRRRRRRRRRRRR#',
      '#RRRRRRRRRRRRRRRRRRRRRRRRRRRRRR#',
      '#RRRRR....................RRRRR#',
      '#RRRRRRRRRRRR.............RRRRR#',
      '#RRRRRRRRRR...............RRRRR#',
      '#RRRRRRRR.................RRRRR#',
      '#..............................#',
      '#RRRRRRRR.................RRRRR#',
      '#RRRRRRRRRR...............RRRRR#',
      '#RRRRRRRRRRRR.............RRRRR#',
      '#RRRRR....................RRRRR#',
      '#RRRRRRRRRRRRRRRRRRRRRRRRRRRRRR#',
      '#RRRRRRRRRRRRRRRRRRRRRRRRRRRRRR#',
      '################################',
      '################################',
    ],
    tee:  { x: 20,  y: 90 },
    cup:  { x: 300, y: 90 },
    entities: [
      { type: 'tornado', x: 140, y: 90, radius: 45, speed: 20, pullForce: 0.12 },
      { type: 'tornado', x: 240, y: 60, radius: 30, speed: 18, pullForce: 0.08 },
    ],
    powerups: [
      { type: 'lasso', x: 240, y: 70 },
    ],
  },
};
