// Hole 8: "Chancellor's Lawn"
// Theme: UNO campus quad — wide open, strong wind, sprinkler hazards
// Par 4 — Deceptively simple wide fairway, strongest wind in the game
//
// Coordinate reference:
//   Canvas: 320×180 px  |  Grid: 32 cols × 18 rows  |  Tile: 10×10 px
//   Tee  pixel (20,  90) → col 2,  row 9  → map[9][2]  must be '.'
//   Cup  pixel (300, 90) → col 30, row 9  → map[9][30] must be '.'
//
// Map legend: . GRASS  # WALL  R ROUGH  S SAND
//
// Design:
//   Wide open green spans rows 2-15, cols 1-30
//   Two diagonal ROUGH paths cross the fairway (campus walkways):
//     Path A: top-left to center (rows 3-8, crawling right)
//     Path B: top-right to center-left (rows 3-7, crawling left)
//   Small wall obstacles (campus benches/trees) at interior positions
//   SAND hazard trap at bottom center (rows 13-14, cols 12-19)
//   Sprinkler entities at (100,70) and (200,110)
//
// Row-by-row char counts (32 each):
//   row  0: 32×'#'                               = 32
//   row  1: 32×'#'                               = 32
//   row  2: '#' + 30×'.' + '#'                  → 1+30+1=32
//   row  3: '#' + 3. + 2R + 22. + 2R + 1. + '#' → 1+3+2+22+2+1+1=32
//   row  4: '#' + 6. + 2R + 16. + 2R + 4. + '#' → 1+6+2+16+2+4+1=32
//   row  5: '#' + 9. + 2R + 10. + 2R + 7. + '#' → 1+9+2+10+2+7+1=32
//   row  6: '#' + 12. + 2R + 4. + 2R + 10. + '#'→ 1+12+2+4+2+10+1=32
//   row  7: '#' + 15. + 2R + 13. + '#'          → 1+15+2+13+1=32
//   row  8: '#' + 2. + 2# + 13. + 2# + 11. + '#'→ 1+2+2+13+2+11+1=32 (bench obstacles)
//   row  9: '#' + 28. + '#' (+ col30='.' in pos 30) → 1+29.+'#'=31 BAD
//   Actually: row 9 tee col2=. cup col30=.
//     '#' + 29×'.' + '#' = 1+29+1+1 = 32? → '#' idx0, 29 dots idx1-29, '#' idx30,'#' idx31
//     Cup col30 = index 30 = '#' — WRONG. Need '.' at index 30.
//     So: '#' + 30×'.' + '#' — wait that's 32 but index 30 = '.' ✓ wait:
//     '#' = idx0, 30 dots = idx1-30, '#' = idx31. Index 30 = '.' ✓, index 2 = '.' ✓
//     '###########.....................' nope.
//     Simply: '#..............................#' = '#' + 30×'.' + '#' = 32 ✓
//     Index 2 = '.', index 30 = '.' ✓
//   row  9: '#' + 30×'.' + '#'                  → 1+30+1=32  [tee col2='.', cup col30='.']
//   row 10: '#' + 30×'.' + '#'                  → 32
//   row 11: '#' + 30×'.' + '#'                  → 32
//   row 12: '#' + 30×'.' + '#'                  → 32
//   row 13: '#' + 4. + 1R + 6S + 8. + 6S + 4. + '#' → 1+4+1+6+8+6+4+1=31 bad
//   Let me redo: '#' + 11. + 8S + 11. + '#' = 1+11+8+11+1=32 ✓
//   row 13: '#' + 11. + 8×'S' + 11. + '#'       → 1+11+8+11+1=32
//   row 14: '#' + 11. + 8×'S' + 11. + '#'       → same=32
//   row 15: '#' + 30×'.' + '#'                  → 32
//   row 16: 32×'#'                               = 32
//   row 17: 32×'#'                               = 32

export default {
  number: 8,
  name: "Chancellor's Lawn",
  par: 4,
  theme: 'campus',
  wind: { baseStrength: 0.7, baseAngle: 180, variable: true },

  normal: {
    map: [
      '################################',  // row  0  32×#
      '################################',  // row  1  32×#
      '#..............................#',  // row  2  1+30.+1=32
      '#...RR....................RR...#',  // row  3  1+3.+2R+20.+2R+3.+1=32
      '#......RR..............RR......#',  // row  4  1+6.+2R+14.+2R+6.+1 = 1+6+2+14+2+6+1=32 ✓
      '#.........RR........RR.........#',  // row  5  1+9.+2R+8.+2R+9.+1 = 1+9+2+8+2+9+1=32 ✓
      '#............RR..RR............#',  // row  6  1+12.+2R+2.+2R+12.+1 = 1+12+2+2+2+12+1=32 ✓
      '#...............RR.............#',  // row  7  1+15.+2R+13.+1 = 1+15+2+13+1=32 ✓
      '#..##.............##...........#',  // row  8  1+2.+2#+13.+2#+11.+1 = 1+2+2+13+2+11+1=32 ✓
      '#..............................#',  // row  9  1+30.+1=32  [tee col2='.', cup col30='.']
      '#..............................#',  // row 10  32
      '#..............................#',  // row 11  32
      '#..............................#',  // row 12  32
      '#...........SSSSSSSS...........#',  // row 13  1+11.+8S+11.+1=32  (sand trap)
      '#...........SSSSSSSS...........#',  // row 14  same=32
      '#..............................#',  // row 15  32
      '################################',  // row 16  32×#
      '################################',  // row 17  32×#
    ],
    tee:  { x: 20,  y: 90 },
    cup:  { x: 300, y: 90 },
    entities: [
      { type: 'sprinkler', x: 100, y: 70,  radius: 30, period: 3.0, phaseOffset: 0.0 },
      { type: 'sprinkler', x: 200, y: 110, radius: 25, period: 3.0, phaseOffset: 1.5 },
    ],
    powerups: [
      { type: 'whirlwind', x: 160, y: 90 },
    ],
  },

  blizzard: {
    // Blizzard campus: stronger sprinklers, ROUGH edges added for wind drift penalty,
    // ICE patch replaces some grass near center (icy patches from campus puddles)
    // Tee (20, 90) → col 2, row 9. Cup (300, 90) → col 30, row 9.
    //
    // Added: ICE strip across rows 9-10, cols 8-11 and 20-23 (icy puddles)
    // row  9 blizzard: 1# + 7. + 4I + 8. + 4I + 7. + 1# = 1+7+4+8+4+7+1=32 ✓
    //   tee col2=. (idx2='.') ✓   cup col30=. (idx30='.') ✓
    map: [
      '################################',  // row  0  32×#
      '################################',  // row  1  32×#
      '#..............................#',  // row  2  32
      '#...RR....................RR...#',  // row  3  32
      '#......RR..............RR......#',  // row  4  32
      '#.........RR........RR.........#',  // row  5  32
      '#............RR..RR............#',  // row  6  32
      '#...............RR.............#',  // row  7  32
      '#..##.............##...........#',  // row  8  32
      '#.......IIII........IIII.......#',  // row  9  1+7.+4I+8.+4I+7.+1=1+7+4+8+4+7+1=32 ✓ [tee col2='.', cup col30='.']
      '#.......IIII........IIII.......#',  // row 10  same=32
      '#..............................#',  // row 11  32
      '#..............................#',  // row 12  32
      '#...........SSSSSSSS...........#',  // row 13  32
      '#...........SSSSSSSS...........#',  // row 14  32
      '#..............................#',  // row 15  32
      '################################',  // row 16  32×#
      '################################',  // row 17  32×#
    ],
    tee:  { x: 20,  y: 90 },
    cup:  { x: 300, y: 90 },
    entities: [
      { type: 'sprinkler', x: 100, y: 70,  radius: 40, period: 2.0, phaseOffset: 0.0 },
      { type: 'sprinkler', x: 200, y: 110, radius: 35, period: 2.0, phaseOffset: 1.0 },
      { type: 'sprinkler', x: 160, y: 90,  radius: 30, period: 2.5, phaseOffset: 0.5 },
    ],
    powerups: [
      { type: 'whirlwind', x: 160, y: 90 },
    ],
  },
};
