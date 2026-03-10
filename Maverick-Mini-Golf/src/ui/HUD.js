import { COLORS, CANVAS, POWERUP } from '../Constants.js';

// Icon letters for each powerup type
const POWERUP_ICONS = {
  [POWERUP.COWBOY_HAT]: 'H',
  [POWERUP.GOLD_STAR]:  '*',
  [POWERUP.LASSO]:      'L',
  [POWERUP.SNOWFLAKE]:  'S',
  [POWERUP.WHIRLWIND]:  'W',
};

const POWERUP_COLORS = {
  [POWERUP.COWBOY_HAT]: '#CD853F',
  [POWERUP.GOLD_STAR]:  '#FFD700',
  [POWERUP.LASSO]:      '#C8A84B',
  [POWERUP.SNOWFLAKE]:  '#A8D8EA',
  [POWERUP.WHIRLWIND]:  '#7EC882',
};

export class HUD {
  constructor() {
    this.activeMessage    = null;
    this.messageTimer     = 0;
    this.trickShotShowing = false;
    this.trickShotTimer   = 0;
    this.holeInOneShowing = false;
    this.holeInOneTimer   = 0;
    this.scorePopups      = []; // { text, x, y, age, maxAge, color }
    this.goalHornTimer    = 0;
    this._animTime        = 0;
  }

  // Show a temporary centered message
  showMessage(text, duration = 2.0, color = COLORS.UNO_RED) {
    this.activeMessage = { text, color };
    this.messageTimer  = duration;
  }

  showTrickShot()  { this.trickShotShowing = true; this.trickShotTimer = 2.5; }
  showHoleInOne()  { this.holeInOneShowing = true; this.holeInOneTimer = 5.0; }
  showGoalHorn()   { this.goalHornTimer = 1.5; }

  addScorePopup(text, x, y, color = COLORS.UNO_WHITE) {
    this.scorePopups.push({ text, x, y, age: 0, maxAge: 2.0, color });
  }

  update(dt) {
    this._animTime += dt;

    if (this.messageTimer > 0) {
      this.messageTimer -= dt;
      if (this.messageTimer <= 0) this.activeMessage = null;
    }
    if (this.trickShotTimer > 0) {
      this.trickShotTimer -= dt;
      if (this.trickShotTimer <= 0) this.trickShotShowing = false;
    }
    if (this.goalHornTimer > 0) this.goalHornTimer -= dt;
    if (this.holeInOneTimer > 0) {
      this.holeInOneTimer -= dt;
      if (this.holeInOneTimer <= 0) this.holeInOneShowing = false;
    }

    this.scorePopups = this.scorePopups.filter(p => {
      p.age += dt;
      p.y   -= 15 * dt; // float upward
      return p.age < p.maxAge;
    });
  }

  // Draw the full HUD overlay
  // gameState: { holeNumber, par, strokes, totalStrokes, totalPar, mode, activePowerups: [] }
  // wind: { angle, strength }
  draw(ctx, gameState, wind) {
    this._drawTopBar(ctx, gameState);
    this._drawWindIndicator(ctx, wind);
    this._drawStrokeInfo(ctx, gameState);
    this._drawPowerupList(ctx, gameState.activePowerups || []);
    this._drawMessage(ctx);
    this._drawTrickShot(ctx);
    this._drawScorePopups(ctx);
    if (this.goalHornTimer > 0) this._drawGoalHorn(ctx);
    if (this.holeInOneShowing) this._drawHoleInOne(ctx);
  }

  _drawTopBar(ctx, state) {
    // Semi-transparent dark bar across top
    ctx.fillStyle = COLORS.HUD_BG;
    ctx.fillRect(0, 0, CANVAS.WIDTH, 18);

    // Bottom border line in UNO red
    ctx.fillStyle = COLORS.UNO_RED;
    ctx.fillRect(0, 17, CANVAS.WIDTH, 1);

    // Top-left: "HOLE X"
    ctx.fillStyle = COLORS.UNO_RED;
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`HOLE ${state.holeNumber || 1}`, 4, 2);

    // Par below HOLE
    ctx.fillStyle = COLORS.HUD_DIM;
    ctx.font = '6px monospace';
    ctx.fillText(`PAR ${state.par || 3}`, 4, 11);

    // Center: Hole name if available
    if (state.holeName) {
      ctx.fillStyle = COLORS.HUD_DIM;
      ctx.font = '6px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(state.holeName.toUpperCase(), CANVAS.WIDTH / 2, 6);
    }

    // Top-right: Mode badge
    if (state.mode === 'blizzard') {
      ctx.fillStyle = '#AED6F1';
      ctx.font = '6px monospace';
      ctx.textAlign = 'right';
      ctx.fillText('BLIZZARD', CANVAS.WIDTH - 4, 11);
    }

    // Top-right: Total score vs par
    const overPar    = (state.totalStrokes || 0) - (state.totalPar || 0);
    const scoreColor = overPar < 0 ? '#7EC882' : overPar > 0 ? '#FF6666' : COLORS.HUD_TEXT;
    const scoreStr   = overPar === 0 ? 'E' : overPar > 0 ? `+${overPar}` : `${overPar}`;
    ctx.fillStyle    = scoreColor;
    ctx.font         = 'bold 8px monospace';
    ctx.textAlign    = 'right';
    ctx.fillText(scoreStr, CANVAS.WIDTH - 4, 2);

    ctx.textBaseline = 'alphabetic';
  }

  _drawWindIndicator(ctx, wind) {
    if (!wind) return;

    const bx = 6;
    const by = CANVAS.HEIGHT - 28;
    const r  = 10;

    // Background circle
    ctx.fillStyle = COLORS.HUD_BG;
    ctx.beginPath();
    ctx.arc(bx + r, by + r, r + 2, 0, Math.PI * 2);
    ctx.fill();

    // Border
    ctx.fillStyle = COLORS.UNO_RED;
    // Draw circle border as ring of small rects (pixel-art style)
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) {
      const bpx = Math.round(bx + r + Math.cos(a) * (r + 1));
      const bpy = Math.round(by + r + Math.sin(a) * (r + 1));
      ctx.fillRect(bpx, bpy, 1, 1);
    }

    // Cardinal directions — tiny dots
    ctx.fillStyle = COLORS.HUD_DIM;
    ctx.fillRect(bx + r - 1, by,          2, 1); // N
    ctx.fillRect(bx + r - 1, by + r*2,    2, 1); // S
    ctx.fillRect(bx,         by + r - 1,  1, 2); // W
    ctx.fillRect(bx + r*2,   by + r - 1,  1, 2); // E

    const strength = wind.strength || 0;
    const angle    = wind.angle    || 0;

    if (strength < 0.01) {
      // Calm — just draw a dot
      ctx.fillStyle = COLORS.HUD_DIM;
      ctx.fillRect(bx + r - 1, by + r - 1, 2, 2);
      ctx.fillStyle = COLORS.HUD_DIM;
      ctx.font = '5px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('CALM', bx + r, by + r * 2 + 8);
      return;
    }

    // Arrow in wind direction (angle = direction wind is COMING FROM, so arrow points opposite)
    const arrowAngle = angle + Math.PI;
    const arrowLen   = Math.round(6 + strength * 4);
    const ax         = bx + r + Math.cos(arrowAngle) * arrowLen;
    const ay         = by + r + Math.sin(arrowAngle) * arrowLen;

    // Draw shaft as pixel line via rects
    const steps = arrowLen;
    ctx.fillStyle = strength > 0.7 ? COLORS.UNO_RED : strength > 0.35 ? '#FF9900' : '#FFFFFF';
    for (let i = 0; i <= steps; i++) {
      const t  = i / steps;
      const px = Math.round(bx + r + Math.cos(arrowAngle) * (i));
      const py = Math.round(by + r + Math.sin(arrowAngle) * (i));
      ctx.fillRect(px, py, 1, 1);
    }
    // Arrowhead
    const hx = Math.round(ax);
    const hy = Math.round(ay);
    ctx.fillRect(hx, hy, 2, 2);
    ctx.fillRect(hx + Math.round(Math.cos(arrowAngle + Math.PI * 0.75)),
                 hy + Math.round(Math.sin(arrowAngle + Math.PI * 0.75)), 2, 2);
    ctx.fillRect(hx + Math.round(Math.cos(arrowAngle - Math.PI * 0.75)),
                 hy + Math.round(Math.sin(arrowAngle - Math.PI * 0.75)), 2, 2);

    // Gust icons below compass (1-3 based on strength)
    const gusts = strength < 0.34 ? 1 : strength < 0.67 ? 2 : 3;
    ctx.fillStyle = COLORS.HUD_DIM;
    ctx.font = '5px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('~'.repeat(gusts), bx + r, by + r * 2 + 8);

    ctx.textAlign = 'left';
  }

  _drawStrokeInfo(ctx, state) {
    // Bottom-right panel
    const panelW = 52;
    const panelH = 22;
    const px     = CANVAS.WIDTH - panelW - 2;
    const py     = CANVAS.HEIGHT - panelH - 2;

    ctx.fillStyle = COLORS.HUD_BG;
    ctx.fillRect(px, py, panelW, panelH);
    ctx.fillStyle = COLORS.UNO_RED;
    ctx.fillRect(px, py, panelW, 1);
    ctx.fillRect(px, py, 1, panelH);

    // Current strokes
    ctx.fillStyle = COLORS.HUD_TEXT;
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`STROKE ${state.strokes || 0}`, px + 3, py + 2);

    // Running total vs par with color
    const overPar = (state.totalStrokes || 0) - (state.totalPar || 0);
    const col     = overPar < 0 ? '#7EC882' : overPar > 0 ? '#FF6666' : COLORS.HUD_DIM;
    const label   = overPar === 0 ? 'E (par)' : overPar > 0 ? `+${overPar} over` : `${overPar} under`;
    ctx.fillStyle = col;
    ctx.font = '6px monospace';
    ctx.fillText(label, px + 3, py + 13);

    ctx.textBaseline = 'alphabetic';
  }

  _drawPowerupList(ctx, powerups) {
    if (!powerups || powerups.length === 0) return;

    const iconW  = 12;
    const iconH  = 12;
    const gap    = 3;
    const totalW = powerups.length * (iconW + gap) - gap;
    const startX = (CANVAS.WIDTH - totalW) / 2;
    const iconY  = CANVAS.HEIGHT - iconH - 4;

    powerups.forEach((pu, i) => {
      const ix    = startX + i * (iconW + gap);
      const color = POWERUP_COLORS[pu] || '#888888';
      const icon  = POWERUP_ICONS[pu]  || '?';

      // Background square
      ctx.fillStyle = COLORS.HUD_BG;
      ctx.fillRect(ix, iconY, iconW, iconH);
      // Colored border
      ctx.fillStyle = color;
      ctx.fillRect(ix,           iconY,          iconW, 1);
      ctx.fillRect(ix,           iconY + iconH-1, iconW, 1);
      ctx.fillRect(ix,           iconY,           1,    iconH);
      ctx.fillRect(ix + iconW-1, iconY,           1,    iconH);
      // Icon letter
      ctx.fillStyle = color;
      ctx.font = 'bold 7px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(icon, ix + iconW / 2, iconY + iconH / 2 + 0.5);
    });

    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';
  }

  _drawMessage(ctx) {
    if (!this.activeMessage) return;

    const progress = 1 - Math.max(0, this.messageTimer - (this.messageTimer > 0 ? 0 : 0));
    const pulse    = 1 + Math.sin(this._animTime * 8) * 0.04;

    const text    = this.activeMessage.text;
    const panelW  = Math.min(Math.max(text.length * 7 + 20, 80), CANVAS.WIDTH - 20);
    const panelH  = 20;
    const px      = (CANVAS.WIDTH  - panelW) / 2;
    const py      = (CANVAS.HEIGHT - panelH) / 2;

    // Fade alpha based on remaining time
    const alpha = this.messageTimer < 0.4
      ? Math.max(0, this.messageTimer / 0.4)
      : 1;

    ctx.globalAlpha = alpha;

    // Background panel
    ctx.fillStyle = COLORS.HUD_BG;
    ctx.fillRect(px, py, panelW, panelH);

    // Border in message color
    const borderColor = this.activeMessage.color;
    ctx.fillStyle = borderColor;
    ctx.fillRect(px,           py,            panelW, 2);
    ctx.fillRect(px,           py + panelH-2, panelW, 2);
    ctx.fillRect(px,           py,            2,      panelH);
    ctx.fillRect(px + panelW-2, py,           2,      panelH);

    // Message text
    ctx.fillStyle = COLORS.HUD_TEXT;
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, CANVAS.WIDTH / 2, py + panelH / 2 + 1);

    ctx.globalAlpha = 1;
    ctx.textBaseline = 'alphabetic';
  }

  _drawTrickShot(ctx) {
    if (!this.trickShotShowing) return;

    // Progress through animation (0..1..fade)
    const t     = 2.5 - this.trickShotTimer; // elapsed since shown
    const slideIn = Math.min(1, t / 0.3);    // 0..1 over first 0.3s
    const fadeOut = this.trickShotTimer < 0.5
      ? Math.max(0, this.trickShotTimer / 0.5)
      : 1;

    const bannerW = 140;
    const bannerH = 16;
    const bx      = (CANVAS.WIDTH - bannerW) / 2;
    const startY  = -bannerH;
    const endY    = 22;
    const by      = startY + (endY - startY) * slideIn;

    const pulse = 1 + Math.sin(this._animTime * 10) * 0.03;

    ctx.globalAlpha = fadeOut;

    // Gold background panel
    ctx.fillStyle = COLORS.TRICK_SHOT;
    ctx.fillRect(bx, by, bannerW, bannerH);

    // Dark border
    ctx.fillStyle = COLORS.UNO_BLACK;
    ctx.fillRect(bx,             by,             bannerW, 2);
    ctx.fillRect(bx,             by + bannerH-2, bannerW, 2);
    ctx.fillRect(bx,             by,             2,       bannerH);
    ctx.fillRect(bx + bannerW-2, by,             2,       bannerH);

    // Text
    ctx.fillStyle = COLORS.UNO_BLACK;
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('TRICK SHOT!', CANVAS.WIDTH / 2, by + bannerH / 2 + 1);

    // Stars on either side
    ctx.fillStyle = COLORS.UNO_RED;
    ctx.fillRect(bx + 4,          by + 4,           3, 3);
    ctx.fillRect(bx + bannerW-7,  by + 4,           3, 3);
    ctx.fillRect(bx + 8,          by + 9,           2, 2);
    ctx.fillRect(bx + bannerW-10, by + 9,           2, 2);

    ctx.globalAlpha = 1;
    ctx.textBaseline = 'alphabetic';
  }

  _drawScorePopups(ctx) {
    this.scorePopups.forEach(p => {
      const alpha = Math.max(0, 1 - p.age / p.maxAge);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.text, p.x, p.y);
    });
    ctx.globalAlpha = 1;
    ctx.textBaseline = 'alphabetic';
  }

  _drawGoalHorn(ctx) {
    // Brief "GOAL HORN" flash across top — UNO spirit
    const alpha = Math.min(1, this.goalHornTimer / 0.3);
    ctx.globalAlpha = alpha * 0.85;
    ctx.fillStyle = COLORS.UNO_RED;
    ctx.fillRect(0, 18, CANVAS.WIDTH, 14);
    ctx.fillStyle = COLORS.UNO_WHITE;
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('GOAL HORN!', CANVAS.WIDTH / 2, 25);
    ctx.globalAlpha = 1;
    ctx.textBaseline = 'alphabetic';
  }

  _drawHoleInOne(ctx) {
    // "HOLE IN ONE!" — fades out after 5 seconds
    const alpha = this.holeInOneTimer < 0.8 ? Math.max(0, this.holeInOneTimer / 0.8) : 1;
    ctx.globalAlpha = alpha;
    const pulse = 1 + Math.sin(this._animTime * 6) * 0.05;
    const bw    = 160;
    const bh    = 24;
    const bx    = (CANVAS.WIDTH  - bw) / 2;
    const by    = (CANVAS.HEIGHT - bh) / 2 - 20;

    // Outer glow
    ctx.fillStyle = 'rgba(255,215,0,0.25)';
    ctx.fillRect(bx - 4, by - 4, bw + 8, bh + 8);

    // Panel
    ctx.fillStyle = COLORS.UNO_BLACK;
    ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = COLORS.GOLD;
    ctx.fillRect(bx,        by,        bw, 2);
    ctx.fillRect(bx,        by+bh-2,   bw, 2);
    ctx.fillRect(bx,        by,        2,  bh);
    ctx.fillRect(bx+bw-2,   by,        2,  bh);

    ctx.fillStyle = COLORS.GOLD;
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('HOLE IN ONE!!!', CANVAS.WIDTH / 2, by + bh / 2 + 1);
    ctx.globalAlpha = 1;
    ctx.textBaseline = 'alphabetic';
  }
}
