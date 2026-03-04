// ============================================================
// Maverick Mini Golf — Wind.js
// Manages wind direction & strength, smooth transitions,
// and the pixel-art weathervane HUD widget.
// ============================================================

import { WIND, COLORS } from '../Constants.js';

export class Wind {
  /**
   * @param {'normal' | 'blizzard'} mode  Game mode determines max wind strength
   */
  constructor(mode) {
    this.angle = 0;          // current angle (radians) — direction wind blows TOWARD
    this.strength = 0;       // current strength 0..1
    this.vx = 0;             // cached X component (used by Ball.update)
    this.vy = 0;             // cached Y component
    this.mode = mode;
    this.shotsUntilChange = WIND.CHANGE_INTERVAL;
    this.animPhase = 0;      // 0..2π for weathervane needle sway animation
    this.targetAngle = 0;
    this.targetStrength = 0;
    this.transitioning = false;

    this.randomize();

    // Snap to initial values so first frame has correct wind
    this.angle = this.targetAngle;
    this.strength = this.targetStrength;
    this._updateComponents();
    this.transitioning = false;
  }

  // ----------------------------------------------------------------
  // Randomise target wind
  // ----------------------------------------------------------------

  /** Pick a new random target direction and strength, begin lerp transition. */
  randomize() {
    this.targetAngle = Math.random() * Math.PI * 2;
    const maxStrength = this.mode === 'blizzard' ? WIND.BLIZZARD_MAX : WIND.NORMAL_MAX;
    this.targetStrength = WIND.MIN_STRENGTH + Math.random() * maxStrength;
    this.transitioning = true;
  }

  // ----------------------------------------------------------------
  // Shot hook
  // ----------------------------------------------------------------

  /** Call after each shot is taken. Decrements counter and maybe randomises. */
  onShot() {
    this.shotsUntilChange--;
    if (this.shotsUntilChange <= 0) {
      this.randomize();
      this.shotsUntilChange = WIND.CHANGE_INTERVAL;
    }
  }

  // ----------------------------------------------------------------
  // Update (call every frame)
  // ----------------------------------------------------------------

  /**
   * Smoothly interpolate angle and strength toward targets.
   * Updates this.vx and this.vy for use by Ball.update().
   * @param {number} dt  Delta time in seconds
   */
  update(dt) {
    const LERP = 0.05; // smooth transition factor per frame (frame-rate dependent but stable for 60fps)

    // Lerp strength
    this.strength += (this.targetStrength - this.strength) * LERP;

    // Lerp angle through shortest arc to avoid spinning the wrong way
    let angleDiff = this.targetAngle - this.angle;
    // Wrap to [-π, π]
    while (angleDiff >  Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    this.angle += angleDiff * LERP;

    // Snap when close enough
    if (
      Math.abs(this.targetStrength - this.strength) < 0.001 &&
      Math.abs(angleDiff) < 0.001
    ) {
      this.strength = this.targetStrength;
      this.angle = this.targetAngle;
      this.transitioning = false;
    }

    // Needle sway animation
    this.animPhase = (this.animPhase + dt * 2.5) % (Math.PI * 2);

    this._updateComponents();
  }

  // ----------------------------------------------------------------
  // Internal helpers
  // ----------------------------------------------------------------

  /** Recompute vx/vy from angle and strength. */
  _updateComponents() {
    this.vx = Math.cos(this.angle) * this.strength;
    this.vy = Math.sin(this.angle) * this.strength;
  }

  // ----------------------------------------------------------------
  // Rendering
  // ----------------------------------------------------------------

  /**
   * Draw the weathervane HUD widget (compass + arrow + gust indicators).
   * Pixel-art style with UNO red/black colour scheme.
   *
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} x     Centre X of the widget
   * @param {number} y     Centre Y of the widget
   * @param {number} size  Radius of the compass rose (widget width ≈ size*2 + padding)
   */
  draw(ctx, x, y, size) {
    ctx.save();
    ctx.imageSmoothingEnabled = false;

    const pad = 4;
    const panelW = size * 2 + pad * 4 + 16; // extra room for gust pips
    const panelH = size * 2 + pad * 4 + 14; // extra room for label
    const panelX = Math.round(x - panelW / 2);
    const panelY = Math.round(y - panelH / 2 - 2);

    // ---- Background panel ----
    ctx.fillStyle = COLORS.HUD_BG;
    ctx.fillRect(panelX, panelY, panelW, panelH);

    // UNO_RED border
    ctx.strokeStyle = COLORS.HUD_BORDER;
    ctx.lineWidth = 1;
    ctx.strokeRect(panelX + 0.5, panelY + 0.5, panelW - 1, panelH - 1);

    // ---- "WIND" label ----
    ctx.fillStyle = COLORS.HUD_TEXT;
    ctx.font = '4px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('WIND', x, panelY + 7);

    // ---- Compass rose ----
    const cx = Math.round(x);
    const cy = Math.round(panelY + 10 + size);

    // Outer compass circle
    ctx.beginPath();
    ctx.arc(cx, cy, size, 0, Math.PI * 2);
    ctx.strokeStyle = COLORS.HUD_DIM;
    ctx.lineWidth = 0.75;
    ctx.stroke();

    // 8 directional tick marks
    const cardinals = ['N', 'E', 'S', 'W'];
    for (let i = 0; i < 8; i++) {
      const tickAngle = (i * Math.PI) / 4;
      const isCardinal = i % 2 === 0;
      const innerR = isCardinal ? size - 3 : size - 2;
      const outerR = size;

      const tx1 = cx + Math.cos(tickAngle) * innerR;
      const ty1 = cy + Math.sin(tickAngle) * innerR;
      const tx2 = cx + Math.cos(tickAngle) * outerR;
      const ty2 = cy + Math.sin(tickAngle) * outerR;

      ctx.beginPath();
      ctx.moveTo(tx1, ty1);
      ctx.lineTo(tx2, ty2);
      ctx.strokeStyle = isCardinal ? COLORS.HUD_TEXT : COLORS.HUD_DIM;
      ctx.lineWidth = isCardinal ? 1 : 0.5;
      ctx.stroke();
    }

    // Cardinal letters (pixel-art tiny font at size=1)
    const cardinalPositions = [
      { label: 'N', angle: -Math.PI / 2 },
      { label: 'E', angle: 0 },
      { label: 'S', angle: Math.PI / 2 },
      { label: 'W', angle: Math.PI },
    ];

    ctx.font = '3px monospace';
    ctx.fillStyle = COLORS.HUD_DIM;
    for (const { label, angle } of cardinalPositions) {
      const lx = cx + Math.cos(angle) * (size - 5);
      const ly = cy + Math.sin(angle) * (size - 5) + 1;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, lx, ly);
    }

    // ---- Wind arrow ----
    // Slight sway animation based on animPhase (±2°)
    const sway = Math.sin(this.animPhase) * 0.035;
    const arrowAngle = this.angle + sway;
    const arrowLen = (size - 4) * Math.max(0.2, this.strength);

    const arrowEndX = cx + Math.cos(arrowAngle) * arrowLen;
    const arrowEndY = cy + Math.sin(arrowAngle) * arrowLen;
    const arrowTailX = cx - Math.cos(arrowAngle) * (arrowLen * 0.4);
    const arrowTailY = cy - Math.sin(arrowAngle) * (arrowLen * 0.4);

    // Arrow shaft
    ctx.beginPath();
    ctx.moveTo(arrowTailX, arrowTailY);
    ctx.lineTo(arrowEndX, arrowEndY);
    ctx.strokeStyle = COLORS.UNO_RED;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Arrowhead (filled triangle)
    const headLen = 3;
    const headWidth = 1.5;
    const perpX = -Math.sin(arrowAngle);
    const perpY =  Math.cos(arrowAngle);
    const backX = arrowEndX - Math.cos(arrowAngle) * headLen;
    const backY = arrowEndY - Math.sin(arrowAngle) * headLen;

    ctx.beginPath();
    ctx.moveTo(arrowEndX, arrowEndY);
    ctx.lineTo(backX + perpX * headWidth, backY + perpY * headWidth);
    ctx.lineTo(backX - perpX * headWidth, backY - perpY * headWidth);
    ctx.closePath();
    ctx.fillStyle = COLORS.UNO_RED;
    ctx.fill();

    // Centre pivot dot
    ctx.beginPath();
    ctx.arc(cx, cy, 1.5, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.HUD_TEXT;
    ctx.fill();

    // ---- Gust strength pips (1-3 arrows on the side) ----
    const numPips = Math.ceil(this.strength * 3);
    const pipStartX = panelX + panelW - pad - 3;
    const pipStartY = cy - 4;

    for (let i = 0; i < 3; i++) {
      const pipY = pipStartY + i * 5;
      const active = i < numPips;
      ctx.strokeStyle = active ? COLORS.UNO_RED : COLORS.HUD_DIM;
      ctx.lineWidth = active ? 1 : 0.5;

      // Small right-pointing chevron
      ctx.beginPath();
      ctx.moveTo(pipStartX - 2, pipY - 1);
      ctx.lineTo(pipStartX,     pipY);
      ctx.lineTo(pipStartX - 2, pipY + 1);
      ctx.stroke();
    }

    // ---- "CALM" label when strength is very low ----
    if (this.strength < 0.05) {
      ctx.fillStyle = COLORS.HUD_DIM;
      ctx.font = '3px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('CALM', cx, cy);
    }

    ctx.restore();
  }
}
