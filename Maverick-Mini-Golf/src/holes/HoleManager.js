// ============================================================
// Maverick Mini Golf — HoleManager.js
// Loads hole data, parses tilemaps, and renders backgrounds + tiles.
// ============================================================

import { TILE, TILE_CHARS, TILE_SIZE, COLS, ROWS, CANVAS, COLORS, THEMES, MODE } from '../Constants.js';

import Hole1 from './Hole1.js';
import Hole2 from './Hole2.js';
import Hole3 from './Hole3.js';
import Hole4 from './Hole4.js';
import Hole5 from './Hole5.js';
import Hole6 from './Hole6.js';
import Hole7 from './Hole7.js';
import Hole8 from './Hole8.js';
import Hole9 from './Hole9.js';

// All 9 holes in order (0-indexed internally, 1-indexed externally)
const ALL_HOLES = [Hole1, Hole2, Hole3, Hole4, Hole5, Hole6, Hole7, Hole8, Hole9];

// ---- Background palette definitions per theme ----
const THEME_PALETTES = {
  [THEMES.ELMWOOD]: {
    sky:    '#87CEEB',
    skyMid: '#A8D8F0',
    hills:  ['#4A8C50', '#3A7D44', '#2A5E31'],
    ground: '#3A7D44',
  },
  [THEMES.LIBRARY]: {
    sky:    '#4A3060',
    skyMid: '#5A3A70',
    hills:  ['#2E1F50', '#3A2760', '#1A1030'],
    ground: '#2A1A40',
  },
  [THEMES.PLAINS]: {
    sky:    '#DAA520',
    skyMid: '#E8B830',
    hills:  ['#B89050', '#C8A060', '#A07840'],
    ground: '#C8A96E',
  },
  [THEMES.ARENA]: {
    sky:    '#1A1A2A',
    skyMid: '#222238',
    hills:  ['#333344', '#282840', '#1E1E2E'],
    ground: '#202030',
  },
  [THEMES.STORM]: {
    sky:    '#1C2333',
    skyMid: '#242C40',
    hills:  ['#2A3040', '#202838', '#181E2C'],
    ground: '#222030',
  },
  [THEMES.OLD_MARKET]: {
    sky:    '#2C1A10',
    skyMid: '#3A2218',
    hills:  ['#3A2820', '#4A3828', '#5A4830'],
    ground: '#3A2A18',
  },
  [THEMES.CREEK]: {
    sky:    '#5890C0',
    skyMid: '#70A8D8',
    hills:  ['#2A6030', '#3A7040', '#4A8050'],
    ground: '#2A5E31',
  },
  [THEMES.CAMPUS]: {
    sky:    '#87CEEB',
    skyMid: '#A0D8F8',
    hills:  ['#4A9050', '#3A8044', '#2A6031'],
    ground: '#3A7D44',
  },
  [THEMES.FINALE]: {
    sky:    '#0A0A1A',
    skyMid: '#100A20',
    hills:  ['#1A0A1A', '#200A10', '#180010'],
    ground: '#100810',
  },
  [THEMES.BLIZZARD]: {
    sky:    '#1C2333',
    skyMid: '#2A3448',
    hills:  ['#C8D8E8', '#A0B8C8', '#D8E8F0'],
    ground: '#D4EEF7',
  },
};

// Tile render colors
const TILE_COLORS = {
  [TILE.GRASS]:  COLORS.GRASS,
  [TILE.WALL]:   COLORS.WALL,
  [TILE.WATER]:  COLORS.WATER,
  [TILE.ICE]:    COLORS.ICE,
  [TILE.SAND]:   COLORS.SAND,
  [TILE.BRIDGE]: COLORS.BRIDGE,
  [TILE.ROUGH]:  COLORS.ROUGH,
  [TILE.EMPTY]:  COLORS.UNO_BLACK,
};

// Secondary (detail) colors per tile
const TILE_DETAIL_COLORS = {
  [TILE.GRASS]:  COLORS.GRASS_DARK,
  [TILE.WALL]:   COLORS.WALL_DARK,
  [TILE.WATER]:  COLORS.WATER_LIGHT,
  [TILE.ICE]:    COLORS.ICE_LIGHT,
  [TILE.SAND]:   '#B89040',
  [TILE.BRIDGE]: '#9B7A24',
  [TILE.ROUGH]:  '#4A7A34',
};

export class HoleManager {
  constructor() {
    /** Array of all 9 hole data objects (raw imports) */
    this.holes = ALL_HOLES;

    /** Currently loaded hole data (raw import) */
    this.current = null;

    /** Currently loaded hole mode data (normal or blizzard variant) */
    this._modeData = null;

    /** 2D array [row][col] of TILE values for the current hole/mode */
    this.tilemap = [];

    /** Current tee position */
    this._tee = null;

    /** Current cup position */
    this._cup = null;
  }

  // ----------------------------------------------------------------
  // Public API
  // ----------------------------------------------------------------

  /**
   * Load a hole by number and mode.
   * @param {number} holeNumber  1..9
   * @param {'normal'|'blizzard'} mode
   * @returns {object} The raw hole data object
   */
  load(holeNumber, mode) {
    const holeData = ALL_HOLES[holeNumber - 1];
    if (!holeData) {
      console.error(`[HoleManager] No hole data for hole ${holeNumber}`);
      return null;
    }

    this.current   = holeData;
    this._modeData = holeData[mode] || holeData.normal;
    this._mode     = mode;
    this.tilemap   = this._parseMap(this._modeData.map);
    this._tee      = { ...this._modeData.tee };
    this._cup      = { ...this._modeData.cup };

    return holeData;
  }

  /** @returns {{ x: number, y: number }} Tee position */
  getTee() { return this._tee; }

  /** @returns {{ x: number, y: number }} Cup position */
  getCup() { return this._cup; }

  // ----------------------------------------------------------------
  // Rendering
  // ----------------------------------------------------------------

  /**
   * Draw the themed background (sky + hills + ground).
   * @param {CanvasRenderingContext2D} ctx
   * @param {string} theme  THEMES constant value
   * @param {'normal'|'blizzard'} mode
   */
  drawBackground(ctx, theme, mode) {
    const isBlizzard = mode === MODE.BLIZZARD;
    const palette    = (isBlizzard && theme !== THEMES.BLIZZARD)
      ? THEME_PALETTES[THEMES.BLIZZARD]
      : (THEME_PALETTES[theme] || THEME_PALETTES[THEMES.ELMWOOD]);

    ctx.save();
    ctx.imageSmoothingEnabled = false;

    // Sky gradient (manual — two rects)
    ctx.fillStyle = palette.sky;
    ctx.fillRect(0, 0, CANVAS.WIDTH, CANVAS.HEIGHT * 0.5);
    ctx.fillStyle = palette.skyMid;
    ctx.fillRect(0, CANVAS.HEIGHT * 0.5, CANVAS.WIDTH, CANVAS.HEIGHT * 0.5);

    // Theme-specific decorations in background
    this._drawThemeDecorations(ctx, theme, isBlizzard, palette);

    ctx.restore();
  }

  /**
   * Draw the tile grid using pixel-art colored rectangles.
   * @param {CanvasRenderingContext2D} ctx
   */
  drawTiles(ctx) {
    if (!this.tilemap.length) return;

    ctx.save();
    ctx.imageSmoothingEnabled = false;

    const cup = this._cup;

    for (let row = 0; row < this.tilemap.length; row++) {
      for (let col = 0; col < this.tilemap[row].length; col++) {
        const tile = this.tilemap[row][col];
        const x    = col * TILE_SIZE;
        const y    = row * TILE_SIZE;

        // Base fill
        const baseColor = TILE_COLORS[tile] ?? COLORS.UNO_BLACK;
        ctx.fillStyle = baseColor;
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

        // Pixel-art detail pass
        this._drawTileDetail(ctx, tile, x, y);
      }
    }

    // Draw cup (hole marker with flag)
    if (cup) {
      this._drawCup(ctx, cup.x, cup.y);
    }

    // Draw tee marker
    if (this._tee) {
      this._drawTee(ctx, this._tee.x, this._tee.y);
    }

    ctx.restore();
  }

  // ----------------------------------------------------------------
  // Internal helpers
  // ----------------------------------------------------------------

  /**
   * Parse a map string array into a 2D TILE-value array.
   * @param {string[]} mapStrings
   * @returns {number[][]}
   */
  _parseMap(mapStrings) {
    return mapStrings.map(row =>
      Array.from(row).map(ch => TILE_CHARS[ch] ?? TILE.EMPTY)
    );
  }

  /**
   * Draw pixel-art detail on top of a tile base colour.
   */
  _drawTileDetail(ctx, tile, x, y) {
    const detail = TILE_DETAIL_COLORS[tile];
    if (!detail) return;

    ctx.fillStyle = detail;

    switch (tile) {
      case TILE.GRASS:
        // Subtle top edge highlight + bottom-right shadow pixel
        ctx.fillRect(x, y, TILE_SIZE, 1);
        ctx.fillRect(x, y, 1, TILE_SIZE);
        // Lighter inner texture every other tile
        ctx.fillStyle = COLORS.GRASS_LIGHT;
        ctx.fillRect(x + 3, y + 3, 2, 2);
        break;

      case TILE.WALL:
        // Brick pattern: alternating mortar lines
        ctx.fillRect(x, y, TILE_SIZE, 1);           // top
        ctx.fillRect(x, y + 4, TILE_SIZE, 1);       // mid mortar
        // Brick offsets
        ctx.fillStyle = COLORS.WALL;
        ctx.fillRect(x, y + 1, 5, 3);
        ctx.fillRect(x + 5, y + 1, 5, 3);
        ctx.fillRect(x + 2, y + 5, 6, 4);
        ctx.fillRect(x + 8, y + 5, 2, 4);
        break;

      case TILE.WATER:
        // Animated-ish waves — static light lines
        ctx.fillStyle = COLORS.WATER_LIGHT;
        ctx.fillRect(x + 1, y + 2, 3, 1);
        ctx.fillRect(x + 6, y + 5, 3, 1);
        ctx.fillRect(x + 2, y + 7, 4, 1);
        break;

      case TILE.ICE:
        // Sheen highlights (diagonal pixel lines)
        ctx.fillStyle = COLORS.ICE_LIGHT;
        ctx.fillRect(x,     y,     TILE_SIZE, 1);
        ctx.fillRect(x,     y,     1, TILE_SIZE);
        ctx.fillRect(x + 3, y + 3, 3, 1);
        break;

      case TILE.SAND:
        // Dotted grain texture
        ctx.fillStyle = '#A07830';
        ctx.fillRect(x + 2, y + 1, 1, 1);
        ctx.fillRect(x + 6, y + 3, 1, 1);
        ctx.fillRect(x + 4, y + 6, 1, 1);
        ctx.fillRect(x + 8, y + 8, 1, 1);
        break;

      case TILE.BRIDGE:
        // Wood plank lines
        ctx.fillStyle = '#6A4A0A';
        ctx.fillRect(x, y + 2, TILE_SIZE, 1);
        ctx.fillRect(x, y + 6, TILE_SIZE, 1);
        ctx.fillStyle = '#9B7A24';
        ctx.fillRect(x, y, TILE_SIZE, 2);
        break;

      case TILE.ROUGH:
        // Long grass tufts
        ctx.fillStyle = '#4A8C3E';
        ctx.fillRect(x + 1, y + 2, 1, 3);
        ctx.fillRect(x + 4, y + 1, 1, 4);
        ctx.fillRect(x + 7, y + 3, 1, 3);
        break;

      default:
        break;
    }
  }

  /**
   * Draw the cup (hole) — black circle with red flag on a pole.
   */
  _drawCup(ctx, cx, cy) {
    const x = Math.round(cx);
    const y = Math.round(cy);

    // Cup circle (dark hole)
    ctx.fillStyle = COLORS.CUP;
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();

    // Cup rim (silver ring)
    ctx.strokeStyle = COLORS.SILVER;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.stroke();

    // Flag pole (up from cup)
    ctx.fillStyle = '#999999';
    ctx.fillRect(x, y - 14, 1, 14);

    // UNO red flag (3-pixel triangular flag)
    ctx.fillStyle = COLORS.CUP_FLAG_RED;
    ctx.fillRect(x + 1, y - 14, 7, 2);
    ctx.fillRect(x + 1, y - 12, 5, 2);
    ctx.fillRect(x + 1, y - 10, 3, 2);
  }

  /**
   * Draw the tee marker — small gold circle/cross.
   */
  _drawTee(ctx, tx, ty) {
    const x = Math.round(tx);
    const y = Math.round(ty);

    // Gold cross tee marker
    ctx.fillStyle = COLORS.TEE_MARKER;
    ctx.fillRect(x - 4, y, 8, 1);
    ctx.fillRect(x, y - 4, 1, 8);

    // Small center square
    ctx.fillStyle = COLORS.GOLD;
    ctx.fillRect(x - 1, y - 1, 3, 3);
  }

  /**
   * Draw theme-specific background decorations (silhouettes, clouds, etc.)
   */
  _drawThemeDecorations(ctx, theme, isBlizzard, palette) {
    if (isBlizzard) {
      this._drawBlizzardDecorations(ctx, palette);
      return;
    }

    switch (theme) {
      case THEMES.ELMWOOD:
      case THEMES.CREEK:
      case THEMES.CAMPUS:
        this._drawElmwoodBackground(ctx, palette);
        break;
      case THEMES.LIBRARY:
        this._drawLibraryBackground(ctx, palette);
        break;
      case THEMES.PLAINS:
        this._drawPlainsBackground(ctx, palette);
        break;
      case THEMES.ARENA:
        this._drawArenaBackground(ctx, palette);
        break;
      case THEMES.STORM:
        this._drawStormBackground(ctx, palette);
        break;
      case THEMES.OLD_MARKET:
        this._drawOldMarketBackground(ctx, palette);
        break;
      case THEMES.FINALE:
        this._drawFinaleBackground(ctx, palette);
        break;
      default:
        this._drawElmwoodBackground(ctx, palette);
        break;
    }
  }

  _drawElmwoodBackground(ctx, palette) {
    // Sun (top right)
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(CANVAS.WIDTH - 28, 8, 14, 14);
    ctx.fillStyle = '#FFE040';
    ctx.fillRect(CANVAS.WIDTH - 21, 4, 2, 4);   // top ray
    ctx.fillRect(CANVAS.WIDTH - 10, 15, 4, 2);   // right ray
    ctx.fillRect(CANVAS.WIDTH - 21, 22, 2, 4);   // bottom ray
    ctx.fillRect(CANVAS.WIDTH - 32, 15, 4, 2);   // left ray

    // Clouds
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillRect(20, 12, 30, 8);
    ctx.fillRect(16, 14, 38, 6);
    ctx.fillRect(90, 8,  22, 7);
    ctx.fillRect(86, 10, 30, 5);

    // Treeline silhouette
    const trees = [0, 30, 60, 95, 130, 170, 205, 240, 275, 300];
    trees.forEach(tx => {
      const h = 18 + (tx % 14);
      ctx.fillStyle = palette.hills[0];
      // Trunk
      ctx.fillRect(tx + 5, CANVAS.HEIGHT - h - 4, 4, 6);
      // Canopy
      ctx.fillStyle = palette.hills[1];
      ctx.fillRect(tx, CANVAS.HEIGHT - h, 14, h);
      ctx.fillStyle = palette.hills[2];
      ctx.fillRect(tx + 2, CANVAS.HEIGHT - h - 4, 10, 8);
    });
  }

  _drawLibraryBackground(ctx, palette) {
    // Dark indigo sky, bookshelf silhouette
    ctx.fillStyle = palette.hills[0];
    ctx.fillRect(0, CANVAS.HEIGHT * 0.55, CANVAS.WIDTH, CANVAS.HEIGHT * 0.45);

    // Bookshelf lines (horizontal shelves)
    ctx.fillStyle = palette.hills[1];
    for (let sy = Math.round(CANVAS.HEIGHT * 0.6); sy < CANVAS.HEIGHT; sy += 16) {
      ctx.fillRect(0, sy, CANVAS.WIDTH, 2);
    }

    // Book spines (vertical colored rects)
    const bookColors = ['#8B0000','#1A4A8A','#228B22','#8B4500','#4B0082','#556B2F','#8B0000'];
    for (let bx = 0; bx < CANVAS.WIDTH; bx += 8) {
      const colorIdx = Math.floor((bx / 8)) % bookColors.length;
      const bh = 10 + (bx * 7 % 5);
      ctx.fillStyle = bookColors[colorIdx];
      ctx.fillRect(bx, CANVAS.HEIGHT - bh - 2, 7, bh);
    }
  }

  _drawPlainsBackground(ctx, palette) {
    // Golden Plains sky — amber gradient
    ctx.fillStyle = '#C88020';
    ctx.fillRect(0, 0, CANVAS.WIDTH, CANVAS.HEIGHT * 0.4);

    // Horizon wheat band
    ctx.fillStyle = palette.hills[0];
    ctx.fillRect(0, Math.round(CANVAS.HEIGHT * 0.45), CANVAS.WIDTH, Math.round(CANVAS.HEIGHT * 0.15));

    // Grass plains
    ctx.fillStyle = palette.hills[1];
    ctx.fillRect(0, Math.round(CANVAS.HEIGHT * 0.6), CANVAS.WIDTH, Math.round(CANVAS.HEIGHT * 0.4));

    // Long grass tufts along horizon
    ctx.fillStyle = '#A07030';
    for (let gx = 0; gx < CANVAS.WIDTH; gx += 12) {
      const gh = 4 + (gx % 8);
      ctx.fillRect(gx, Math.round(CANVAS.HEIGHT * 0.58) - gh, 2, gh);
      ctx.fillRect(gx + 4, Math.round(CANVAS.HEIGHT * 0.58) - gh + 2, 2, gh - 2);
    }
  }

  _drawArenaBackground(ctx, palette) {
    // Dark arena interior
    ctx.fillStyle = '#111122';
    ctx.fillRect(0, 0, CANVAS.WIDTH, CANVAS.HEIGHT);

    // Crowd silhouette (rows of dots)
    ctx.fillStyle = '#1E1E32';
    ctx.fillRect(0, 0, CANVAS.WIDTH, 22);
    ctx.fillStyle = '#2A2A44';
    ctx.fillRect(0, 0, CANVAS.WIDTH, 14);

    // Crowd heads (tiny pixel dots)
    ctx.fillStyle = '#3A3A55';
    for (let cx2 = 4; cx2 < CANVAS.WIDTH; cx2 += 8) {
      for (let cy2 = 2; cy2 < 14; cy2 += 6) {
        ctx.fillRect(cx2 + (cy2 % 4), cy2, 4, 4);
      }
    }

    // Scoreboard silhouette (top center)
    ctx.fillStyle = '#0A0A1A';
    ctx.fillRect(CANVAS.WIDTH / 2 - 30, 2, 60, 14);
    ctx.fillStyle = '#C8102E';
    ctx.fillRect(CANVAS.WIDTH / 2 - 28, 4, 56, 10);
    ctx.fillStyle = '#F5F5F5';
    ctx.fillRect(CANVAS.WIDTH / 2 - 10, 6, 20, 6);

    // Rink ice border highlight
    ctx.fillStyle = COLORS.ICE_LIGHT;
    ctx.fillRect(0, 28, CANVAS.WIDTH, 2);
    ctx.fillRect(0, CANVAS.HEIGHT - 32, CANVAS.WIDTH, 2);
  }

  _drawStormBackground(ctx, palette) {
    // Dark storm sky
    ctx.fillStyle = '#10141E';
    ctx.fillRect(0, 0, CANVAS.WIDTH, CANVAS.HEIGHT);

    // Lightning clouds (dark blobs)
    ctx.fillStyle = '#1C2230';
    ctx.fillRect(10, 4, 60, 18);
    ctx.fillRect(5, 8, 70, 14);
    ctx.fillRect(110, 2, 80, 16);
    ctx.fillRect(200, 6, 100, 18);
    ctx.fillRect(195, 10, 110, 12);

    // Lightning bolt (pixel art)
    ctx.fillStyle = '#FFFFAA';
    ctx.fillRect(80, 10, 2, 4);
    ctx.fillRect(78, 14, 4, 2);
    ctx.fillRect(76, 16, 4, 4);
    ctx.fillRect(74, 20, 2, 2);

    // Dark plains ground
    ctx.fillStyle = '#141820';
    ctx.fillRect(0, CANVAS.HEIGHT * 0.65, CANVAS.WIDTH, CANVAS.HEIGHT * 0.35);

    // Ground horizon line
    ctx.fillStyle = '#1E2028';
    ctx.fillRect(0, Math.round(CANVAS.HEIGHT * 0.65), CANVAS.WIDTH, 2);
  }

  _drawOldMarketBackground(ctx, palette) {
    // Evening Old Market sky
    ctx.fillStyle = '#1A0E06';
    ctx.fillRect(0, 0, CANVAS.WIDTH, CANVAS.HEIGHT);

    // Lantern light glow (warm amber patches)
    ctx.fillStyle = 'rgba(200,140,40,0.12)';
    ctx.fillRect(60, 20, 40, 30);
    ctx.fillRect(160, 15, 40, 30);
    ctx.fillRect(250, 22, 35, 28);

    // Building silhouettes (old brick)
    ctx.fillStyle = '#1E1008';
    const buildings = [
      { x: 0,   w: 50,  h: 50 },
      { x: 40,  w: 30,  h: 38 },
      { x: 80,  w: 45,  h: 55 },
      { x: 140, w: 60,  h: 48 },
      { x: 195, w: 35,  h: 62 },
      { x: 230, w: 50,  h: 44 },
      { x: 275, w: 45,  h: 52 },
    ];
    buildings.forEach(b => {
      ctx.fillRect(b.x, CANVAS.HEIGHT - b.h, b.w, b.h);
    });

    // Windows (amber glow)
    ctx.fillStyle = 'rgba(255,200,80,0.6)';
    buildings.forEach(b => {
      for (let wy = CANVAS.HEIGHT - b.h + 4; wy < CANVAS.HEIGHT - 8; wy += 8) {
        for (let wx = b.x + 4; wx < b.x + b.w - 4; wx += 8) {
          if ((wx + wy) % 16 !== 0) ctx.fillRect(wx, wy, 4, 4);
        }
      }
    });

    // Train tracks (two pixel rails)
    ctx.fillStyle = '#4A3828';
    ctx.fillRect(0, Math.round(CANVAS.HEIGHT * 0.42), CANVAS.WIDTH, 1);
    ctx.fillRect(0, Math.round(CANVAS.HEIGHT * 0.44), CANVAS.WIDTH, 1);
    // Ties
    ctx.fillStyle = '#3A2818';
    for (let tx = 0; tx < CANVAS.WIDTH; tx += 8) {
      ctx.fillRect(tx, Math.round(CANVAS.HEIGHT * 0.41), 4, 4);
    }
  }

  _drawFinaleBackground(ctx, palette) {
    // Deep night sky with stars
    ctx.fillStyle = '#050510';
    ctx.fillRect(0, 0, CANVAS.WIDTH, CANVAS.HEIGHT);

    // Stars
    const stars = [
      {x:12,y:8},{x:40,y:4},{x:78,y:12},{x:120,y:6},{x:165,y:10},{x:210,y:5},
      {x:250,y:12},{x:290,y:7},{x:310,y:14},{x:25,y:20},{x:90,y:18},{x:175,y:22},
      {x:230,y:16},{x:280,y:24},{x:55,y:28},{x:140,y:26},{x:300,y:20},
    ];
    ctx.fillStyle = '#F5F5F5';
    stars.forEach(s => ctx.fillRect(s.x, s.y, (s.x % 3 === 0) ? 2 : 1, (s.x % 3 === 0) ? 2 : 1));

    // Firework bursts (static pixel art)
    this._drawFirework(ctx, 60,  25, '#FFD700');
    this._drawFirework(ctx, 180, 18, '#C8102E');
    this._drawFirework(ctx, 280, 28, '#F5F5F5');

    // Campus silhouette (top building shapes)
    ctx.fillStyle = '#100810';
    const finalBuildings = [
      {x:0,w:40,h:28},{x:35,w:20,h:20},{x:100,w:50,h:32},{x:160,w:30,h:24},
      {x:200,w:60,h:36},{x:255,w:25,h:20},{x:285,w:35,h:28},
    ];
    finalBuildings.forEach(b => {
      ctx.fillRect(b.x, CANVAS.HEIGHT - b.h - 20, b.w, b.h);
    });

    // UNO red horizon glow
    ctx.fillStyle = 'rgba(200,16,46,0.15)';
    ctx.fillRect(0, CANVAS.HEIGHT - 30, CANVAS.WIDTH, 30);
  }

  _drawBlizzardDecorations(ctx, palette) {
    // Blizzard dark sky
    ctx.fillStyle = '#0C1018';
    ctx.fillRect(0, 0, CANVAS.WIDTH, CANVAS.HEIGHT);

    // Storm clouds
    ctx.fillStyle = '#1C2030';
    ctx.fillRect(0, 0, CANVAS.WIDTH, 20);
    ctx.fillRect(0, 8, CANVAS.WIDTH, 12);

    // Static snowflake field (pixel art dots)
    ctx.fillStyle = '#D4EEF7';
    const flakePositions = [
      {x:15,y:10},{x:35,y:18},{x:60,y:8},{x:90,y:22},{x:115,y:12},
      {x:140,y:20},{x:170,y:6},{x:195,y:16},{x:225,y:10},{x:255,y:22},
      {x:285,y:14},{x:305,y:8},{x:25,y:30},{x:75,y:38},{x:130,y:28},
      {x:185,y:35},{x:240,y:30},{x:295,y:40},
    ];
    flakePositions.forEach(f => ctx.fillRect(f.x, f.y, 2, 2));

    // Snow drifts on ground
    ctx.fillStyle = '#D4EEF7';
    ctx.fillRect(0, CANVAS.HEIGHT - 8, CANVAS.WIDTH, 8);
    // Drift bumps
    const drifts = [0, 40, 90, 150, 200, 260, 310];
    drifts.forEach(dx => {
      const dh = 4 + (dx % 8);
      ctx.fillRect(dx, CANVAS.HEIGHT - 8 - dh, 30 + (dx % 20), dh);
    });
  }

  _drawFirework(ctx, cx, cy, color) {
    ctx.fillStyle = color;
    // Center burst
    ctx.fillRect(cx - 1, cy - 1, 2, 2);
    // Rays (8 directions)
    const rays = [
      {dx:0,dy:-1,l:6},{dx:0,dy:1,l:6},{dx:1,dy:0,l:6},{dx:-1,dy:0,l:6},
      {dx:1,dy:-1,l:4},{dx:1,dy:1,l:4},{dx:-1,dy:1,l:4},{dx:-1,dy:-1,l:4},
    ];
    rays.forEach(r => {
      ctx.fillRect(cx + r.dx * r.l - 1, cy + r.dy * r.l - 1, 2, 2);
      ctx.fillRect(cx + r.dx * Math.round(r.l * 0.5), cy + r.dy * Math.round(r.l * 0.5), 1, 1);
    });
  }
}
