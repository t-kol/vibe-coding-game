// ============================================================
// Maverick Mini Golf — PowerUp.js
// A collectible power-up pickup floating on the course.
// Collected when the ball rolls through it.
// ============================================================

import { COLORS, POWERUP, PHYSICS } from '../Constants.js';

// Icon letters / symbols per powerup type
const ICONS = {
  [POWERUP.COWBOY_HAT]: 'H',
  [POWERUP.GOLD_STAR]:  '*',
  [POWERUP.LASSO]:      'L',
  [POWERUP.SNOWFLAKE]:  'S',
  [POWERUP.WHIRLWIND]:  'W',
};

// Glow color per powerup type
const GLOW_COLORS = {
  [POWERUP.COWBOY_HAT]: '#CD853F',
  [POWERUP.GOLD_STAR]:  '#FFD700',
  [POWERUP.LASSO]:      '#C8A84B',
  [POWERUP.SNOWFLAKE]:  '#A8D8EA',
  [POWERUP.WHIRLWIND]:  '#88FF88',
};

// Inner icon fill color
const ICON_COLORS = {
  [POWERUP.COWBOY_HAT]: '#CD853F',
  [POWERUP.GOLD_STAR]:  '#FFD700',
  [POWERUP.LASSO]:      '#C8A84B',
  [POWERUP.SNOWFLAKE]:  '#D4EEF7',
  [POWERUP.WHIRLWIND]:  '#7EC882',
};

const COLLECT_RADIUS = 7; // game pixels — ball center must be within this distance

export class PowerUp {
  /**
   * @param {object} cfg
   * @param {string} cfg.type  POWERUP constant key
   * @param {number} cfg.x     Center X (game pixels)
   * @param {number} cfg.y     Center Y (game pixels)
   */
  constructor(cfg) {
    this.type      = cfg.type;
    this.x         = cfg.x;
    this.y         = cfg.y;
    this.collected = false;

    this._animTime   = 0;
    this._bobPhase   = Math.random() * Math.PI * 2; // stagger bob
    this._spinPhase  = 0;
    this._collectAnim = 0; // 0..1 — burst animation on collect
  }

  // ----------------------------------------------------------------
  // Update
  // ----------------------------------------------------------------

  update(dt) {
    if (this.collected) {
      // Short collect burst animation (shrinks and fades)
      this._collectAnim = Math.min(1, this._collectAnim + dt * 4);
      return;
    }

    this._animTime  += dt;
    this._spinPhase  = (this._spinPhase + dt * 2.5) % (Math.PI * 2);
  }

  // ----------------------------------------------------------------
  // Collection check
  // ----------------------------------------------------------------

  /**
   * Test whether the ball has touched this power-up.
   * Marks it as collected and returns true on first contact.
   * @param {{ x: number, y: number }} ball
   * @returns {boolean}
   */
  checkCollect(ball) {
    if (this.collected) return false;

    const dx   = ball.x - this.x;
    const dy   = ball.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < COLLECT_RADIUS + PHYSICS.BALL_RADIUS) {
      this.collected = true;
      return true;
    }

    return false;
  }

  // ----------------------------------------------------------------
  // Rendering
  // ----------------------------------------------------------------

  draw(ctx) {
    if (this.collected && this._collectAnim >= 1) return; // fully animated out

    const glowColor = GLOW_COLORS[this.type] || COLORS.GOLD;
    const iconColor = ICON_COLORS[this.type] || COLORS.GOLD;
    const icon      = ICONS[this.type]       || '?';

    const cx = Math.round(this.x);
    // Bob up and down gently
    const bob = Math.sin(this._animTime * 3.5 + this._bobPhase) * 2;
    const cy  = Math.round(this.y + bob);

    ctx.save();
    ctx.imageSmoothingEnabled = false;

    if (this.collected) {
      // Burst animation: expanding ring that fades
      const t     = this._collectAnim;
      const burst = t * 14;
      const alpha = Math.max(0, 1 - t);
      ctx.globalAlpha = alpha;

      ctx.strokeStyle = glowColor;
      ctx.lineWidth   = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, burst, 0, Math.PI * 2);
      ctx.stroke();

      // Star particles
      for (let i = 0; i < 6; i++) {
        const pAngle  = (i / 6) * Math.PI * 2 + this._spinPhase;
        const pRadius = burst * 0.7;
        ctx.fillStyle = glowColor;
        ctx.fillRect(
          Math.round(cx + Math.cos(pAngle) * pRadius) - 1,
          Math.round(cy + Math.sin(pAngle) * pRadius) - 1,
          2, 2
        );
      }

      ctx.globalAlpha = 1;
      ctx.restore();
      return;
    }

    // ---- Outer glow ring (pulsing) ----
    const pulse = 0.5 + 0.5 * Math.sin(this._animTime * 4);
    ctx.fillStyle = `rgba(${_hexToRgb(glowColor)},${(0.12 + pulse * 0.10).toFixed(2)})`;
    ctx.beginPath();
    ctx.arc(cx, cy, 10, 0, Math.PI * 2);
    ctx.fill();

    // ---- Shadow ----
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(cx + 1, cy + 7, 6, 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // ---- Base circle (slightly spinning) ----
    const sz = 7 + Math.round(pulse);
    ctx.fillStyle = COLORS.UNO_BLACK;
    ctx.beginPath();
    ctx.arc(cx, cy, sz, 0, Math.PI * 2);
    ctx.fill();

    // Glow border ring
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, sz, 0, Math.PI * 2);
    ctx.stroke();

    // ---- Inner icon ----
    ctx.fillStyle = iconColor;
    ctx.font      = `bold ${Math.round(sz * 1.1)}px monospace`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(icon, cx, cy + 0.5);

    ctx.textBaseline = 'alphabetic';
    ctx.restore();
  }
}

// ---- Helper: hex color to "r,g,b" string for rgba() ----
function _hexToRgb(hex) {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return `${r},${g},${b}`;
}
