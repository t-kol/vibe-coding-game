// ============================================================
// MAVERICK MINI GOLF — Renderer.js
// Handles canvas setup, scaling, and draw context access.
// ============================================================

import { CANVAS, COLORS } from './Constants.js';

export class Renderer {
  constructor(canvasEl) {
    this.canvas = canvasEl;
    this.ctx    = canvasEl.getContext('2d');
    this._scale = CANVAS.SCALE;
    this._setupCanvas();
    this._setupResizeHandler();
  }

  _setupCanvas() {
    this.canvas.width  = CANVAS.WIDTH;
    this.canvas.height = CANVAS.HEIGHT;
    // Scale for display
    this.canvas.style.width  = `${CANVAS.WIDTH  * CANVAS.SCALE}px`;
    this.canvas.style.height = `${CANVAS.HEIGHT * CANVAS.SCALE}px`;
    // Crisp pixel rendering
    this.ctx.imageSmoothingEnabled = false;
  }

  _setupResizeHandler() {
    // Fit canvas to window while maintaining aspect ratio.
    // Updates canvas CSS dimensions on every window resize.
    const fit = () => {
      const aspect = CANVAS.WIDTH / CANVAS.HEIGHT;
      const winW   = window.innerWidth;
      const winH   = window.innerHeight;
      let w = winW, h = winW / aspect;
      if (h > winH) { h = winH; w = winH * aspect; }
      this.canvas.style.width  = `${Math.floor(w)}px`;
      this.canvas.style.height = `${Math.floor(h)}px`;
      this._scale = w / CANVAS.WIDTH;
    };
    window.addEventListener('resize', fit);
    fit();
  }

  /** Current CSS-to-canvas pixel ratio (used by Input for mouse coordinate mapping). */
  get scale() { return this._scale; }

  /** The raw 2D rendering context. */
  get ctx2d() { return this.ctx; }

  /**
   * Clear the entire canvas with a solid fill color.
   * @param {string} color - CSS color string (default: UNO_BLACK)
   */
  clear(color = COLORS.UNO_BLACK) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, 0, CANVAS.WIDTH, CANVAS.HEIGHT);
  }

  /**
   * Draw a simple loading / progress screen.
   * @param {number} progress - 0..1
   */
  drawLoading(progress) {
    this.clear();
    const cx = CANVAS.WIDTH  / 2;
    const cy = CANVAS.HEIGHT / 2;

    // Title
    this.ctx.fillStyle  = COLORS.UNO_RED;
    this.ctx.font       = 'bold 12px monospace';
    this.ctx.textAlign  = 'center';
    this.ctx.fillText('MAVERICK MINI GOLF', cx, cy - 20);

    // Progress bar background
    this.ctx.fillStyle = COLORS.HUD_BG;
    this.ctx.fillRect(cx - 50, cy - 4, 100, 8);

    // Progress bar fill
    this.ctx.fillStyle = COLORS.UNO_RED;
    this.ctx.fillRect(cx - 50, cy - 4, 100 * Math.max(0, Math.min(1, progress)), 8);

    // Label
    this.ctx.fillStyle = COLORS.HUD_DIM;
    this.ctx.font      = '6px monospace';
    this.ctx.fillText('LOADING...', cx, cy + 16);
  }
}
