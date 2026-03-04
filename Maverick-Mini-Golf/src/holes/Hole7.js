// Hole 7: "Elmwood Creek Crossing"
// Theme: Elmwood Park creek and footbridges
// Par 3 — Water hazard center, narrow bridge, alternate risky upper bypass
//
// Coordinate reference:
//   Canvas: 320×180 px  |  Grid: 32 cols × 18 rows  |  Tile: 10×10 px
//   Tee  pixel (25,  90) → col 2,  row 9  → map[9][2]  must be '.'
//   Cup  pixel (295, 90) → col 29, row 9  → map[9][29] must be '.'
//
// Map legend: . GRASS  # WALL  ~ WATER  B BRIDGE  R ROUGH  I ICE
//
// Design:
//   Main fairway: rows 7-11, left-to-right with water hazard at cols 12-19
//   Water columns 12-13 and 16-19 are WATER (~); cols 14-15 are BRIDGE (B)
//   Bridge provides the safe 2-tile-wide crossing path
//   Upper bypass (rows 2-5): narrow passage for risky shortcut above the water
//   ROUGH borders fairway for textured feel
//   Stepping stones effect: left bank narrows before water
//
// Row-by-row char counts (32 each):
//   row  0: 32×'#'                                          = 32
//   row  1: 32×'#'                                          = 32
//   row  2: 7×'#' + 18×'.' + 7×'#'                        → 7+18+7=32
//   row  3: 6×'#' + 1R + 16×'.' + 1R + 8×'#'             → 6+1+16+1+8=32
//   row  4: 6×'#' + 20×'.' + 6×'#'                        → 6+20+6=32
//   row  5: 7×'#' + 1R + 16×'.' + 1R + 7×'#'             → 7+1+16+1+7=32
//   row  6: 1# + 5R + 5. + 2~ + 2B + 4~ + 10. + 3#       → 1+5+5+8+10+3=32
//   row  7: 1# + 1R + 9. + 2~ + 2B + 4~ + 10. + 1R + 2#  → 1+1+9+8+10+1+2=32
//   row  8: 1# + 11. + 2~ + 2B + 4~ + 10. + 2#            → 1+11+8+10+2=32
//   row  9: 1# + 11. + 2~ + 2B + 4~ + 10. + 2#            → same=32 [tee col2='.', cup col29='.']
//   row 10: 1# + 11. + 2~ + 2B + 4~ + 10. + 2#            → same=32
//   row 11: 1# + 11. + 2~ + 2B + 4~ + 9. + 3#             → 1+11+8+9+3=32
//   row 12: 5# + 5. + 2~ + 2B + 4~ + 5. + 9#              → 5+5+8+5+9=32
//   row 13: 32×'#'                                          = 32
//   row 14: 32×'#'                                          = 32
//   row 15: 32×'#'                                          = 32
//   row 16: 32×'#'                                          = 32
//   row 17: 32×'#'                                          = 32
//
// Cup verification: row 9, col 29 = index 29
//   '#...........~~BB~~~~..........##'
//   idx: 0=# 1-11=11dots 12-13=~~ 14-15=BB 16-19=~~~~ 20-29=10dots 30-31=##
//   index 29 = '.' ✓
// Tee verification: row 9, col 2 = index 2 = '.' ✓

export default {
  number: 7,
  name: 'Elmwood Creek Crossing',
  par: 3,
  theme: 'creek',
  wind: { baseStrength: 0.2, baseAngle: 0, variable: true },

  normal: {
    map: [
      '################################',  // row  0  32×#
      '################################',  // row  1  32×#
      '#######..................#######',  // row  2  7#+18.+7# = 32
      '######R................R########',  // row  3  6#+1R+16.+1R+8# = 32  (upper bypass)
      '######....................######',  // row  4  6#+20.+6# = 32
      '#######R................R#######',  // row  5  7#+1R+16.+1R+7# = 32
      '#RRRRR.....~~BB~~~~..........###',  // row  6  1+5+5+2+2+4+10+3=32
      '#R.........~~BB~~~~..........R##',  // row  7  1+1+9+2+2+4+10+1+2=32
      '#...........~~BB~~~~..........##',  // row  8  1+11+2+2+4+10+2=32
      '#...........~~BB~~~~..........##',  // row  9  same=32  [tee col2='.', cup col29='.']
      '#...........~~BB~~~~..........##',  // row 10  same=32
      '#...........~~BB~~~~.........###',  // row 11  1+11+8+9+3=32
      '#####.....~~BB~~~~.....#########',  // row 12  5+5+8+5+9=32
      '################################',  // row 13  32×#
      '################################',  // row 14  32×#
      '################################',  // row 15  32×#
      '################################',  // row 16  32×#
      '################################',  // row 17  32×#
    ],
    tee:  { x: 25,  y: 90 },
    cup:  { x: 295, y: 90 },
    entities: [],
    powerups: [
      { type: 'cowboyHat', x: 155, y: 60 },
    ],
  },

  blizzard: {
    // Frozen creek: WATER (~) becomes ICE (I) — different hazard type.
    // Slippery surface replaces penalty zone; BRIDGE remains for the main safe path.
    // Tee (25, 90) → col 2, row 9. Cup (295, 90) → col 29, row 9.
    //
    // Row changes from normal: '~' → 'I' everywhere
    // Counts identical to normal map = 32 each ✓
    map: [
      '################################',  // row  0  32×#
      '################################',  // row  1  32×#
      '#######..................#######',  // row  2  7#+18.+7# = 32
      '######R................R########',  // row  3  6#+1R+16.+1R+8# = 32
      '######....................######',  // row  4  6#+20.+6# = 32
      '#######R................R#######',  // row  5  7#+1R+16.+1R+7# = 32
      '#RRRRR.....IIBBIIII..........###',  // row  6  1+5+5+2+2+4+10+3=32 (~ → I)
      '#R.........IIBBIIII..........R##',  // row  7  1+1+9+2+2+4+10+1+2=32
      '#...........IIBBIIII..........##',  // row  8  1+11+2+2+4+10+2=32
      '#...........IIBBIIII..........##',  // row  9  same=32  [tee col2='.', cup col29='.']
      '#...........IIBBIIII..........##',  // row 10  same=32
      '#...........IIBBIIII.........###',  // row 11  1+11+8+9+3=32
      '#####.....IIBBIIII.....#########',  // row 12  5+5+8+5+9=32
      '################################',  // row 13  32×#
      '################################',  // row 14  32×#
      '################################',  // row 15  32×#
      '################################',  // row 16  32×#
      '################################',  // row 17  32×#
    ],
    tee:  { x: 25,  y: 90 },
    cup:  { x: 295, y: 90 },
    entities: [],
    powerups: [
      { type: 'cowboyHat', x: 155, y: 60 },
    ],
  },
};
