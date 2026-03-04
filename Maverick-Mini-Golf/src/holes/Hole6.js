// Hole 6: "Old Market Rails"
// Theme: Omaha Old Market / Union Pacific Railroad
// Par 4 — Winding cobblestone fairway, steam train crosses horizontally
//
// Coordinate reference:
//   Canvas: 320×180 px  |  Grid: 32 cols × 18 rows  |  Tile: 10×10 px
//   Tee  pixel (20,  90) → col 2,  row 9  → map[9][2]  must be '.'
//   Cup  pixel (300, 55) → col 30, row 5  → map[5][30] must be '.'
//
// Map legend: . GRASS  # WALL  R ROUGH  S SAND  I ICE
//
// Design:
//   Fairway winds from left-center (row 9) upward to upper-right (row 5).
//   ROUGH tiles simulate cobblestone feel on fairway edges.
//   Row 7 (y=75) is the train track — kept open for the Train entity.
//   SAND hazard in lower-left (rows 10-11) penalizes going too low.
//   ICE patch near top-right (rows 2-3, cols 24-27) adds slippery hazard.
//   Brick wall protrusions at top-left corner (rows 2-3) and bottom block.
//
// Path: col2 row9 → cols1-10 row8-9 → bend cols9-13 rows6-8 → straight
//       cols12-23 rows6-7 → bend cols22-30 rows4-6 → col30 row5 (cup)
//
// Row-by-row char counts (must total 32 each):
//   row 0:  32×'#'                                        = 32
//   row 1:  32×'#'                                        = 32
//   row 2:  7×'#' + 16×'#' + 4×'I' + 5×'#'             → 7+16+4+5=32
//   row 3:  6×'#' + 5×'R' + 10×'.' + 5×'I' + 6×'#'     → 6+5+10+5+6=32
//   row 4:  4×'#' + 3×'R' + 19×'.' + 6×'#'              → 4+3+19+6=32
//   row 5:  3×'#' + 2×'R' + 24×'.' + 3×'#'              → 3+2+24+3=32 (col30='.')
//   row 6:  '#' + 'R' + 28×'.' + 'R' + '#'              → 1+1+28+1+1=32
//   row 7:  '#' + 'R' + 28×'.' + 'R' + '#'              → 1+1+28+1+1=32 (train row)
//   row 8:  '#' + 11×'.' + 10×'#' + 9×'.' + '#'         → 1+11+10+9+1=32
//   row 9:  '#' + 10×'.' + 3×'R' + 18×'#'               → 1+10+3+18=32 (col2='.')
//   row 10: '#' + 6×'S' + 4×'R' + 21×'#'                → 1+6+4+21=32
//   row 11: '#' + 3×'S' + 28×'#'                         → 1+3+28=32
//   row 12: 32×'#'                                        = 32
//   row 13: 32×'#'                                        = 32
//   row 14: 32×'#'                                        = 32
//   row 15: 32×'#'                                        = 32
//   row 16: 32×'#'                                        = 32
//   row 17: 32×'#'                                        = 32

export default {
  number: 6,
  name: 'Old Market Rails',
  par: 4,
  theme: 'oldMarket',
  wind: { baseStrength: 0.2, baseAngle: 90, variable: true },

  normal: {
    map: [
      '################################',  // row  0  32×#
      '################################',  // row  1  32×#
      '#######################IIII#####',  // row  2  23#+4I+5# = 32
      '######RRRRR..........IIIII######',  // row  3  6#+5R+10.+5I+6# = 32
      '####RRR...................######',  // row  4  4#+3R+19.+6# = 32
      '###RR..........................#',  // row  5  3#+2R+26.+1# = 32  [cup col30='.']
      '#R............................R#',  // row  6  1#+1R+28.+1R+1# = 32
      '#R............................R#',  // row  7  1#+1R+28.+1R+1# = 32  [train row y=75]
      '#...........##########.........#',  // row  8  1#+11.+10#+9.+1# = 32
      '#..........RRR##################',  // row  9  1#+10.+3R+18# = 32  [tee col2='.']
      '#SSSSSSRRRR#####################',  // row 10  1#+6S+4R+21# = 32
      '#SSS############################',  // row 11  1#+3S+28# = 32
      '################################',  // row 12  32×#
      '################################',  // row 13  32×#
      '################################',  // row 14  32×#
      '################################',  // row 15  32×#
      '################################',  // row 16  32×#
      '################################',  // row 17  32×#
    ],
    tee:  { x: 20,  y: 90 },
    cup:  { x: 300, y: 55 },
    entities: [
      { type: 'train', x: -60, y: 75, width: 55, height: 18, speed: 50, direction: 1, period: 5.0, phaseOffset: 0.0 },
    ],
    powerups: [
      { type: 'goldStar', x: 160, y: 90 },
      { type: 'lasso',    x: 240, y: 55 },
    ],
  },

  blizzard: {
    // Icy rails: some ROUGH replaced with ICE, faster trains, narrower path
    // Tee (20, 90) → col 2, row 9. Cup (300, 55) → col 30, row 5.
    // Row char counts same as normal map (verified above)
    map: [
      '################################',  // row  0
      '################################',  // row  1
      '#######################IIII#####',  // row  2
      '######RRRRR..........IIIII######',  // row  3
      '####IRR...................######',  // row  4  ICE replaces first R — still 32: 4#+1I+2R+19.+6#=32
      '###II..........................#',  // row  5  3#+2I+26.+1# = 32  [cup col30='.']
      '#I............................I#',  // row  6  1#+1I+28.+1I+1# = 32
      '#I............................I#',  // row  7  32  [train row]
      '#...........##########.........#',  // row  8  32
      '#..........RRR##################',  // row  9  32  [tee col2='.']
      '#SSSSSSRRRR#####################',  // row 10  32
      '#SSS############################',  // row 11  32
      '################################',  // row 12
      '################################',  // row 13
      '################################',  // row 14
      '################################',  // row 15
      '################################',  // row 16
      '################################',  // row 17
    ],
    tee:  { x: 20,  y: 90 },
    cup:  { x: 300, y: 55 },
    entities: [
      { type: 'train', x: -60, y: 75, width: 55, height: 18, speed: 70, direction: 1,  period: 4.0, phaseOffset: 0.0 },
      { type: 'train', x: 380, y: 95, width: 55, height: 18, speed: 65, direction: -1, period: 4.0, phaseOffset: 2.0 },
    ],
    powerups: [
      { type: 'goldStar', x: 160, y: 90 },
    ],
  },
};
