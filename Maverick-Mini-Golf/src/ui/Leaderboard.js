import { COLORS, CANVAS } from '../Constants.js';

const STORAGE_KEY = 'maverick_golf_scores';

// Medal colors for top 3 ranks
const RANK_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];

export class Leaderboard {
  constructor() {
    this.scores        = this._load();
    this.visible       = false;
    this.animTime      = 0;
    this.onBack        = null;
    this.newEntryIndex = -1; // highlight position of new score
    this._rowRevealTime = 0;
  }

  _load() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch { return []; }
  }

  _save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.scores));
  }

  // Add a new score and sort
  addScore(name, totalStrokes, totalPar, grade, mode) {
    const entry = {
      name,
      totalStrokes,
      totalPar,
      grade,
      mode,
      date: new Date().toLocaleDateString(),
    };
    this.scores.push(entry);
    this.scores.sort((a, b) => a.totalStrokes - b.totalStrokes);
    this.scores = this.scores.slice(0, 10); // keep top 10
    this.newEntryIndex = this.scores.indexOf(entry);
    this._save();
    return this.newEntryIndex;
  }

  show() {
    this.visible        = true;
    this.animTime       = 0;
    this._rowRevealTime = 0;
  }

  hide() { this.visible = false; }

  update(dt, input) {
    if (!this.visible) return;
    this.animTime       += dt;
    this._rowRevealTime += dt;

    if (input.justPressed('ESC') || input.justPressed('SHOT') || input.mouseJustDown) {
      this.onBack?.();
    }
  }

  draw(ctx) {
    if (!this.visible) return;

    // ---- Background ----
    ctx.fillStyle = '#07070F';
    ctx.fillRect(0, 0, CANVAS.WIDTH, CANVAS.HEIGHT);

    // Subtle scanlines
    ctx.fillStyle = 'rgba(200,16,46,0.04)';
    for (let sy = 0; sy < CANVAS.HEIGHT; sy += 6) {
      ctx.fillRect(0, sy, CANVAS.WIDTH, 1);
    }

    // Decorative corner borders
    this._drawCornerDecorations(ctx);

    // ---- Header ----
    ctx.fillStyle = COLORS.UNO_RED;
    ctx.fillRect(0, 0, CANVAS.WIDTH, 22);
    // Double-line header border
    ctx.fillStyle = '#6A0816';
    ctx.fillRect(0, 20, CANVAS.WIDTH, 1);
    ctx.fillStyle = '#FF3355';
    ctx.fillRect(0, 21, CANVAS.WIDTH, 1);

    // Longhorn icon (small, left of title)
    this._drawMiniLonghorn(ctx, 14, 10);

    // Title
    ctx.fillStyle = COLORS.UNO_WHITE;
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('HIGH SCORES', CANVAS.WIDTH / 2, 4);

    // UNO branding
    ctx.fillStyle = 'rgba(245,245,245,0.5)';
    ctx.font = '5px monospace';
    ctx.fillText('MAVERICK MINI GOLF — ELMWOOD PARK', CANVAS.WIDTH / 2, 15);

    // Longhorn icon right side
    this._drawMiniLonghorn(ctx, CANVAS.WIDTH - 14, 10);

    // ---- Column headers ----
    const colDefs = [
      { label: 'RANK',    w: 22,  align: 'center' },
      { label: 'NAME',    w: 68,  align: 'left'   },
      { label: 'STR',     w: 20,  align: 'right'  },
      { label: 'VS PAR',  w: 26,  align: 'right'  },
      { label: 'GRD',     w: 16,  align: 'center' },
      { label: 'MODE',    w: 28,  align: 'center' },
      { label: 'DATE',    w: 42,  align: 'right'  },
    ];

    const tableX  = 4;
    const headerY = 24;
    const rowH    = 12;

    // Header bar
    ctx.fillStyle = '#111122';
    ctx.fillRect(tableX, headerY, CANVAS.WIDTH - tableX * 2, rowH);
    ctx.fillStyle = COLORS.UNO_RED;
    ctx.fillRect(tableX, headerY + rowH - 1, CANVAS.WIDTH - tableX * 2, 1);

    let cx = tableX;
    colDefs.forEach(col => {
      ctx.fillStyle = COLORS.HUD_DIM;
      ctx.font = '5px monospace';
      ctx.textAlign = col.align;
      const tx = col.align === 'left'   ? cx + 2
               : col.align === 'right'  ? cx + col.w - 2
               : cx + col.w / 2;
      ctx.fillText(col.label, tx, headerY + 3);
      cx += col.w;
    });

    // ---- Score rows ----
    if (this.scores.length === 0) {
      ctx.fillStyle = COLORS.HUD_DIM;
      ctx.font = '7px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('NO SCORES YET', CANVAS.WIDTH / 2, headerY + rowH + 24);
      ctx.font = '6px monospace';
      ctx.fillText('Play a round to set a record!', CANVAS.WIDTH / 2, headerY + rowH + 36);
    } else {
      const maxReveal = Math.floor(this._rowRevealTime / 0.1);

      this.scores.forEach((entry, ri) => {
        if (ri >= maxReveal) return;

        const ry        = headerY + rowH + ri * rowH;
        const isNew     = ri === this.newEntryIndex;
        const rankColor = ri < 3 ? RANK_COLORS[ri] : COLORS.HUD_TEXT;

        // Row background
        if (isNew) {
          // Highlight new entry with animated pulse
          const pulse = Math.abs(Math.sin(this.animTime * 4));
          ctx.fillStyle = `rgba(200,16,46,${(0.15 + pulse * 0.15).toFixed(2)})`;
          ctx.fillRect(tableX, ry, CANVAS.WIDTH - tableX * 2, rowH);
        } else if (ri < 3) {
          ctx.fillStyle = `rgba(${ri === 0 ? '255,215,0' : ri === 1 ? '192,192,192' : '205,127,50'},0.06)`;
          ctx.fillRect(tableX, ry, CANVAS.WIDTH - tableX * 2, rowH);
        } else if (ri % 2 === 0) {
          ctx.fillStyle = 'rgba(255,255,255,0.02)';
          ctx.fillRect(tableX, ry, CANVAS.WIDTH - tableX * 2, rowH);
        }

        // Row separator
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        ctx.fillRect(tableX, ry + rowH - 1, CANVAS.WIDTH - tableX * 2, 1);

        // Grade color
        const gradeColors = { S: '#FFD700', A: '#7EC882', B: '#87CEEB', C: '#F5F5F5', D: '#FF6666' };
        const gradeColor  = gradeColors[entry.grade] || COLORS.HUD_DIM;

        // Over/under par
        const overPar  = (entry.totalStrokes || 0) - (entry.totalPar || 0);
        const parStr   = overPar === 0 ? 'E' : overPar > 0 ? `+${overPar}` : `${overPar}`;
        const parColor = overPar < 0 ? '#7EC882' : overPar > 0 ? '#FF6666' : COLORS.HUD_DIM;

        // Mode badge color
        const modeColor = entry.mode === 'blizzard' ? '#AED6F1' : '#7EC882';
        const modeLabel = entry.mode === 'blizzard' ? 'BLZD' : 'NRML';

        const cells = [
          { text: ri < 3 ? ['1st','2nd','3rd'][ri] : `${ri + 1}th`, color: rankColor,         align: 'center' },
          { text: (entry.name || 'ANON').substring(0, 10).toUpperCase(), color: isNew ? COLORS.UNO_WHITE : COLORS.HUD_TEXT, align: 'left' },
          { text: String(entry.totalStrokes || 0),   color: COLORS.HUD_TEXT, align: 'right'  },
          { text: parStr,                             color: parColor,        align: 'right'  },
          { text: entry.grade || '?',                 color: gradeColor,      align: 'center' },
          { text: modeLabel,                          color: modeColor,       align: 'center' },
          { text: entry.date || '',                   color: COLORS.HUD_DIM,  align: 'right'  },
        ];

        cx = tableX;
        cells.forEach((cell, ci) => {
          const col = colDefs[ci];
          ctx.fillStyle = cell.color;
          ctx.font = ci === 0 && ri < 3 ? 'bold 6px monospace' : '6px monospace';
          ctx.textAlign = cell.align;
          const tx = cell.align === 'left'   ? cx + 2
                   : cell.align === 'right'  ? cx + col.w - 2
                   : cx + col.w / 2;
          ctx.fillText(cell.text, tx, ry + 3);
          cx += col.w;
        });

        // Medal icon for top 3
        if (ri < 3) {
          ctx.fillStyle = rankColor;
          ctx.fillRect(tableX, ry + 2, 2, rowH - 4);
        }
      });
    }

    // ---- Back prompt ----
    ctx.fillStyle = COLORS.HUD_BG;
    ctx.fillRect(0, CANVAS.HEIGHT - 14, CANVAS.WIDTH, 14);
    ctx.fillStyle = COLORS.UNO_RED;
    ctx.fillRect(0, CANVAS.HEIGHT - 14, CANVAS.WIDTH, 1);

    if (Math.sin(this.animTime * 3) > 0) {
      ctx.fillStyle = COLORS.HUD_DIM;
      ctx.font = '6px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('ESC / SPACE TO RETURN TO MENU', CANVAS.WIDTH / 2, CANVAS.HEIGHT - 4);
    }

    ctx.textBaseline = 'alphabetic';
  }

  _drawCornerDecorations(ctx) {
    const size = 8;
    const color = '#C8102E';

    // Top-left
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, size, 2);
    ctx.fillRect(0, 0, 2, size);

    // Top-right
    ctx.fillRect(CANVAS.WIDTH - size, 0, size, 2);
    ctx.fillRect(CANVAS.WIDTH - 2,   0, 2,    size);

    // Bottom-left
    ctx.fillRect(0, CANVAS.HEIGHT - 2, size, 2);
    ctx.fillRect(0, CANVAS.HEIGHT - size, 2, size);

    // Bottom-right
    ctx.fillRect(CANVAS.WIDTH - size, CANVAS.HEIGHT - 2, size, 2);
    ctx.fillRect(CANVAS.WIDTH - 2,   CANVAS.HEIGHT - size, 2, size);
  }

  _drawMiniLonghorn(ctx, cx, cy) {
    // Tiny longhorn head for branding
    ctx.fillStyle = COLORS.UNO_WHITE;
    ctx.fillRect(cx - 3, cy - 2, 6, 5);
    ctx.fillRect(cx - 2, cy + 2, 4, 3);
    // Horns
    ctx.fillRect(cx - 8, cy - 3, 4, 2);
    ctx.fillRect(cx + 4, cy - 3, 4, 2);
    ctx.fillRect(cx - 5, cy - 5, 2, 2);
    ctx.fillRect(cx + 3, cy - 5, 2, 2);
  }
}
