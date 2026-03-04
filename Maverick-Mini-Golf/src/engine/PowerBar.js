// ============================================================
// Maverick Mini Golf — PowerBar.js
// Controls the shot power charging and renders the HUD bar.
// ============================================================

import { POWER_BAR, COLORS, CANVAS } from '../Constants.js';

export class PowerBar {
  constructor() {
    this.value = 0;           // current power 0..1
    this.filling = false;     // true while player holds the shoot key
    this.released = false;    // true for ONE frame when shot is released
    this._pendingLaunch = false;
    this.launchPower = 0;     // power captured at release moment
  }

  // ----------------------------------------------------------------
  // Control API
  // ----------------------------------------------------------------

  /** Begin charging from zero. Call when player presses shoot key. */
  startFill() {
    this.filling = true;
    this.value = 0;
    this.released = false;
    this._pendingLaunch = false;
    this.launchPower = 0;
  }

  /**
   * Advance the power value each frame.
   * @param {number} dt  Delta time in seconds
   * @returns {number | null}  Launch power if released this frame, else null
   */
  update(dt) {
    if (this.filling) {
      this.value = Math.min(1.0, this.value + POWER_BAR.FILL_RATE * dt);
    }
    return null; // Launch power is consumed via consume()
  }

  /**
   * Release the charge. Call when player lets go of shoot key.
   * Sets released = true for exactly one frame so consume() can pick it up.
   */
  release() {
    if (!this.filling) return;
    this.filling = false;
    this.released = true;
    this.launchPower = Math.max(this.value, POWER_BAR.MIN_LAUNCH);
    this.value = 0;
  }

  /**
   * Consume the pending launch power (returns the value, then clears it).
   * Should be called once per frame by game logic.
   * @returns {number | null}
   */
  consume() {
    if (this.released) {
      this.released = false;
      return this.launchPower;
    }
    return null;
  }

  // ----------------------------------------------------------------
  // Rendering
  // ----------------------------------------------------------------

  /**
   * Draw the power bar HUD at the bottom-centre of the canvas.
   * @param {CanvasRenderingContext2D} ctx
   */
  draw(ctx) {
    if (!this.filling && this.value === 0 && !this.released) return;

    ctx.save();
    ctx.imageSmoothingEnabled = false;

    // ---- Layout ----
    const barW = 80;
    const barH = 8;
    const barX = Math.round((CANVAS.WIDTH - barW) / 2);
    const barY = CANVAS.HEIGHT - 18;
    const pad = 2;

    // ---- Background panel ----
    const panelX = barX - pad - 12; // extra space for "POWER" label on left
    const panelY = barY - pad - 6;
    const panelW = barW + pad * 2 + 12;
    const panelH = barH + pad * 2 + 12;

    ctx.fillStyle = COLORS.HUD_BG;
    ctx.fillRect(panelX, panelY, panelW, panelH);
    ctx.strokeStyle = COLORS.HUD_BORDER;
    ctx.lineWidth = 1;
    ctx.strokeRect(panelX + 0.5, panelY + 0.5, panelW - 1, panelH - 1);

    // ---- "POWER" label ----
    ctx.fillStyle = COLORS.HUD_TEXT;
    ctx.font = '4px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('POWER', panelX + pad + 1, panelY + pad + 1);

    // ---- Bar trough ----
    ctx.fillStyle = COLORS.POWER_BAR_BG;
    ctx.fillRect(barX, barY, barW, barH);

    // ---- Filled portion — colour shifts with power level ----
    const fillW = Math.round(barW * this.value);
    if (fillW > 0) {
      const fillColor = this._fillColor(this.value);
      ctx.fillStyle = fillColor;
      ctx.fillRect(barX, barY, fillW, barH);

      // Pulsing highlight at top of filled bar
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.fillRect(barX, barY, fillW, Math.ceil(barH * 0.35));
    }

    // ---- Segment tick marks every 25% ----
    for (let i = 1; i < 4; i++) {
      const tx = barX + Math.round(barW * (i / 4));
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(tx, barY, 1, barH);
    }

    // ---- Bar border ----
    ctx.strokeStyle = COLORS.UNO_BLACK;
    ctx.lineWidth = 1;
    ctx.strokeRect(barX - 0.5, barY - 0.5, barW + 1, barH + 1);

    // ---- Percentage label ----
    const pct = Math.round(this.value * 100);
    ctx.fillStyle = COLORS.HUD_TEXT;
    ctx.font = '4px monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText(`${pct}%`, panelX + panelW - pad - 1, panelY + pad + 1);

    // ---- "MAX!" flash when full ----
    if (this.value >= 1.0) {
      ctx.fillStyle = COLORS.POWER_BAR_MAX;
      ctx.font = '5px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('MAX!', barX + barW / 2, barY + barH / 2);
    }

    ctx.restore();
  }

  // ----------------------------------------------------------------
  // Internal helpers
  // ----------------------------------------------------------------

  /**
   * Returns the fill colour for the given power level.
   * green (0) → UNO_RED (0.4) → orange (0.7) → yellow (1.0)
   * @param {number} power  0..1
   * @returns {string}
   */
  _fillColor(power) {
    if (power < 0.4) {
      // Green → UNO_RED
      return this._lerpColor('#22BB44', COLORS.POWER_BAR_FILL, power / 0.4);
    } else if (power < 0.75) {
      // UNO_RED → orange
      return this._lerpColor(COLORS.POWER_BAR_FILL, COLORS.POWER_BAR_WARN, (power - 0.4) / 0.35);
    } else {
      // Orange → yellow (max)
      return this._lerpColor(COLORS.POWER_BAR_WARN, COLORS.POWER_BAR_MAX, (power - 0.75) / 0.25);
    }
  }

  /**
   * Linear interpolate between two hex colour strings.
   * @param {string} a  Hex color e.g. '#FF0000'
   * @param {string} b  Hex color e.g. '#00FF00'
   * @param {number} t  0..1
   * @returns {string}
   */
  _lerpColor(a, b, t) {
    const parse = hex => {
      const c = hex.replace('#', '');
      return [
        parseInt(c.substring(0, 2), 16),
        parseInt(c.substring(2, 4), 16),
        parseInt(c.substring(4, 6), 16),
      ];
    };
    const [r1, g1, b1] = parse(a);
    const [r2, g2, b2] = parse(b);
    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b_ = Math.round(b1 + (b2 - b1) * t);
    return `rgb(${r},${g},${b_})`;
  }
}
