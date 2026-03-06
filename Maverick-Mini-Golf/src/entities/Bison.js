// ============================================================
// Maverick Mini Golf — Bison.js
// A herd of bison that charge across the fairway.
// Deflects the ball when hit (unpredictable bounce).
// ============================================================

import { COLORS } from '../Constants.js';

export class Bison {
  /**
   * @param {object} cfg
   * @param {number} cfg.x            Starting X (game pixels, can be off-screen)
   * @param {number} cfg.y            Starting Y (game pixels)
   * @param {number} cfg.width        Bison hitbox width
   * @param {number} cfg.height       Bison hitbox height
   * @param {number} cfg.speed        Movement speed (px/s)
   * @param {number} cfg.direction    1 = moving right, -1 = moving left
   * @param {number} cfg.period       Seconds between each crossing pass
   * @param {number} cfg.phaseOffset  Initial time offset to stagger bison
   */
  constructor(cfg) {
    this.x           = cfg.x;
    this.y           = cfg.y;
    this.width       = cfg.width  ?? 20;
    this.height      = cfg.height ?? 14;
    this.speed       = cfg.speed  ?? 40;
    this.direction   = cfg.direction  ?? 1;
    this.period      = cfg.period     ?? 4.0;
    this.phaseOffset = cfg.phaseOffset ?? 0;

    this._timer      = this.phaseOffset;
    this._active     = false;    // currently crossing the screen
    this._startX     = cfg.x;   // reset position when off-screen
    this._frozen     = 0;        // freeze timer (seconds)

    this._animTime   = 0;
    this._legPhase   = 0;
  }

  // ----------------------------------------------------------------
  // Update
  // ----------------------------------------------------------------

  update(dt) {
    this._animTime += dt;

    if (this._frozen > 0) {
      this._frozen -= dt;
      return;
    }

    if (!this._active) {
      this._timer += dt;
      if (this._timer >= this.period) {
        this._timer  = 0;
        this._active = true;
        // Reset start position off-screen on the correct side
        this.x = this.direction > 0 ? -this.width - 10 : 330;
      }
      return;
    }

    // Move horizontally
    this.x += this.speed * this.direction * dt;
    this._legPhase = (this._legPhase + dt * 8) % (Math.PI * 2);

    // Check if bison has left the screen
    if (this.direction > 0 && this.x > 340) {
      this._active = false;
    } else if (this.direction < 0 && this.x + this.width < -20) {
      this._active = false;
    }
  }

  // ----------------------------------------------------------------
  // Collision
  // ----------------------------------------------------------------

  /** Returns AABB if currently on-screen, else null */
  getBounds() {
    if (!this._active) return null;
    return { x: this.x, y: this.y, width: this.width, height: this.height };
  }

  /**
   * Deflect the ball off the bison (unpredictable random bounce).
   * @param {{ x: number, y: number, vx: number, vy: number }} ball
   */
  deflectBall(ball) {
    // Deflect in bison's travel direction with a random vertical kick
    const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
    const deflectSpeed = Math.max(speed, 4);

    // Bias toward bison's travel direction but with some randomness
    const baseAngle = this.direction > 0 ? 0 : Math.PI;
    const spread    = (Math.random() - 0.5) * Math.PI * 0.8;
    const finalAngle = baseAngle + spread;

    ball.vx = Math.cos(finalAngle) * deflectSpeed * 1.2;
    ball.vy = Math.sin(finalAngle) * deflectSpeed * 1.2;

    // Push ball outside bison bounds
    if (this.direction > 0) {
      ball.x = this.x + this.width + ball.radius + 1;
    } else {
      ball.x = this.x - ball.radius - 1;
    }
  }

  // ----------------------------------------------------------------
  // Power-up: freeze
  // ----------------------------------------------------------------

  freeze(duration) {
    this._frozen = duration;
  }

  // ----------------------------------------------------------------
  // Rendering
  // ----------------------------------------------------------------

  draw(ctx) {
    if (!this._active) return;

    const x = Math.round(this.x);
    const y = Math.round(this.y);
    const w = this.width;
    const h = this.height;

    ctx.save();
    ctx.imageSmoothingEnabled = false;

    const frozen = this._frozen > 0;
    const bodyColor   = frozen ? '#88AACC' : '#5A3A1A';
    const darkColor   = frozen ? '#6699BB' : '#3A2010';
    const humpColor   = frozen ? '#99BBDD' : '#6A4A2A';

    // Flip if going left
    if (this.direction < 0) {
      ctx.scale(-1, 1);
      ctx.translate(-x * 2 - w, 0);
    }

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(x + 2, y + h - 1, w - 4, 2);

    // --- Body ---
    ctx.fillStyle = bodyColor;
    ctx.fillRect(x + 2, y + 2, w - 4, h - 4);

    // Hump (bison shoulder hump — pixel art bump)
    ctx.fillStyle = humpColor;
    ctx.fillRect(x + 2, y,     8, 4);
    ctx.fillRect(x + 3, y - 2, 6, 3);
    ctx.fillRect(x + 4, y - 3, 4, 2);

    // Dark belly
    ctx.fillStyle = darkColor;
    ctx.fillRect(x + 3, y + h - 6, w - 6, 3);

    // --- Head ---
    ctx.fillStyle = bodyColor;
    ctx.fillRect(x + w - 8, y + 1, 8, 7);
    // Snout
    ctx.fillStyle = darkColor;
    ctx.fillRect(x + w - 4, y + 3, 4, 4);
    // Nostril
    ctx.fillStyle = '#200A00';
    ctx.fillRect(x + w - 3, y + 4, 1, 1);
    // Eye
    ctx.fillStyle = '#200A00';
    ctx.fillRect(x + w - 7, y + 2, 2, 2);
    ctx.fillStyle = '#FF4400';
    ctx.fillRect(x + w - 7, y + 2, 1, 1);

    // Short horn
    ctx.fillStyle = '#CC9944';
    ctx.fillRect(x + w - 5, y - 1, 2, 2);

    // --- Legs (animated) ---
    const legSwing = Math.sin(this._legPhase);
    ctx.fillStyle = darkColor;
    // Front pair
    const fl1 = Math.round(legSwing * 2);
    ctx.fillRect(x + w - 10, y + h - 5, 3, 5 + fl1);
    ctx.fillRect(x + w - 6,  y + h - 5, 3, 5 - fl1);
    // Rear pair
    const rl1 = Math.round(-legSwing * 2);
    ctx.fillRect(x + 4, y + h - 5, 3, 5 + rl1);
    ctx.fillRect(x + 8, y + h - 5, 3, 5 - rl1);

    // Freeze ice overlay
    if (frozen) {
      ctx.fillStyle = 'rgba(168,216,234,0.35)';
      ctx.fillRect(x, y - 3, w, h + 3);
    }

    ctx.restore();
  }
}
