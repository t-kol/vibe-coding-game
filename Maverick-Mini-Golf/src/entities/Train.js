// ============================================================
// Maverick Mini Golf — Train.js
// A vintage steam train that crosses the fairway horizontally.
// Ball bounces off the train cars.
// ============================================================

import { COLORS } from '../Constants.js';

export class Train {
  /**
   * @param {object} cfg
   * @param {number} cfg.x            Starting X (game pixels, can be off-screen)
   * @param {number} cfg.y            Starting Y (center of train)
   * @param {number} cfg.width        Train hitbox width (entire train length)
   * @param {number} cfg.height       Train hitbox height
   * @param {number} cfg.speed        Movement speed (px/s)
   * @param {number} cfg.direction    1 = moving right, -1 = moving left
   * @param {number} cfg.period       Seconds between each pass
   * @param {number} cfg.phaseOffset  Initial time offset
   */
  constructor(cfg) {
    this.x           = cfg.x;
    this.y           = cfg.y;
    this.width       = cfg.width  ?? 55;
    this.height      = cfg.height ?? 18;
    this.speed       = cfg.speed  ?? 50;
    this.direction   = cfg.direction  ?? 1;
    this.period      = cfg.period     ?? 5.0;
    this.phaseOffset = cfg.phaseOffset ?? 0;

    this._timer      = this.phaseOffset;
    this._active     = false;
    this._frozen     = 0;
    this._animTime   = 0;
    this._wheelPhase = 0;
    this._smokeTimer = 0;
    this._smokes     = [];  // active smoke puff positions
  }

  // ----------------------------------------------------------------
  // Update
  // ----------------------------------------------------------------

  update(dt) {
    this._animTime   += dt;
    this._smokeTimer += dt;

    if (this._frozen > 0) {
      this._frozen -= dt;
      // Animate smoke even when frozen (trailing off)
      this._updateSmoke(dt);
      return;
    }

    if (!this._active) {
      this._timer += dt;
      if (this._timer >= this.period) {
        this._timer  = 0;
        this._active = true;
        this.x = this.direction > 0 ? -this.width - 10 : 330;
      }
      return;
    }

    this.x += this.speed * this.direction * dt;
    this._wheelPhase = (this._wheelPhase + dt * (this.speed / 10)) % (Math.PI * 2);

    // Emit smoke puffs
    if (this._smokeTimer > 0.18) {
      this._smokeTimer = 0;
      const smokeX = this.direction > 0 ? this.x + this.width - 8 : this.x + 8;
      this._smokes.push({ x: smokeX, y: this.y - 10, age: 0, r: 4 });
    }

    this._updateSmoke(dt);

    // Off-screen check
    if (this.direction > 0 && this.x > 350) this._active = false;
    if (this.direction < 0 && this.x + this.width < -20) this._active = false;
  }

  _updateSmoke(dt) {
    this._smokes = this._smokes.filter(s => {
      s.age += dt;
      s.y   -= 12 * dt;
      s.r   += 2 * dt;
      return s.age < 1.2;
    });
  }

  // ----------------------------------------------------------------
  // Collision
  // ----------------------------------------------------------------

  getBounds() {
    if (!this._active) return null;
    return { x: this.x, y: this.y - this.height / 2, width: this.width, height: this.height };
  }

  /**
   * Deflect the ball off the train — bounce perpendicular to travel direction.
   */
  deflectBall(ball) {
    const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
    const deflectSpeed = Math.max(speed, 3);

    // Reflect velocity: reverse X and add vertical kick
    ball.vx = -ball.vx * 0.8 + this.direction * 2;
    ball.vy = (Math.random() - 0.5) * deflectSpeed * 1.4;

    // Eject ball from train
    if (ball.y < this.y) {
      ball.y = this.y - this.height / 2 - ball.radius - 1;
      ball.vy = Math.min(ball.vy, -2);
    } else {
      ball.y = this.y + this.height / 2 + ball.radius + 1;
      ball.vy = Math.max(ball.vy, 2);
    }
  }

  freeze(duration) {
    this._frozen = duration;
  }

  // ----------------------------------------------------------------
  // Rendering
  // ----------------------------------------------------------------

  draw(ctx) {
    if (!this._active) return;

    const x  = Math.round(this.x);
    const cy = Math.round(this.y);
    const w  = this.width;
    const h  = this.height;
    const hy = cy - Math.round(h / 2);  // top of train

    ctx.save();
    ctx.imageSmoothingEnabled = false;

    const frozen  = this._frozen > 0;
    const flip    = this.direction < 0;

    if (flip) {
      ctx.scale(-1, 1);
      ctx.translate(-x * 2 - w, 0);
    }

    // ---- Smoke puffs (draw before train so they appear behind) ----
    this._smokes.forEach(s => {
      const alpha = Math.max(0, 0.6 - s.age / 1.2);
      ctx.fillStyle = `rgba(200,200,210,${alpha.toFixed(2)})`;
      const sr = Math.round(s.r);
      ctx.beginPath();
      ctx.arc(Math.round(flip ? (330 - s.x) : s.x), Math.round(s.y), sr, 0, Math.PI * 2);
      ctx.fill();
    });

    // ---- Engine (front / right side) ----
    const engineX = flip ? x : x + w - 24;
    const bodyColor   = frozen ? '#7799AA' : '#4A3020';
    const boilerColor = frozen ? '#99AABB' : '#5A4030';
    const redColor    = frozen ? '#AABBCC' : '#C8102E';

    // Boiler barrel
    ctx.fillStyle = boilerColor;
    ctx.fillRect(engineX, hy + 2, 24, h - 6);

    // Boiler top dome
    ctx.fillStyle = boilerColor;
    ctx.fillRect(engineX + 2, hy,     20, 4);
    ctx.fillRect(engineX + 5, hy - 2, 14, 3);

    // Smokestack
    ctx.fillStyle = bodyColor;
    ctx.fillRect(engineX + 14, hy - 8, 5, 8);
    ctx.fillRect(engineX + 12, hy - 10, 9, 3);

    // Red stripe on boiler
    ctx.fillStyle = redColor;
    ctx.fillRect(engineX, hy + h - 12, 24, 3);

    // Headlight
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(engineX + 20, hy + 3, 4, 4);
    ctx.fillStyle = 'rgba(255,220,100,0.4)';
    ctx.fillRect(engineX + 22, hy + 1, 6, 8);

    // ---- Cab ----
    ctx.fillStyle = bodyColor;
    ctx.fillRect(engineX - 14, hy + 1, 15, h - 3);
    // Cab window
    ctx.fillStyle = '#1A0A00';
    ctx.fillRect(engineX - 12, hy + 3, 6, 5);
    ctx.fillStyle = 'rgba(150,220,255,0.4)';
    ctx.fillRect(engineX - 12, hy + 3, 6, 5);

    // ---- Car (passenger / cargo) ----
    const carX = flip ? x + 24 : x;
    const carW = w - 24;
    ctx.fillStyle = '#3A2818';
    ctx.fillRect(carX, hy + 2, carW, h - 4);
    // Car detail — planks
    ctx.fillStyle = '#2A1A10';
    ctx.fillRect(carX, hy + 2, carW, 2);
    ctx.fillRect(carX, hy + h - 4, carW, 2);
    // Car windows
    ctx.fillStyle = '#1A0A00';
    for (let wx = carX + 4; wx < carX + carW - 6; wx += 8) {
      ctx.fillRect(wx, hy + 4, 5, 5);
      ctx.fillStyle = 'rgba(100,180,220,0.5)';
      ctx.fillRect(wx, hy + 4, 5, 5);
      ctx.fillStyle = '#1A0A00';
    }

    // ---- Wheels ----
    const wheelColor = frozen ? '#8899AA' : '#888888';
    const spokeColor = frozen ? '#AABBCC' : '#AAAAAA';
    const wheelY = hy + h - 2;
    const wheels = [
      x + 4, x + 14,       // engine wheels
      x + w - 28, x + w - 18, x + w - 8  // car wheels
    ];
    wheels.forEach(wx => {
      // Wheel rim
      ctx.fillStyle = wheelColor;
      ctx.beginPath();
      ctx.arc(wx + 2, wheelY, 4, 0, Math.PI * 2);
      ctx.fill();
      // Spoke
      ctx.fillStyle = spokeColor;
      const spoke = this._wheelPhase;
      ctx.fillRect(
        wx + 2 + Math.round(Math.cos(spoke) * 2) - 1,
        wheelY + Math.round(Math.sin(spoke) * 2) - 1,
        2, 2
      );
      ctx.fillRect(
        wx + 2 + Math.round(Math.cos(spoke + Math.PI) * 2) - 1,
        wheelY + Math.round(Math.sin(spoke + Math.PI) * 2) - 1,
        2, 2
      );
    });

    // Freeze overlay
    if (frozen) {
      ctx.fillStyle = 'rgba(168,216,234,0.3)';
      ctx.fillRect(x, hy - 10, w, h + 14);
    }

    ctx.restore();
  }
}
