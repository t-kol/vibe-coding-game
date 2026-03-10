// Hole 3: "Bison Stampede"
// Theme: Nebraska Great Plains — bison crossing zone with central island obstacle
// Par 4
//
// Coordinate reference:
//   Canvas: 320×180 px  |  Grid: 32 cols × 18 rows  |  Tile: 10×10 px
//   Tee  pixel (20, 90)  → col 2,  row 9  → map[9][2]  = '.'  ✓
//   Cup  pixel (295, 90) → col 29, row 9  → map[9][29] = '.'  ✓
//
// Map legend: . GRASS  # WALL  R ROUGH  S SAND
//
// Design:
//   A 5-tile-wide WALL island sits at rows 7-11, cols 13-17 — directly blocking
//   the straight shot from tee to cup. Players must route ABOVE (rows 2-6) or
//   BELOW (rows 12-15) to get around it.
//   Bison cross the upper and lower open plains, adding timing challenges.
//   SAND traps flanking the lower bypass punish stray shots.
//
// Row-by-row char counts (all = 32):
//   island rows  : 1+1+11.+5#+13.+1 = 32 ✓  (cols 13-17 = '#')
//   open rows    : 1+1+28.+1+1 = 32 ✓
//   rough border : 1+30R+1 = 32 ✓
//   sand row     : 1+7.+6S+6.+6S+5.+1 = 32 ✓

export default {
  number: 3,
  name: 'Bison Stampede',
  par: 4,
  theme: 'plains',
  wind: { baseStrength: 0.3, baseAngle: 270, variable: true },

  normal: {
    map: [
      '################################',  // row  0  border
      '################################',  // row  1  border
      '#RRRRRRRRRRRRRRRRRRRRRRRRRRRRRR#',  // row  2  1+30R+1=32 ✓  rough border
      '#R............................R#',  // row  3  1+1+28.+1+1=32 ✓  upper plains
      '#R............................R#',  // row  4  upper plains
      '#R............................R#',  // row  5  upper plains
      '#R............................R#',  // row  6  upper plains (bison y=65)
      '#R...........#####.............#',  // row  7  1+1+11.+5#+13.+1=32 ✓  island top
      '#R...........#####.............#',  // row  8  island
      '#R...........#####.............#',  // row  9  island — tee col2=. cup col29=. ✓
      '#R...........#####.............#',  // row 10  island
      '#R...........#####.............#',  // row 11  island bottom
      '#R............................R#',  // row 12  lower plains (bison y=125)
      '#R............................R#',  // row 13  lower plains
      '#.......SSSSSS......SSSSSS.....#',  // row 14  1+7.+6S+6.+6S+5.+1=32 ✓  sand traps
      '#RRRRRRRRRRRRRRRRRRRRRRRRRRRRRR#',  // row 15  rough border
      '################################',  // row 16  border
      '################################',  // row 17  border
    ],
    tee:  { x: 20,  y: 90 },
    cup:  { x: 295, y: 90 },
    entities: [
      // Bison cross ABOVE the island
      { type: 'bison', x: -40, y: 55,  width: 20, height: 14, speed: 45, direction:  1, period: 3.5, phaseOffset: 0.0 },
      { type: 'bison', x: 360, y: 75,  width: 20, height: 14, speed: 40, direction: -1, period: 4.0, phaseOffset: 1.5 },
      // Bison cross BELOW the island
      { type: 'bison', x: -40, y: 125, width: 20, height: 14, speed: 42, direction:  1, period: 4.0, phaseOffset: 2.2 },
    ],
    powerups: [
      { type: 'snowflake', x: 160, y: 45 },
      { type: 'lasso',     x: 160, y: 135 },
    ],
  },

  blizzard: {
    // ROUGH expands, bison faster, sand traps replaced with ICE (slippery escape)
    map: [
      '################################',  // row  0
      '################################',  // row  1
      '#RRRRRRRRRRRRRRRRRRRRRRRRRRRRRR#',  // row  2
      '#RR..........................RR#',  // row  3  1+2+26.+2+1=32 ✓
      '#RR..........................RR#',  // row  4
      '#RR..........................RR#',  // row  5
      '#RR..........................RR#',  // row  6
      '#RR..........#####...........RR#',  // row  7  1+2+10.+5#+11.+2+1=32 ✓  island
      '#RR..........#####...........RR#',  // row  8
      '#RR..........#####...........RR#',  // row  9  tee col2=. cup col29=. ✓
      '#RR..........#####...........RR#',  // row 10
      '#RR..........#####...........RR#',  // row 11
      '#RR..........................RR#',  // row 12
      '#RR..........................RR#',  // row 13
      '#.......IIIIII......IIIIII.....#',  // row 14  1+7.+6I+6.+6I+5.+1=32 ✓  ICE traps
      '#RRRRRRRRRRRRRRRRRRRRRRRRRRRRRR#',  // row 15
      '################################',  // row 16
      '################################',  // row 17
    ],
    tee:  { x: 20,  y: 90 },
    cup:  { x: 295, y: 90 },
    entities: [
      { type: 'bison', x: -40, y: 55,  width: 22, height: 14, speed: 60, direction:  1, period: 2.8, phaseOffset: 0.0 },
      { type: 'bison', x: 360, y: 75,  width: 22, height: 14, speed: 55, direction: -1, period: 3.0, phaseOffset: 0.8 },
      { type: 'bison', x: -40, y: 125, width: 22, height: 14, speed: 58, direction:  1, period: 3.0, phaseOffset: 1.6 },
      { type: 'bison', x: 360, y: 135, width: 22, height: 14, speed: 62, direction: -1, period: 2.8, phaseOffset: 2.4 },
    ],
    powerups: [
      { type: 'snowflake', x: 160, y: 45 },
    ],
  },
};
