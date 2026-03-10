// Hole 1: "Welcome to the Bluffs"
// Theme: Elmwood Park entrance / Missouri River overlook
// Par 3 — L-shape dogleg: tee bottom-left, cup top-right
//
// Coordinate reference:
//   Canvas: 320×180 px  |  Grid: 32 cols × 18 rows  |  Tile: 10×10 px
//   Tee  pixel (25, 135) → col 2,  row 13 → map[13][2]  = '.'  ✓
//   Cup  pixel (295, 35) → col 29, row  3 → map[3][29]  = '.'  ✓
//
// Map legend: . GRASS  # WALL  R ROUGH
//
// Layout:
//   Right corridor  : rows 3-10,  cols 23-29 (7 wide)
//   Corner          : row 11,     cols 1-29  — ROUGH at cols 22-25 marks the bend
//   Bottom corridor : rows 11-15, cols 1-29  (wide, runs left to right)
//   Ball must travel RIGHT along bottom, then UP through right corridor to reach cup.

export default {
  number: 1,
  name: 'Welcome to the Bluffs',
  par: 3,
  theme: 'elmwood',
  wind: { baseStrength: 0.15, baseAngle: 45, variable: true },

  normal: {
    map: [
      '################################',  // row  0  32×#
      '################################',  // row  1  32×#
      '################################',  // row  2  32×#
      '#######################.......##',  // row  3  23#+7.+2#=32 ✓  cup col29='.'
      '#######################.......##',  // row  4  same ✓
      '#######################.......##',  // row  5  same ✓
      '#######################.......##',  // row  6  same ✓
      '#######################.......##',  // row  7  same ✓
      '#######################.......##',  // row  8  same ✓
      '#######################.......##',  // row  9  same ✓
      '#######################.......##',  // row 10  same ✓
      '#.....................RRRR....##',   // row 11  1+21.+4R+4.+2#=32 ✓  dogleg bend
      '#.............................##',   // row 12  1+29.+2#=32 ✓
      '#.............................##',   // row 13  same ✓  tee col2='.'
      '#.............................##',   // row 14  same ✓
      '#...RRRR......................##',   // row 15  1+3.+4R+22.+2#=32 ✓  rough border
      '################################',  // row 16  32×#
      '################################',  // row 17  32×#
    ],
    tee:  { x: 25,  y: 135 },
    cup:  { x: 295, y: 35  },
    entities: [],
    powerups: [
      { type: 'goldStar', x: 280, y: 65 },
    ],
  },

  blizzard: {
    // Both corridors turn to ICE — players must control the slide through two turns
    map: [
      '################################',  // row  0
      '################################',  // row  1
      '################################',  // row  2
      '#######################IIIIIII##',  // row  3  ICE in right corridor; cup col29='I' ✓
      '#######################IIIIIII##',  // row  4
      '#######################IIIIIII##',  // row  5
      '#######################IIIIIII##',  // row  6
      '#######################IIIIIII##',  // row  7
      '#######################IIIIIII##',  // row  8
      '#######################IIIIIII##',  // row  9
      '#######################IIIIIII##',  // row 10
      '#IIIIIIIIIIIIIIIIIIIIIRRRRIIII##',  // row 11  1+21I+4R+4I+2#=32 ✓  rough corner
      '#IIIIIIIIIIIIIIIIIIIIIIIIIIIII##',  // row 12  1+29I+2#=32 ✓
      '#IIIIIIIIIIIIIIIIIIIIIIIIIIIII##',  // row 13  tee col2='I' (playable) ✓
      '#IIIIIIIIIIIIIIIIIIIIIIIIIIIII##',  // row 14
      '#...RRRR......................##',   // row 15  grass near bottom edge
      '################################',  // row 16
      '################################',  // row 17
    ],
    tee:  { x: 25,  y: 135 },
    cup:  { x: 295, y: 35  },
    entities: [],
    powerups: [
      { type: 'goldStar', x: 280, y: 65 },
    ],
  },
};
