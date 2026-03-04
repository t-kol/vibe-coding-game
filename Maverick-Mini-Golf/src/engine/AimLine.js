// ============================================================
// Maverick Mini Golf — AimLine.js
// Projected aim dots accounting for wind drift.
// Stops dots at WALL / EMPTY tiles.
// ============================================================

import { AIM, COLORS, PHYSICS, TILE, TILE_SIZE } from '../Constants.js';

export class AimLine {
  constructor() {
    this.angle = 0;    // current aim angle in radians (0 = right)
    this.visible = true;
  }

  // ----------------------------------------------------------------
  // Angle control (keyboard)
  // ----------------------------------------------------------------

  /** Rotate aim left by AIM.TURN_SPEED degrees (one frame). */
  turnLeft() {
    this.angle -= AIM.TURN_SPEED * (Math.PI / 180);
  }

  /** Rotate aim right by AIM.TURN_SPEED degrees (one frame). */
  turnRight() {
    this.angle += AIM.TURN_SPEED * (Math.PI / 180);
  }

  // ----------------------------------------------------------------
  // Mouse control
  // ----------------------------------------------------------------

  /**
   * Point the aim line from the ball toward the mouse cursor.
   * @param {number} dx  Mouse X minus ball X (in game pixels)
   * @param {number} dy  Mouse Y minus ball Y (in game pixels)
   */
  setFromMouse(dx, dy) {
    this.angle = Math.atan2(dy, dx);
  }

  // ----------------------------------------------------------------
  // Rendering
  // ----------------------------------------------------------------

  /**
   * Draw the projected aim dots from the ball's position.
   * Simulates future ball trajectory step-by-step, bending with wind.
   * Stops if a dot lands inside a WALL or EMPTY tile.
   *
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} ballX      Ball centre X in game pixels
   * @param {number} ballY      Ball centre Y in game pixels
   * @param {number} power      Current power 0..1 (affects how many dots appear)
   * @param {{ vx: number, vy: number }} wind  Wind force vector
   * @param {number[][]} tilemap  2D tile array for wall detection
   */
  draw(ctx, ballX, ballY, power, wind, tilemap) {
    if (!this.visible) return;

    ctx.save();
    ctx.imageSmoothingEnabled = false;

    // Direction unit vector
    const dirX = Math.cos(this.angle);
    const dirY = Math.sin(this.angle);

    // Simulate dot positions along the aim line
    // Accumulated position (game pixels, floating)
    let dotX = ballX;
    let dotY = ballY;

    // Accumulated wind drift (grows with each step, simulating ball travel)
    let driftX = 0;
    let driftY = 0;

    // Number of visible dots scales a little with power (min 3, max AIM.DOTS)
    const visibleDots = Math.max(3, Math.round(power * AIM.DOTS));

    for (let i = 0; i < AIM.DOTS; i++) {
      // Advance one step along the aim direction
      dotX += dirX * AIM.DOT_SPACING;
      dotY += dirY * AIM.DOT_SPACING;

      // Accumulate wind drift (WIND_SCALE controls how much drift per step)
      driftX += wind.vx * PHYSICS.WIND_SCALE * AIM.DOT_SPACING * 1.5;
      driftY += wind.vy * PHYSICS.WIND_SCALE * AIM.DOT_SPACING * 1.5;

      const px = dotX + driftX;
      const py = dotY + driftY;

      // --- Wall / EMPTY tile check ---
      const col = Math.floor(px / TILE_SIZE);
      const row = Math.floor(py / TILE_SIZE);

      if (
        row < 0 || row >= tilemap.length ||
        col < 0 || col >= (tilemap[0]?.length ?? 0)
      ) {
        break; // Out of map bounds — stop
      }

      const tileType = tilemap[row][col];
      if (tileType === TILE.WALL || tileType === TILE.EMPTY) {
        // Draw a small 'X' impact marker and stop
        this._drawImpactMark(ctx, px, py);
        break;
      }

      // --- Dot opacity fades with distance ---
      const t = i / (AIM.DOTS - 1);       // 0 (near ball) → 1 (far)
      const alpha = i < visibleDots
        ? 0.9 * (1 - t * 0.65)             // Fade to ~35% by last dot
        : 0;

      if (alpha <= 0) continue;

      // --- Dot colour: tinted red near ball, white further away ---
      // Use wind tint colour when wind is strong
      const windStrength = Math.sqrt(wind.vx * wind.vx + wind.vy * wind.vy);
      let dotColor;
      if (windStrength > 0.3 && i > 3) {
        // Wind tint on farther dots to show drift
        dotColor = `rgba(200,16,46,${alpha})`;  // AIM_WIND_TINT style
      } else {
        dotColor = `rgba(245,245,245,${alpha})`; // Near-white
      }

      ctx.beginPath();
      ctx.arc(Math.round(px), Math.round(py), AIM.DOT_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = dotColor;
      ctx.fill();
    }

    // ---- Arrowhead at the end of the aim line (near ball, strong direction cue) ----
    this._drawArrowhead(ctx, ballX, ballY, dirX, dirY, power);

    ctx.restore();
  }

  // ----------------------------------------------------------------
  // Internal draw helpers
  // ----------------------------------------------------------------

  /**
   * Draw a small arrowhead pointing in (dirX, dirY) near the ball.
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} bx
   * @param {number} by
   * @param {number} dirX  Normalised direction X
   * @param {number} dirY  Normalised direction Y
   * @param {number} power  0..1
   */
  _drawArrowhead(ctx, bx, by, dirX, dirY, power) {
    const dist = 8 + power * 4; // arrow sits 8-12px from ball
    const tipX = bx + dirX * dist;
    const tipY = by + dirY * dist;
    const headLen = 4;
    const headW = 2;

    const perpX = -dirY;
    const perpY =  dirX;

    const baseX = tipX - dirX * headLen;
    const baseY = tipY - dirY * headLen;

    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(baseX + perpX * headW, baseY + perpY * headW);
    ctx.lineTo(baseX - perpX * headW, baseY - perpY * headW);
    ctx.closePath();
    ctx.fillStyle = COLORS.AIM_DOT;
    ctx.fill();
  }

  /**
   * Draw a small X mark where the aim line hits a wall.
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} px
   * @param {number} py
   */
  _drawImpactMark(ctx, px, py) {
    const s = 2;
    ctx.strokeStyle = COLORS.AIM_WIND_TINT;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px - s, py - s);
    ctx.lineTo(px + s, py + s);
    ctx.moveTo(px + s, py - s);
    ctx.lineTo(px - s, py + s);
    ctx.stroke();
  }
}
