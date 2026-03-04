import { COLORS, CANVAS } from '../Constants.js';

// Theme-specific accent colors for hole intro panels
const THEME_ACCENTS = {
  elmwood:    { sky: '#87CEEB', ground: '#3A7D44', accent: '#FFD700'  },
  library:    { sky: '#4A3060', ground: '#2A1A50', accent: '#9B7FCC'  },
  plains:     { sky: '#DAA520', ground: '#C8A96E', accent: '#FF8C00'  },
  arena:      { sky: '#1A1A2A', ground: '#444455', accent: '#C8102E'  },
  storm:      { sky: '#1C2333', ground: '#2A3040', accent: '#AED6F1'  },
  oldMarket:  { sky: '#2C1A10', ground: '#3A2010', accent: '#CD7F32'  },
  creek:      { sky: '#1A6FA8', ground: '#2A5E31', accent: '#4FC3F7'  },
  campus:     { sky: '#87CEEB', ground: '#3A7D44', accent: '#C8102E'  },
  finale:     { sky: '#0A0A1A', ground: '#1A0A0A', accent: '#FFD700'  },
  blizzard:   { sky: '#1C2333', ground: '#D4EEF7', accent: '#A8D8EA'  },
  default:    { sky: '#87CEEB', ground: '#3A7D44', accent: '#FFD700'  },
};

export class HoleIntro {
  constructor() {
    this.visible    = false;
    this.animTime   = 0;
    this.duration   = 3.0; // auto-dismiss after 3 seconds
    this.holeData   = null;
    this.mode       = 'normal';
    this.onComplete = null;

    this._slideProgress = 0; // 0..1 panel slide-in
    this._dismissed     = false;
  }

  show(holeData, mode) {
    this.holeData       = holeData;
    this.mode           = mode || 'normal';
    this.visible        = true;
    this.animTime       = 0;
    this._slideProgress = 0;
    this._dismissed     = false;
  }

  update(dt, input) {
    if (!this.visible) return;

    this.animTime       += dt;
    this._slideProgress  = Math.min(1, this._slideProgress + dt * 4); // slide in over ~0.25s

    // Auto-dismiss or on input
    if (this.animTime >= this.duration || input.justPressed('SHOT') || input.mouseJustDown) {
      if (!this._dismissed) {
        this._dismissed = true;
        this.visible    = false;
        this.onComplete?.();
      }
    }
  }

  draw(ctx) {
    if (!this.visible) return;

    const theme      = this.holeData?.theme || 'default';
    const themeKey   = typeof theme === 'string' ? theme : 'default';
    const colors     = THEME_ACCENTS[themeKey] || THEME_ACCENTS.default;
    const isBlizzard = this.mode === 'blizzard';

    // ---- Dark overlay ----
    ctx.fillStyle = 'rgba(0,0,0,0.80)';
    ctx.fillRect(0, 0, CANVAS.WIDTH, CANVAS.HEIGHT);

    // ---- Panel ----
    const panelW = 210;
    const panelH = 90;
    const px     = (CANVAS.WIDTH  - panelW) / 2;

    // Slide down from top
    const slideEase = _easeOutBack(this._slideProgress);
    const py        = (CANVAS.HEIGHT - panelH) / 2 - (1 - slideEase) * 50;

    ctx.save();

    // Panel shadow
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(px + 3, py + 3, panelW, panelH);

    // Panel body
    ctx.fillStyle = COLORS.HUD_BG;
    ctx.fillRect(px, py, panelW, panelH);

    // ---- Theme miniature scene (top strip of panel) ----
    this._drawThemeStrip(ctx, px + 2, py + 2, panelW - 4, 30, colors, isBlizzard);

    // ---- Double-line border ----
    ctx.fillStyle = isBlizzard ? colors.accent : COLORS.UNO_RED;
    ctx.fillRect(px,            py,            panelW, 2);
    ctx.fillRect(px,            py + panelH-2, panelW, 2);
    ctx.fillRect(px,            py,            2,      panelH);
    ctx.fillRect(px + panelW-2, py,            2,      panelH);
    // Inner border line
    ctx.fillStyle = isBlizzard ? 'rgba(168,216,234,0.25)' : 'rgba(200,16,46,0.25)';
    ctx.fillRect(px + 3,        py + 3,        panelW - 6, 1);
    ctx.fillRect(px + 3,        py + panelH-4, panelW - 6, 1);
    ctx.fillRect(px + 3,        py + 3,        1,      panelH - 6);
    ctx.fillRect(px + panelW-4, py + 3,        1,      panelH - 6);

    // ---- Hole number — large, sliding in from left ----
    const holeNumX  = px + 10;
    const holeNumY  = py + 32;
    ctx.fillStyle   = isBlizzard ? colors.accent : COLORS.UNO_RED;
    ctx.font        = 'bold 14px monospace';
    ctx.textAlign   = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`HOLE ${this.holeData?.number || '?'}`, holeNumX, holeNumY);

    // ---- Hole name ----
    ctx.fillStyle   = COLORS.HUD_TEXT;
    ctx.font        = '8px monospace';
    ctx.fillText(`"${(this.holeData?.name || 'Unknown').toUpperCase()}"`, holeNumX, holeNumY + 17);

    // ---- Par info ----
    ctx.fillStyle = COLORS.HUD_DIM;
    ctx.font      = '7px monospace';
    ctx.fillText(`PAR  ${this.holeData?.par || 3}`, holeNumX, holeNumY + 29);

    // ---- Par badge (right side) ----
    const badgeX = px + panelW - 40;
    const badgeY = py + 34;
    ctx.fillStyle = colors.accent;
    ctx.fillRect(badgeX, badgeY, 34, 20);
    ctx.fillStyle = COLORS.UNO_BLACK;
    ctx.font = '6px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('PAR', badgeX + 17, badgeY + 4);
    ctx.font = 'bold 10px monospace';
    ctx.fillText(String(this.holeData?.par || 3), badgeX + 17, badgeY + 13);

    // ---- Mode badge ----
    if (isBlizzard) {
      ctx.fillStyle = '#1C2333';
      ctx.fillRect(px + panelW - 62, py + 2, 56, 12);
      ctx.fillStyle = colors.accent;
      ctx.fillRect(px + panelW - 62, py + 2, 56, 1);
      ctx.font = '6px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('BLIZZARD MODE', px + panelW - 34, py + 9);
    } else {
      ctx.fillStyle = '#1A2A0A';
      ctx.fillRect(px + panelW - 52, py + 2, 48, 12);
      ctx.fillStyle = '#7EC882';
      ctx.fillRect(px + panelW - 52, py + 2, 48, 1);
      ctx.font = '6px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('NORMAL MODE', px + panelW - 28, py + 9);
    }

    // ---- Wind info (if hole has wind) ----
    if (this.holeData?.wind && this.holeData.wind.baseStrength > 0) {
      ctx.fillStyle = COLORS.HUD_DIM;
      ctx.font = '6px monospace';
      ctx.textAlign = 'left';
      const windStr = this.holeData.wind.variable ? 'VARIABLE WIND' : 'STEADY WIND';
      ctx.fillText(`WIND: ${windStr}`, holeNumX, holeNumY + 40);
    }

    // ---- Countdown bar ----
    const barW      = panelW - 8;
    const barH      = 4;
    const barX      = px + 4;
    const barY      = py + panelH - 10;
    const fillRatio = Math.max(0, 1 - this.animTime / this.duration);

    ctx.fillStyle = '#1A1A1A';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = isBlizzard ? colors.accent : COLORS.UNO_RED;
    ctx.fillRect(barX, barY, Math.round(barW * fillRatio), barH);
    // Bar border
    ctx.fillStyle = '#333333';
    ctx.fillRect(barX,        barY,        barW, 1);
    ctx.fillRect(barX,        barY + barH-1, barW, 1);
    ctx.fillRect(barX,        barY,        1,   barH);
    ctx.fillRect(barX + barW-1, barY,      1,   barH);

    // ---- "PRESS SPACE TO START" flashing prompt ----
    if (Math.sin(this.animTime * 5) > 0) {
      ctx.fillStyle = COLORS.HUD_DIM;
      ctx.font = '6px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('PRESS SPACE TO START', CANVAS.WIDTH / 2, py + panelH - 14);
    }

    ctx.textBaseline = 'alphabetic';
    ctx.restore();
  }

  _drawThemeStrip(ctx, x, y, w, h, colors, isBlizzard) {
    // Sky background
    ctx.fillStyle = colors.sky;
    ctx.fillRect(x, y, w, h);

    if (isBlizzard) {
      // Blizzard snowflakes
      ctx.fillStyle = '#D4EEF7';
      const t = this.animTime;
      const flakes = [
        { ox: 0.1, oy: 0.2 }, { ox: 0.25, oy: 0.5 }, { ox: 0.4, oy: 0.1 },
        { ox: 0.55, oy: 0.6 }, { ox: 0.7, oy: 0.3 }, { ox: 0.85, oy: 0.7 },
        { ox: 0.15, oy: 0.8 }, { ox: 0.6, oy: 0.15 }, { ox: 0.92, oy: 0.5 },
      ];
      flakes.forEach((f, i) => {
        const fx = x + f.ox * w + Math.sin(t * 1.5 + i) * 3;
        const fy = y + ((f.oy * h + t * (5 + i % 3)) % h);
        ctx.fillRect(Math.round(fx), Math.round(fy), 2, 2);
      });
    } else {
      // Sun (top right)
      ctx.fillStyle = '#FFD700';
      ctx.fillRect(x + w - 18, y + 2, 10, 10);
      // Sun rays (pixel style)
      ctx.fillStyle = '#FFE040';
      ctx.fillRect(x + w - 13, y,      2, 2);     // top
      ctx.fillRect(x + w - 8,  y + 5,  2, 2);     // right
      ctx.fillRect(x + w - 13, y + 11, 2, 2);     // bottom
      ctx.fillRect(x + w - 20, y + 5,  2, 2);     // left
      // Clouds (pixel rectangles)
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(x + 4,  y + 4,  18, 6);
      ctx.fillRect(x + 2,  y + 6,  22, 4);
      ctx.fillRect(x + 30, y + 8,  12, 4);
      ctx.fillRect(x + 28, y + 10, 16, 3);
    }

    // Ground strip
    ctx.fillStyle = colors.ground;
    ctx.fillRect(x, y + h - 8, w, 8);
    // Ground shadow/detail
    ctx.fillStyle = isBlizzard ? '#AACCCC' : '#2A5E31';
    ctx.fillRect(x, y + h - 8, w, 2);

    // Mini golf hole flag (tiny pixel art)
    const flagX = x + w / 2;
    const flagY = y + h - 8;
    // Pole
    ctx.fillStyle = '#888888';
    ctx.fillRect(flagX, flagY - 10, 1, 10);
    // Flag
    ctx.fillStyle = COLORS.UNO_RED;
    ctx.fillRect(flagX + 1, flagY - 10, 5, 3);
    // Cup circle
    ctx.fillStyle = '#0A0A0A';
    ctx.fillRect(flagX - 2, flagY, 5, 2);

    // Border on strip
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(x, y + h - 1, w, 1);
  }
}

// Ease-out-back for panel slide animation
function _easeOutBack(t) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}
