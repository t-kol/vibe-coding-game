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
    this._setupResizeHandler();
  }

  _setupResizeHandler() {
    const fit = () => {
      const dpr = window.devicePixelRatio || 1;

      // Largest integer CSS scale that fits the window (no fractional blurring)
      const cssScaleW = Math.floor(window.innerWidth  / CANVAS.WIDTH);
      const cssScaleH = Math.floor(window.innerHeight / CANVAS.HEIGHT);
      const cssScale  = Math.max(1, Math.min(cssScaleW, cssScaleH));

      const cssW = CANVAS.WIDTH  * cssScale;
      const cssH = CANVAS.HEIGHT * cssScale;
      this.canvas.style.width  = `${cssW}px`;
      this.canvas.style.height = `${cssH}px`;

      // Physical buffer matches actual screen pixels for Retina sharpness
      const physW = Math.round(cssW * dpr);
      const physH = Math.round(cssH * dpr);
      if (this.canvas.width !== physW || this.canvas.height !== physH) {
        this.canvas.width  = physW;
        this.canvas.height = physH;
      }

      // Absolute transform: game coords (320×180) → physical pixels (non-cumulative)
      this.ctx.setTransform(physW / CANVAS.WIDTH, 0, 0, physH / CANVAS.HEIGHT, 0, 0);
      this.ctx.imageSmoothingEnabled = false;

      // For mouse input: CSS pixels → game pixels
      this._scale = cssScale;
    };

    window.addEventListener('resize', fit);
    window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`)
          .addEventListener('change', fit);
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
