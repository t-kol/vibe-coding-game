// Hole 9: "Maverick's Final Drive"
// Theme: Elmwood Park grand finale — every mechanic combined
// Par 5 — Longest hole, top-left to bottom-right, full screen traverse
//
// Coordinate reference:
//   Canvas: 320×180 px  |  Grid: 32 cols × 18 rows  |  Tile: 10×10 px
//   Tee  pixel (20,  30) → col 2,  row 3  → map[3][2]  must be '.'
//   Cup  pixel (300,150) → col 30, row 15 → map[15][30] must be '.'
//
// Map legend: . GRASS  # WALL  ~ WATER  B BRIDGE  R ROUGH  I ICE  S SAND
//
// Design — Three-section S-curve layout:
//   Section A (rows 2-5): Top-left fairway — cols 1-17 open
//     ICE patch at rows 2-3, cols 8-12 (icy morning grass)
//     ROUGH border at row edges
//   Connector (rows 5-12): Narrow vertical corridor — cols 15-19 open
//     WATER at rows 7-9, cols 17 (narrow water channel)
//     BRIDGE at rows 7-9, col 18 (safe single crossing)
//   Section C (rows 12-15): Bottom-right fairway — cols 15-30 open
//     SAND trap at rows 13-14, cols 15-18
//     ICE patch at rows 14-15, cols 22-26
//
// Row-by-row char counts (32 each):
//   row  0: 32×'#'                                          = 32
//   row  1: 32×'#'                                          = 32
//   row  2: 1# + 17. + 14#                                 → 1+17+14=32  (incl ICE: col8-12=IIIII)
//           → '#.......IIIII.....##############'            = 1+7+5I+5.+14# = 1+7+5+5+14=32 ✓
//   row  3: same structure, tee col2=.                     → same as row 2
//   row  4: 1# + 14. + 3R + 14#                           → '#..............RRR##############'
//           = 1+14.+3R+14# = 32 ✓
//   row  5: 1# + 11. + 4R + 1. + 3R + 12#                → '#...........RRRR.RRR############'
//           = 1+11+4+1+3+12 = 32 ✓  (opening narrow connector at cols 15-19)
//           Better: open connector cols 15-19 now
//           '#...........RRRR...RRRRR########' = 1+11+4R+3.+5R+8# = 32 ✓ but col15=.?
//           Let me just use: '#...............################' for rows 2-4
//           then transition in row 5.
//           Row 2-4: 1# + 15. + 16# = 32 (indices 1-15 open, 16-31 wall) ✓
//           Row 5: open the connector: 1# + 15. + 4. + 12# = too simple
//           '#...............RRRR############' = 1+15.+4R+12# = 1+15+4+12=32 ✓
//           col2=. ✓ in rows 2-5 (tee row 3 col2=.)
//   row  6: closed left + connector open
//           '################....############' = 16#+4.+12# = 32 ✓ (connector at cols 16-19)
//   row  7: connector + water/bridge
//           '################..~B############' = 16#+2.+1~+1B+12# = 32 ✓
//   row  8: '################..~B############' = same=32
//   row  9: '################..~B############' = same=32
//   row 10: '################....############' = 16#+4.+12# = 32 ✓
//   row 11: '################RRRR############' = 16#+4R+12# = 32 ✓ (rough transition)
//   row 12: '################................' = 16#+16. = 32 ✓ (opens bottom section cols16-31)
//           Wait: need cup at col30. Row 15 col30=. Let me check row 12:
//           '################................' last char is '.', not '#'. Border issue.
//           Fix: '###############................#' = 15#+16.+1# = 32 ✓ cols15-30 open ✓
//   row 13: '###############SSSS.............' — need wall border at col31:
//           '###############SSSS............#' = 15#+4S+12.+1# = 15+4+12+1=32 ✓
//           Hmm: 15+4+12+1=32. col15-18=S, col19-30=. (12 dots), col31=# ✓
//   row 14: '###############SSSSIIIII.......#' = 15#+4S+5I+7.+1# = 15+4+5+7+1=32 ✓
//           cup col30: idx30 is in the 7 dots (idx24-30), so idx30=. ✓
//   row 15: '###############IIIII...........#' = 15#+5I+11.+1# = 15+5+11+1=32 ✓
//           cup col30: idx30 in 11 dots (idx20-30), idx30=. ✓ [CUP row]
//   row 16: 32×'#'                                          = 32
//   row 17: 32×'#'                                          = 32
//
// Connectivity verification:
//   Tee col2 row3: in top section rows 2-5, cols 1-15 open → col2=. ✓
//   From top section (row5, col15-ish) → connector (rows6-11, cols16-19) ✓
//   Connector (row12, opens) → bottom section (rows12-15, cols15-30) ✓
//   Cup col30 row15: in bottom section cols15-30 → col30=. ✓

export default {
  number: 9,
  name: "Maverick's Final Drive",
  par: 5,
  theme: 'finale',
  wind: { baseStrength: 0.5, baseAngle: 270, variable: true },

  normal: {
    map: [
      '################################',  // row  0  32×#
      '################################',  // row  1  32×#
      '#.......IIIII..#################',  // row  2  1+7.+5I+2.+17# = 1+7+5+2+17=32 ✓
      '#.......IIIII..#################',  // row  3  same=32  [tee col2='.']
      '#..............RRRR#############',  // row  4  1+14.+4R+13# = 1+14+4+13=32 ✓
      '#..............RRRR#############',  // row  5  same=32
      '################....############',  // row  6  16#+4.+12# = 32 ✓ (connector)
      '################..~B############',  // row  7  16#+2.+1~+1B+12# = 32 ✓ (water/bridge)
      '################..~B############',  // row  8  same=32
      '################..~B############',  // row  9  same=32
      '################....############',  // row 10  32 ✓ (connector)
      '################RRRR############',  // row 11  16#+4R+12# = 32 ✓ (rough transition)
      '###############................#',  // row 12  15#+16.+1# = 32 ✓ (opens bottom section)
      '###############SSSS............#',  // row 13  15#+4S+12.+1# = 32 ✓ (sand trap)
      '###############SSSSIIIII.......#',  // row 14  15#+4S+5I+7.+1# = 32 ✓ (ice+sand)
      '###############IIIII...........#',  // row 15  15#+5I+11.+1# = 32 ✓ [cup col30='.']
      '################################',  // row 16  32×#
      '################################',  // row 17  32×#
    ],
    tee:  { x: 20,  y: 30 },
    cup:  { x: 300, y: 150 },
    entities: [
      { type: 'bison',   x: -40, y: 65,  width: 20, height: 14, speed: 40, direction: 1,  period: 4.0, phaseOffset: 0.0 },
      { type: 'tornado', x: 200, y: 100, radius: 30, speed: 12, pullForce: 0.06 },
    ],
    powerups: [
      { type: 'lasso',     x: 100, y: 55  },
      { type: 'snowflake', x: 200, y: 90  },
    ],
  },

  blizzard: {
    // Blizzard finale: ICE expands, extra tornado, faster bison
    // Tee (20, 30) → col 2, row 3. Cup (300, 150) → col 30, row 15.
    //
    // Changes from normal:
    //   rows 2-3: full ICE across top section (col1-12 = ICE, col13-14 = ROUGH)
    //   row 14-15: more ICE coverage in bottom section
    //   row 7-9: water/bridge stays (frozen bridge = still passable)
    map: [
      '################################',  // row  0  32×#
      '################################',  // row  1  32×#
      '#IIIIIIIIIIIII.#################',  // row  2  1#+13I+1.+17# = 1+13+1+17=32 ✓
      '#IIIIIIIIIIIII.#################',  // row  3  same=32  [tee col2='I' → need '.' at col2!]
      // row 3 col 2 must be '.'. Let me fix:
      // '#.IIIIIIIIIII..#################' = 1+1.+11I+2.+17# = 1+1+11+2+17=32 ✓
      // idx2 = '.' ✓
      '#.IIIIIIIIIII..#################',  // row  3  1+1.+11I+2.+17# = 32 ✓ [tee col2='.']
      '#..............RRRR#############',  // row  4  32 ✓
      '#..............RRRR#############',  // row  5  32 ✓
      '################IIII############',  // row  6  16#+4I+12# = 32 ✓ (connector → ICE)
      '################II~B############',  // row  7  16#+2I+1~+1B+12# = 32 ✓
      '################II~B############',  // row  8  same=32
      '################II~B############',  // row  9  same=32
      '################IIII############',  // row 10  same=32 (connector ICE)
      '################RRRR############',  // row 11  32 ✓
      '###############IIIIIIIIIIIIIIII#',  // row 12  15#+14I+1.+1# = 15+14+1+1=31 BAD
      // fix: '###############IIIIIIIIIIIIIII.#' = 15#+14I+1.+1# nope still 31.
      // '###############IIIIIIIIIIIIIIII#' = 15+16I+1# = 32 ✓ but cup needs '.' at col30
      // col30 = idx30, in this string: idx0-14=15#, idx15-30=16I, idx31=# → idx30='I' (ICE). OK for blizzard.
      // But the cup needs to be at a GRASS tile to be reachable. ICE is playable (ball can move on it).
      // Actually ICE is passable, so the cup CAN be on ICE — the ball will slide into the cup.
      // So: '###############IIIIIIIIIIIIIIII#' is fine for blizzard (cup on ICE is interesting!)
      // Actually wait — cup pixel (300,150) → col30 row15. In row 15 it must still be reachable.
      // ICE is tile type 4 (playable surface), so cup on ICE is valid.
      // Let me keep row 12 blizzard = row 12 normal (GRASS bottom section):
      '###############................#',  // row 12  15#+16.+1# = 32 ✓
      '###############IIIIIIIIIIII....#',  // row 13  15#+11I+4.+1# = 15+11+4+1=31 BAD
      // '###############IIIIIIIIIIIII...#' = 15+13I+3.+1# = 32 ✓
      '###############IIIIIIIIIIIII...#',  // row 13  15#+13I+3.+1# = 15+13+3+1=32 ✓
      '###############IIIIIIIIIIIIIIII#',  // row 14  15#+16I+1# = 32 ✓ (fully icy)
      '###############IIIIIIIIIIIIIIII#',  // row 15  15#+16I+1# = 32 ✓ [cup col30='I' = playable ICE]
      '################################',  // row 16  32×#
      '################################',  // row 17  32×#
    ],
    tee:  { x: 20,  y: 30 },
    cup:  { x: 300, y: 150 },
    entities: [
      { type: 'bison',   x: -40, y: 65,  width: 22, height: 14, speed: 55, direction: 1,  period: 3.0, phaseOffset: 0.0 },
      { type: 'tornado', x: 160, y: 90,  radius: 40, speed: 15, pullForce: 0.10 },
      { type: 'tornado', x: 250, y: 130, radius: 30, speed: 18, pullForce: 0.07 },
    ],
    powerups: [
      { type: 'lasso',     x: 100, y: 55  },
      { type: 'snowflake', x: 200, y: 90  },
    ],
  },
};
