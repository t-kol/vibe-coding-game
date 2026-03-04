// ============================================================
// MAVERICK MINI GOLF — main.js
// Entry point imported by index.html.
// Implements the complete game loop state machine.
// ============================================================

import { STATE, MODE, ENTITY, POWERUP, PHYSICS, CANVAS, COLORS, TILE } from './Constants.js';
import { Renderer }    from './Renderer.js';
import { Ball }        from './engine/Ball.js';
import { Wind }        from './engine/Wind.js';
import { PowerBar }    from './engine/PowerBar.js';
import { AimLine }     from './engine/AimLine.js';
import { Input }       from './engine/Input.js';
import { rectsOverlap } from './engine/Collision.js';
import { HoleManager } from './holes/HoleManager.js';
import { Bison }       from './entities/Bison.js';
import { Train }       from './entities/Train.js';
import { Tornado }     from './entities/Tornado.js';
import { BookCart }    from './entities/BookCart.js';
import { Sprinkler }   from './entities/Sprinkler.js';
import { PowerUp }     from './entities/PowerUp.js';
import { Maverick }    from './entities/Maverick.js';
import { Menu }        from './ui/Menu.js';
import { HUD }         from './ui/HUD.js';
import { Scoreboard }  from './ui/Scoreboard.js';
import { Leaderboard } from './ui/Leaderboard.js';
import { HoleIntro }   from './ui/HoleIntro.js';

// ============================================================

class Game {
  constructor() {
    // Obtain the canvas element created in index.html
    const canvasEl = document.getElementById('gameCanvas');

    // ---- Core systems ----
    this.renderer    = new Renderer(canvasEl);
    this.input       = new Input(canvasEl);
    this.holeManager = new HoleManager();

    // ---- Global game state ----
    this.state       = STATE.MENU;
    this.mode        = MODE.NORMAL;
    this.currentHole = 1;           // 1-indexed, 1..9
    this.scores      = [];          // stroke count per completed hole
    this.totalPar    = 0;           // cumulative par so far

    // ---- Per-hole objects ----
    this.ball       = null;
    this.wind       = null;
    this.powerBar   = new PowerBar();
    this.aimLine    = new AimLine();
    this.maverick   = new Maverick();
    this.entities   = [];           // active entity instances for current hole
    this.powerups   = [];           // active power-up instances for current hole
    this.strokes    = 0;            // strokes taken on current hole
    this.activePowerups = [];       // POWERUP type strings collected but not yet consumed
    this.lastBallPos    = null;     // snapshot for LASSO mulligan
    this.lastBallVel    = null;

    // ---- Trick-shot tracking ----
    this.wallHitsThisShot = 0;

    // ---- UI instances ----
    this.menu        = new Menu();
    this.hud         = new HUD();
    this.scoreboard  = new Scoreboard();
    this.leaderboard = new Leaderboard();
    this.holeIntro   = new HoleIntro();

    // Wire up all UI callbacks
    this._setupCallbacks();

    // Kick off the RAF game loop
    this._lastTime = performance.now();
    requestAnimationFrame(this._loop.bind(this));
  }

  // ----------------------------------------------------------
  // Callback wiring
  // ----------------------------------------------------------

  _setupCallbacks() {
    // Main menu → start a new game
    this.menu.onPlay = (mode) => {
      this.mode        = mode;
      this.currentHole = 1;
      this.scores      = [];
      this.totalPar    = 0;
      this._startHole(1);
    };

    // Main menu → show leaderboard
    this.menu.onLeaderboard = () => {
      this.state = STATE.LEADERBOARD;
      this.leaderboard.show();
    };

    // Leaderboard → back to menu
    this.leaderboard.onBack = () => {
      this.leaderboard.hide();
      this.state = STATE.MENU;
    };

    // Hole intro animation finished → begin play
    this.holeIntro.onComplete = () => {
      this.state = STATE.PLAYING;
      this.maverick.setState('idle');
    };

    // Scoreboard "continue" button
    this.scoreboard.onContinue = () => {
      this.scoreboard.hide();
      if (this.state === STATE.HOLE_COMPLETE) {
        if (this.currentHole < 9) {
          this.currentHole++;
          this._startHole(this.currentHole);
        } else {
          this._endGame();
        }
      } else if (this.state === STATE.GAME_OVER) {
        this.state = STATE.MENU;
      }
    };
  }

  // ----------------------------------------------------------
  // Hole management
  // ----------------------------------------------------------

  _startHole(holeNumber) {
    const holeData = this.holeManager.load(holeNumber, this.mode);
    this.totalPar += holeData.par;

    const tee = this.holeManager.getTee();
    this.ball  = new Ball(tee.x, tee.y);
    this.wind  = new Wind(this.mode);

    this.strokes            = 0;
    this.activePowerups     = [];
    this.wallHitsThisShot   = 0;
    this.lastBallPos        = null;
    this.lastBallVel        = null;

    // Spawn dynamic entities for this hole / mode
    const modeData = holeData[this.mode] || holeData.normal;
    const entityCfgs  = modeData.entities  || [];
    const powerupCfgs = modeData.powerups  || [];

    this.entities = entityCfgs
      .map(cfg => this._spawnEntity(cfg))
      .filter(e => e !== null);

    this.powerups = powerupCfgs.map(cfg => new PowerUp(cfg));

    // Skin Maverick for the game mode
    this.maverick.setState('idle');
    this.maverick.skin = this.mode === MODE.BLIZZARD ? 'blizzard' : 'default';

    // Show hole intro overlay
    this.state = STATE.HOLE_INTRO;
    this.holeIntro.show(holeData, this.mode);
  }

  /**
   * Instantiate an entity from a spawn config descriptor.
   * Returns null for unknown types so null-checks in the loop are safe.
   */
  _spawnEntity(cfg) {
    switch (cfg.type) {
      case ENTITY.BISON:     return new Bison(cfg);
      case ENTITY.TRAIN:     return new Train(cfg);
      case ENTITY.TORNADO:   return new Tornado(cfg);
      case ENTITY.BOOK_CART: return new BookCart(cfg);
      case ENTITY.SPRINKLER: return new Sprinkler(cfg);
      default:
        console.warn(`[Game] Unknown entity type: "${cfg.type}" — skipping.`);
        return null;
    }
  }

  // ----------------------------------------------------------
  // Main loop
  // ----------------------------------------------------------

  _loop(timestamp) {
    // Cap dt at 50 ms to prevent spiral-of-death on tab-switch / lag spikes
    const dt = Math.min((timestamp - this._lastTime) / 1000, 0.05);
    this._lastTime = timestamp;

    this.input.beginFrame();
    this._update(dt);
    this._draw();
    this.input.endFrame();

    requestAnimationFrame(this._loop.bind(this));
  }

  // ----------------------------------------------------------
  // Update dispatcher
  // ----------------------------------------------------------

  _update(dt) {
    // Keep input aware of the current CSS↔canvas scale factor
    this.input.setScale(this.renderer.scale);

    switch (this.state) {
      case STATE.MENU:
      case STATE.MODE_SELECT:
        this.menu.update(dt, this.input);
        break;

      case STATE.HOLE_INTRO:
        this.holeIntro.update(dt, this.input);
        break;

      case STATE.PLAYING:
        this._updatePlaying(dt);
        break;

      case STATE.BALL_MOVING:
        this._updateBallMoving(dt);
        break;

      case STATE.HOLE_COMPLETE:
      case STATE.GAME_OVER:
        this.scoreboard.update(dt, this.input);
        break;

      case STATE.LEADERBOARD:
        this.leaderboard.update(dt, this.input);
        break;

      default:
        // Unknown state — do nothing
        break;
    }

    // HUD animations (score popups, messages) update every frame regardless
    this.hud.update(dt);
  }

  // ----------------------------------------------------------
  // PLAYING state — aiming & shooting
  // ----------------------------------------------------------

  _updatePlaying(dt) {
    const ball = this.ball;
    if (!ball) return;

    // ---- Keyboard aiming ----
    if (this.input.isDown('LEFT'))  this.aimLine.turnLeft();
    if (this.input.isDown('RIGHT')) this.aimLine.turnRight();

    // ---- Mouse / touch aiming ----
    if (this.input.mouseDown) {
      const dx = this.input.mouseX - ball.x;
      const dy = this.input.mouseY - ball.y;
      if (Math.sqrt(dx * dx + dy * dy) > 5) {
        this.aimLine.setFromMouse(dx, dy);
      }
    }

    // ---- Power bar: fill while SHOT / mouse held, release on release ----
    if (this.input.isDown('SHOT') || this.input.mouseDown) {
      if (!this.powerBar.filling) this.powerBar.startFill();
    }
    if ((this.input.justPressed('SHOT') || this.input.mouseJustUp) && this.powerBar.filling) {
      this.powerBar.release();
    }
    this.powerBar.update(dt);

    // ---- Consume power → shoot ----
    const launchPower = this.powerBar.consume();
    if (launchPower !== null) {
      this._shoot(launchPower);
      return; // state changed inside _shoot
    }

    // ---- LASSO mulligan (use key U) ----
    // Check raw key directly via isDown if 'U' is mapped, or watch ENTER as fallback.
    // We expose mulligan via a dedicated check so it works without re-mapping KEYS.
    if (this.input.justPressed('ENTER') && this.activePowerups.includes(POWERUP.LASSO)) {
      this._useLasso();
    }

    // ---- Maverick idle animation ----
    this.maverick.update(dt);
  }

  // ----------------------------------------------------------
  // BALL_MOVING state — physics simulation, entity interaction
  // ----------------------------------------------------------

  _updateBallMoving(dt) {
    const ball = this.ball;
    const cup  = this.holeManager.getCup();
    if (!ball || !cup) return;

    // Update wind simulation
    this.wind.update(dt);

    // Apply Tornado suction / repulsion forces *before* ball physics step
    for (const ent of this.entities) {
      if (ent instanceof Tornado && ent.isNearBall(ball)) {
        ent.applyForce(ball);
      }
    }

    // Apply Sprinkler water-jet forces *before* ball physics step
    for (const ent of this.entities) {
      if (ent instanceof Sprinkler) {
        // Sprinkler may expose applyForce if it pushes the ball
        if (typeof ent.applyForce === 'function') {
          ent.applyForce(ball);
        }
      }
    }

    // Advance ball physics (handles friction, wall bounce, cup detection, hazards)
    const result = ball.update(this.holeManager.tilemap, this.wind, cup);

    // Record peak wall-hit count for this shot (trick-shot detection)
    if (ball.totalWallHits > this.wallHitsThisShot) {
      this.wallHitsThisShot = ball.totalWallHits;
    }

    // Update all entities
    for (const ent of this.entities) {
      if (ent) ent.update(dt);
    }

    // ---- Entity–ball collision (solid obstacles, non-ghost mode) ----
    if (!ball.ghostMode) {
      for (const ent of this.entities) {
        if (!ent) continue;
        // Tornados and Sprinklers apply forces, not solid deflections
        if (ent instanceof Tornado || ent instanceof Sprinkler) continue;
        const b = typeof ent.getBounds === 'function' ? ent.getBounds() : null;
        if (b && rectsOverlap(
          ball.x - ball.radius, ball.y - ball.radius, ball.radius * 2, ball.radius * 2,
          b.x, b.y, b.width, b.height
        )) {
          ent.deflectBall(ball);
          ball.isMoving = true; // ensure ball keeps simulating after deflect
        }
      }
    }

    // ---- Power-up collection ----
    for (const pu of this.powerups) {
      if (!pu.collected && pu.checkCollect(ball)) {
        this._applyPowerup(pu.type);
      }
    }
    // Animate power-up sprites (spinning, pulsing, etc.)
    for (const pu of this.powerups) {
      pu.update(dt);
    }

    // ---- Handle ball physics events ----
    if (result.event === 'cup') {
      this._onHoleComplete();
      return;
    }

    if (result.event === 'water' || result.event === 'oob') {
      // Penalty stroke + reset
      this.hud.showMessage('+1 Stroke Penalty', 1.5, COLORS.WATER);
      this.hud.addScorePopup('+1', ball.x, ball.y, COLORS.WATER);
      this.strokes++;
      ball.resetToSafe();
      // Ball is now stationary at safe position — fall through to stop logic below
    }

    // ---- Max strokes per hole ----
    if (this.strokes >= PHYSICS.MAX_STROKES && !ball.isMoving) {
      this.hud.showMessage('MAX STROKES — MOVING ON', 2.0, COLORS.HUD_DIM);
      this._onHoleComplete();
      return;
    }

    // ---- Ball has come to rest ----
    if (!ball.isMoving) {
      // Trick-shot detection: 2+ wall bounces on a single shot
      if (this.wallHitsThisShot >= 2) {
        this.hud.showTrickShot();
      }
      this.wallHitsThisShot = 0;
      this.state = STATE.PLAYING;
      this.maverick.setState('idle');
    }

    this.maverick.update(dt);
  }

  // ----------------------------------------------------------
  // Shooting
  // ----------------------------------------------------------

  _shoot(power) {
    if (!this.ball) return;

    // Snapshot position for LASSO mulligan before launch
    this.lastBallPos = { x: this.ball.x, y: this.ball.y };
    this.lastBallVel = { vx: 0, vy: 0 };

    this.ball.savePosition(); // tell Ball to remember its last safe spot too

    this.ball.launch(this.aimLine.angle, power);
    this.strokes++;
    this.wallHitsThisShot = 0;
    this.wind.onShot();
    this.maverick.setState('swing');
    this.state = STATE.BALL_MOVING;

    // Consume WHIRLWIND power-up: double speed this shot
    if (this.activePowerups.includes(POWERUP.WHIRLWIND)) {
      this.ball.turboMode = true;
      this.activePowerups = this.activePowerups.filter(p => p !== POWERUP.WHIRLWIND);
    }
  }

  // ----------------------------------------------------------
  // LASSO (Mulligan) — undo last shot
  // ----------------------------------------------------------

  _useLasso() {
    if (!this.lastBallPos) return;
    if (!this.activePowerups.includes(POWERUP.LASSO)) return;

    // Remove the power-up
    this.activePowerups = this.activePowerups.filter(p => p !== POWERUP.LASSO);

    // Restore ball position and undo the stroke count
    this.ball.x  = this.lastBallPos.x;
    this.ball.y  = this.lastBallPos.y;
    this.ball.vx = 0;
    this.ball.vy = 0;
    this.ball.isMoving   = false;
    this.ball.ghostMode  = false;
    this.ball.turboMode  = false;
    this.strokes         = Math.max(0, this.strokes - 1);

    this.lastBallPos = null;
    this.lastBallVel = null;

    this.hud.showMessage('MULLIGAN!', 1.5, COLORS.GOLD);
    this.state = STATE.PLAYING;
    this.maverick.setState('idle');
  }

  // ----------------------------------------------------------
  // Power-up application
  // ----------------------------------------------------------

  _applyPowerup(type) {
    switch (type) {
      case POWERUP.COWBOY_HAT:
        // Ghost mode: ball passes through solid obstacles for one shot
        this.ball.ghostMode = true;
        this.hud.showMessage('GHOST BALL!', 1.5, COLORS.BALL);
        break;

      case POWERUP.GOLD_STAR:
        // Guidance arrow: AimLine shows extended path (handled by AimLine.draw internals)
        this.hud.showMessage('GUIDANCE ARROW!', 1.5, COLORS.GOLD);
        // Store flag for AimLine to pick up via a property if needed
        this.ball.guidanceMode = true;
        break;

      case POWERUP.LASSO:
        // Store for manual use (press ENTER / U)
        if (!this.activePowerups.includes(POWERUP.LASSO)) {
          this.activePowerups.push(POWERUP.LASSO);
          this.hud.showMessage('MULLIGAN READY! (Enter)', 1.5, COLORS.GOLD);
        }
        break;

      case POWERUP.SNOWFLAKE:
        // Freeze all hazard entities for 5 seconds
        for (const ent of this.entities) {
          if (ent && typeof ent.freeze === 'function') ent.freeze(5);
        }
        this.hud.showMessage('HAZARDS FROZEN! (5s)', 1.5, COLORS.ICE);
        break;

      case POWERUP.WHIRLWIND:
        // Store for next shot consumption
        if (!this.activePowerups.includes(POWERUP.WHIRLWIND)) {
          this.activePowerups.push(POWERUP.WHIRLWIND);
          this.hud.showMessage('TURBO READY!', 1.5, COLORS.POWER_BAR_WARN);
        }
        break;

      default:
        console.warn(`[Game] Unknown powerup type: "${type}"`);
        break;
    }
  }

  // ----------------------------------------------------------
  // Hole complete
  // ----------------------------------------------------------

  _onHoleComplete() {
    const holeData = this.holeManager.current;
    if (!holeData) return;

    const par = holeData.par;

    // Maverick reaction
    if (this.strokes === 1) {
      this.hud.showHoleInOne();
      this.maverick.setState('celebrate');
    } else if (this.strokes < par) {
      this.maverick.setState('celebrate');
    } else if (this.strokes > par + 1) {
      this.maverick.setState('frustrated');
    } else {
      this.maverick.setState('idle');
    }

    // Special: goal horn for hole 4 (arena theme) when ≤ 2 strokes
    if (this.currentHole === 4 && this.strokes <= 2) {
      this.hud.showGoalHorn();
    }

    // Record score
    this.scores.push(this.strokes);

    // Compute running totals for scoreboard display
    const totalStrokes = this.scores.reduce((a, b) => a + b, 0);
    const runningPar   = this.holeManager.holes
      .slice(0, this.scores.length)
      .reduce((acc, h) => acc + h.par, 0);

    this.state = STATE.HOLE_COMPLETE;
    this.scoreboard.show('hole', {
      holeNumber:   this.currentHole,
      holeName:     holeData.name,
      par,
      strokes:      this.strokes,
      totalStrokes,
      totalPar:     runningPar,
    });
  }

  // ----------------------------------------------------------
  // Game over (all 9 holes done)
  // ----------------------------------------------------------

  _endGame() {
    const totalStrokes = this.scores.reduce((a, b) => a + b, 0);
    const totalPar     = this.holeManager.holes
      .slice(0, 9)
      .reduce((acc, h) => acc + h.par, 0);
    const overPar = totalStrokes - totalPar;

    // Letter grade
    let grade = 'D';
    if      (overPar <= -3) grade = 'S';
    else if (overPar <=  0) grade = 'A';
    else if (overPar <=  4) grade = 'B';
    else if (overPar <=  8) grade = 'C';

    // Celebration if under par overall
    if (totalStrokes < totalPar) {
      this.maverick.setState('celebrate');
    }

    this.state = STATE.GAME_OVER;
    this.scoreboard.show('game', {
      scores: this.scores.map((s, i) => ({
        hole:    i + 1,
        name:    this.holeManager.holes[i].name,
        par:     this.holeManager.holes[i].par,
        strokes: s,
      })),
      totalStrokes,
      totalPar,
      grade,
    });

    // Persist to leaderboard
    this.leaderboard.addScore('MAVERICK', totalStrokes, totalPar, grade, this.mode);
  }

  // ----------------------------------------------------------
  // Draw dispatcher
  // ----------------------------------------------------------

  _draw() {
    const ctx = this.renderer.ctx2d;

    switch (this.state) {
      case STATE.MENU:
        this.renderer.clear(COLORS.UNO_BLACK);
        this.menu.draw(ctx);
        break;

      case STATE.MODE_SELECT:
        this.renderer.clear(COLORS.UNO_BLACK);
        this.menu.drawModeSelect(ctx);
        break;

      case STATE.HOLE_INTRO:
        // Render hole behind the overlay so players see where they are
        this._drawHoleScene(ctx);
        this.holeIntro.draw(ctx);
        break;

      case STATE.PLAYING:
      case STATE.BALL_MOVING:
        this._drawHoleScene(ctx);
        this._drawGameHUD(ctx);
        break;

      case STATE.HOLE_COMPLETE:
        // Keep hole visible behind the score card
        this._drawHoleScene(ctx);
        this.scoreboard.draw(ctx);
        break;

      case STATE.GAME_OVER:
        this.renderer.clear(COLORS.UNO_BLACK);
        this.scoreboard.draw(ctx);
        break;

      case STATE.LEADERBOARD:
        this.renderer.clear(COLORS.UNO_BLACK);
        this.leaderboard.draw(ctx);
        break;

      default:
        this.renderer.clear(COLORS.UNO_BLACK);
        break;
    }
  }

  // ----------------------------------------------------------
  // Hole scene (background + tiles + entities + ball + Maverick)
  // ----------------------------------------------------------

  _drawHoleScene(ctx) {
    const hd = this.holeManager.current;
    if (!hd) return;

    // Background sky / terrain fill
    this.holeManager.drawBackground(ctx, hd.theme, this.mode);

    // Tile grid (grass, walls, water, ice, sand, etc.)
    this.holeManager.drawTiles(ctx);

    // Entities drawn behind the ball
    for (const ent of this.entities) {
      if (ent) ent.draw(ctx);
    }

    // Power-ups (uncollected)
    for (const pu of this.powerups) {
      pu.draw(ctx);
    }

    // Aim line & power bar only visible while player is aiming
    if (this.state === STATE.PLAYING && this.ball) {
      this.aimLine.draw(
        ctx,
        this.ball.x,
        this.ball.y,
        this.powerBar.value,
        this.wind,
        this.holeManager.tilemap
      );
      this.powerBar.draw(ctx);
    }

    // Ball
    if (this.ball) this.ball.draw(ctx);

    // Maverick character — offset behind the ball along the aim direction
    if (this.ball && this.maverick) {
      const angle   = this.aimLine.angle;
      const offsetX = -Math.cos(angle) * 14;
      const offsetY = -Math.sin(angle) * 14;
      this.maverick.draw(ctx, this.ball.x + offsetX, this.ball.y + offsetY, angle);
    }
  }

  // ----------------------------------------------------------
  // In-game HUD overlay (strokes, par, wind, power-ups)
  // ----------------------------------------------------------

  _drawGameHUD(ctx) {
    const hd = this.holeManager.current;
    if (!hd) return;

    // Running totals across all holes played so far
    const totalStrokes = this.scores.reduce((a, b) => a + b, 0) + this.strokes;
    const runningPar   = this.holeManager.holes
      .slice(0, this.currentHole - 1)
      .reduce((acc, h) => acc + h.par, 0);

    this.hud.draw(ctx, {
      holeNumber:    this.currentHole,
      par:           hd.par,
      strokes:       this.strokes,
      totalStrokes,
      totalPar:      runningPar + hd.par,
      mode:          this.mode,
      activePowerups: this.activePowerups,
    }, this.wind);

    // Wind / weather vane indicator in the bottom-left corner
    this.wind.draw(ctx, 6, CANVAS.HEIGHT - 38, 30);
  }
}

// ============================================================
// Bootstrap — wait for DOM then start the game
// ============================================================

window.addEventListener('DOMContentLoaded', () => {
  new Game();
});
