# Maverick Mini Golf — Game Spec

**Platform:** Browser (HTML5 Canvas) / PC
**Style:** 16-bit pixel art
**Setting:** Elmwood Park Golf Course, University of Nebraska at Omaha (UNO)
**Theme:** UNO Mavericks on the Nebraska Plains

---

## Overview

Maverick Mini Golf is a single-player 16-bit mini golf game set on a stylized version of the Elmwood Park Golf Course at the University of Nebraska at Omaha. Players take on the role of the UNO Maverick — a rugged, pixel-art longhorn cowboy golfer — navigating 9 holes inspired by campus landmarks, Great Plains wilderness, and Omaha's city culture. The game blends classic mini golf mechanics with light progression, unlockables, and Nebraska-flavored personality.

---

## Setting & Mode Selection

The game offers two course modes selectable from the main menu:

### Normal Mode — "A Day at Elmwood Park"
A sunny afternoon at Elmwood Park, just as it is on campus. The course looks true to life — green fairways, mature trees, and familiar UNO campus landmarks in the background. Wind is gentle, hazards are natural (creeks, hills, trees), and the atmosphere is relaxed and collegiate. Perfect for a casual round.

### Blizzard Mode — "The Frontier Awakens"
A mysterious overnight blizzard swept across Elmwood Park, transforming the golf course into a wild Nebraska frontier. Bison roam the fairways, tornado winds whip across the greens, and the ghosts of Omaha's railroad past haunt the back nine. Only the Maverick — UNO's fearless longhorn hero — can brave all 9 holes and tame the wild course before the semester ends. Hazards are more extreme and obstacles more unpredictable in this mode.

Each hole has a Normal and Blizzard layout variant. The core hole structure (shape, par, theme) stays the same — but hazard intensity, visual atmosphere, and obstacle behavior differ between modes.

---

## Core Gameplay

### Controls
| Action | Keyboard | Mouse |
|--------|----------|-------|
| Aim | Arrow keys / A/D | Click & drag |
| Set power | Hold Space | Click & hold |
| Release shot | Release Space | Release click |
| View hole map | M | M |

### Shot Mechanic
- **Power bar** fills while the button is held (classic oscillating bar or hold-to-fill)
- **Aim line** shows projected ball trajectory with visible wind drift curve
- **Spin modifier** (optional): press Left/Right before releasing to add topspin or backspin

### Scoring
| Term | Definition |
|------|-----------|
| Hole-in-One | 1 stroke — legendary |
| Eagle | 2 under par |
| Birdie | 1 under par |
| Par | Expected strokes for hole |
| Bogey | 1 over par |
| Double Bogey | 2 over par |
| Max | 7 strokes — ball resets to last safe tile |

---

## Player Character

**The Maverick**
- 16-bit animated longhorn cowboy sprite with a golf bag and Stetson hat
- Idle, swing, celebrate, and frustrated animations
- Unlockable cosmetics:
  - Hats: Classic Stetson, UNO cap, Blizzard beanie, Graduation mortarboard
  - Putters: Lasso putter, Hockey stick (nod to UNO hockey), Steel rail putter
  - Ball skins: Maverick branded, Snowball, Cornhusk, Fire & Ice

---

## The 9 Holes

### Hole 1 — "Welcome to the Bluffs"
**Par:** 3 | **Theme:** Elmwood Park entrance / Missouri River overlook
- Gently curving fairway overlooking a pixel-art Missouri River panorama
- Light breeze introduces the wind mechanic
- Tutorial hole with on-screen tip prompts

### Hole 2 — "The Criss Library Stacks"
**Par:** 3 | **Theme:** UNO's Criss Library
- Winding path through towering pixel bookshelves
- Moving book carts roll across the fairway on a timer
- Secret shortcut hidden behind a false wall of books

### Hole 3 — "Bison Stampede"
**Par:** 4 | **Theme:** Nebraska Great Plains
- A herd of pixel-art bison periodically charges across the fairway
- Time your shot to thread between them or bank around obstacles
- Hitting a bison deflects the ball unpredictably — high risk, high reward

### Hole 4 — "Baxter Arena Madhouse"
**Par:** 3 | **Theme:** Baxter Arena / UNO Hockey
- Indoor ice rink aesthetic — ball slides farther and faster on icy surfaces
- Hockey boards act as bumper walls for trick shots
- Sink the ball in under 2 strokes to trigger a goal horn SFX celebration

### Hole 5 — "Tornado Alley"
**Par:** 4 | **Theme:** Nebraska Plains storm
- A slow-moving tornado drifts across the screen, pulling the ball off course if too close
- Dark storm clouds reduce visibility in affected zones
- Weathervane UI shows shifting wind direction every shot

### Hole 6 — "Old Market Rails"
**Par:** 4 | **Theme:** Omaha's Old Market / Union Pacific Railroad
- A vintage steam train passes through the hole on a rail track — ball bounces off the cars if struck
- Cobblestone paths and brick walls create tight angles perfect for trick shots
- Collect a golden railroad spike for a bonus stroke reduction

### Hole 7 — "Elmwood Creek Crossing"
**Par:** 3 | **Theme:** Elmwood Park creek and footbridges
- Narrow wooden footbridges over a rushing creek
- Fall into the water: +1 stroke penalty, ball resets to last safe tile
- Stepping stone platforms provide an alternate riskier route

### Hole 8 — "Chancellor's Lawn"
**Par:** 4 | **Theme:** UNO main campus quad
- Open wide fairway — deceptively simple, but wind is at its strongest here
- Campus sprinklers activate on a timer, nudging the ball sideways
- Campus NPCs (students, professors) line the edges and react to your shots

### Hole 9 — "Maverick's Final Drive"
**Par:** 5 | **Theme:** Elmwood Park grand finale
- The longest and most challenging hole — spans a full stylized overview of campus
- Combines all prior mechanics: wind, bison crossings, icy patches, water hazards, and moving obstacles
- Finale: fireworks explode over the UNO skyline and the Maverick does a victory stomp if the player finishes under total par

---

## Environmental Systems

### Wind
- Direction and strength shown via a weathervane in the HUD corner
- Wind direction and speed shift every 2–3 shots
- Aim line curves visually in real time to reflect current wind
- Tornado Alley (Hole 5) has the most dramatic wind behavior

### Water Hazards
- Ball enters water → +1 stroke penalty → resets to last safe tile
- Animated splash and ripple pixel-art effect on contact

### Ice Surfaces
- Introduced in Hole 4 (Baxter Arena)
- Ball travels farther and is harder to control on ice tiles
- Visual indicator: blue tint overlay on icy tile sections

### Trick Shot Multiplier
- Bouncing off 2+ walls before holing out triggers a "TRICK SHOT!" banner
- Awards bonus points toward the end-of-game leaderboard score

---

## Power-Ups (Maverick Collectibles)

Scattered across select holes as glowing UNO-branded pickups:

| Item | Effect |
|------|--------|
| Cowboy Hat | Ghost ball — passes through one obstacle |
| Gold Star | Guidance arrow — shows ideal path for one shot |
| Lasso | Mulligan — undo last shot once |
| Snowflake | Freeze nearby hazards (bison, train) for 5 seconds |
| Whirlwind | Turbo — ball moves at 2x speed for one shot |

---

## Visual Style

- **Resolution:** 320×180 upscaled to fill screen
- **Palette:** SNES-era 16-color palettes per zone; UNO black and red as the dominant brand colors, with zone-specific supporting tones
- **Sprites:** 16×16 to 32×32 pixel characters and objects
- **Backgrounds:** Layered parallax scrolling (sky, treeline, foreground campus details)
- **UI:** Pixelated HUD with score, stroke counter, hole number, wind indicator, and power bar — styled in UNO black and red throughout

### Color Palette Themes
| Zone | Primary | Accent |
|------|---------|--------|
| Elmwood Park (outdoor) | Forest green, UNO black | UNO red |
| Great Plains / Bison | Wheat tan, open sky blue | UNO red |
| Storm / Tornado | Stormy grey, dark charcoal | Electric red |
| Indoor / Arena | Ice blue, white | UNO red and black |
| Old Market | Cobblestone grey, brick brown | Lantern amber |
| Blizzard / Night | Deep black, snow white | UNO red glow |

---

## Audio

- **BGM:** Original chiptune tracks per zone (Americana/Western-influenced, SNES-style)
  - Elmwood Park: Breezy, upbeat frontier jingle
  - Great Plains / Bison hole: Driving, Western-style rhythm
  - Baxter Arena: Upbeat sports-rock chiptune
  - Storm holes: Tense minor-key track with layered wind SFX
  - Old Market: Jazzy, locomotive-rhythm groove
- **SFX:** Putter swing, ball roll, water splash, bison grunt, crowd cheer, goal horn, tornado whoosh, train whistle, hole-in-one fanfare

---

## Progression & Scoring

### End of Round
- Total stroke count vs. total par displayed on a pixel-art scoreboard screen
- Letter grade awarded: S / A / B / C / D based on performance
- Unlockables triggered by achievement:
  - **S rank:** Unlock "Golden Lasso Putter" cosmetic
  - **A rank:** Unlock "Snowball" ball skin
  - **Hole-in-One on any hole:** Unlock secret "Blizzard Maverick" character skin (snow-covered longhorn)
  - **Complete any hole without power-ups:** Unlock "Purist" badge

### Leaderboard
- Local high score table
- Stores: Player name, total strokes, total par, grade, date

---

## Scope & Milestones

| Phase | Deliverable | Target |
|-------|-------------|--------|
| 1 | Core engine: ball physics, power bar, aim line, wind system | Week 2 |
| 2 | Holes 1–3 fully playable with all assets | Week 4 |
| 3 | Holes 4–6 + ice and storm mechanics | Week 6 |
| 4 | Holes 7–9 + all environmental hazards | Week 8 |
| 5 | Power-ups, scoring, UI polish | Week 10 |
| 6 | Audio, animations, leaderboard, QA | Week 12 |

---

## Tech Stack

- **Engine:** HTML5 Canvas + vanilla JS, or Phaser.js (2D game framework)
- **Art:** Aseprite for pixel art sprites and tilemaps
- **Audio:** BeepBox or FamiTracker for chiptune composition
- **Build:** Vite for bundling; hosted via GitHub Pages or itch.io

---

## Stretch Goals

- [ ] 2-player local pass-and-play mode
- [ ] Course editor — design your own hole
- [ ] Daily Challenge: randomized hole layout with global leaderboard
- [ ] Mobile touch/swipe support
- [ ] Unlockable secret 10th hole: "The Blizzard Back Nine" — a full whiteout snowstorm course
- [ ] UNO Athletics Easter eggs: hidden hockey pucks, basketballs, and soccer balls hidden in environmental details

---

*Spec version 1.0 — Maverick Mini Golf, Elmwood Park Golf Course, University of Nebraska at Omaha*
