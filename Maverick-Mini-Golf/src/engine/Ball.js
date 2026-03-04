// ============================================================
// Maverick Mini Golf — Ball.js
// The golf ball: physics, tile interaction, drawing.
// ============================================================

import { PHYSICS, POWER_BAR, TILE, TILE_SIZE, CANVAS, COLORS } from '../Constants.js';
import { resolveCircleTile, circleIntersectsRect } from './Collision.js';

export class Ball {
  /**
   * @param {number} x  Starting game-pixel X position
   * @param {number} y  Starting game-pixel Y position
   */
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.radius = PHYSICS.BALL_RADIUS;
    this.isMoving = false;
    this.inWater = false;

    /** Consecutive wall hits in current rolling session (for trick shot detection) */
    this.wallHitCount = 0;
    /** Wall hits for the current stroke (resets on launch) */
    this.totalWallHits = 0;

    this.lastSafeX = x;
    this.lastSafeY = y;

    /** Power-up: ball passes through the next obstacle entity it touches */
    this.ghostMode = false;
    /** Power-up: 2× launch speed; consumed on shot */
    this.turboMode = false;
  }

  // ----------------------------------------------------------------
  // Launch
  // ----------------------------------------------------------------

  /**
   * Apply a launch impulse.
   * @param {number} angle  Direction in radians (0 = right)
   * @param {number} power  0..1 launch power fraction
   */
  launch(angle, power) {
    const speed = power * POWER_BAR.MAX_IMPULSE * (this.turboMode ? 2 : 1);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.isMoving = true;
    this.totalWallHits = 0;
    this.wallHitCount = 0;
    this.turboMode = false; // consumed on shot
  }

  // ----------------------------------------------------------------
  // Update
  // ----------------------------------------------------------------

  /**
   * Advance physics by one frame.
   *
   * @param {number[][]} tilemap  2D array [row][col] of TILE values
   * @param {{ vx: number, vy: number }} wind  Wind force vector (game units/frame)
   * @param {{ x: number, y: number }} cup     Cup position in game pixels
   * @returns {{ event: null | 'water' | 'cup' | 'oob' }}
   */
  update(tilemap, wind, cup) {
    if (!this.isMoving) return { event: null };

    // -- Wind influence --
    this.vx += wind.vx * PHYSICS.WIND_SCALE;
    this.vy += wind.vy * PHYSICS.WIND_SCALE;

    // -- Apply friction based on current tile --
    const currentTile = this.getCurrentTile(tilemap);
    const friction = PHYSICS.FRICTION[currentTile] ?? PHYSICS.FRICTION[TILE.GRASS];
    this.vx *= friction;
    this.vy *= friction;

    // -- Move --
    this.x += this.vx;
    this.y += this.vy;

    // -- Tile collision: check neighboring tiles for WALL --
    this._resolveWallCollisions(tilemap);

    // -- Out-of-bounds check (completely outside canvas) --
    const r = this.radius;
    if (
      this.x + r < 0 ||
      this.x - r > CANVAS.WIDTH ||
      this.y + r < 0 ||
      this.y - r > CANVAS.HEIGHT
    ) {
      this.resetToSafe();
      return { event: 'oob' };
    }

    // -- Water / EMPTY tile check --
    const tileAfterMove = this.getCurrentTile(tilemap);
    if (tileAfterMove === TILE.WATER || tileAfterMove === TILE.EMPTY) {
      if (!this.inWater) {
        this.inWater = true;
        this.resetToSafe();
        return { event: 'water' };
      }
    } else {
      this.inWater = false;
      // Save safe position when on stable, solid surface
      if (
        tileAfterMove === TILE.GRASS ||
        tileAfterMove === TILE.BRIDGE ||
        tileAfterMove === TILE.ICE ||
        tileAfterMove === TILE.ROUGH ||
        tileAfterMove === TILE.SAND
      ) {
        this.savePosition();
      }
    }

    // -- Cup detection --
    if (cup) {
      const dx = this.x - cup.x;
      const dy = this.y - cup.y;
      if (Math.sqrt(dx * dx + dy * dy) < PHYSICS.CUP_RADIUS) {
        this.isMoving = false;
        return { event: 'cup' };
      }
    }

    // -- Stop when slow enough --
    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (speed < PHYSICS.MIN_SPEED) {
      this.vx = 0;
      this.vy = 0;
      this.isMoving = false;
      this.wallHitCount = 0;
    }

    return { event: null };
  }

  // ----------------------------------------------------------------
  // Internal helpers
  // ----------------------------------------------------------------

  /**
   * Check all WALL and EMPTY tiles in a 5×5 neighbourhood around the ball
   * and resolve circle-rect collisions for each solid tile.
   * @param {number[][]} tilemap
   */
  _resolveWallCollisions(tilemap) {
    const col = Math.floor(this.x / TILE_SIZE);
    const row = Math.floor(this.y / TILE_SIZE);
    const searchRadius = 2;

    for (let dr = -searchRadius; dr <= searchRadius; dr++) {
      for (let dc = -searchRadius; dc <= searchRadius; dc++) {
        const r = row + dr;
        const c = col + dc;

        // Out-of-tilemap bounds are treated as solid walls
        if (r < 0 || r >= tilemap.length || c < 0 || c >= (tilemap[0]?.length ?? 0)) {
          const rx = c * TILE_SIZE;
          const ry = r * TILE_SIZE;
          const result = resolveCircleTile(this, rx, ry, TILE_SIZE, TILE_SIZE);
          if (result.collided) {
            this.wallHitCount++;
            this.totalWallHits++;
          }
          continue;
        }

        const tileType = tilemap[r][c];
        if (tileType === TILE.WALL || tileType === TILE.EMPTY) {
          const rx = c * TILE_SIZE;
          const ry = r * TILE_SIZE;
          const result = resolveCircleTile(this, rx, ry, TILE_SIZE, TILE_SIZE);
          if (result.collided) {
            this.wallHitCount++;
            this.totalWallHits++;
          }
        }
      }
    }
  }

  // ----------------------------------------------------------------
  // Tile query
  // ----------------------------------------------------------------

  /**
   * Returns the TILE value at the ball's current position.
   * Returns TILE.EMPTY for positions outside the tilemap.
   * @param {number[][]} tilemap
   * @returns {number}
   */
  getCurrentTile(tilemap) {
    const col = Math.floor(this.x / TILE_SIZE);
    const row = Math.floor(this.y / TILE_SIZE);
    if (row < 0 || row >= tilemap.length || col < 0 || col >= (tilemap[0]?.length ?? 0)) {
      return TILE.EMPTY;
    }
    return tilemap[row][col];
  }

  // ----------------------------------------------------------------
  // Safe-position management
  // ----------------------------------------------------------------

  /** Store the current position as the last known safe landing spot. */
  savePosition() {
    this.lastSafeX = this.x;
    this.lastSafeY = this.y;
  }

  /** Teleport ball back to last safe position (penalty recovery). */
  resetToSafe() {
    this.x = this.lastSafeX;
    this.y = this.lastSafeY;
    this.vx = 0;
    this.vy = 0;
    this.isMoving = false;
    this.inWater = false;
  }

  // ----------------------------------------------------------------
  // Rendering
  // ----------------------------------------------------------------

  /**
   * Draw the ball onto the canvas context.
   * Uses pixel-art style: crisp circle, drop shadow, ghost tint.
   * @param {CanvasRenderingContext2D} ctx
   */
  draw(ctx) {
    ctx.save();
    ctx.imageSmoothingEnabled = false;

    const x = Math.round(this.x);
    const y = Math.round(this.y);
    const r = this.radius;

    if (this.ghostMode) {
      // Ghost mode: semi-transparent ball with blue tint
      ctx.globalAlpha = 0.55;

      // Shadow
      ctx.beginPath();
      ctx.arc(x + 1, y + 1, r, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.BALL_SHADOW;
      ctx.fill();

      // Ghost tinted body
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = '#88CCFF'; // blue-white ghost tint
      ctx.fill();

      // Slight inner highlight
      ctx.beginPath();
      ctx.arc(x - 1, y - 1, r * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(200, 230, 255, 0.7)';
      ctx.fill();

      ctx.globalAlpha = 1;
    } else {
      // Normal ball

      // Drop shadow (offset down-right by 1px)
      ctx.beginPath();
      ctx.arc(x + 1, y + 1, r, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.BALL_SHADOW;
      ctx.fill();

      // Ball body
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.BALL; // near-white
      ctx.fill();

      // Small inner highlight to give depth
      ctx.beginPath();
      ctx.arc(x - 1, y - 1, r * 0.42, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.fill();

      // Thin dark outline
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }

    ctx.restore();
  }
}
