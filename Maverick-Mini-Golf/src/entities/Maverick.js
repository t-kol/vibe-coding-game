import { COLORS, CANVAS } from '../Constants.js';

export class Maverick {
  // state: 'idle' | 'aiming' | 'swing' | 'celebrate' | 'frustrated'
  constructor() {
    this.state         = 'idle';
    this.animTime      = 0;
    this.animFrame     = 0;
    this.swingPhase    = 0;   // 0..1 for swing animation
    this.celebrateTimer = 0;
    this.skin          = 'default'; // 'default' | 'blizzard'
    this.hat           = 'stetson'; // 'stetson' | 'uno_cap' | 'beanie' | 'mortarboard'
    this.putter        = 'default'; // 'default' | 'lasso' | 'hockey' | 'rail'

    // Shadow alpha for draw layering
    this._shadowAlpha  = 0.35;
  }

  setState(state) {
    this.state      = state;
    this.animTime   = 0;
    this.animFrame  = 0;
    if (state === 'celebrate') this.celebrateTimer = 2.0;
    if (state === 'swing')     this.swingPhase = 0;
  }

  update(dt) {
    this.animTime += dt;

    if (this.state === 'swing') {
      this.swingPhase = Math.min(this.swingPhase + dt * 4, 1);
      if (this.swingPhase >= 1) {
        this.state      = 'idle';
        this.swingPhase = 0;
      }
    }

    if (this.state === 'celebrate') {
      this.celebrateTimer -= dt;
      if (this.celebrateTimer <= 0) this.state = 'idle';
      this.animFrame = Math.floor(this.animTime * 8) % 4;
    }

    if (this.state === 'idle' || this.state === 'aiming') {
      this.animFrame = Math.floor(this.animTime * 2) % 2; // gentle idle bob
    }

    if (this.state === 'frustrated') {
      this.animFrame = Math.floor(this.animTime * 6) % 2; // agitated shake
    }
  }

  // Draw the Maverick character at (x, y), facing direction angle (radians)
  // Position is typically offset from ball position
  draw(ctx, x, y, aimAngle) {
    ctx.save();
    ctx.translate(x, y);

    // Determine facing direction
    const flip = Math.cos(aimAngle) < 0;
    if (flip) ctx.scale(-1, 1);

    // Idle bob: move body up/down slightly
    const bobY = (this.state === 'idle' || this.state === 'aiming')
      ? Math.sin(this.animTime * 2.5) * 0.8
      : 0;

    // Celebrate jump: bounce up
    const celebY = this.state === 'celebrate'
      ? -Math.abs(Math.sin(this.animTime * 8)) * 4
      : 0;

    // Frustrated shake: jitter x
    const frustrateX = this.state === 'frustrated'
      ? Math.sin(this.animTime * 20) * 1.5
      : 0;

    ctx.translate(frustrateX, bobY + celebY);

    // Ground shadow
    ctx.fillStyle = COLORS.BALL_SHADOW;
    ctx.beginPath();
    ctx.ellipse(0, 18, 8, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Draw character layers (back-to-front)
    this._drawBody(ctx);
    this._drawHat(ctx);
    this._drawPutter(ctx, aimAngle, flip);

    if (this.state === 'celebrate') {
      this._drawCelebrationEffect(ctx);
    }

    ctx.restore();
  }

  _drawBody(ctx) {
    const isBlizzard = this.skin === 'blizzard';

    // ---- Boots ----
    ctx.fillStyle = '#4A2519';
    ctx.fillRect(-5, 13, 4, 5);  // left boot
    ctx.fillRect(1,  13, 4, 5);  // right boot
    // Boot highlight
    ctx.fillStyle = '#5A3529';
    ctx.fillRect(-5, 13, 4, 1);
    ctx.fillRect(1,  13, 4, 1);
    // Boot spurs (tiny silver)
    ctx.fillStyle = COLORS.SILVER;
    ctx.fillRect(-6, 16, 1, 1);
    ctx.fillRect(5,  16, 1, 1);

    // ---- Jeans ----
    ctx.fillStyle = '#2244AA';
    ctx.fillRect(-4, 6, 3, 8);   // left leg
    ctx.fillRect(1,  6, 3, 8);   // right leg
    // Jean seam highlight
    ctx.fillStyle = '#1A3388';
    ctx.fillRect(-3, 6, 1, 8);
    ctx.fillRect(2,  6, 1, 8);

    // ---- Jersey/body ----
    const bodyColor = isBlizzard ? '#DDDDDD' : '#C8102E';
    ctx.fillStyle = bodyColor;
    ctx.fillRect(-4, -3, 8, 10);
    // UNO stripes / trim
    ctx.fillStyle = '#0A0A0A';
    ctx.fillRect(-4, 0, 2, 4);   // left stripe
    ctx.fillRect(2,  0, 2, 4);   // right stripe
    // Number on jersey (optional — pixel "1")
    if (!isBlizzard) {
      ctx.fillStyle = '#F5F5F5';
      ctx.fillRect(-1, -2, 1, 4); // "1" on jersey
    } else {
      // Coat lapels
      ctx.fillStyle = '#BBBBBB';
      ctx.fillRect(-4, -3, 2, 5);
      ctx.fillRect(2,  -3, 2, 5);
    }

    // ---- Arms ----
    // Arm position changes with state
    const armSwing = this.state === 'swing'
      ? Math.sin(this.swingPhase * Math.PI) * 3
      : 0;

    const skinColor = isBlizzard ? '#DDA070' : '#E8B88A';
    // Left arm
    ctx.fillStyle = skinColor;
    ctx.fillRect(-6, -1 + armSwing, 2, 6);
    // Right arm
    ctx.fillRect(4,  -1 - armSwing, 2, 6);

    // Golf glove (left hand — white)
    ctx.fillStyle = '#F5F5F5';
    ctx.fillRect(-7, 4 + armSwing, 3, 3);
    ctx.fillStyle = '#CCCCCC';
    ctx.fillRect(-7, 4 + armSwing, 3, 1); // glove seam

    // ---- Head ----
    const headBob = (this.state === 'idle' && this.animFrame === 1) ? 0 : 0;
    ctx.fillStyle = skinColor;
    ctx.fillRect(-4, -11, 8, 8); // square head (pixel art)
    // Head highlight
    ctx.fillStyle = isBlizzard ? '#EFCBA0' : '#F0C090';
    ctx.fillRect(-4, -11, 8, 2);

    // ---- Neck ----
    ctx.fillStyle = skinColor;
    ctx.fillRect(-2, -4, 4, 2);

    // ---- Expression (eyes, mouth) ----
    this._drawFace(ctx, isBlizzard);

    // ---- Longhorn horns ----
    ctx.fillStyle = '#8B5E1A';
    // Left horn
    ctx.fillRect(-8, -14, 4, 2);
    ctx.fillRect(-10, -16, 3, 2);
    ctx.fillRect(-9, -17, 2, 1);
    // Right horn
    ctx.fillRect(4,  -14, 4, 2);
    ctx.fillRect(7,  -16, 3, 2);
    ctx.fillRect(7,  -17, 2, 1);
    // Horn tip highlight
    ctx.fillStyle = '#AA7E2A';
    ctx.fillRect(-10, -16, 1, 1);
    ctx.fillRect(9,   -16, 1, 1);

    // ---- Collar / bandana ----
    ctx.fillStyle = isBlizzard ? '#8888CC' : '#FFD700';
    ctx.fillRect(-3, -4, 6, 2);
    ctx.fillStyle = isBlizzard ? '#6666AA' : '#C8A020';
    ctx.fillRect(-2, -3, 4, 1);
  }

  _drawFace(ctx, isBlizzard) {
    const isFrustrated = this.state === 'frustrated';
    const isCelebrate  = this.state === 'celebrate';

    // Eyes
    if (isFrustrated) {
      // Angry slanted brows + narrow eyes
      ctx.fillStyle = '#333333';
      ctx.fillRect(-3, -9, 2, 1); // left eye (narrow)
      ctx.fillRect(1,  -9, 2, 1); // right eye
      // Angry brows
      ctx.fillStyle = '#5A3000';
      ctx.fillRect(-3, -10, 3, 1);
      ctx.fillRect(0,  -10, 3, 1);
      // Frown
      ctx.fillStyle = '#333333';
      ctx.fillRect(-2, -6, 1, 1);
      ctx.fillRect(-1, -7, 1, 1);
      ctx.fillRect(0,  -7, 1, 1);
      ctx.fillRect(1,  -6, 1, 1);
    } else if (isCelebrate) {
      // Happy eyes with sparkles
      ctx.fillStyle = '#333333';
      ctx.fillRect(-3, -9, 2, 2);
      ctx.fillRect(1,  -9, 2, 2);
      // Big smile
      ctx.fillStyle = '#333333';
      ctx.fillRect(-3, -7, 1, 1);
      ctx.fillRect(-2, -6, 4, 1);
      ctx.fillRect(2,  -7, 1, 1);
      // Rosy cheeks
      ctx.fillStyle = 'rgba(220, 120, 100, 0.5)';
      ctx.fillRect(-4, -8, 2, 2);
      ctx.fillRect(2,  -8, 2, 2);
    } else {
      // Normal: eyes with optional blink
      const isBlinking = this.animFrame === 1 && (this.animTime % 3.5) < 0.12;
      ctx.fillStyle = '#333333';
      if (isBlinking) {
        // Blink — horizontal line
        ctx.fillRect(-3, -9, 2, 1);
        ctx.fillRect(1,  -9, 2, 1);
      } else {
        // Open eyes
        ctx.fillRect(-3, -9, 2, 2);
        ctx.fillRect(1,  -9, 2, 2);
        // Eye shine
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(-3, -9, 1, 1);
        ctx.fillRect(1,  -9, 1, 1);
      }

      // Focused expression when aiming — concentrated brow
      if (this.state === 'aiming') {
        ctx.fillStyle = '#5A3000';
        ctx.fillRect(-3, -10, 2, 1);
        ctx.fillRect(1,  -10, 2, 1);
      }

      // Smile / neutral mouth
      ctx.fillStyle = '#333333';
      if (this.state === 'aiming') {
        // Determined straight line
        ctx.fillRect(-2, -7, 4, 1);
      } else {
        // Slight smile
        ctx.fillRect(-2, -7, 1, 1);
        ctx.fillRect(1,  -7, 1, 1);
        ctx.fillRect(-1, -6, 2, 1);
      }
    }
  }

  _drawHat(ctx) {
    if (this.hat === 'stetson') {
      // Stetson cowboy hat — tan/brown
      // Brim
      ctx.fillStyle = '#8B6914';
      ctx.fillRect(-7, -13, 14, 3);
      // Crown
      ctx.fillStyle = '#7A5A0A';
      ctx.fillRect(-4, -19, 8, 7);
      // Crown highlight
      ctx.fillStyle = '#9B7A1E';
      ctx.fillRect(-4, -19, 8, 2);
      // Hatband
      ctx.fillStyle = '#4A2E00';
      ctx.fillRect(-4, -13, 8, 1);
      // Hat pin / feather
      ctx.fillStyle = COLORS.UNO_RED;
      ctx.fillRect(2, -19, 1, 4);

    } else if (this.hat === 'uno_cap') {
      // UNO branded baseball cap — red
      // Cap body
      ctx.fillStyle = COLORS.UNO_RED;
      ctx.fillRect(-4, -14, 8, 5);
      // Brim extending left (forward-facing)
      ctx.fillStyle = '#A00020';
      ctx.fillRect(-7, -10, 5, 2);
      // Cap button
      ctx.fillStyle = '#0A0A0A';
      ctx.fillRect(-1, -15, 2, 2);
      // "UNO" text area on front panel
      ctx.fillStyle = '#F5F5F5';
      ctx.fillRect(-2, -13, 4, 3);
      // "U" shape in red on white patch
      ctx.fillStyle = COLORS.UNO_RED;
      ctx.fillRect(-2, -13, 1, 2);
      ctx.fillRect(1,  -13, 1, 2);
      ctx.fillRect(-2, -12, 4, 1);

    } else if (this.hat === 'beanie') {
      // UNO beanie — navy with red stripe
      ctx.fillStyle = '#1A2A5E';
      ctx.fillRect(-4, -17, 8, 8);
      // Pom-pom
      ctx.fillStyle = '#C8102E';
      ctx.fillRect(-2, -19, 4, 3);
      // Red stripe
      ctx.fillStyle = COLORS.UNO_RED;
      ctx.fillRect(-4, -13, 8, 2);
      // White stripe
      ctx.fillStyle = '#F5F5F5';
      ctx.fillRect(-4, -11, 8, 1);
      // Ribbing texture (vertical lines)
      ctx.fillStyle = '#263A7A';
      for (let i = -3; i <= 2; i += 2) {
        ctx.fillRect(i, -17, 1, 5);
      }

    } else if (this.hat === 'mortarboard') {
      // Academic mortarboard — graduation cap
      // Cap body
      ctx.fillStyle = '#111111';
      ctx.fillRect(-3, -18, 6, 6);
      // Flat board (square top)
      ctx.fillStyle = '#1A1A1A';
      ctx.fillRect(-7, -13, 14, 2);
      // Board highlight edge
      ctx.fillStyle = '#333333';
      ctx.fillRect(-7, -13, 14, 1);
      // Tassel cord
      ctx.fillStyle = COLORS.GOLD;
      ctx.fillRect(4, -13, 1, 6);
      // Tassel end
      ctx.fillStyle = COLORS.GOLD;
      ctx.fillRect(3, -8, 3, 2);
      ctx.fillRect(3, -7, 1, 1);
      ctx.fillRect(5, -7, 1, 1);
      // UNO seal on front
      ctx.fillStyle = COLORS.UNO_RED;
      ctx.fillRect(-2, -17, 4, 3);
      ctx.fillStyle = '#F5F5F5';
      ctx.fillRect(-1, -16, 2, 1);
    }
  }

  _drawPutter(ctx, aimAngle, flip) {
    ctx.save();

    // When flipped, we need to un-flip aimAngle for correct rotation direction
    const effectiveAngle = flip ? Math.PI - aimAngle : aimAngle;
    ctx.rotate(effectiveAngle);

    // Apply swing rotation: backswing and follow-through
    const swingRotation = this.state === 'swing'
      ? -Math.sin(this.swingPhase * Math.PI) * 1.4
      : 0;
    ctx.rotate(swingRotation);

    // Offset: start putter from hand position
    ctx.translate(2, 4);

    // Putter shaft
    const shaftColor = this.putter === 'hockey' ? '#8B4513'
                     : this.putter === 'lasso'  ? '#CD853F'
                     : '#C0C0C0';
    ctx.fillStyle = shaftColor;
    ctx.fillRect(0, -1, 16, 2);

    // Shaft highlight
    ctx.fillStyle = this.putter === 'hockey' ? '#A0642A' : '#E0E0E0';
    ctx.fillRect(0, -1, 16, 1);

    // Putter head / club type
    if (this.putter === 'lasso') {
      // Lasso loop at end
      ctx.strokeStyle = '#CD853F';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(22, 0, 5, 0, Math.PI * 2);
      ctx.stroke();
      // Lasso knot
      ctx.fillStyle = '#A0642A';
      ctx.fillRect(17, -1, 3, 2);

    } else if (this.putter === 'hockey') {
      // Hockey stick blade
      ctx.fillStyle = '#000000';
      ctx.fillRect(14, -1, 2, 6);
      ctx.fillRect(14,  4, 6, 2);
      // Blade tape
      ctx.fillStyle = COLORS.UNO_RED;
      ctx.fillRect(14, 5, 6, 1);

    } else if (this.putter === 'rail') {
      // Rail gun putter — sci-fi style, heavier head
      ctx.fillStyle = '#666666';
      ctx.fillRect(14, -3, 6, 6);
      ctx.fillStyle = '#888888';
      ctx.fillRect(14, -3, 6, 2);
      // Rail lines
      ctx.fillStyle = '#4488FF';
      ctx.fillRect(15, -2, 1, 5);
      ctx.fillRect(18, -2, 1, 5);

    } else {
      // Default blade putter
      ctx.fillStyle = '#888888';
      ctx.fillRect(14, -2, 5, 4);
      // Face highlight
      ctx.fillStyle = '#BBBBBB';
      ctx.fillRect(14, -2, 5, 1);
      // Heel/hosel
      ctx.fillStyle = '#666666';
      ctx.fillRect(14, -1, 2, 2);
    }

    ctx.restore();
  }

  _drawCelebrationEffect(ctx) {
    // Stars and sparkles shoot outward from body center
    const numStars = 8;
    for (let i = 0; i < numStars; i++) {
      const baseAngle = (i / numStars) * Math.PI * 2;
      const orbit     = baseAngle + this.animTime * 2.5;
      const radius    = 14 + Math.sin(this.animTime * 5 + i) * 5;

      const sx = Math.cos(orbit) * radius;
      const sy = Math.sin(orbit) * radius;

      // Alternating UNO colors
      const colors = [COLORS.GOLD, COLORS.UNO_RED, '#F5F5F5', COLORS.GOLD];
      ctx.fillStyle = colors[i % colors.length];

      // Star shape (4-pointed, drawn as 2 rects)
      const sz = i % 2 === 0 ? 3 : 2;
      ctx.fillRect(sx - sz / 2, sy - 1,      sz, 2);
      ctx.fillRect(sx - 1,      sy - sz / 2, 2,  sz);
    }

    // Small confetti bursts
    const confetti = [
      { dx: -10, dy: -14, color: COLORS.UNO_RED  },
      { dx:  10, dy: -12, color: COLORS.GOLD      },
      { dx:  -8, dy:  -8, color: '#F5F5F5'        },
      { dx:  12, dy:  -6, color: '#7EC882'        },
    ];
    confetti.forEach((c, i) => {
      const wave = Math.sin(this.animTime * 7 + i * 1.3);
      ctx.fillStyle = c.color;
      ctx.fillRect(c.dx + wave * 2, c.dy + Math.abs(wave) * 2, 2, 2);
    });
  }
}
