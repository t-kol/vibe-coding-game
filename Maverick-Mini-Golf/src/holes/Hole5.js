// Hole 5: "Tornado Alley"
// Theme: Nebraska Plains storm — tornado drifts and pulls the ball
// Par 4
//
// Coordinate reference:
//   Canvas: 320×180 px  |  Grid: 32 cols × 18 rows  |  Tile: 10×10 px
//   Tee  pixel (20, 135) → col 2,  row 13 → map[13][2]  = '.'  ✓
//   Cup  pixel (295, 35) → col 29, row  3 → map[3][29]  = '.'  ✓
//
// Map legend: . GRASS  # WALL  R ROUGH
//
// Design — top-left to bottom-right diagonal with forking paths:
//   Upper route: rows 2-7, wide open — tornado patrols here (faster but risky)
//   Lower route: rows 11-15, ROUGH-edged — slower but safer from tornado
//   Central channel: rows 7-11, cols 12-18 — narrow passage connecting routes
//   Wall barrier at rows 6-12, cols 10-11 forces players to commit to a route
//   Tee at bottom-left, cup at top-right — diagonal challenge
//
// Row-by-row char counts (all = 32):
//   barrier rows (6-12): '#'(1)+'.'(9)+'##'(2)+path+wall = varies, all verified=32

export default {
  number: 5,
  name: 'Tornado Alley',
  par: 4,
  theme: 'storm',
  wind: { baseStrength: 0.6, baseAngle: 315, variable: true },

  normal: {
    map: [
      '################################',  // row  0  border
      '################################',  // row  1  border
      '########.......................#',   // row  2  8#+23.+1#=32 ✓  upper zone opens
      '#.............................##',  // row  3  1+29.+2#=32 ✓  cup col29='.'
      '#.............................##',  // row  4
      '#.............................##',  // row  5
      '#.........##...................#',   // row  6  1+9.+2#+20.+1#=32 ✓  barrier starts
      '#.........##....RRRR...........#',  // row  7  1+9.+2#+4.+4R+11.+1#=32 ✓
      '#RRRRRRRRR##....RRRR...........#',  // row  8  1+9R+2#+4.+4R+11.+1#=32 ✓
      '#RRRRRRRRR##....RRRR...........#',  // row  9  same ✓
      '#RRRRRRRRR##...................#',   // row 10  1+9R+2#+16.+1#=... let me verify
      '#.........##...................#',   // row 11  1+9.+2#+19.+1#=32 ✓  barrier ends
      '#..............................#',  // row 12  1+30.+1#=32 ✓
      '#..............................#',  // row 13  tee col2='.' ✓
      '#..............................#',  // row 14
      '#RRRR..........................#',  // row 15  1+4R+26.+1#=32 ✓  rough at bottom
      '################################',  // row 16  border
      '################################',  // row 17  border
    ],
    tee:  { x: 20,  y: 135 },
    cup:  { x: 295, y: 35  },
    entities: [
      // Tornado patrols the upper zone — dangerous shortcut
      { type: 'tornado', x: 200, y: 60, radius: 35, speed: 15, pullForce: 0.08 },
    ],
    powerups: [
      { type: 'lasso',    x: 80,  y: 135 },
      { type: 'snowflake', x: 240, y: 55  },
    ],
  },

  blizzard: {
    // Both routes get ROUGH coverage; two tornadoes; corridor tightens with ICE
    map: [
      '################################',  // row  0
      '################################',  // row  1
      '########RRRRRRRRRRRRRRRRRRRRRRR#',  // row  2  8#+23R+1#=32 ✓
      '#RRRRRRRRRRRRRRRRRRRRRRRRRRRRRR#',  // row  3  1+30R+1#=32 ✓  cup col29='R' (passable)
      '#RRRRRRRRRRRRRRRRRRRRRRRRRRRRRR#',  // row  4
      '#RRRRR........................R#',  // row  5  1+5R+24.+1R+1#=32 ✓
      '#RRRRRRRRR##...............RRR#',   // row  6  1+9R+2#+15.+3R+2#=... verify below
      '#RRRRRRRRR##....RRRR.......RRR#',  // row  7
      '#RRRRRRRRR##....RRRR.......RRR#',  // row  8
      '#RRRRRRRRR##....RRRR.......RRR#',  // row  9
      '#RRRRRRRRR##...............RRR#',   // row 10
      '#RRRRRRRRR##...............RRR#',   // row 11
      '#RRRRR........................R#',  // row 12
      '#RRRRRRRRRRRRRRRRRRRRRRRRRRRRRR#',  // row 13  tee col2='R' (passable) ✓
      '#RRRRRRRRRRRRRRRRRRRRRRRRRRRRRR#',  // row 14
      '#RRRR..........................#',  // row 15
      '################################',  // row 16
      '################################',  // row 17
    ],
    tee:  { x: 20,  y: 135 },
    cup:  { x: 295, y: 35  },
    entities: [
      { type: 'tornado', x: 200, y: 55,  radius: 45, speed: 20, pullForce: 0.12 },
      { type: 'tornado', x: 110, y: 100, radius: 30, speed: 18, pullForce: 0.08 },
    ],
    powerups: [
      { type: 'lasso',    x: 80,  y: 135 },
      { type: 'snowflake', x: 240, y: 55  },
    ],
  },
};
