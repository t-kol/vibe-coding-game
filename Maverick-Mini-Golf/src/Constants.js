// ============================================================
// MAVERICK MINI GOLF — Shared Constants & Types
// All modules import from here. Do NOT redefine these elsewhere.
// ============================================================

// --- Tile types (numeric) ---
export const TILE = {
  EMPTY:  0,   // void / out of bounds (treated as WALL)
  GRASS:  1,   // normal play surface, normal friction
  WALL:   2,   // solid boundary, ball bounces off
  WATER:  3,   // hazard: +1 stroke penalty, ball resets to last safe pos
  ICE:    4,   // slippery surface, very low friction
  SAND:   5,   // rough surface, high friction / slow
  BRIDGE: 6,   // passable surface over WATER tiles
  ROUGH:  7,   // slightly high friction, playable
};

// ASCII chars for hole tilemaps (32 cols × 18 rows)
// Each char maps to a TILE value
export const TILE_CHARS = {
  '.': TILE.GRASS,
  '#': TILE.WALL,
  '~': TILE.WATER,
  'I': TILE.ICE,
  'S': TILE.SAND,
  'B': TILE.BRIDGE,
  'R': TILE.ROUGH,
  ' ': TILE.EMPTY,
};

// Inverse map: TILE value → char (for debugging)
export const TILE_TO_CHAR = Object.fromEntries(
  Object.entries(TILE_CHARS).map(([k, v]) => [v, k])
);

// --- Canvas / Display ---
export const CANVAS = {
  WIDTH:  320,   // internal game resolution (pixels)
  HEIGHT: 180,
  SCALE:  4,     // CSS upscale factor → displayed at 1280×720
};

// --- Tile grid ---
export const TILE_SIZE = 10; // each tile is 10×10 game pixels
export const COLS = 32;      // CANVAS.WIDTH  / TILE_SIZE
export const ROWS = 18;      // CANVAS.HEIGHT / TILE_SIZE

// --- Physics ---
export const PHYSICS = {
  FRICTION: {
    [TILE.GRASS]:  0.984,
    [TILE.ICE]:    0.998,
    [TILE.SAND]:   0.940,
    [TILE.ROUGH]:  0.970,
    [TILE.BRIDGE]: 0.984,
  },
  BALL_RADIUS: 3.5,       // game pixels
  CUP_RADIUS:  5,         // game pixels (ball "falls in" when center within this)
  MIN_SPEED:   0.08,      // below this speed → ball considered at rest
  RESTITUTION: 0.55,      // wall bounce coefficient (0=absorb, 1=perfect)
  MAX_STROKES: 7,         // stroke limit per hole — then ball resets to tee
  GRAVITY:     0,         // top-down — no gravity in this game
  WIND_SCALE:  0.004,     // wind force multiplier applied per frame
};

// --- Game States ---
export const STATE = {
  LOADING:        'loading',
  MENU:           'menu',
  MODE_SELECT:    'mode_select',
  HOLE_INTRO:     'hole_intro',
  PLAYING:        'playing',
  BALL_MOVING:    'ball_moving',  // sub-state: wait for ball to stop
  SHOT_RESULT:    'shot_result',
  HOLE_COMPLETE:  'hole_complete',
  GAME_OVER:      'game_over',
  LEADERBOARD:    'leaderboard',
};

// --- Game Modes ---
export const MODE = {
  NORMAL:   'normal',
  BLIZZARD: 'blizzard',
};

// --- Power-up types ---
export const POWERUP = {
  COWBOY_HAT: 'cowboyHat',   // ghost ball — passes through ONE obstacle
  GOLD_STAR:  'goldStar',    // guidance arrow — shows ideal path for one shot
  LASSO:      'lasso',       // mulligan — undo last shot
  SNOWFLAKE:  'snowflake',   // freeze nearby hazards for 5 seconds
  WHIRLWIND:  'whirlwind',   // turbo — 2× ball speed for one shot
};

// --- Entity types (dynamic obstacles) ---
export const ENTITY = {
  BISON:     'bison',
  TRAIN:     'train',
  TORNADO:   'tornado',
  BOOK_CART: 'bookCart',
  SPRINKLER: 'sprinkler',
  NPC:       'npc',
};

// --- Scoring terms ---
export const SCORE_NAMES = {
  '-4': 'Condor',
  '-3': 'Albatross',
  '-2': 'Eagle',
  '-1': 'Birdie',
   '0': 'Par',
   '1': 'Bogey',
   '2': 'Double Bogey',
   '3': 'Triple Bogey',
};

export const GRADE_THRESHOLDS = [
  { label: 'S', maxOverPar: -3 },  // 3+ under total par
  { label: 'A', maxOverPar:  0 },  // at par or better
  { label: 'B', maxOverPar:  4 },
  { label: 'C', maxOverPar:  8 },
  { label: 'D', maxOverPar: 12 },
];

// --- Color palette (hex strings) ---
export const COLORS = {
  // Brand
  UNO_RED:         '#C8102E',
  UNO_BLACK:       '#0A0A0A',
  UNO_WHITE:       '#F5F5F5',

  // Terrain
  GRASS:           '#3A7D44',
  GRASS_DARK:      '#2A5E31',
  GRASS_LIGHT:     '#52A45A',
  WALL:            '#4A3728',
  WALL_DARK:       '#2E1F14',
  WATER:           '#1A6FA8',
  WATER_LIGHT:     '#2A9CD4',
  ICE:             '#A8D8EA',
  ICE_LIGHT:       '#D4EEF7',
  SAND:            '#C8A84B',
  BRIDGE:          '#8B6914',
  ROUGH:           '#5A8C3E',

  // Sky / backgrounds
  SKY_NORMAL:      '#87CEEB',
  SKY_BLIZZARD:    '#1C2333',
  PLAINS_TAN:      '#C8A96E',

  // HUD
  HUD_BG:          'rgba(10,10,10,0.88)',
  HUD_BORDER:      '#C8102E',
  HUD_TEXT:        '#F5F5F5',
  HUD_DIM:         '#999999',
  POWER_BAR_BG:    '#2A2A2A',
  POWER_BAR_FILL:  '#C8102E',
  POWER_BAR_WARN:  '#FF6600',
  POWER_BAR_MAX:   '#FFFF00',

  // UI elements
  BTN_BG:          '#1A1A1A',
  BTN_HOVER:       '#C8102E',
  BTN_TEXT:        '#F5F5F5',
  GOLD:            '#FFD700',
  SILVER:          '#C0C0C0',
  BRONZE:          '#CD7F32',

  // Ball / cup
  BALL:            '#F5F5F5',
  BALL_SHADOW:     'rgba(0,0,0,0.4)',
  CUP:             '#0A0A0A',
  CUP_FLAG_RED:    '#C8102E',
  TEE_MARKER:      '#FFD700',

  // Aim line
  AIM_LINE:        'rgba(255,255,255,0.6)',
  AIM_DOT:         'rgba(255,255,255,0.9)',
  AIM_WIND_TINT:   'rgba(200,16,46,0.7)',

  // Effects
  SPLASH:          '#4FC3F7',
  STAR_YELLOW:     '#FFD700',
  TRICK_SHOT:      '#FFD700',
};

// --- Input key codes ---
export const KEYS = {
  LEFT:  ['ArrowLeft',  'KeyA'],
  RIGHT: ['ArrowRight', 'KeyD'],
  UP:    ['ArrowUp',    'KeyW'],
  DOWN:  ['ArrowDown',  'KeyS'],
  SHOT:  ['Space'],
  MAP:   ['KeyM'],
  ESC:   ['Escape'],
  ENTER: ['Enter'],
  SPIN_L:['KeyQ'],
  SPIN_R:['KeyE'],
  FAST:  ['KeyF', 'ShiftLeft', 'ShiftRight'],  // fast-forward while ball rolls
};

// --- Power bar settings ---
export const POWER_BAR = {
  FILL_RATE:   1.5,   // power units per second (at 60fps → ~0.025/frame)
  MAX:         1.0,   // maximum power value
  MIN_LAUNCH:  0.05,  // minimum power to actually launch the ball
  MAX_IMPULSE: 12,    // pixels/frame at max power
};

// --- Aim settings ---
export const AIM = {
  TURN_SPEED:      2.0,   // degrees per frame
  DOTS:            12,    // number of dots to show on aim line
  DOT_SPACING:     10,    // pixels between aim dots
  DOT_RADIUS:      1.5,
};

// --- Wind settings ---
export const WIND = {
  MIN_STRENGTH:    0.0,
  MAX_STRENGTH:    1.0,
  CHANGE_INTERVAL: 3,    // shots between wind changes
  NORMAL_MAX:      0.5,  // max wind strength in Normal mode
  BLIZZARD_MAX:    1.0,  // max wind strength in Blizzard mode
};

// --- Hole themes (background palette keys) ---
export const THEMES = {
  ELMWOOD:    'elmwood',
  LIBRARY:    'library',
  PLAINS:     'plains',
  ARENA:      'arena',
  STORM:      'storm',
  OLD_MARKET: 'oldMarket',
  CREEK:      'creek',
  CAMPUS:     'campus',
  FINALE:     'finale',
  BLIZZARD:   'blizzard',
};

// ============================================================
// HOLE DATA STRUCTURE (used by Hole1.js … Hole9.js)
// Each hole file exports a default object matching this shape:
// {
//   number:  1,
//   name:    "Welcome to the Bluffs",
//   par:     3,
//   theme:   THEMES.ELMWOOD,
//   wind:    { baseStrength: 0.1, baseAngle: 45, variable: true },
//   normal: {
//     map:      string[],     // 18 strings, each 32 chars (TILE_CHARS keys)
//     tee:      { x, y },     // game-pixel coords of ball spawn
//     cup:      { x, y },     // game-pixel coords of hole cup
//     entities: [],           // array of entity spawn descriptors
//     powerups: [],           // array of { type, x, y }
//   },
//   blizzard: { ... same shape as normal ... }
// }
// ============================================================

// ============================================================
// ENTITY SPAWN DESCRIPTOR SHAPE
// {
//   type:    ENTITY.BISON,  // entity type key
//   x:       number,        // starting x in game pixels
//   y:       number,        // starting y in game pixels
//   ... additional props per entity type (see entities/*.js)
// }
// ============================================================
