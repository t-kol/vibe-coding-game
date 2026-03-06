// ============================================================
// Maverick Mini Golf — Tornado.js
// A slow-moving tornado that pulls (or repels) the ball.
// Not a solid obstacle — applies force via applyForce().
// ============================================================

import { COLORS } from '../Constants.js';

export class Tornado {
  /**
   * @param {object} cfg
   * @param {number} cfg.x          Starting center X
   * @param {number} cfg.y          Starting center Y
   * @param {number} cfg.radius     Influence radius (px)
   * @param {number} cfg.speed      Drift speed (px/s)
   * @param {number} cfg.pullForce  Force magnitude per frame (0..1)
   */
  constructor(cfg) {
    this.x         = cfg.x;
    this.y         = cfg.y;
    this.radius    = cfg.radius    ?? 35;
    this.speed     = cfg.speed     ?? 15;
    this.pullForce = cfg.pullForce ?? 0.08;

    // Drift direction changes slowly
    this._driftAngle  = Math.random() * Math.PI * 2;
    this._driftTimer  = 0;
    this._driftPeriod = 2.0 + Math.random() * 2.0;

    this._startX = cfg.x;
    this._startY = cfg.y;

    this._frozen   = 0;
    this._animTime = 0;
    this._spinPhase = 0;
  }

  // ----------------------------------------------------------------
  // Update
  // ----------------------------------------------------------------

  update(dt) {
    this._animTime  += dt;
    this._spinPhase  = (this._spinPhase + dt * 3) % (Math.PI * 2);

    if (this._frozen > 0) {
      this._frozen -= dt;
      return;
    }

    // Drift in current direction
    this.x += Math.cos(this._driftAngle) * this.speed * dt;
    this.y += Math.sin(this._driftAngle) * this.speed * dt;

    // Periodically change drift direction (wander)
    this._driftTimer += dt;
    if (this._driftTimer >= this._driftPeriod) {
      this._driftTimer  = 0;
      this._driftPeriod = 1.5 + Math.random() * 2.5;
      this._driftAngle  = Math.random() * Math.PI * 2;
    }

    // Stay near starting position (elastic pull back)
    const dxHome = this._startX - this.x;
    const dyHome = this._startY - this.y;
    const distHome = Math.sqrt(dxHome * dxHome + dyHome * dyHome);
    if (distHome > 60) {
      this.x += (dxHome / distHome) * 5 * dt;
      this.y += (dyHome / distHome) * 5 * dt;
    }
  }

  // ----------------------------------------------------------------
  // Force application
  // ----------------------------------------------------------------

  /** Check if ball is within the tornado's influence radius */
  isNearBall(ball) {
    const dx = ball.x - this.x;
    const dy = ball.y - this.y;
    return Math.sqrt(dx * dx + dy * dy) < this.radius;
  }

  /**
   * Apply suction force toward the tornado's center.
   * The closer the ball, the stronger the pull.
   */
  applyForce(ball) {
    if (this._frozen > 0) return;

    const dx   = this.x - ball.x;
    const dy   = this.y - ball.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 1) return;

    // Normalized direction toward tornado center
    const nx = dx / dist;
    const ny = dy / dist;

    // Strength: stronger near center
    const t = Math.max(0, 1 - dist / this.radius);
    const force = this.pullForce * t;

    // Apply suction (pull toward center) + slight tangential spin
    const tangentX = -ny;
    const tangentY =  nx;

    ball.vx += nx * force + tangentX * force * 0.5;
    ball.vy += ny * force + tangentY * force * 0.5;
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
    const r  = this.radius;

    ctx.save();
    ctx.imageSmoothingEnabled = false;

    const frozen = this._frozen > 0;

    // ---- Influence zone — faint red/grey circle ----
    ctx.fillStyle = frozen
      ? 'rgba(168,216,234,0.06)'
      : 'rgba(200,16,46,0.07)';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    // ---- Spiral bands ----
    const numBands = 4;
    for (let b = 0; b < numBands; b++) {
      const bandR = r * (1 - b / numBands);
      const alpha = 0.15 + b * 0.05;
      ctx.strokeStyle = frozen
        ? `rgba(168,216,234,${alpha})`
        : `rgba(80,80,90,${alpha})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, bandR, this._spinPhase + b * 0.8, this._spinPhase + b * 0.8 + Math.PI * 1.5);
      ctx.stroke();
    }

    // ---- Tornado funnel (pixel art — stacked narrowing rects) ----
    // Widest at top, narrowest at bottom
    const funnelW = 16;
    const funnelH = 30;
    const funnelX = cx - funnelW / 2;
    const funnelY = cy - funnelH / 2;

    const baseColor = frozen ? '#A8D8EA' : '#5A5A6A';
    const darkColor = frozen ? '#88AABB' : '#3A3A44';

    // Draw rotating funnel segments
    for (let i = 0; i < 6; i++) {
      const segY    = funnelY + i * 5;
      const segW    = Math.round(funnelW * (1 - i * 0.12));
      const segX    = cx - segW / 2;
      const spinOff = Math.round(Math.sin(this._spinPhase + i * 0.5) * 3);

      ctx.fillStyle = i % 2 === 0 ? baseColor : darkColor;
      ctx.fillRect(segX + spinOff, segY, segW, 4);
    }

    // ---- Debris particles orbiting the tornado ----
    const numDebris = 5;
    for (let d = 0; d < numDebris; d++) {
      const debrisAngle = this._spinPhase * 2 + (d / numDebris) * Math.PI * 2;
      const debrisR     = r * (0.35 + (d % 2) * 0.2);
      const dx = cx + Math.cos(debrisAngle) * debrisR;
      const dy = cy + Math.sin(debrisAngle) * debrisR * 0.6; // elliptical

      ctx.fillStyle = frozen
        ? `rgba(168,216,234,0.7)`
        : `rgba(60,60,70,0.8)`;
      ctx.fillRect(Math.round(dx) - 1, Math.round(dy) - 1, 3, 3);
    }

    // ---- Center vortex dot ----
    ctx.fillStyle = frozen ? COLORS.ICE_LIGHT : '#888899';
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
