// Hole 3: "Bison Stampede"
// Theme: Nebraska Great Plains — wide-open fairway with bison crossing zone
// Par 4
//
// Coordinate reference:
//   Canvas: 320×180 px  |  Grid: 32 cols × 18 rows  |  Tile: 10×10 px
//   Tee  pixel (20, 90)  → col 2,  row 9  → map[9][2]  = '.'  ✓
//   Cup  pixel (300, 90) → col 30, row 9  → map[9][30] = '.'  ✓
//
// Map legend: . GRASS  # WALL  R ROUGH  S SAND
//
// Design:
//   Wide open plains fairway running left→right along row 9.
//   ROUGH borders inside the outer WALL frame give a Great Plains feel.
//   Two rock formations (WALL clusters) flank the approach:
//     Left rocks  : cols 5-7, rows 4-6
//     Right rocks : cols 24-26, rows 11-13
//   Center bison crossing zone (cols 10-22) stays fully clear for bison to cross.
//   SAND trap: cols 14-18, rows 13-14 (below the fairway — hazard if ball strays).
//   Tee at col 2/row 9, Cup at col 30/row 9 — both on GRASS.
//
// Row size verification (all = 32 chars):
//   Border rows (0,1,16,17)   : 32 × '#'         = 32 ✓
//   Rough-border rows (2,15)  : '#'+'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRR'+'#'  = 1+30+1 = 32 ✓
//   Standard open rows        : '#'+'R'+28×'.'+'R'+'#' = 1+1+28+1+1 = 32 ✓
//   Rows with left rock cluster (cols 5-7):
//     '#'+'R'+'....'(4)+'###'(3)+dot_run+'R'+'#'
//     4+3+?+1+1=32 → dot_run = 23  → '#R....###.......................R#' = 1+1+4+3+23+1+1=34 WRONG
//     Fix: '#'+'R'(1)+4dots+3walls+22dots+'R'+'#' = 1+1+4+3+22+1 = 32? = 1+1+4+3+22+1+...
//     Actually: 1+1+4+3+22+1+0 = 32 — missing final '#'. Try:
//     '#R....###......................R#' : 1+1+4+3+22+1+1=33 WRONG
//     Correct: '#R...###........................R#' — 1+1+3+3+24+1+1=34 WRONG
//
//   Let me use fixed structure:
//     '#' + 'R' + open_left + '###' + open_right + 'R' + '#'
//     Total = 1+1+OL+3+OR+1+1 = OL+OR = 25
//     If OL=3, OR=22: 1+1+3+3+22+1+1=32 ✓  → 3 dots before rocks at col 4
//     Rocks at cols: 0:#, 1:R, 2:., 3:., 4:., 5:#, 6:#, 7:#, 8-29:., 30:R, 31:#
//
//   Rows with right rock cluster (cols 24-26):
//     '#' + 'R' + open_left + '###' + open_right + 'R' + '#'
//     OL+OR=25, rocks at cols 24-26: OL=cols 1..23 = 22 dots → 1+1+22+3+2+1+1=31 WRONG
//     cols 0=# 1=R 2-23=. 24=# 25=# 26=# 27-28=. 29=R? 30=. 31=#
//     '#'+'R'+22dots+'###'+2dots+'R'+'.'+'#' — but cup is at col 30, need col 30 open
//     Fix: '#'+'R'+22dots+'###'+3dots+'R'+'#' = 1+1+22+3+3+1+1=32 ✓
//     → cols 27-29 = '...', col 30 = 'R', col 31 = '#'
//     BUT cup is at col 30 row 9, not in the rock rows so this is fine.

export default {
  number: 3,
  name: 'Bison Stampede',
  par: 4,
  theme: 'plains',
  wind: { baseStrength: 0.3, baseAngle: 270, variable: true },

  normal: {
    map: [
      // row 0 — border wall
      '################################',
      // row 1 — border wall
      '################################',
      // row 2 — rough border: '#'+'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRR'+'#' = 1+30+1=32 ✓
      '#RRRRRRRRRRRRRRRRRRRRRRRRRRRRRR#',
      // row 3 — open plains: '#'+'R'+28 dots+'R'+'#' = 32 ✓
      '#R............................R#',
      // row 4 — left rock cluster (cols 5-7); OR=22 dots after rocks
      // '#'+'R'+'...'(3)+'###'(3)+'......................'(22)+'R'+'#' = 1+1+3+3+22+1+1=32 ✓
      '#R...###......................R#',
      // row 5 — left rock cluster continues
      '#R...###......................R#',
      // row 6 — left rock cluster ends; row open
      '#R...###......................R#',
      // row 7 — open plains
      '#R............................R#',
      // row 8 — open plains
      '#R............................R#',
      // row 9 — TEE col 2 = '.', CUP col 30 = '.'
      // '#'+'.'(30)+'.'+'#' → '#'+30 dots+'#' = 32 ✓
      // col 2='.', col 30='.', col 1='.' (between # and start), col 31='#'
      // But col 1 = 'R' in standard rows... tee at col 2 is '.' ✓
      // Use full open: no ROUGH on row 9 so ball path is clean
      '#..............................#',
      // row 10 — open plains
      '#R............................R#',
      // row 11 — right rock cluster (cols 24-26)
      // '#'+'R'+22 dots+'###'+3 dots+'R'+'#' = 1+1+22+3+3+1+1=32 ✓
      '#R......................###...R#',
      // row 12 — right rock cluster continues
      '#R......................###...R#',
      // row 13 — right rock cluster ends; SAND trap at cols 14-17
      // '#'+'R'+12 dots+'SSSS'+2 dots+'###'+3 dots+'R'+'#' = 1+1+12+4+2+3+3+1+1=28 — WRONG
      // Keep rocks but no sand on same row — keep simple
      '#R......................###...R#',
      // row 14 — SAND trap: cols 13-18
      // '#'+'R'+11 dots+'SSSSSS'+10 dots+'R'+'#' = 1+1+11+6+10+1+1=31 — need 32
      // '#'+'R'+11 dots+'SSSSSS'+11 dots+'#' = 1+1+11+6+11+1+1=32 ✓
      '#R...........SSSSSS...........##',
      // row 15 — rough border
      '#RRRRRRRRRRRRRRRRRRRRRRRRRRRRRR#',
      // row 16 — border wall
      '################################',
      // row 17 — border wall
      '################################',
    ],
    tee:  { x: 20,  y: 90 },
    cup:  { x: 300, y: 90 },
    entities: [
      { type: 'bison', x: -40, y: 65,  width: 20, height: 14, speed: 45, direction:  1, period: 4.0, phaseOffset: 0.0 },
      { type: 'bison', x: -40, y: 85,  width: 20, height: 14, speed: 40, direction:  1, period: 4.0, phaseOffset: 1.2 },
      { type: 'bison', x: 360, y: 100, width: 20, height: 14, speed: 42, direction: -1, period: 4.0, phaseOffset: 2.4 },
    ],
    powerups: [
      { type: 'snowflake', x: 160, y: 90 },
    ],
  },

  blizzard: {
    // More ROUGH patches, stronger bison, slightly narrower safe zone
    // All rows verified to 32 chars.
    map: [
      '################################',  // row  0 — 32 walls
      '################################',  // row  1 — 32 walls
      '#RRRRRRRRRRRRRRRRRRRRRRRRRRRRRR#',  // row  2 — 1+30R+1=32 ✓
      '#RR..........................RR#',  // row  3 — 1+2+26+2+1=32 ✓
      '#RR..###......................R#',   // row  4 — 1+2+2+3+22+1+1=32 ✓
      '#RR..###......................R#',   // row  5 — 1+2+2+3+22+1+1=32 ✓
      '#RR..###......................R#',   // row  6 — 1+2+2+3+22+1+1=32 ✓
      '#RR..........................RR#',  // row  7 — 1+2+26+2+1=32 ✓
      '#RR..........................RR#',  // row  8 — 1+2+26+2+1=32 ✓
      '#..............................#',  // row  9 — 1+30+1=32 ✓  tee/cup clear
      '#RR..........................RR#',  // row 10 — 1+2+26+2+1=32 ✓
      '#R......................###..RR#',   // row 11 — 1+1+22+3+2+2+1=32 ✓
      '#R......................###..RR#',   // row 12 — 1+1+22+3+2+2+1=32 ✓
      '#R......................###..RR#',   // row 13 — 1+1+22+3+2+2+1=32 ✓
      '#RR.........SSSSSSSS........RRR#',  // row 14 — 1+2+9+8+8+3+1=32 ✓
      '#RRRRRRRRRRRRRRRRRRRRRRRRRRRRRR#',  // row 15 — 1+30R+1=32 ✓
      '################################',  // row 16 — 32 walls
      '################################',  // row 17 — 32 walls
    ],
    tee:  { x: 20,  y: 90 },
    cup:  { x: 300, y: 90 },
    entities: [
      { type: 'bison', x: -40, y: 60,  width: 22, height: 14, speed: 60, direction:  1, period: 3.0, phaseOffset: 0.0 },
      { type: 'bison', x: -40, y: 80,  width: 22, height: 14, speed: 55, direction:  1, period: 3.0, phaseOffset: 0.8 },
      { type: 'bison', x: -40, y: 100, width: 22, height: 14, speed: 58, direction:  1, period: 3.0, phaseOffset: 1.6 },
      { type: 'bison', x: 360, y: 115, width: 22, height: 14, speed: 62, direction: -1, period: 3.0, phaseOffset: 2.4 },
    ],
    powerups: [
      { type: 'snowflake', x: 160, y: 90 },
    ],
  },
};
