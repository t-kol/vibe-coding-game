import { COLORS, CANVAS, SCORE_NAMES, GRADE_THRESHOLDS } from '../Constants.js';

// Grade colors
const GRADE_COLORS = {
  S: '#FFD700',
  A: '#7EC882',
  B: '#87CEEB',
  C: '#F5F5F5',
  D: '#FF6666',
};

export class Scoreboard {
  constructor() {
    this.visible    = false;
    this.type       = 'hole';   // 'hole' | 'game'
    this.animTime   = 0;
    this.revealed   = [];       // which rows have been revealed (animated)
    this.onContinue = null;     // callback
    this.data       = null;

    this._revealTimer   = 0;
    this._revealDelay   = 0.18; // seconds between row reveals
    this._promptBlink   = 0;
  }

  show(type, data) {
    this.type      = type;
    this.data      = data;
    this.visible   = true;
    this.animTime  = 0;
    this.revealed  = [];
    this._revealTimer = 0;
    this._promptBlink = 0;
  }

  hide() { this.visible = false; }

  update(dt, input) {
    if (!this.visible) return;
    this.animTime     += dt;
    this._promptBlink += dt;
    this._revealTimer += dt;

    // Reveal rows one by one over time
    const totalRows = this.type === 'hole'
      ? 4  // par, strokes, score, total
      : (this.data?.scores?.length || 0) + 1; // hole rows + total

    const expectedRevealed = Math.floor(this._revealTimer / this._revealDelay);
    while (this.revealed.length < Math.min(expectedRevealed, totalRows)) {
      this.revealed.push(this.revealed.length);
    }

    // Press Enter/Space/click to continue
    if (input.justPressed('SHOT') || input.justPressed('ENTER') || input.mouseJustDown) {
      // Force reveal all rows first, then continue on next press
      if (this.revealed.length < totalRows) {
        for (let i = this.revealed.length; i < totalRows; i++) {
          this.revealed.push(i);
        }
      } else {
        this.onContinue?.();
      }
    }
  }

  draw(ctx) {
    if (!this.visible) return;
    if (this.type === 'hole') this._drawHoleScore(ctx);
    else this._drawGameScore(ctx);
  }

  _drawHoleScore(ctx) {
    if (!this.data) return;

    // Dark overlay
    ctx.fillStyle = 'rgba(0,0,0,0.82)';
    ctx.fillRect(0, 0, CANVAS.WIDTH, CANVAS.HEIGHT);

    const panelW = 200;
    const panelH = 110;
    const px     = (CANVAS.WIDTH  - panelW) / 2;
    const py     = (CANVAS.HEIGHT - panelH) / 2;

    // Panel slide-in animation
    const slideProgress = Math.min(1, this.animTime / 0.35);
    const offsetY = (1 - slideProgress) * -30;

    ctx.save();
    ctx.translate(0, offsetY);

    // Panel background
    ctx.fillStyle = COLORS.HUD_BG;
    ctx.fillRect(px, py, panelW, panelH);

    // Pixel-art border — double-line style
    ctx.fillStyle = COLORS.UNO_RED;
    ctx.fillRect(px,            py,            panelW, 2);
    ctx.fillRect(px,            py + panelH-2, panelW, 2);
    ctx.fillRect(px,            py,            2,      panelH);
    ctx.fillRect(px + panelW-2, py,            2,      panelH);
    ctx.fillStyle = '#6A0816';
    ctx.fillRect(px + 3,        py + 3,        panelW - 6, 1);
    ctx.fillRect(px + 3,        py + panelH-4, panelW - 6, 1);
    ctx.fillRect(px + 3,        py + 3,        1,      panelH - 6);
    ctx.fillRect(px + panelW-4, py + 3,        1,      panelH - 6);

    // Header bar
    ctx.fillStyle = COLORS.UNO_RED;
    ctx.fillRect(px, py, panelW, 18);

    ctx.fillStyle = COLORS.UNO_WHITE;
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(`HOLE ${this.data.holeNumber} COMPLETE!`, CANVAS.WIDTH / 2, py + 4);

    // Hole name
    if (this.data.holeName) {
      ctx.fillStyle = COLORS.HUD_DIM;
      ctx.font = '6px monospace';
      ctx.fillText(`"${this.data.holeName}"`, CANVAS.WIDTH / 2, py + 21);
    }

    // Score rows (revealed one by one)
    const rows = [
      { label: 'PAR',     value: String(this.data.par),     color: COLORS.HUD_TEXT },
      { label: 'STROKES', value: String(this.data.strokes), color: COLORS.HUD_TEXT },
    ];

    const diff       = (this.data.strokes || 0) - (this.data.par || 0);
    const termName   = this._getScoreTerm(this.data.strokes, this.data.par);
    const scoreColor = diff < 0 ? '#7EC882' : diff > 0 ? '#FF6666' : COLORS.GOLD;
    const scoreStr   = diff === 0 ? 'E' : diff > 0 ? `+${diff}` : `${diff}`;
    rows.push({ label: 'SCORE', value: `${scoreStr}  ${termName.toUpperCase()}`, color: scoreColor });

    const totalOver = (this.data.totalStrokes || 0) - (this.data.totalPar || 0);
    const totalCol  = totalOver < 0 ? '#7EC882' : totalOver > 0 ? '#FF6666' : COLORS.HUD_DIM;
    const totalStr  = totalOver === 0 ? 'E' : totalOver > 0 ? `+${totalOver}` : `${totalOver}`;
    rows.push({ label: 'RUNNING TOTAL', value: `${this.data.totalStrokes || 0}  (${totalStr})`, color: totalCol });

    const rowStartY = py + 30;
    const rowH      = 13;
    rows.forEach((row, i) => {
      if (!this.revealed.includes(i)) return;

      const ry = rowStartY + i * rowH;
      // Alternating row tint
      if (i % 2 === 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.04)';
        ctx.fillRect(px + 4, ry, panelW - 8, rowH);
      }
      ctx.fillStyle = COLORS.HUD_DIM;
      ctx.font = '6px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(row.label, px + 8, ry + 3);

      ctx.fillStyle = row.color;
      ctx.font = 'bold 7px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(row.value, px + panelW - 8, ry + 3);
    });

    // BIG score term name (if revealed)
    if (this.revealed.includes(2)) {
      const bigLabel = termName.toUpperCase();
      ctx.fillStyle  = scoreColor;
      ctx.font       = 'bold 14px monospace';
      ctx.textAlign  = 'center';
      // Pulse animation
      const pulse = 1 + Math.sin(this.animTime * 6) * 0.04;
      ctx.save();
      ctx.translate(CANVAS.WIDTH / 2, py + panelH - 28);
      ctx.scale(pulse, pulse);
      ctx.fillText(bigLabel, 0, 0);
      ctx.restore();
    }

    // "PRESS SPACE TO CONTINUE" flashing prompt
    if (this.revealed.length >= 4 && Math.sin(this._promptBlink * 4) > 0) {
      ctx.fillStyle = COLORS.HUD_DIM;
      ctx.font = '6px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('PRESS SPACE TO CONTINUE', CANVAS.WIDTH / 2, py + panelH - 6);
    }

    ctx.textBaseline = 'alphabetic';
    ctx.restore();
  }

  _drawGameScore(ctx) {
    if (!this.data) return;

    // Full-screen overlay
    ctx.fillStyle = '#070710';
    ctx.fillRect(0, 0, CANVAS.WIDTH, CANVAS.HEIGHT);

    // Background texture — subtle pixel grid
    ctx.fillStyle = 'rgba(200,16,46,0.04)';
    for (let gy = 0; gy < CANVAS.HEIGHT; gy += 8) {
      ctx.fillRect(0, gy, CANVAS.WIDTH, 1);
    }

    // ---- Header ----
    ctx.fillStyle = COLORS.UNO_RED;
    ctx.fillRect(0, 0, CANVAS.WIDTH, 20);
    ctx.fillStyle = COLORS.UNO_WHITE;
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('FINAL SCORECARD', CANVAS.WIDTH / 2, 4);

    // UNO branding sub-line
    ctx.fillStyle = 'rgba(245,245,245,0.6)';
    ctx.font = '5px monospace';
    ctx.fillText('ELMWOOD PARK GOLF COURSE — UNIVERSITY OF NEBRASKA OMAHA', CANVAS.WIDTH / 2, 15);

    // ---- Grade box (top-right) ----
    const grade      = this._getGrade(this.data.totalStrokes || 0, this.data.totalPar || 0);
    const gradeColor = GRADE_COLORS[grade] || COLORS.HUD_DIM;
    const gbx = CANVAS.WIDTH - 30;
    const gby = 22;
    ctx.fillStyle = COLORS.HUD_BG;
    ctx.fillRect(gbx, gby, 26, 26);
    ctx.fillStyle = gradeColor;
    ctx.fillRect(gbx,      gby,      26, 2);
    ctx.fillRect(gbx,      gby+24,   26, 2);
    ctx.fillRect(gbx,      gby,      2,  26);
    ctx.fillRect(gbx + 24, gby,      2,  26);
    ctx.fillStyle = gradeColor;
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(grade, gbx + 13, gby + 6);

    ctx.fillStyle = COLORS.HUD_DIM;
    ctx.font = '5px monospace';
    ctx.fillText('GRADE', gbx + 13, gby + 21);

    // ---- Scoreboard table ----
    const tableX   = 4;
    const tableY   = 24;
    const colW     = [14, 70, 16, 18, 18]; // Hole, Name, Par, Str, +/-
    const colLabels = ['#', 'HOLE NAME', 'PAR', 'STR', '+/-'];
    const rowH     = 11;

    // Table header
    ctx.fillStyle = '#1A1A2A';
    ctx.fillRect(tableX, tableY, CANVAS.WIDTH - 8, rowH);
    ctx.fillStyle = COLORS.UNO_RED;
    ctx.fillRect(tableX, tableY + rowH - 1, CANVAS.WIDTH - 8, 1);

    let colX = tableX + 2;
    colLabels.forEach((label, ci) => {
      ctx.fillStyle = COLORS.HUD_DIM;
      ctx.font = '5px monospace';
      ctx.textAlign = ci <= 1 ? 'left' : 'right';
      const cxPos = ci <= 1 ? colX : colX + colW[ci] - 2;
      ctx.fillText(label, cxPos, tableY + 3);
      colX += colW[ci];
    });

    // Table rows
    const scores = this.data.scores || [];
    scores.forEach((row, ri) => {
      if (!this.revealed.includes(ri)) return;

      const ry = tableY + rowH + ri * rowH;
      // Row bg
      ctx.fillStyle = ri % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'transparent';
      ctx.fillRect(tableX, ry, CANVAS.WIDTH - 8, rowH);

      const diff     = (row.strokes || 0) - (row.par || 0);
      const rowColor = diff < -1 ? COLORS.GOLD
                    : diff === -1 ? '#7EC882'
                    : diff === 0  ? COLORS.HUD_TEXT
                    : diff === 1  ? '#FFB347'
                    : '#FF6666';
      const diffStr  = diff === 0 ? 'E' : diff > 0 ? `+${diff}` : `${diff}`;

      const cells = [
        { text: String(row.hole || ri + 1), align: 'left',  color: COLORS.HUD_DIM },
        { text: (row.name || `Hole ${ri + 1}`).substring(0, 16), align: 'left',  color: COLORS.HUD_TEXT },
        { text: String(row.par || 3),       align: 'right', color: COLORS.HUD_DIM },
        { text: String(row.strokes || 0),   align: 'right', color: rowColor },
        { text: diffStr,                    align: 'right', color: rowColor },
      ];

      colX = tableX + 2;
      cells.forEach((cell, ci) => {
        ctx.fillStyle = cell.color;
        ctx.font = ci === 1 ? '5px monospace' : '6px monospace';
        ctx.textAlign = cell.align;
        const cxPos = cell.align === 'left' ? colX : colX + colW[ci] - 2;
        ctx.fillText(cell.text, cxPos, ry + 3);
        colX += colW[ci];
      });
    });

    // ---- Total row ----
    if (this.revealed.includes(scores.length)) {
      const totalY = tableY + rowH + scores.length * rowH;
      ctx.fillStyle = COLORS.UNO_RED;
      ctx.fillRect(tableX, totalY - 1, CANVAS.WIDTH - 8, 1);
      ctx.fillStyle = '#1A0A10';
      ctx.fillRect(tableX, totalY, CANVAS.WIDTH - 8, rowH + 1);

      const overPar   = (this.data.totalStrokes || 0) - (this.data.totalPar || 0);
      const totalColor = overPar < 0 ? '#7EC882' : overPar > 0 ? '#FF6666' : COLORS.GOLD;
      const totalDiff  = overPar === 0 ? 'E' : overPar > 0 ? `+${overPar}` : `${overPar}`;

      ctx.fillStyle = COLORS.UNO_WHITE;
      ctx.font = 'bold 7px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('TOTAL', tableX + 16, totalY + 3);

      ctx.fillStyle = totalColor;
      ctx.textAlign = 'right';
      ctx.fillText(`${this.data.totalStrokes || 0}   ${totalDiff}`, CANVAS.WIDTH - 10, totalY + 3);
    }

    // ---- Congratulatory message ----
    if (this.revealed.length >= scores.length + 1) {
      const grade  = this._getGrade(this.data.totalStrokes || 0, this.data.totalPar || 0);
      const congrats = {
        S: 'LEGENDARY! ALL-AMERICAN GOLFER!',
        A: 'EXCELLENT ROUND, MAVERICK!',
        B: 'SOLID GAME AT ELMWOOD PARK!',
        C: 'RESPECTABLE EFFORT!',
        D: 'KEEP PRACTICING, COWBOY!',
      };
      const msg = congrats[grade] || 'ROUND COMPLETE!';
      ctx.fillStyle = gradeColor;
      ctx.font = 'bold 7px monospace';
      ctx.textAlign = 'center';
      const msgY = tableY + rowH * (scores.length + 2) + 10;
      if (msgY < CANVAS.HEIGHT - 12) {
        ctx.fillText(msg, CANVAS.WIDTH / 2, msgY);
      }
    }

    // ---- Prompt ----
    if (Math.sin(this._promptBlink * 4) > 0) {
      ctx.fillStyle = COLORS.HUD_DIM;
      ctx.font = '6px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('PRESS SPACE TO CONTINUE', CANVAS.WIDTH / 2, CANVAS.HEIGHT - 4);
    }

    ctx.textBaseline = 'alphabetic';
  }

  _getScoreTerm(strokes, par) {
    const diff = strokes - par;
    return SCORE_NAMES[String(diff)] || (diff > 0 ? `+${diff}` : `${diff}`);
  }

  _getGrade(totalStrokes, totalPar) {
    const overPar = totalStrokes - totalPar;
    for (const { label, maxOverPar } of GRADE_THRESHOLDS) {
      if (overPar <= maxOverPar) return label;
    }
    return 'D';
  }
}
