// ============================================================
// Maverick Mini Golf — Input.js
// Keyboard and mouse input handler with per-frame justPressed detection.
// ============================================================

import { KEYS } from '../Constants.js';

export class Input {
  /**
   * @param {HTMLCanvasElement} canvas  The game canvas element
   */
  constructor(canvas) {
    /** @type {Object.<string, { down: boolean, justPressed: boolean }>} */
    this._keys = {};

    /**
     * Mouse state in GAME pixel coordinates (already scaled down).
     * @type {{ x: number, y: number, down: boolean, justDown: boolean, justUp: boolean }}
     */
    this._mouse = {
      x: 0,
      y: 0,
      down: false,
      justDown: false,
      justUp: false,
    };

    /** CSS-to-canvas pixel scale factor (CSS pixels / game pixels). */
    this._scale = 1;

    this._canvas = canvas;
    this._attachListeners();
  }

  // ----------------------------------------------------------------
  // Frame lifecycle — call beginFrame() BEFORE game logic,
  //                   endFrame()   AFTER  game logic.
  // ----------------------------------------------------------------

  /**
   * Reset one-shot mouse flags at the start of each frame.
   * Call this BEFORE any game logic reads input.
   */
  beginFrame() {
    this._mouse.justDown = false;
    this._mouse.justUp = false;
  }

  /**
   * Reset one-shot key flags at the end of each frame.
   * Call this AFTER all game logic that reads input.
   */
  endFrame() {
    for (const k in this._keys) {
      this._keys[k].justPressed = false;
    }
  }

  // ----------------------------------------------------------------
  // Key queries
  // ----------------------------------------------------------------

  /**
   * Returns true if any key in the named group is currently held down.
   * @param {string} keyGroup  Key from the KEYS constant (e.g. 'LEFT', 'SHOT')
   * @returns {boolean}
   */
  isDown(keyGroup) {
    return KEYS[keyGroup]?.some(k => this._keys[k]?.down) ?? false;
  }

  /**
   * Returns true if any key in the group was pressed this frame (one-shot).
   * @param {string} keyGroup
   * @returns {boolean}
   */
  justPressed(keyGroup) {
    return KEYS[keyGroup]?.some(k => this._keys[k]?.justPressed) ?? false;
  }

  // ----------------------------------------------------------------
  // Mouse queries (getters so callers use input.mouseX etc.)
  // ----------------------------------------------------------------

  /** True while the primary mouse button is held down. */
  get mouseDown() { return this._mouse.down; }

  /** True for exactly one frame when mouse button is first pressed. */
  get mouseJustDown() { return this._mouse.justDown; }

  /** True for exactly one frame when mouse button is released. */
  get mouseJustUp() { return this._mouse.justUp; }

  /** Current mouse X in game pixel coordinates. */
  get mouseX() { return this._mouse.x; }

  /** Current mouse Y in game pixel coordinates. */
  get mouseY() { return this._mouse.y; }

  // ----------------------------------------------------------------
  // Scale
  // ----------------------------------------------------------------

  /**
   * Update the CSS→game-pixel scale factor.
   * Must match CANVAS.SCALE (or the CSS transform applied to the canvas).
   * @param {number} scale  CSS pixels per game pixel
   */
  setScale(scale) {
    this._scale = scale;
  }

  // ----------------------------------------------------------------
  // Event listeners
  // ----------------------------------------------------------------

  /** Attach all DOM event listeners. Called once in the constructor. */
  _attachListeners() {
    // ---- Keyboard ----
    document.addEventListener('keydown', (e) => {
      const k = e.code;
      if (!this._keys[k]) {
        this._keys[k] = { down: false, justPressed: false };
      }
      if (!this._keys[k].down) {
        // Key was not already held — this is a fresh press
        this._keys[k].justPressed = true;
      }
      this._keys[k].down = true;

      // Prevent arrow keys / space from scrolling the page
      if (
        k === 'Space' ||
        k === 'ArrowLeft' || k === 'ArrowRight' ||
        k === 'ArrowUp'   || k === 'ArrowDown'
      ) {
        e.preventDefault();
      }
    });

    document.addEventListener('keyup', (e) => {
      const k = e.code;
      if (this._keys[k]) {
        this._keys[k].down = false;
        // justPressed is already consumed per-frame; no need to clear here
      }
    });

    // ---- Mouse ----
    document.addEventListener('mousemove', (e) => {
      const rect = this._canvas.getBoundingClientRect();
      this._mouse.x = (e.clientX - rect.left) / this._scale;
      this._mouse.y = (e.clientY - rect.top)  / this._scale;
    });

    document.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return; // Left button only
      const rect = this._canvas.getBoundingClientRect();
      this._mouse.x = (e.clientX - rect.left) / this._scale;
      this._mouse.y = (e.clientY - rect.top)  / this._scale;
      this._mouse.down = true;
      this._mouse.justDown = true;
    });

    document.addEventListener('mouseup', (e) => {
      if (e.button !== 0) return; // Left button only
      this._mouse.down = false;
      this._mouse.justUp = true;
    });

    // ---- Touch (map to mouse so mobile works) ----
    this._canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.changedTouches[0];
      const rect = this._canvas.getBoundingClientRect();
      this._mouse.x = (touch.clientX - rect.left) / this._scale;
      this._mouse.y = (touch.clientY - rect.top)  / this._scale;
      this._mouse.down = true;
      this._mouse.justDown = true;
    }, { passive: false });

    this._canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touch = e.changedTouches[0];
      const rect = this._canvas.getBoundingClientRect();
      this._mouse.x = (touch.clientX - rect.left) / this._scale;
      this._mouse.y = (touch.clientY - rect.top)  / this._scale;
    }, { passive: false });

    this._canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      this._mouse.down = false;
      this._mouse.justUp = true;
    }, { passive: false });

    // ---- Blur — release all held inputs when window loses focus ----
    window.addEventListener('blur', () => {
      for (const k in this._keys) {
        this._keys[k].down = false;
        this._keys[k].justPressed = false;
      }
      this._mouse.down = false;
      this._mouse.justDown = false;
      this._mouse.justUp = false;
    });
  }
}
