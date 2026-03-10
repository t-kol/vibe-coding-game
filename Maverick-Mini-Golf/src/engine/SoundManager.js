// ============================================================
// Maverick Mini Golf — SoundManager.js
// All SFX synthesized via Web Audio API — no audio files needed.
// AudioContext is created on the first call to unlock autoplay.
// ============================================================

export class SoundManager {
  constructor() {
    this._ctx       = null;
    this.muted      = false;

    // Rolling ball: persistent nodes while ball is moving
    this._rollSrc   = null;
    this._rollGain  = null;
    this._rollFilter = null;
  }

  // ----------------------------------------------------------
  // Public API
  // ----------------------------------------------------------

  toggle() { this.muted = !this.muted; }

  /** Putter swing when shot is released. */
  swing() {
    this._woosh(600, 120, 0.18, 0.22);
  }

  /** Ball bounces off a wall tile. */
  wallBounce() {
    this._click(880, 0.12, 0.07);
  }

  /** Ball rolls into water hazard. */
  waterSplash() {
    this._noise(0.5, 0.28, 600, 'lowpass');
    this._osc('sine', 200, 0.35, 0.18, 0.01);
  }

  /** Ball drops into the cup. */
  cupIn() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((f, i) => this._scheduleNote('sine', f, 0.3, 0.28, 0.01, i * 80));
  }

  /** Hole-in-one fanfare. */
  holeInOne() {
    const melody = [523, 659, 784, 1047, 1319, 784, 1047, 1319, 1568];
    melody.forEach((f, i) => this._scheduleNote('square', f, 0.22, 0.22, 0.01, i * 90));
  }

  /** Goal horn for hole 4 (Baxter Arena) when ≤ 2 strokes. */
  goalHorn() {
    this._osc('sawtooth', 110, 0.8, 0.42, 0.02);
    this._scheduleOsc('sawtooth', 165, 0.7, 0.35, 0.02, 80);
    this._scheduleOsc('sawtooth', 220, 0.5, 0.25, 0.02, 200);
  }

  /** Trick shot banner sound (ascending scale). */
  trickShot() {
    [440, 554, 659, 880].forEach((f, i) => this._scheduleNote('square', f, 0.14, 0.22, 0.005, i * 60));
  }

  /** Power-up collected. */
  powerupCollect() {
    this._note('sine', 880, 0.18, 0.28, 0.005);
    this._scheduleNote('sine', 1320, 0.15, 0.25, 0.005, 110);
  }

  /** Penalty stroke (water / OOB). */
  penalty() {
    const ctx = this._ctx || this._getCtx();
    if (!ctx) return;
    this._sweepOsc('sawtooth', 380, 95, 0.45, 0.32);
  }

  /** Bison deflects the ball. */
  bison() {
    this._noise(0.25, 0.22, 250, 'lowpass');
    this._osc('sawtooth', 55, 0.28, 0.25, 0.01);
  }

  /** Train whistle. */
  trainWhistle() {
    [900, 1100, 900, 700].forEach((f, i) => this._scheduleNote('sine', f, 0.18, 0.28, 0.01, i * 140));
  }

  /** Tornado whoosh (short burst). */
  tornadoWhoosh() {
    this._noise(0.6, 0.18, 1200, 'highpass');
    this._sweepOsc('sine', 200, 400, 0.5, 0.14);
  }

  /** Mulligan / lasso used. */
  mulligan() {
    this._sweepOsc('sine', 220, 660, 0.3, 0.22);
    this._scheduleNote('sine', 880, 0.2, 0.18, 0.01, 320);
  }

  // ----------------------------------------------------------
  // Rolling ball: continuous filtered noise
  // ----------------------------------------------------------

  startRolling() {
    if (this._rollSrc || this.muted) return;
    const ctx = this._getCtx();
    if (!ctx) return;

    // 1-second buffer of white noise, looped
    const bufLen = ctx.sampleRate;
    const buf    = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const data   = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;

    this._rollSrc    = ctx.createBufferSource();
    this._rollFilter = ctx.createBiquadFilter();
    this._rollGain   = ctx.createGain();

    this._rollSrc.buffer    = buf;
    this._rollSrc.loop      = true;

    this._rollFilter.type            = 'bandpass';
    this._rollFilter.frequency.value = 300;
    this._rollFilter.Q.value         = 4;

    this._rollGain.gain.setValueAtTime(0.001, ctx.currentTime);
    this._rollGain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 0.08);

    this._rollSrc.connect(this._rollFilter);
    this._rollFilter.connect(this._rollGain);
    this._rollGain.connect(ctx.destination);
    this._rollSrc.start();
  }

  /** Update rolling volume based on ball speed (call every frame). */
  setRollSpeed(speed) {
    if (!this._rollGain || !this._ctx) return;
    const vol = Math.min(0.13, speed * 0.012);
    this._rollGain.gain.setTargetAtTime(vol, this._ctx.currentTime, 0.04);
    // Shift filter frequency with speed for pitch variety
    if (this._rollFilter) {
      const freq = 150 + speed * 18;
      this._rollFilter.frequency.setTargetAtTime(freq, this._ctx.currentTime, 0.04);
    }
  }

  stopRolling() {
    if (!this._rollSrc || !this._ctx) return;
    const ctx = this._ctx;
    this._rollGain.gain.setTargetAtTime(0.001, ctx.currentTime, 0.06);
    const src = this._rollSrc;
    setTimeout(() => { try { src.stop(); } catch (_) {} }, 200);
    this._rollSrc   = null;
    this._rollGain  = null;
    this._rollFilter = null;
  }

  // ----------------------------------------------------------
  // Internal helpers
  // ----------------------------------------------------------

  _getCtx() {
    if (this._ctx) return this._ctx;
    try {
      this._ctx = new (window.AudioContext || window.webkitAudioContext)();
      return this._ctx;
    } catch (_) {
      return null;
    }
  }

  /** Resume context on first user gesture (handles autoplay policy). */
  _resume() {
    if (this._ctx && this._ctx.state === 'suspended') {
      this._ctx.resume().catch(() => {});
    }
  }

  /** Basic oscillator burst. */
  _osc(type, freq, duration, gain, attack) {
    if (this.muted) return;
    const ctx = this._getCtx();
    if (!ctx) return;
    this._resume();
    const osc = ctx.createOscillator();
    const g   = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0, ctx.currentTime);
    g.gain.linearRampToValueAtTime(gain, ctx.currentTime + attack);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(g); g.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + duration + 0.05);
  }

  /** Convenience: one-shot note (same as _osc). */
  _note(type, freq, duration, gain, attack) {
    this._osc(type, freq, duration, gain, attack);
  }

  /** Schedule a note to start after `delayMs` milliseconds. */
  _scheduleNote(type, freq, duration, gain, attack, delayMs) {
    if (this.muted) return;
    setTimeout(() => this._note(type, freq, duration, gain, attack), delayMs);
  }

  /** Schedule an oscillator burst after `delayMs` ms. */
  _scheduleOsc(type, freq, duration, gain, attack, delayMs) {
    if (this.muted) return;
    setTimeout(() => this._osc(type, freq, duration, gain, attack), delayMs);
  }

  /** Frequency sweep (pitch slide). */
  _sweepOsc(type, freqStart, freqEnd, duration, gain) {
    if (this.muted) return;
    const ctx = this._getCtx();
    if (!ctx) return;
    this._resume();
    const osc = ctx.createOscillator();
    const g   = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freqStart, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 10), ctx.currentTime + duration);
    g.gain.setValueAtTime(gain, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(g); g.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + duration + 0.05);
  }

  /** White-noise burst with a filter. */
  _noise(duration, gain, filterFreq, filterType = 'lowpass') {
    if (this.muted) return;
    const ctx = this._getCtx();
    if (!ctx) return;
    this._resume();
    const bufLen = Math.ceil(ctx.sampleRate * duration);
    const buf    = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const data   = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;
    const src    = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const g      = ctx.createGain();
    src.buffer       = buf;
    filter.type      = filterType;
    filter.frequency.value = filterFreq;
    g.gain.setValueAtTime(gain, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    src.connect(filter); filter.connect(g); g.connect(ctx.destination);
    src.start();
  }

  /** Quick click / impact sound (square wave pop). */
  _click(freq, gain, duration) {
    if (this.muted) return;
    const ctx = this._getCtx();
    if (!ctx) return;
    this._resume();
    const osc = ctx.createOscillator();
    const g   = ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = freq;
    g.gain.setValueAtTime(gain, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(g); g.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + duration + 0.01);
  }

  /** Woosh: noise + pitch sweep combo. */
  _woosh(freqStart, freqEnd, duration, noiseGain) {
    if (this.muted) return;
    this._noise(duration, noiseGain, 3000, 'highpass');
    this._sweepOsc('sine', freqStart, freqEnd, duration, 0.15);
  }
}
