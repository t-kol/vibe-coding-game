// ============================================================
// Maverick Mini Golf — BookCart.js
// A rolling library book cart that bounces back and forth.
// Deflects the ball on collision.
// ============================================================

import { COLORS } from '../Constants.js';

export class BookCart {
  /**
   * @param {object} cfg
   * @param {number} cfg.x        Starting X
   * @param {number} cfg.y        Starting Y (center)
   * @param {number} cfg.width    Cart width
   * @param {number} cfg.height   Cart height
   * @param {number} cfg.speed    Movement speed (px/s)
   * @param {number} cfg.bounceX1 Left bounce wall X
   * @param {number} cfg.bounceX2 Right bounce wall X
   */
  constructor(cfg) {
    this.x        = cfg.x;
    this.y        = cfg.y;
    this.width    = cfg.width  ?? 15;
    this.height   = cfg.height ?? 12;
    this.speed    = cfg.speed  ?? 20;
    this.bounceX1 = cfg.bounceX1 ?? 30;
    this.bounceX2 = cfg.bounceX2 ?? 290;

    this._dir      = 1;   // 1 = right, -1 = left
    this._frozen   = 0;
    this._animTime = 0;
    this._wheelPhase = 0;

    // Clamp initial X
    this.x = Math.max(this.bounceX1, Math.min(this.bounceX2 - this.width, this.x));
  }

  // ----------------------------------------------------------------
  // Update
  // ----------------------------------------------------------------

  update(dt) {
    this._animTime   += dt;

    if (this._frozen > 0) {
      this._frozen -= dt;
      return;
    }

    this.x += this.speed * this._dir * dt;
    this._wheelPhase = (this._wheelPhase + dt * this.speed * 0.1) % (Math.PI * 2);

    // Bounce at walls
    if (this.x <= this.bounceX1) {
      this.x   = this.bounceX1;
      this._dir = 1;
    } else if (this.x + this.width >= this.bounceX2) {
      this.x   = this.bounceX2 - this.width;
      this._dir = -1;
    }
  }

  // ----------------------------------------------------------------
  // Collision
  // ----------------------------------------------------------------

  getBounds() {
    return {
      x:      this.x,
      y:      this.y - this.height / 2,
      width:  this.width,
      height: this.height,
    };
  }

  /**
   * Deflect ball off the cart — horizontal bounce with vertical scatter.
   */
  deflectBall(ball) {
    const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
    const deflectSpeed = Math.max(speed, 3);

    // Push ball in cart's travel direction plus a vertical kick
    ball.vx = this._dir * deflectSpeed * 0.9;
    ball.vy = (Math.random() - 0.5) * deflectSpeed;

    // Eject from collision edge
    const bounds = this.getBounds();
    if (ball.x < this.x + this.width / 2) {
      ball.x = bounds.x - ball.radius - 1;
      ball.vx = -Math.abs(ball.vx);
    } else {
      ball.x = bounds.x + bounds.width + ball.radius + 1;
      ball.vx = Math.abs(ball.vx);
    }
  }

  freeze(duration) {
    this._frozen = duration;
  }

  // ----------------------------------------------------------------
  // Rendering
  // ----------------------------------------------------------------

  draw(ctx) {
    const x  = Math.round(this.x);
    const cy = Math.round(this.y);
    const w  = this.width;
    const h  = this.height;
    const ty = cy - Math.round(h / 2);

    ctx.save();
    ctx.imageSmoothingEnabled = false;

    const frozen = this._frozen > 0;

    // ---- Cart frame ----
    ctx.fillStyle = frozen ? '#7799AA' : '#5A3A18';
    ctx.fillRect(x, ty, w, h);

    // Frame detail lines
    ctx.fillStyle = frozen ? '#99BBCC' : '#7A5A30';
    ctx.fillRect(x,     ty,     w, 2);  // top rail
    ctx.fillRect(x,     ty + h - 2, w, 2);  // bottom rail
    ctx.fillRect(x,     ty, 2, h);  // left side
    ctx.fillRect(x + w - 2, ty, 2, h);  // right side

    // ---- Books (top shelf) ----
    const bookColors = frozen
      ? ['#88AABB', '#6699AA', '#AABBCC', '#99AABB']
      : ['#8B0000', '#1A4A8A', '#228B22', '#8B4500'];
    const bookW = Math.floor((w - 4) / 4);
    for (let i = 0; i < 4; i++) {
      const bx = x + 2 + i * bookW;
      ctx.fillStyle = bookColors[i % bookColors.length];
      ctx.fillRect(bx, ty + 2, bookW - 1, h - 6);
      // Book spine highlight
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.fillRect(bx, ty + 2, 1, h - 6);
    }

    // ---- Wheels ----
    const wheelColor = frozen ? '#8899AA' : '#333333';
    const wheelY     = ty + h;
    ctx.fillStyle = wheelColor;
    ctx.beginPath();
    ctx.arc(x + 3, wheelY, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + w - 3, wheelY, 3, 0, Math.PI * 2);
    ctx.fill();

    // Wheel spokes (rotate)
    ctx.fillStyle = frozen ? '#AABBCC' : '#666666';
    [x + 3, x + w - 3].forEach(wx => {
      const sp = this._wheelPhase;
      ctx.fillRect(wx + Math.round(Math.cos(sp) * 2) - 1,
                   wheelY + Math.round(Math.sin(sp) * 2) - 1, 2, 2);
    });

    // Freeze overlay
    if (frozen) {
      ctx.fillStyle = 'rgba(168,216,234,0.3)';
      ctx.fillRect(x, ty, w, h);
    }

    ctx.restore();
  }
}
