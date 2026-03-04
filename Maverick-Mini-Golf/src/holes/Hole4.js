// Hole 4: "Baxter Arena Madhouse"
// Theme: Baxter Arena ice rink — ball slides fast on ICE tiles
// Par 3
//
// Coordinate reference:
//   Canvas: 320×180 px  |  Grid: 32 cols × 18 rows  |  Tile: 10×10 px
//   Tee  pixel (25, 90)  → col 2,  row 9  → map[9][2]  = 'I'  (ICE, playable) ✓
//   Cup  pixel (295, 90) → col 29, row 9  → map[9][29] = 'I'  (ICE, playable) ✓
//
// Map legend: . GRASS  # WALL  I ICE  R ROUGH
//
// Design:
//   Full ICE rink occupies rows 3-14, cols 2-29.
//   Hockey board WALL at inner rink boundary (rows 3 and 14, cols 2-29 top/bottom boards).
//   Corner boards at col 2 col 29 rows 3-14 (side boards) — but tee/cup are on col 2/29 row 9.
//   So side boards stop at row 3 and 14 only; cols 2 and 29 in row 9 are ICE.
//
//   Interior hockey board bumpers create trick-shot angles:
//     Left wing  bumper : cols 10-11, rows 5-8   (upper zone)
//     Right wing bumper : cols 20-21, rows 10-13  (lower zone)
//     These force the ball to arc around rather than go straight.
//     Row 9 itself is open: direct shot blocked only by the natural angle challenge.
//
//   GRASS bench/spectator areas: rows 1-2 and rows 15-16 (outside the rink).
//   Outer WALL border: rows 0, 17 and implicit from cols 0, 31.
//
// Row size verification:
//   Border rows (0,17)         : 32 × '#'                       = 32 ✓
//   Spectator rows (1,2,15,16) : '#' + 30×'.' + '#'             = 32 ✓
//   Rink board rows (3,14)     : '##' + 28×'I' + '##'           = 32 ✓
//   Interior ICE rows (4-13)   : '##' + 'I' + ... + 'I' + '##' = 32 ✓
//     (side boards at cols 0-1 and 30-31; ICE interior cols 2-29)
//   Bumper rows: '##' + ICE run + '##' obstacle + ICE run + '##' = varies

export default {
  number: 4,
  name: 'Baxter Arena Madhouse',
  par: 3,
  theme: 'arena',
  wind: { baseStrength: 0.0, baseAngle: 0, variable: false },

  normal: {
    map: [
      // row 0 — outer wall border
      '################################',
      // row 1 — GRASS spectator bench area
      // '#' + 30×'.' + '#' = 32 ✓
      '#..............................#',
      // row 2 — GRASS spectator bench area
      '#..............................#',
      // row 3 — top hockey board (full width rink interior)
      // '##' + 28×'I' + '##' = 2+28+2=32 ✓
      '##IIIIIIIIIIIIIIIIIIIIIIIIIIII##',
      // row 4 — rink interior, left wing bumper at cols 10-11
      // '##' + 8×'I' + '##' + 18×'I' + '##' = 2+8+2+18+2=32 ✓
      '##IIIIIIII##IIIIIIIIIIIIIIIIII##',
      // row 5 — rink interior, left wing bumper continues
      '##IIIIIIII##IIIIIIIIIIIIIIIIII##',
      // row 6 — rink interior, left wing bumper continues
      '##IIIIIIII##IIIIIIIIIIIIIIIIII##',
      // row 7 — rink interior, left wing bumper continues
      '##IIIIIIII##IIIIIIIIIIIIIIIIII##',
      // row 8 — rink interior, left wing bumper ends; clear passage
      // '##' + 28×'I' + '##' = 32 ✓
      '##IIIIIIIIIIIIIIIIIIIIIIIIIIII##',
      // row 9 — TEE at col 2 = 'I' ✓, CUP at col 29 = 'I' ✓
      // Full open ICE: '##' + 28×'I' + '##' = 32 ✓
      '##IIIIIIIIIIIIIIIIIIIIIIIIIIII##',
      // row 10 — rink interior, right wing bumper at cols 20-21
      // '##' + 18×'I' + '##' + 8×'I' + '##' = 2+18+2+8+2=32 ✓
      '##IIIIIIIIIIIIIIIIII##IIIIIIII##',
      // row 11 — right wing bumper continues
      '##IIIIIIIIIIIIIIIIII##IIIIIIII##',
      // row 12 — right wing bumper continues
      '##IIIIIIIIIIIIIIIIII##IIIIIIII##',
      // row 13 — right wing bumper ends; clear passage
      '##IIIIIIIIIIIIIIIIII##IIIIIIII##',
      // row 14 — bottom hockey board
      '##IIIIIIIIIIIIIIIIIIIIIIIIIIII##',
      // row 15 — GRASS spectator bench area
      '#..............................#',
      // row 16 — GRASS spectator bench area
      '#..............................#',
      // row 17 — outer wall border
      '################################',
    ],
    tee:  { x: 25,  y: 90 },
    cup:  { x: 295, y: 90 },
    entities: [],
    powerups: [
      { type: 'whirlwind', x: 160, y: 90 },
    ],
  },

  blizzard: {
    // More ICE, the GRASS bench areas also freeze over to ICE, extra bumpers
    map: [
      '################################',  // row  0 — outer wall
      '##IIIIIIIIIIIIIIIIIIIIIIIIIIII##',  // row  1 — frozen benches (ICE)   2+28+2=32 ✓
      '##IIIIIIIIIIIIIIIIIIIIIIIIIIII##',  // row  2 — frozen benches (ICE)
      '##IIIIIIIIIIIIIIIIIIIIIIIIIIII##',  // row  3 — top board (ICE solid)
      '##IIIIIIII##IIIIII##IIIIIIIIII##',  // row  4 — 2+8+2+6+2+10+2=32 ✓  dual bumpers
      '##IIIIIIII##IIIIII##IIIIIIIIII##',  // row  5
      '##IIIIIIII##IIIIII##IIIIIIIIII##',  // row  6
      '##IIIIIIII##IIIIII##IIIIIIIIII##',  // row  7
      '##IIIIIIIIIIIIIIIIIIIIIIIIIIII##',  // row  8 — open corridor
      '##IIIIIIIIIIIIIIIIIIIIIIIIIIII##',  // row  9 — tee/cup row, fully open
      '##IIIIIIIIIIIIIIIIIIIIIIIIIIII##',  // row 10 — open corridor
      '##IIII##IIIIII##IIIIIIIIIIIIII##',  // row 11 — 2+4+2+6+2+14+2=32 ✓  dual bumpers
      '##IIII##IIIIII##IIIIIIIIIIIIII##',  // row 12
      '##IIII##IIIIII##IIIIIIIIIIIIII##',  // row 13
      '##IIIIIIIIIIIIIIIIIIIIIIIIIIII##',  // row 14 — bottom board (ICE solid)
      '##IIIIIIIIIIIIIIIIIIIIIIIIIIII##',  // row 15 — frozen benches
      '##IIIIIIIIIIIIIIIIIIIIIIIIIIII##',  // row 16 — frozen benches
      '################################',  // row 17 — outer wall
    ],
    tee:  { x: 25,  y: 90 },
    cup:  { x: 295, y: 90 },
    entities: [],
    powerups: [
      { type: 'whirlwind', x: 160, y: 90 },
    ],
  },
};
