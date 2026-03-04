// Hole 2: "The Criss Library Stacks"
// Theme: UNO Criss Library — winding path through bookshelves
// Par 3
//
// Coordinate reference:
//   Canvas: 320×180 px  |  Grid: 32 cols × 18 rows  |  Tile: 10×10 px
//   Tee  pixel (25, 90)  → col 2,  row 9  → map[9][2]  = '.'  ✓
//   Cup  pixel (295, 45) → col 29, row 4  → map[4][29] = '.'  ✓
//
// Map legend: . GRASS  # WALL  I ICE  R ROUGH
//
// Design — Z-shaped winding path:
//   Lower-left corridor : rows 7-11, cols 1-16  (tee at col 2, row 9)
//   Vertical junction   : rows 3-9,  cols 14-17
//   Upper-right corridor: rows 2-6,  cols 15-30 (cup at col 29, row 4)
//   Bookshelf WALL stubs protrude from corridor walls.
//   A narrow secret gap at cols 14-15, rows 5-6 lets a precise shot skip the bend.
//
// Row-by-row character counts (must be exactly 32 each):
//   All-wall rows: 32 × '#' = 32 ✓
//   Mixed rows: left_walls + content + right_walls = 32

export default {
  number: 2,
  name: 'The Criss Library Stacks',
  par: 3,
  theme: 'library',
  wind: { baseStrength: 0.05, baseAngle: 0, variable: false },

  normal: {
    map: [
      // row 0 — border wall
      '################################',
      // row 1 — border wall
      '################################',
      // row 2 — upper-right corridor ceiling; cols 15-30 open
      // '#' (15) + '................' (16) + '#' (1) = 32  ✓
      '###############................#',
      // row 3 — upper corridor open + bookshelf stub at cols 19-20 from top
      // cols 15-18 open, 19-20 wall, 21-29 open  → '#'(15) + '....'(4) + '##'(2) + '.........'(9) + '#'(2) = 32
      '###############....##.........##',
      // row 4 — upper corridor; cup at col 29 open; bookshelf stub at 19-20
      // cols 15-18 open, 19-20 wall, 21-29 open
      '###############....##.........##',
      // row 5 — upper corridor; bookshelf stubs at 19-20; junction starting
      // cols 14-29 open (junction added at 14)
      // '#'(14) + '................'(16) + '##'(2) = 32  ✓
      '##############................##',
      // row 6 — junction open (cols 14-16), right corridor still open (17-29)
      // '#'(14) + '................'(16) + '##'(2) = 32  ✓
      '##############................##',
      // row 7 — lower corridor starts (cols 1-13 open), junction (14-16), right blocked
      // '#'(1) + '.............'(13) + '...'(3) + '###########'(11) + '#####'(4) = ?
      // Actually: cols 1-16 open, cols 17-30 wall, col 31 wall
      // '#'(1) + '................'(16) + '###############'(15) = 32  ✓
      '#................###############',
      // row 8 — lower corridor (cols 1-13 open), junction (14-16), right blocked
      // same structure with bookshelf stub inside at col 6
      // '#'(1) + '.....'(5) + '#'(1) + '.........'(9) + '####'(4) + '###########'(11) + '#'(1) = 32? fix
      // simpler: '#'(1) + '................'(16) + '###############'(15) = 32
      '#................###############',
      // row 9 — TEE at col 2; lower corridor full width cols 1-16, bookshelf stub at 9-10
      // '#'(1) + '.......'(7) + '##'(2) + '......'(6) + '###############'(15) + '#'(1) = 32  ✓
      '#.......##......################',
      // row 10 — lower corridor, bookshelf stub from bottom at col 4-5
      // '#'(1) + '...'(3) + '##'(2) + '...........'(11) + '###############'(15) = 32  ✓
      '#...##...........###############',
      // row 11 — lower corridor bottom open, transition to wall below
      // '#'(1) + '...............'(15) + '################'(16) = 32  ✓
      '#...............################',
      // row 12 — border wall
      '################################',
      // row 13 — border wall
      '################################',
      // row 14 — border wall
      '################################',
      // row 15 — border wall
      '################################',
      // row 16 — border wall
      '################################',
      // row 17 — border wall
      '################################',
    ],
    tee:  { x: 25,  y: 90 },
    cup:  { x: 295, y: 45 },
    entities: [
      { type: 'bookCart', x: 160, y: 70,  width: 15, height: 12, speed: 20, bounceX1: 60,  bounceX2: 260 },
      { type: 'bookCart', x: 200, y: 110, width: 15, height: 12, speed: 25, bounceX1: 120, bounceX2: 280 },
    ],
    powerups: [
      { type: 'cowboyHat', x: 160, y: 55 },
    ],
  },

  blizzard: {
    // Same winding layout but with ICE patches on the floor (slippery!)
    // Row counts verified to 32 chars each.
    map: [
      '################################',  // row  0 — 32 walls
      '################################',  // row  1 — 32 walls
      '###############IIIIIIIIIIIIIIII#',  // row  2 — 15+16+1=32 ✓
      '###############IIII##IIIIIIIII##',  // row  3 — 15+4+2+9+2=32 ✓
      '###############IIII##IIIIIIIII##',  // row  4 — 15+4+2+9+2=32 ✓ cup at col29=I(passable)
      '##############IIIIIIIIIIIIIIII##',  // row  5 — 14+16+2=32 ✓
      '##############IIIIIIIIIIIIIIII##',  // row  6 — 14+16+2=32 ✓
      '#IIIIIIIIIIIIIIII###############',  // row  7 — 1+16+15=32 ✓
      '#IIIIIIIIIIIIIIII###############',  // row  8 — 1+16+15=32 ✓
      '#IIIIIII##IIIIII################',  // row  9 — 1+7+2+6+16=32 ✓ tee at col2=I(passable)
      '#IIIII##IIIIIII#################',  // row 10 — 1+5+2+7+17=32 ✓
      '#IIIIIIIIIIIIIII################',  // row 11 — 1+15+16=32 ✓
      '################################',  // row 12 — 32 walls
      '################################',  // row 13 — 32 walls
      '################################',  // row 14 — 32 walls
      '################################',  // row 15 — 32 walls
      '################################',  // row 16 — 32 walls
      '################################',  // row 17 — 32 walls
    ],
    tee:  { x: 25,  y: 90 },
    cup:  { x: 295, y: 45 },
    entities: [
      { type: 'bookCart', x: 160, y: 70,  width: 15, height: 12, speed: 35, bounceX1: 60,  bounceX2: 260 },
      { type: 'bookCart', x: 200, y: 110, width: 15, height: 12, speed: 40, bounceX1: 120, bounceX2: 280 },
    ],
    powerups: [
      { type: 'cowboyHat', x: 160, y: 55 },
    ],
  },
};
