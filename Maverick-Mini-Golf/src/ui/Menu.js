import { COLORS, CANVAS, MODE, STATE } from '../Constants.js';

export class Menu {
  constructor() {
    this.state = 'main'; // 'main' | 'modeSelect'
    this.selectedIndex = 0;
    this.animTime = 0;
    this.logoAnim = 0;
    this.stars = this._generateStars(40);
    this.onPlay = null;        // callback(mode) — set by main game
    this.onLeaderboard = null; // callback()

    // Bouncing ball state
    this._ballX = CANVAS.WIDTH / 2;
    this._ballY = CANVAS.HEIGHT - 28;
    this._ballVX = 38;
    this._ballVY = -22;
    this._ballGravity = 60; // pixels per second^2 (screen gravity for animation)

    // Input debounce
    this._prevUp = false;
    this._prevDown = false;
    this._prevEnter = false;
    this._prevClick = false;

    // Mode select state
    this._modeSelectedIndex = 0;
    this._modeItems = [
      { mode: MODE.NORMAL,   label: 'A DAY AT ELMWOOD PARK',  sub: 'NORMAL MODE',   desc: ['Sunny skies over Elmwood.', 'Classic mini golf fun!'] },
      { mode: MODE.BLIZZARD, label: 'THE FRONTIER AWAKENS',   sub: 'BLIZZARD MODE', desc: ['A blizzard hits the plains.', 'Slippery, windy, wild!'] },
    ];
  }

  _generateStars(n) {
    return Array.from({ length: n }, () => ({
      x: Math.random() * CANVAS.WIDTH,
      y: Math.random() * CANVAS.HEIGHT,
      size: Math.random() < 0.3 ? 2 : 1,
      twinkle: Math.random() * Math.PI * 2,
    }));
  }

  update(dt, input) {
    this.animTime += dt;
    this.logoAnim = Math.sin(this.animTime * 1.5) * 2;
    this.stars.forEach(s => (s.twinkle += dt * 2));

    // Bouncing ball physics (for menu animation)
    this._ballX += this._ballVX * dt;
    this._ballY += this._ballVY * dt;
    this._ballVY += this._ballGravity * dt;
    const floorY = CANVAS.HEIGHT - 28;
    if (this._ballY >= floorY) {
      this._ballY = floorY;
      this._ballVY = -Math.abs(this._ballVY) * 0.72;
      if (Math.abs(this._ballVY) < 8) this._ballVY = -22;
    }
    if (this._ballX < 8 || this._ballX > CANVAS.WIDTH - 8) {
      this._ballVX *= -1;
      this._ballX = Math.max(8, Math.min(CANVAS.WIDTH - 8, this._ballX));
    }

    if (this.state === 'main') {
      this._handleMain(input);
    } else if (this.state === 'modeSelect') {
      this._handleModeSelect(input);
    }
  }

  _handleMain(input) {
    const upNow    = input.justPressed('UP');
    const downNow  = input.justPressed('DOWN');
    const enterNow = input.justPressed('SHOT') || input.justPressed('ENTER');
    const clickNow = input.mouseJustDown;

    const menuItems = 2; // PLAY, LEADERBOARD

    if (upNow)   this.selectedIndex = (this.selectedIndex - 1 + menuItems) % menuItems;
    if (downNow) this.selectedIndex = (this.selectedIndex + 1) % menuItems;

    // Check mouse hover for button selection
    if (input.mouseX !== undefined && input.mouseY !== undefined) {
      const btnY1 = 110;
      const btnY2 = 128;
      const btnW  = 90;
      const btnX  = (CANVAS.WIDTH - btnW) / 2;
      if (input.mouseX >= btnX && input.mouseX <= btnX + btnW) {
        if (input.mouseY >= btnY1 && input.mouseY <= btnY1 + 14) this.selectedIndex = 0;
        if (input.mouseY >= btnY2 && input.mouseY <= btnY2 + 14) this.selectedIndex = 1;
      }
    }

    if (enterNow || clickNow) {
      if (this.selectedIndex === 0) {
        this.state = 'modeSelect';
        this._modeSelectedIndex = 0;
      } else if (this.selectedIndex === 1) {
        this.onLeaderboard?.();
      }
    }
  }

  _handleModeSelect(input) {
    const leftNow  = input.justPressed('LEFT');
    const rightNow = input.justPressed('RIGHT');
    const upNow    = input.justPressed('UP');
    const downNow  = input.justPressed('DOWN');
    const enterNow = input.justPressed('SHOT') || input.justPressed('ENTER');
    const escNow   = input.justPressed('ESC');
    const clickNow = input.mouseJustDown;

    if (leftNow || upNow)   this._modeSelectedIndex = 0;
    if (rightNow || downNow) this._modeSelectedIndex = 1;

    // Mouse hover detection
    if (input.mouseX !== undefined && input.mouseY !== undefined) {
      const panelW = 110;
      const gap    = 10;
      const totalW = panelW * 2 + gap;
      const startX = (CANVAS.WIDTH - totalW) / 2;
      const panelY = 60;
      const panelH = 90;
      if (input.mouseY >= panelY && input.mouseY <= panelY + panelH) {
        if (input.mouseX >= startX && input.mouseX <= startX + panelW) this._modeSelectedIndex = 0;
        if (input.mouseX >= startX + panelW + gap && input.mouseX <= startX + totalW) this._modeSelectedIndex = 1;
      }
    }

    if (escNow) {
      this.state = 'main';
      return;
    }

    if (enterNow || clickNow) {
      const chosen = this._modeItems[this._modeSelectedIndex];
      this.onPlay?.(chosen.mode);
    }
  }

  draw(ctx) {
    if (this.state === 'modeSelect') {
      this.drawModeSelect(ctx);
      return;
    }

    // --- Background sky ---
    ctx.fillStyle = '#0A0A1A';
    ctx.fillRect(0, 0, CANVAS.WIDTH, CANVAS.HEIGHT);

    // --- Stars ---
    this.stars.forEach(s => {
      const bright = 0.5 + 0.5 * Math.sin(s.twinkle);
      const alpha  = 0.4 + bright * 0.6;
      ctx.fillStyle = `rgba(245,245,245,${alpha.toFixed(2)})`;
      ctx.fillRect(s.x, s.y, s.size, s.size);
    });

    // --- Nebraska plains silhouette (pixel hills at bottom) ---
    this._drawPlainsSilhouette(ctx);

    // --- Longhorn silhouette above title ---
    this._drawLonghornSilhouette(ctx, CANVAS.WIDTH / 2, 28);

    // --- "MAVERICK MINI GOLF" pixel title ---
    const titleY = 52 + Math.round(this.logoAnim);
    this._drawPixelTitle(ctx, titleY);

    // --- Subtitle ---
    ctx.fillStyle = COLORS.HUD_DIM;
    ctx.font = '6px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('ELMWOOD PARK GOLF COURSE', CANVAS.WIDTH / 2, titleY + 30);
    ctx.fillStyle = '#7A7A7A';
    ctx.fillText('UNIVERSITY OF NEBRASKA OMAHA', CANVAS.WIDTH / 2, titleY + 38);

    // --- Menu buttons ---
    const btnW    = 90;
    const btnX    = (CANVAS.WIDTH - btnW) / 2;
    const btn1Y   = 110;
    const btn2Y   = 128;
    this._drawButton(ctx, 'PLAY',         btnX, btn1Y, btnW, this.selectedIndex === 0);
    this._drawButton(ctx, 'LEADERBOARD',  btnX, btn2Y, btnW, this.selectedIndex === 1);

    // --- Navigational hint ---
    if (Math.sin(this.animTime * 3) > 0) {
      ctx.fillStyle = COLORS.HUD_DIM;
      ctx.font = '6px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('ARROW KEYS / CLICK TO SELECT', CANVAS.WIDTH / 2, CANVAS.HEIGHT - 8);
    }

    // --- Animated bouncing golf ball ---
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(this._ballX, CANVAS.HEIGHT - 22, 5, 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.BALL;
    ctx.beginPath();
    ctx.arc(this._ballX, this._ballY, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(200,200,200,0.5)';
    ctx.beginPath();
    ctx.arc(this._ballX - 1, this._ballY - 1, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawPlainsSilhouette(ctx) {
    // Rolling Nebraska plains — dark silhouette at bottom
    ctx.fillStyle = '#141A0A';
    const floorY = CANVAS.HEIGHT - 22;
    ctx.fillRect(0, floorY, CANVAS.WIDTH, 22);

    // Hill bumps using pixel rects
    const hills = [
      { x: 0,   w: 60,  h: 12 },
      { x: 45,  w: 80,  h: 18 },
      { x: 110, w: 70,  h: 14 },
      { x: 160, w: 90,  h: 20 },
      { x: 230, w: 60,  h: 15 },
      { x: 270, w: 70,  h: 12 },
    ];
    ctx.fillStyle = '#1A240E';
    hills.forEach(h => {
      // Draw a simple stepped "hill" shape
      const steps = Math.floor(h.h / 3);
      for (let s = 0; s <= steps; s++) {
        const stepW = h.w - s * (h.w / (steps + 2));
        const stepX = h.x + (h.w - stepW) / 2;
        const stepY = floorY - s * 3;
        ctx.fillRect(Math.round(stepX), Math.round(stepY), Math.round(stepW), 4);
      }
    });

    // Ground line
    ctx.fillStyle = '#2A3A14';
    ctx.fillRect(0, floorY, CANVAS.WIDTH, 2);
  }

  _drawLonghornSilhouette(ctx, cx, cy) {
    // Simple pixel-art longhorn head silhouette
    ctx.fillStyle = '#3A1A08';
    // Head
    ctx.fillRect(cx - 6, cy - 4, 12, 10);
    // Snout
    ctx.fillRect(cx - 4, cy + 5, 8, 4);
    ctx.fillRect(cx - 3, cy + 8, 6, 3);
    // Horns — sweeping outward
    const hornColor = '#2E1004';
    ctx.fillStyle = hornColor;
    // Left horn: arc outward and up
    ctx.fillRect(cx - 14, cy - 6, 4, 2);
    ctx.fillRect(cx - 12, cy - 8, 4, 2);
    ctx.fillRect(cx - 10, cy - 9, 3, 2);
    ctx.fillRect(cx - 8,  cy - 10, 3, 2);
    ctx.fillRect(cx - 6,  cy - 8, 2, 4);
    // Right horn
    ctx.fillRect(cx + 10, cy - 6, 4, 2);
    ctx.fillRect(cx + 8,  cy - 8, 4, 2);
    ctx.fillRect(cx + 7,  cy - 9, 3, 2);
    ctx.fillRect(cx + 5,  cy - 10, 3, 2);
    ctx.fillRect(cx + 4,  cy - 8, 2, 4);
    // Eyes
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(cx - 4, cy - 1, 2, 2);
    ctx.fillRect(cx + 2,  cy - 1, 2, 2);
    // Nostrils
    ctx.fillStyle = '#1A0A04';
    ctx.fillRect(cx - 2, cy + 7, 1, 1);
    ctx.fillRect(cx + 1,  cy + 7, 1, 1);
  }

  _drawPixelTitle(ctx, y) {
    // "MAVERICK MINI GOLF" in large pixel-block letters
    // We draw each letter as a set of filled rectangles for a pixel-font look
    // Using a simplified 5x7 pixel font drawn via rects
    const text    = 'MAVERICK';
    const text2   = 'MINI GOLF';
    const scale   = 2;
    const charW   = 5 * scale;
    const charH   = 7 * scale;
    const spacing = 2;

    // Shadow
    ctx.fillStyle = COLORS.UNO_BLACK;
    this._drawPixelString(ctx, text,  CANVAS.WIDTH / 2 + 1, y - 10 + 1, scale, '#0A0A0A');
    this._drawPixelString(ctx, text2, CANVAS.WIDTH / 2 + 1, y +  8 + 1, scale, '#0A0A0A');

    // Main text in UNO_RED
    this._drawPixelString(ctx, text,  CANVAS.WIDTH / 2, y - 10, scale, COLORS.UNO_RED);
    this._drawPixelString(ctx, text2, CANVAS.WIDTH / 2, y +  8, scale, '#FFD700');
  }

  _drawPixelString(ctx, str, cx, y, scale, color) {
    // Minimal pixel font: each letter is a 5-wide bitmask array of rows
    const font = _PIXEL_FONT;
    const charW = (5 + 1) * scale;
    const totalW = str.length * charW - scale;
    let x = cx - totalW / 2;
    for (const ch of str) {
      const glyph = font[ch] || font['?'];
      ctx.fillStyle = color;
      for (let row = 0; row < glyph.length; row++) {
        for (let col = 0; col < 5; col++) {
          if (glyph[row] & (1 << (4 - col))) {
            ctx.fillRect(x + col * scale, y + row * scale, scale, scale);
          }
        }
      }
      x += charW;
    }
  }

  _drawButton(ctx, text, x, y, width, selected) {
    const h = 14;
    // Background
    ctx.fillStyle = selected ? COLORS.UNO_RED : COLORS.BTN_BG;
    ctx.fillRect(x, y, width, h);
    // Border — pixel art style (manual corners)
    ctx.fillStyle = selected ? '#FF3355' : COLORS.UNO_RED;
    ctx.fillRect(x,           y,         width, 1); // top
    ctx.fillRect(x,           y + h - 1, width, 1); // bottom
    ctx.fillRect(x,           y,         1,     h); // left
    ctx.fillRect(x + width-1, y,         1,     h); // right
    // Corner pixels — pixel-art beveled look
    ctx.fillStyle = selected ? COLORS.UNO_RED : '#2A2A2A';
    ctx.fillRect(x, y, 1, 1);
    ctx.fillRect(x + width - 1, y, 1, 1);
    ctx.fillRect(x, y + h - 1, 1, 1);
    ctx.fillRect(x + width - 1, y + h - 1, 1, 1);
    // Label
    ctx.fillStyle = COLORS.BTN_TEXT;
    ctx.font = 'bold 7px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + width / 2, y + h / 2 + 0.5);
    ctx.textBaseline = 'alphabetic';
  }

  drawModeSelect(ctx) {
    // Dark background
    ctx.fillStyle = '#0A0A1A';
    ctx.fillRect(0, 0, CANVAS.WIDTH, CANVAS.HEIGHT);

    // Stars
    this.stars.forEach(s => {
      const bright = 0.5 + 0.5 * Math.sin(s.twinkle);
      ctx.fillStyle = `rgba(245,245,245,${(0.3 + bright * 0.5).toFixed(2)})`;
      ctx.fillRect(s.x, s.y, s.size, s.size);
    });

    // Header
    ctx.fillStyle = COLORS.UNO_RED;
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('CHOOSE YOUR COURSE', CANVAS.WIDTH / 2, 18);
    ctx.fillStyle = COLORS.HUD_DIM;
    ctx.font = '6px monospace';
    ctx.fillText('ARROW KEYS TO SELECT  |  SPACE TO CONFIRM  |  ESC BACK', CANVAS.WIDTH / 2, 28);

    const panelW  = 110;
    const panelH  = 90;
    const gap     = 10;
    const totalW  = panelW * 2 + gap;
    const startX  = (CANVAS.WIDTH - totalW) / 2;
    const panelY  = 36;

    this._modeItems.forEach((item, i) => {
      const px  = startX + i * (panelW + gap);
      const sel = i === this._modeSelectedIndex;
      const isBlizzard = item.mode === MODE.BLIZZARD;

      // Panel background
      if (isBlizzard) {
        ctx.fillStyle = '#0E1422';
      } else {
        ctx.fillStyle = '#0E1A0A';
      }
      ctx.fillRect(px, panelY, panelW, panelH);

      // Glow border when selected
      if (sel) {
        // Outer glow (simulate with stacked border rects)
        ctx.fillStyle = 'rgba(200,16,46,0.3)';
        ctx.fillRect(px - 2, panelY - 2, panelW + 4, panelH + 4);
        ctx.fillStyle = COLORS.UNO_RED;
      } else {
        ctx.fillStyle = '#333333';
      }
      ctx.fillRect(px,            panelY,            panelW, 2);
      ctx.fillRect(px,            panelY + panelH-2, panelW, 2);
      ctx.fillRect(px,            panelY,            2,      panelH);
      ctx.fillRect(px + panelW-2, panelY,            2,      panelH);

      // Panel content -- sky stripe
      if (isBlizzard) {
        ctx.fillStyle = '#1C2333';
        ctx.fillRect(px + 2, panelY + 2, panelW - 4, 30);
        // Snowflakes
        ctx.fillStyle = '#D4EEF7';
        for (let s = 0; s < 6; s++) {
          const sx = px + 10 + ((s * 19 + Math.floor(this.animTime * 2) * 3) % (panelW - 20));
          const sy = panelY + 4 + (s * 7) % 26;
          ctx.fillRect(sx, sy, 2, 2);
        }
      } else {
        ctx.fillStyle = '#87CEEB';
        ctx.fillRect(px + 2, panelY + 2, panelW - 4, 30);
        // Sun
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(px + panelW - 18, panelY + 4, 10, 10);
      }

      // Ground stripe
      ctx.fillStyle = isBlizzard ? '#D4EEF7' : '#3A7D44';
      ctx.fillRect(px + 2, panelY + 30, panelW - 4, 8);
      ctx.fillStyle = isBlizzard ? '#A8D8EA' : '#2A5E31';
      ctx.fillRect(px + 2, panelY + 36, panelW - 4, 4);

      // Panel title
      ctx.fillStyle = sel ? COLORS.UNO_WHITE : COLORS.HUD_DIM;
      ctx.font = 'bold 7px monospace';
      ctx.textAlign = 'center';
      const titleLines = item.label.split(' ');
      // Wrap if needed
      ctx.fillText(item.label.length > 16 ? item.label.substring(0, 16) : item.label,
        px + panelW / 2, panelY + 50);
      if (item.label.length > 16) {
        ctx.fillText(item.label.substring(16).trim(), px + panelW / 2, panelY + 59);
      }

      // Sub label
      ctx.fillStyle = isBlizzard ? '#AED6F1' : '#7EC882';
      ctx.font = '6px monospace';
      ctx.fillText(item.sub, px + panelW / 2, panelY + 68);

      // Description
      ctx.fillStyle = COLORS.HUD_DIM;
      ctx.font = '6px monospace';
      item.desc.forEach((line, li) => {
        ctx.fillText(line, px + panelW / 2, panelY + 78 + li * 8);
      });

      // Selected arrow indicator
      if (sel) {
        ctx.fillStyle = COLORS.UNO_RED;
        const arrowX = px + panelW / 2;
        ctx.fillRect(arrowX - 3, panelY + panelH + 4, 6, 2);
        ctx.fillRect(arrowX - 1, panelY + panelH + 6, 2, 2);
      }
    });

    // Confirm prompt
    if (Math.sin(this.animTime * 3) > 0) {
      ctx.fillStyle = COLORS.UNO_WHITE;
      ctx.font = '6px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('PRESS SPACE TO START', CANVAS.WIDTH / 2, CANVAS.HEIGHT - 6);
    }

    // Back hint
    ctx.fillStyle = COLORS.HUD_DIM;
    ctx.font = '6px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('ESC: BACK', 6, CANVAS.HEIGHT - 6);
  }
}

// ============================================================
// Minimal 5x7 pixel font bitmasks (row = 7 bits, bit 4 = leftmost col)
// ============================================================
const _PIXEL_FONT = {
  'A': [0b01110, 0b10001, 0b10001, 0b11111, 0b10001, 0b10001, 0b10001],
  'B': [0b11110, 0b10001, 0b10001, 0b11110, 0b10001, 0b10001, 0b11110],
  'C': [0b01111, 0b10000, 0b10000, 0b10000, 0b10000, 0b10000, 0b01111],
  'D': [0b11110, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b11110],
  'E': [0b11111, 0b10000, 0b10000, 0b11110, 0b10000, 0b10000, 0b11111],
  'F': [0b11111, 0b10000, 0b10000, 0b11110, 0b10000, 0b10000, 0b10000],
  'G': [0b01111, 0b10000, 0b10000, 0b10111, 0b10001, 0b10001, 0b01111],
  'H': [0b10001, 0b10001, 0b10001, 0b11111, 0b10001, 0b10001, 0b10001],
  'I': [0b01110, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b01110],
  'J': [0b00111, 0b00001, 0b00001, 0b00001, 0b00001, 0b10001, 0b01110],
  'K': [0b10001, 0b10010, 0b10100, 0b11000, 0b10100, 0b10010, 0b10001],
  'L': [0b10000, 0b10000, 0b10000, 0b10000, 0b10000, 0b10000, 0b11111],
  'M': [0b10001, 0b11011, 0b10101, 0b10001, 0b10001, 0b10001, 0b10001],
  'N': [0b10001, 0b11001, 0b10101, 0b10011, 0b10001, 0b10001, 0b10001],
  'O': [0b01110, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01110],
  'P': [0b11110, 0b10001, 0b10001, 0b11110, 0b10000, 0b10000, 0b10000],
  'Q': [0b01110, 0b10001, 0b10001, 0b10001, 0b10101, 0b10010, 0b01101],
  'R': [0b11110, 0b10001, 0b10001, 0b11110, 0b10100, 0b10010, 0b10001],
  'S': [0b01111, 0b10000, 0b10000, 0b01110, 0b00001, 0b00001, 0b11110],
  'T': [0b11111, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100],
  'U': [0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01110],
  'V': [0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01010, 0b00100],
  'W': [0b10001, 0b10001, 0b10001, 0b10001, 0b10101, 0b11011, 0b10001],
  'X': [0b10001, 0b10001, 0b01010, 0b00100, 0b01010, 0b10001, 0b10001],
  'Y': [0b10001, 0b10001, 0b01010, 0b00100, 0b00100, 0b00100, 0b00100],
  'Z': [0b11111, 0b00001, 0b00010, 0b00100, 0b01000, 0b10000, 0b11111],
  ' ': [0b00000, 0b00000, 0b00000, 0b00000, 0b00000, 0b00000, 0b00000],
  '?': [0b01110, 0b10001, 0b00001, 0b00110, 0b00100, 0b00000, 0b00100],
  '!': [0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b00000, 0b00100],
  '-': [0b00000, 0b00000, 0b00000, 0b11111, 0b00000, 0b00000, 0b00000],
};
