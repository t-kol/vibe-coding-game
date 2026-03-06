// ============================================================
// Maverick Mini Golf — Sprinkler.js
// A campus sprinkler that rotates and pushes the ball sideways.
// Force is applied when the ball is within the spray radius.
// ============================================================

import { COLORS } from '../Constants.js';

export class Sprinkler {
  /**
   * @param {object} cfg
   * @param {number} cfg.x           Center X (game pixels)
   * @param {number} cfg.y           Center Y (game pixels)
   * @param {number} cfg.radius      Spray reach radius
   * @param {number} cfg.period      Time for one full rotation (seconds)
   * @param {number} cfg.phaseOffset Initial rotation offset (seconds)
   */
  constructor(cfg) {
    this.x           = cfg.x;
    this.y           = cfg.y;
    this.radius      = cfg.radius      ?? 30;
    this.period      = cfg.period      ?? 3.0;
    this.phaseOffset = cfg.phaseOffset ?? 0;

    this._angle    = (this.phaseOffset / this.period) * Math.PI * 2;
    this._frozen   = 0;
    this._animTime = this.phaseOffset;
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

    // Rotate spray arm
    this._angle = (this._animTime / this.period) * Math.PI * 2;
  }

  // ----------------------------------------------------------------
  // Force
  // ----------------------------------------------------------------

  /**
   * If the ball is in the spray zone and in the arc being sprayed,
   * apply a tangential push force.
   */
  applyForce(ball) {
    if (this._frozen > 0) return;

    const dx   = ball.x - this.x;
    const dy   = ball.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 1 || dist > this.radius) return;

    // Angle from sprinkler center to ball
    const ballAngle = Math.atan2(dy, dx);

    // Spray arc: the sprinkler covers a ~60° arc centered on _angle
    const arc       = Math.PI / 3;
    let   angleDiff = ballAngle - this._angle;
    // Wrap to [-PI, PI]
    while (angleDiff >  Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

    if (Math.abs(angleDiff) > arc / 2) return; // ball not in spray arc

    // Spray pushes ball radially outward
    const strength = 0.15 * (1 - dist / this.radius);
    ball.vx += (dx / dist) * strength;
    ball.vy += (dy / dist) * strength;
  }

  freeze(duration) {
    this._frozen = duration;
  }

  // ----------------------------------------------------------------
  // Rendering
  // ----------------------------------------------------------------

  draw(ctx) {
    const cx = Math.round(this.x);
    const cy = Math.round(this.y);

    ctx.save();
    ctx.imageSmoothingEnabled = false;

    const frozen = this._frozen > 0;

    // ---- Spray zone indicator (faint circle) ----
    ctx.strokeStyle = frozen
      ? 'rgba(168,216,234,0.15)'
      : 'rgba(74,195,247,0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, this.radius, 0, Math.PI * 2);
    ctx.stroke();

    // ---- Spray droplets along arc ----
    const arcHalf = Math.PI / 3;
    const dropletColor = frozen ? 'rgba(168,216,234,0.7)' : 'rgba(74,195,247,0.7)';
    const numDroplets = 5;
    for (let d = 0; d < numDroplets; d++) {
      const t = d / numDroplets;
      const dropAngle = this._angle - arcHalf / 2 + t * arcHalf;
      const dropR     = this.radius * (0.3 + t * 0.6);
      const dPulse    = Math.sin(this._animTime * 8 + d * 0.7) * 0.2 + 0.8;
      const dx = cx + Math.cos(dropAngle) * dropR;
      const dy = cy + Math.sin(dropAngle) * dropR;

      ctx.fillStyle = dropletColor;
      ctx.fillRect(Math.round(dx) - 1, Math.round(dy) - 1, 2, 2);
    }

    // ---- Spray arm (rotating pipe) ----
    const armLen = 8;
    const armEndX = cx + Math.cos(this._angle) * armLen;
    const armEndY = cy + Math.sin(this._angle) * armLen;

    ctx.fillStyle = frozen ? '#8899AA' : '#6A8848';
    // Draw pixel arm as rects along angle
    const steps = armLen;
    for (let i = 2; i <= steps; i++) {
      const px = Math.round(cx + Math.cos(this._angle) * i);
      const py = Math.round(cy + Math.sin(this._angle) * i);
      ctx.fillRect(px - 1, py - 1, 2, 2);
    }

    // Nozzle tip
    ctx.fillStyle = frozen ? '#AABBCC' : '#88AACC';
    ctx.fillRect(Math.round(armEndX) - 1, Math.round(armEndY) - 1, 3, 3);

    // ---- Base (sprinkler head) ----
    ctx.fillStyle = frozen ? '#7799AA' : '#5A7830';
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = frozen ? '#99BBCC' : '#6A9840';
    ctx.beginPath();
    ctx.arc(cx, cy, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
