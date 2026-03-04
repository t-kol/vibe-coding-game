// ============================================================
// Maverick Mini Golf — Collision.js
// Pure collision-detection and resolution functions.
// No classes, no side effects beyond mutating the ball object.
// ============================================================

import { PHYSICS, TILE_SIZE } from '../Constants.js';

/**
 * Returns true if a circle (cx, cy, radius) overlaps an axis-aligned rect
 * defined by its top-left corner (rx, ry) and dimensions (rw, rh).
 *
 * @param {number} cx     Circle center X
 * @param {number} cy     Circle center Y
 * @param {number} radius Circle radius
 * @param {number} rx     Rect left edge
 * @param {number} ry     Rect top edge
 * @param {number} rw     Rect width
 * @param {number} rh     Rect height
 * @returns {boolean}
 */
export function circleIntersectsRect(cx, cy, radius, rx, ry, rw, rh) {
  // Find the closest point on the rect to the circle center
  const closestX = Math.max(rx, Math.min(cx, rx + rw));
  const closestY = Math.max(ry, Math.min(cy, ry + rh));

  // Compute squared distance from closest point to circle center
  const dx = cx - closestX;
  const dy = cy - closestY;
  return (dx * dx + dy * dy) < (radius * radius);
}

/**
 * Reflects ball velocity off the infinite line defined by segment (x1,y1)→(x2,y2).
 * Only responds if the ball is close enough and approaching the surface.
 * Mutates ball.vx and ball.vy in place.
 *
 * @param {{ x:number, y:number, vx:number, vy:number, radius:number }} ball
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 * @returns {{ collided: boolean, nx: number, ny: number }}
 */
export function resolveCircleSegment(ball, x1, y1, x2, y2) {
  const result = { collided: false, nx: 0, ny: 0 };

  // Segment direction and length squared
  const edgeDx = x2 - x1;
  const edgeDy = y2 - y1;
  const lenSq = edgeDx * edgeDx + edgeDy * edgeDy;

  if (lenSq === 0) return result; // Degenerate segment

  // Project ball center onto the segment, clamped to [0,1]
  const t = Math.max(0, Math.min(1,
    ((ball.x - x1) * edgeDx + (ball.y - y1) * edgeDy) / lenSq
  ));

  // Closest point on segment to ball center
  const closestX = x1 + t * edgeDx;
  const closestY = y1 + t * edgeDy;

  // Vector from closest point to ball center
  const diffX = ball.x - closestX;
  const diffY = ball.y - closestY;
  const distSq = diffX * diffX + diffY * diffY;

  if (distSq >= ball.radius * ball.radius) return result;
  if (distSq === 0) return result; // Ball center exactly on segment edge-case

  const dist = Math.sqrt(distSq);

  // Surface normal pointing from segment toward ball
  const nx = diffX / dist;
  const ny = diffY / dist;

  // Only resolve if ball is moving toward the surface (approaching)
  const velDotNormal = ball.vx * nx + ball.vy * ny;
  if (velDotNormal >= 0) return result; // Moving away — no collision

  // Push ball out of surface
  const penetration = ball.radius - dist;
  ball.x += nx * penetration;
  ball.y += ny * penetration;

  // Reflect velocity: v' = v - 2(v·n)n, dampened by restitution
  ball.vx -= (1 + PHYSICS.RESTITUTION) * velDotNormal * nx;
  ball.vy -= (1 + PHYSICS.RESTITUTION) * velDotNormal * ny;

  result.collided = true;
  result.nx = nx;
  result.ny = ny;
  return result;
}

/**
 * Resolves collision between a circular ball and a solid tile rect.
 * Finds the closest point on the rect surface, pushes the ball out, and
 * reflects velocity with PHYSICS.RESTITUTION dampening.
 * Mutates ball.x, ball.y, ball.vx, ball.vy in place.
 *
 * @param {{ x:number, y:number, vx:number, vy:number, radius:number }} ball
 * @param {number} rx  Rect left edge in game pixels
 * @param {number} ry  Rect top edge in game pixels
 * @param {number} rw  Rect width (typically TILE_SIZE)
 * @param {number} rh  Rect height (typically TILE_SIZE)
 * @returns {{ collided: boolean, normal: { nx: number, ny: number } }}
 */
export function resolveCircleTile(ball, rx, ry, rw, rh) {
  const result = { collided: false, normal: { nx: 0, ny: 0 } };

  // Quick AABB + circle check first
  if (!circleIntersectsRect(ball.x, ball.y, ball.radius, rx, ry, rw, rh)) {
    return result;
  }

  // Closest point on rect to ball center
  const closestX = Math.max(rx, Math.min(ball.x, rx + rw));
  const closestY = Math.max(ry, Math.min(ball.y, ry + rh));

  let diffX = ball.x - closestX;
  let diffY = ball.y - closestY;
  let dist = Math.sqrt(diffX * diffX + diffY * diffY);

  let nx, ny;

  if (dist === 0) {
    // Ball center is inside the rect — use the shortest axis to eject
    const overlapL = ball.x - rx;
    const overlapR = (rx + rw) - ball.x;
    const overlapT = ball.y - ry;
    const overlapB = (ry + rh) - ball.y;
    const minOverlap = Math.min(overlapL, overlapR, overlapT, overlapB);

    if (minOverlap === overlapL)      { nx = -1; ny = 0; dist = overlapL; }
    else if (minOverlap === overlapR) { nx =  1; ny = 0; dist = overlapR; }
    else if (minOverlap === overlapT) { nx = 0; ny = -1; dist = overlapT; }
    else                              { nx = 0; ny =  1; dist = overlapB; }
  } else {
    nx = diffX / dist;
    ny = diffY / dist;
  }

  // Push ball out so its edge is exactly on the rect surface
  const penetration = ball.radius - dist;
  if (penetration <= 0) return result; // Floating point guard — no real overlap

  ball.x += nx * penetration;
  ball.y += ny * penetration;

  // Only reflect if ball is moving toward the surface
  const velDotNormal = ball.vx * nx + ball.vy * ny;
  if (velDotNormal < 0) {
    // Reflect: v' = v - (1+e)(v·n)n
    ball.vx -= (1 + PHYSICS.RESTITUTION) * velDotNormal * nx;
    ball.vy -= (1 + PHYSICS.RESTITUTION) * velDotNormal * ny;
  }

  result.collided = true;
  result.normal.nx = nx;
  result.normal.ny = ny;
  return result;
}

/**
 * Simple axis-aligned bounding box overlap test.
 * Useful for entity vs ball collision checks.
 *
 * @param {number} ax  Rect A left
 * @param {number} ay  Rect A top
 * @param {number} aw  Rect A width
 * @param {number} ah  Rect A height
 * @param {number} bx  Rect B left
 * @param {number} by  Rect B top
 * @param {number} bw  Rect B width
 * @param {number} bh  Rect B height
 * @returns {boolean}
 */
export function rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw &&
         ax + aw > bx &&
         ay < by + bh &&
         ay + ah > by;
}
