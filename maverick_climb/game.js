// ─── CANVAS ──────────────────────────────────────────────────────────────────
const canvas = document.getElementById('c');
const ctx    = canvas.getContext('2d');
const VW = 400, VH = 300;
const vc = document.createElement('canvas');
vc.width = VW; vc.height = VH;
const vx = vc.getContext('2d');

// ─── PALETTE ─────────────────────────────────────────────────────────────────
const C = {
  red:'#D00000', redLt:'#FF4444', redDk:'#880000',
  gold:'#FFB800', goldLt:'#FFE066', goldDk:'#996600',
  wall:'#8C8C8C', wallLt:'#B0B0B0',
  pad:'#D00000', padDk:'#8B0000',
  skin:'#F0A875', skinLt:'#FFDAAA', skinDk:'#C07840',
  shirt:'#D00000', shirtLt:'#FF5555', shirtDk:'#880000',
  pants:'#111', pantsLt:'#3A3A3A',
  hair:'#2A1800', hairLt:'#4A3010',
  jugG:'#22C55E', jugGLt:'#86EFAC', jugGDk:'#15803D',
  crimpB:'#3B82F6', crimpBLt:'#93C5FD', crimpBDk:'#1D4ED8',
  slopR:'#EF4444', slopRLt:'#FCA5A5', slopRDk:'#991B1B',
  fin:'#FFB800', finLt:'#FFE066', finDk:'#996600',
};

// ─── PHYSICS CONSTANTS ───────────────────────────────────────────────────────
// ARM_SEG: each arm segment (upper-arm = forearm = ARM_SEG).
// Max reach per arm from shoulder = ARM_SEG * 2 = 64 px.
// Shoulder offset from body centre ≈ 11 px.
// REACH is set so no route hold ever forces the arm past its natural length.
const ARM_SEG = 27;   // fixed — never dynamic; max arm reach = 54 px
const LEG_SEG = 21;   // fixed leg segment
const HANG    = 19;   // body hangs this many px below highest held hold
const REACH   = 70;   // max dist from body-centre to a selectable hold

// ─── HOLD PROPS ──────────────────────────────────────────────────────────────
const HOLD_SIZE = { jug:11, crimp:8, sloper:13, finish:13 };
// powerMin/Max: acceptable % band. angleTol: degrees. pSpd: needle speed.
const HOLD_PROPS = {
  jug:    { powerMin:45, powerMax:100, angleTol:30, pSpd:150, aSpd:230 },
  crimp:  { powerMin:62, powerMax:88,  angleTol:14, pSpd:195, aSpd:270 },
  sloper: { powerMin:52, powerMax:94,  angleTol:19, pSpd:170, aSpd:255 },
  finish: { powerMin:40, powerMax:100, angleTol:35, pSpd:140, aSpd:220 },
};
const HOLD_COLS = {
  jug:    { m:C.jugG,   lt:C.jugGLt,  dk:C.jugGDk  },
  crimp:  { m:C.crimpB, lt:C.crimpBLt,dk:C.crimpBDk },
  sloper: { m:C.slopR,  lt:C.slopRLt, dk:C.slopRDk  },
  finish: { m:C.fin,    lt:C.finLt,   dk:C.finDk    },
};

// ─── ROUTE GENERATION ────────────────────────────────────────────────────────
// Holds are placed randomly each play. Two hard constraints guarantee visuals:
//   1. sampled within REACH px of body centre  → always selectable
//   2. within ARM_SEG*2 px of the grabbing shoulder → arms reach fully, never over-stretch
function generateRoute(cfg) {
  const { name, grade, tape, holdTypes, minR = 18 } = cfg;
  const WALL_L = 68, WALL_R = 332;
  const clp = (v,lo,hi) => Math.max(lo, Math.min(hi, v));
  const N = 11; // intermediate holds between starts and finish

  const starts = [
    { x:155, y:252, type:'jug', isStart:true },
    { x:245, y:252, type:'jug', isStart:true },
  ];
  const result = [...starts];
  let lhPos = starts[0], rhPos = starts[1];

  for (let step = 0; step < N; step++) {
    const cx = (lhPos.x + rhPos.x) / 2;
    const cy = Math.max(lhPos.y, rhPos.y) + HANG;
    const isLate = step >= N - 2;
    const prog = (step + 1) / (N + 1);
    const targetY = 220 - prog * 170;     // sweeps ~220 → ~50 up the wall
    const xMin = isLate ? 120 : WALL_L;
    const xMax = isLate ? 280 : WALL_R;

    let chosen = null, bestScore = Infinity;
    for (let t = 0; t < 600; t++) {
      const angle = Math.random() * Math.PI * 2;
      const r = minR + Math.random() * (REACH - minR); // ≤ REACH → always reachable
      const hx = cx + Math.cos(angle) * r;
      const hy = cy + Math.sin(angle) * r;
      if (hy >= cy - 10) continue;              // must be above body
      if (hx < xMin || hx > xMax) continue;
      if (hy < 20 || hy > 245) continue;
      // Minimum spacing: no hold within 28px of any already-placed hold
      if (result.some(e => Math.hypot(hx - e.x, hy - e.y) < 28)) continue;
      // Hard arm-reach constraint — ensures hand always reaches the hold visually
      const isLeft = hx <= cx;
      const shX = cx + (isLeft ? -11 : 11), shY = cy - 12;
      if (Math.hypot(hx - shX, hy - shY) > ARM_SEG * 2) continue;
      // Score: bias toward target height; only x-bias near top (for finish reachability)
      const score = Math.abs(hy - targetY) * 0.6
                  + (isLate ? Math.abs(hx - 200) * 0.4 : 0)
                  + Math.random() * 22;  // large random term → free horizontal spread
      if (score < bestScore) { bestScore = score; chosen = { x:Math.round(hx), y:Math.round(hy) }; }
    }
    if (!chosen) {
      chosen = {
        x: Math.round(clp(cx + (Math.random() > .5 ? -35 : 35), WALL_L, WALL_R)),
        y: Math.round(clp(cy - 40, 20, 245)),
      };
    }
    const type = holdTypes[Math.floor(Math.random() * holdTypes.length)];
    result.push({ x:chosen.x, y:chosen.y, type });
    const newH = result[result.length - 1];
    if (chosen.x <= cx) lhPos = newH; else rhPos = newH;
  }

  // If finish hold (200, 35) would be out of reach, insert one bridge hold
  const fcx = (lhPos.x + rhPos.x) / 2;
  const fcy = Math.max(lhPos.y, rhPos.y) + HANG;
  if (Math.hypot(200 - fcx, 35 - fcy) > REACH * 0.9) {
    const bx = Math.round(clp((fcx + 200) / 2, WALL_L, WALL_R));
    const by = Math.round(clp((fcy + 35) / 2 - 8, 20, 245));
    result.push({ x:bx, y:by, type:'jug' });
    const bH = result[result.length - 1];
    if (bx <= fcx) lhPos = bH; else rhPos = bH;
  }

  result.push({ x:200, y:35, type:'jug', isFinish:true });
  return { name, grade, tape, holds:result };
}

const ROUTE_CONFIGS = [
  { name:'THE WARM UP',  grade:'V0', tape:'#22C55E', holdTypes:['jug'],                   minR:15 },
  { name:'THE CRACK',    grade:'V2', tape:'#3B82F6', holdTypes:['jug','sloper','crimp'],   minR:20 },
  { name:'THE OVERHANG', grade:'V4', tape:'#D00000', holdTypes:['crimp','sloper','crimp'], minR:28 },
];
let ROUTES = ROUTE_CONFIGS.map(generateRoute);

// ─── INPUT ───────────────────────────────────────────────────────────────────
const keys = { jp: new Set(), dn: new Set() };
document.addEventListener('keydown', e => {
  if (!keys.dn.has(e.key)) keys.jp.add(e.key);
  keys.dn.add(e.key);
  if ([' ','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) e.preventDefault();
});
document.addEventListener('keyup', e => keys.dn.delete(e.key));

// ─── MATH ────────────────────────────────────────────────────────────────────
const lerp  = (a, b, t) => a + (b-a)*t;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const dist  = (ax, ay, bx, by) => Math.hypot(bx-ax, by-ay);
const ang   = (ax, ay, bx, by) => Math.atan2(by-ay, bx-ax)*180/Math.PI;

function ik(ax, ay, bx, by, seg, bend) {
  const dx=bx-ax, dy=by-ay;
  let d=Math.hypot(dx,dy), max=seg*2;
  let ex=bx, ey=by;
  if (d>max){ ex=ax+dx/d*max; ey=ay+dy/d*max; d=max; }
  const mx=(ax+ex)/2, my=(ay+ey)/2;
  const nd=Math.max(d,0.001);
  const px=-(ey-ay)/nd, py=(ex-ax)/nd;
  const h=Math.sqrt(Math.max(0,seg*seg-(d/2)*(d/2)));
  return { jx:mx+px*h*bend, jy:my+py*h*bend, ex, ey };
}

// ─── STATE ───────────────────────────────────────────────────────────────────
let holds=[], particles=[], state={};

function buildHolds(routeIdx) {
  return ROUTES[routeIdx].holds.map((h,i) => ({
    id:i, x:h.x, y:h.y,
    type:h.isFinish?'finish':h.type,
    isStart:!!h.isStart, isFinish:!!h.isFinish,
  }));
}
function bodyPos(lhId,rhId) {
  const lh=holds[lhId], rh=holds[rhId];
  return { x:(lh.x+rh.x)/2, y:Math.max(lh.y,rh.y)+HANG };
}

function initState(routeIdx=0, screen='menu') {
  ROUTES[routeIdx] = generateRoute(ROUTE_CONFIGS[routeIdx]);
  holds     = buildHolds(routeIdx);
  particles = [];
  const bp  = bodyPos(0,1);
  const r0  = reachableFrom(bp.x, bp.y, 0, 1);
  state = {
    screen,
    routeIdx,
    menuSel:0, completeSel:0,
    score:0, falls:0,
    time:0, timerOn:false,
    flash:null, flashT:0, flashMax:0,
    cursorId: r0.length ? r0.reduce((a,b)=>a.y<b.y?a:b).id : 2,
    ch:{
      x:bp.x, y:bp.y, tx:bp.x, ty:bp.y,
      lh:0, rh:1,
      reachArm:null, reachX:0, reachY:0,
      fallX:bp.x, fallY:bp.y, fallVy:0,
      fallRot:0, fallRotSpd:0,
      fallPhase:null, fallTimer:0,
    },
    tm:{
      phase:'power', targetId:null,
      pVal:0, pDir:1, pSpd:150, pLocked:false, pLockedVal:0,
      aVal:0, aSpd:230, aLocked:false, aLockedVal:0, idealAngle:0,
    },
  };
}

// ─── REACHABLE ───────────────────────────────────────────────────────────────
function reachableFrom(bx,by,lhId,rhId) {
  return holds.filter(h => {
    if (h.isStart) return false;
    if (h.id===lhId||h.id===rhId) return false;
    return dist(bx,by,h.x,h.y)<=REACH;
  });
}
function reachable() {
  const ch=state.ch;
  return reachableFrom(ch.x,ch.y,ch.lh,ch.rh);
}

// ─── CURSOR NAV ──────────────────────────────────────────────────────────────
function moveCursor(dir) {
  const reach=reachable();
  if (!reach.length) return;
  const cur=reach.find(h=>h.id===state.cursorId)||reach[0];
  if (!reach.find(h=>h.id===cur.id)){ state.cursorId=reach[0].id; return; }
  let best=null, bestScore=Infinity;
  for (const h of reach) {
    if (h.id===cur.id) continue;
    const dx=h.x-cur.x, dy=h.y-cur.y, d=Math.hypot(dx,dy);
    let inDir=false, score=d;
    if (dir==='up')    { inDir=dy<-4; score=d+Math.abs(dx)*.9; }
    if (dir==='down')  { inDir=dy>4;  score=d+Math.abs(dx)*.9; }
    if (dir==='left')  { inDir=dx<-4; score=d+Math.abs(dy)*.9; }
    if (dir==='right') { inDir=dx>4;  score=d+Math.abs(dy)*.9; }
    if (inDir&&score<bestScore){ bestScore=score; best=h; }
  }
  if (best) state.cursorId=best.id;
}

// ─── DRAW HELPERS ────────────────────────────────────────────────────────────
function rr(ctx2,x,y,w,h,r) {
  ctx2.beginPath();
  ctx2.moveTo(x+r,y); ctx2.lineTo(x+w-r,y); ctx2.arcTo(x+w,y,x+w,y+r,r);
  ctx2.lineTo(x+w,y+h-r); ctx2.arcTo(x+w,y+h,x+w-r,y+h,r);
  ctx2.lineTo(x+r,y+h); ctx2.arcTo(x,y+h,x,y+h-r,r);
  ctx2.lineTo(x,y+r); ctx2.arcTo(x,y,x+r,y,r);
  ctx2.closePath();
}
function limb(x1,y1,x2,y2,w,col,hi,dk) {
  const dx=x2-x1,dy=y2-y1,d=Math.hypot(dx,dy);
  if (d<0.5) return;
  const nx=-dy/d,ny=dx/d,hw=w/2;
  vx.fillStyle=dk;
  vx.beginPath();
  vx.moveTo(x1+nx*hw+1,y1+ny*hw+1); vx.lineTo(x2+nx*hw+1,y2+ny*hw+1);
  vx.lineTo(x2-nx*hw+1,y2-ny*hw+1); vx.lineTo(x1-nx*hw+1,y1-ny*hw+1);
  vx.closePath(); vx.fill();
  vx.fillStyle=col;
  vx.beginPath();
  vx.moveTo(x1+nx*hw,y1+ny*hw); vx.lineTo(x2+nx*hw,y2+ny*hw);
  vx.lineTo(x2-nx*hw,y2-ny*hw); vx.lineTo(x1-nx*hw,y1-ny*hw);
  vx.closePath(); vx.fill();
  vx.fillStyle=hi;
  vx.beginPath();
  vx.moveTo(x1+nx*hw,y1+ny*hw); vx.lineTo(x2+nx*hw,y2+ny*hw);
  vx.lineTo(x2+nx*hw*.3,y2+ny*hw*.3); vx.lineTo(x1+nx*hw*.3,y1+ny*hw*.3);
  vx.closePath(); vx.fill();
}
function starShape(cx,cy,r,col,dk) {
  vx.beginPath();
  for (let i=0;i<5;i++) {
    const a=(i/5)*Math.PI*2-Math.PI/2, b=((i+.5)/5)*Math.PI*2-Math.PI/2;
    i===0?vx.moveTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r)
         :vx.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r);
    vx.lineTo(cx+Math.cos(b)*r*.4,cy+Math.sin(b)*r*.4);
  }
  vx.closePath(); vx.fillStyle=col; vx.fill();
  vx.strokeStyle=dk; vx.lineWidth=0.5; vx.stroke();
}

// ─── WALL ────────────────────────────────────────────────────────────────────
function drawWall() {
  vx.fillStyle='#14141e'; vx.fillRect(0,0,VW,VH);
  vx.fillStyle='#1e1e2e'; vx.fillRect(0,0,52,VH); vx.fillRect(348,0,VW-348,VH);
  vx.fillStyle=C.wall; vx.fillRect(52,14,296,VH-26);
  const P=40;
  for (let py=14;py<VH-12;py+=P) {
    for (let px=52;px<348;px+=P) {
      const pw=Math.min(P,348-px),ph=Math.min(P,VH-12-py);
      vx.fillStyle=((Math.floor((px-52)/P)+Math.floor((py-14)/P))%2===0)?'#939393':'#878787';
      vx.fillRect(px+1,py+1,pw-1,ph-1);
      vx.fillStyle=C.wallLt; vx.fillRect(px+1,py+1,pw-1,1); vx.fillRect(px+1,py+1,1,ph-1);
      vx.fillStyle='#606060'; vx.fillRect(px+1,py+ph-1,pw-1,1); vx.fillRect(px+pw-1,py+1,1,ph-1);
      vx.fillStyle='#555'; vx.fillRect(px,py,pw,1); vx.fillRect(px,py,1,ph);
      vx.fillStyle='#505050'; vx.fillRect(px+3,py+3,3,3);
      vx.fillStyle='#AAA'; vx.fillRect(px+3,py+3,1,1);
    }
  }
  vx.fillStyle=C.red;   vx.fillRect(52,0,296,15);
  vx.fillStyle=C.redLt; vx.fillRect(52,0,296,2);
  vx.fillStyle=C.redDk; vx.fillRect(52,13,296,2);
  vx.fillStyle=C.pad;   vx.fillRect(52,VH-13,296,13);
  vx.fillStyle=C.redLt; vx.fillRect(52,VH-13,296,2);
  vx.fillStyle=C.padDk; vx.fillRect(52,VH-5,296,5);
  vx.fillStyle=C.padDk;
  for (let sx=52;sx<348;sx+=50) vx.fillRect(sx,VH-13,2,13);
  // route tape
  const tape=ROUTES[state.routeIdx]?.tape||'#22C55E';
  vx.fillStyle=tape; vx.fillRect(53,15,3,VH-28);
  vx.fillStyle='rgba(0,0,0,0.3)'; vx.fillRect(53,15,1,VH-28);
}

// ─── HOLDS ───────────────────────────────────────────────────────────────────
function drawHold(h,isCursor,isReachable) {
  const col=HOLD_COLS[h.type], sz=HOLD_SIZE[h.type], {x,y}=h;
  vx.globalAlpha=0.22; vx.fillStyle='#000';
  if (h.type==='jug'||h.type==='finish') {
    vx.beginPath(); vx.ellipse(x+1,y+2,sz*.85,sz*.52,0,0,Math.PI*2); vx.fill();
  } else if (h.type==='crimp') {
    vx.fillRect(x-sz+1,y-sz*.32+2,sz*2,sz*.65);
  } else {
    vx.beginPath(); vx.ellipse(x+1,y+2,sz*.8,sz*.52,0,Math.PI,Math.PI*2);
    vx.lineTo(x+sz*.8+1,y+2); vx.lineTo(x-sz*.8+1,y+2); vx.fill();
    vx.fillRect(x-sz*.8+1,y+2,sz*1.6,3);
  }
  vx.globalAlpha=1;
  if (h.type==='jug'||h.type==='finish') {
    vx.fillStyle=col.dk; vx.beginPath(); vx.ellipse(x,y,sz*.85,sz*.52,0,0,Math.PI*2); vx.fill();
    vx.fillStyle=col.m;  vx.beginPath(); vx.ellipse(x,y-1,sz*.82,sz*.48,0,0,Math.PI*2); vx.fill();
    vx.fillStyle=col.lt; vx.beginPath(); vx.ellipse(x-sz*.28,y-sz*.2,sz*.28,sz*.18,-0.5,0,Math.PI*2); vx.fill();
    if (h.type==='finish') starShape(x,y-sz-7,5,C.gold,C.goldDk);
  } else if (h.type==='crimp') {
    const w=sz*2,ht=sz*.65;
    vx.fillStyle=col.dk; vx.fillRect(x-sz,y-ht/2,w,ht);
    vx.fillStyle=col.m;  vx.fillRect(x-sz,y-ht/2,w,ht-2);
    vx.fillStyle=col.lt; vx.fillRect(x-sz+1,y-ht/2,w-2,2);
  } else {
    vx.fillStyle=col.dk;
    vx.beginPath(); vx.ellipse(x,y,sz*.8,sz*.52,0,Math.PI,Math.PI*2);
    vx.lineTo(x+sz*.8,y); vx.lineTo(x-sz*.8,y); vx.fill();
    vx.fillStyle=col.m;
    vx.beginPath(); vx.ellipse(x,y-1,sz*.77,sz*.49,0,Math.PI,Math.PI*2);
    vx.lineTo(x+sz*.77,y-1); vx.lineTo(x-sz*.77,y-1); vx.fill();
    vx.fillStyle=col.lt;
    vx.beginPath(); vx.ellipse(x-sz*.3,y-sz*.18,sz*.22,sz*.13,-0.4,Math.PI,Math.PI*2); vx.fill();
  }
  if (h.id===state.ch.lh||h.id===state.ch.rh) {
    vx.strokeStyle='rgba(255,255,255,0.6)'; vx.lineWidth=1.5;
    vx.beginPath(); vx.ellipse(x,y,sz+3,sz*.7+3,0,0,Math.PI*2); vx.stroke();
  }
  if (isCursor&&isReachable) {
    const p=0.55+0.45*Math.sin(Date.now()/160);
    vx.strokeStyle=`rgba(255,255,60,${p})`; vx.lineWidth=2.5;
    vx.beginPath(); vx.ellipse(x,y,sz+7,sz*.7+6,0,0,Math.PI*2); vx.stroke();
    vx.fillStyle=`rgba(255,255,60,${p})`; vx.fillRect(x-2,y-sz-12,4,4);
  } else if (isCursor) {
    vx.strokeStyle='rgba(255,120,0,0.7)'; vx.lineWidth=1.5;
    vx.beginPath(); vx.ellipse(x,y,sz+7,sz*.7+6,0,0,Math.PI*2); vx.stroke();
  }
}

// ─── CHARACTER ───────────────────────────────────────────────────────────────
function drawCharacter() {
  const ch=state.ch;
  if (ch.fallPhase){ drawFallingChar(); return; }

  const lhH=ch.lh!==null?holds[ch.lh]:null;
  const rhH=ch.rh!==null?holds[ch.rh]:null;
  const cx=ch.x, cy=ch.y;

  const lSh={x:cx-11,y:cy-12}, rSh={x:cx+11,y:cy-12};
  const lHp={x:cx-5,y:cy+8}, rHp={x:cx+5,y:cy+8};

  // Hand targets — fixed arm; IK naturally clamps at ARM_SEG*2
  let lhx=lhH?lhH.x:lSh.x-22, lhy=lhH?lhH.y:lSh.y-14;
  let rhx=rhH?rhH.x:rSh.x+22, rhy=rhH?rhH.y:rSh.y-14;
  if (ch.reachArm==='left')  { lhx=ch.reachX; lhy=ch.reachY; }
  if (ch.reachArm==='right') { rhx=ch.reachX; rhy=ch.reachY; }

  // ── Foot positions: hang straight down unless near the pad, then tuck ───
  const FSNAP=55;
  const padY=VH-13;
  const hangY=lHp.y+LEG_SEG*2-3;          // 39px below hip ≈ full extension
  const nearPad=hangY>=padY-5;              // feet would reach/pass the pad
  // Tucked: feet pulled wide and up (frog position); Hang: nearly straight down
  let lfx=nearPad?cx-13:cx-8,  lfy=nearPad?cy+16:hangY;
  let rfx=nearPad?cx+12:cx+7,  rfy=nearPad?cy+16:hangY;
  let lfH=null, rfH=null, bestLd=FSNAP, bestRd=FSNAP;
  for (const h of holds) {
    if (h.id===ch.lh||h.id===ch.rh) continue;
    if (h.y<=lHp.y) continue;
    const ld=Math.hypot(h.x-lfx,h.y-lfy);
    const rd=Math.hypot(h.x-rfx,h.y-rfy);
    if (ld<bestLd&&h.x<=cx+12){ bestLd=ld; lfH=h; }
    if (rd<bestRd&&h.x>=cx-12){ bestRd=rd; rfH=h; }
  }
  if (lfH&&rfH&&lfH.id===rfH.id){ if (bestLd<=bestRd) rfH=null; else lfH=null; }
  if (lfH){ lfx=lfH.x; lfy=lfH.y; }
  if (rfH){ rfx=rfH.x; rfy=rfH.y; }

  // ── Draw (legs behind body, body on top) ─────────────────────────────────
  // bend=+1 → left knee bends LEFT (outward); bend=-1 → right knee bends RIGHT (outward)
  const ll=ik(lHp.x,lHp.y,lfx,lfy,LEG_SEG,1);
  limb(lHp.x,lHp.y,ll.jx,ll.jy,6,C.pants,C.pantsLt,'#000');
  limb(ll.jx,ll.jy,ll.ex,ll.ey,5,C.pants,C.pantsLt,'#000');
  vx.fillStyle='#111'; vx.fillRect(ll.ex-6,ll.ey-3,12,5);
  vx.fillStyle='#444'; vx.fillRect(ll.ex-6,ll.ey-3,12,1);

  const rl=ik(rHp.x,rHp.y,rfx,rfy,LEG_SEG,-1);
  limb(rHp.x,rHp.y,rl.jx,rl.jy,6,C.pants,C.pantsLt,'#000');
  limb(rl.jx,rl.jy,rl.ex,rl.ey,5,C.pants,C.pantsLt,'#000');
  vx.fillStyle='#111'; vx.fillRect(rl.ex-5,rl.ey-3,12,5);
  vx.fillStyle='#444'; vx.fillRect(rl.ex-5,rl.ey-3,12,1);

  // Arms — fixed ARM_SEG; IK gives natural bend for close holds,
  // extends (but never past ARM_SEG*2) for far ones.
  const la=ik(lSh.x,lSh.y,lhx,lhy,ARM_SEG,-1);
  limb(lSh.x,lSh.y,la.jx,la.jy,5,C.shirt,C.shirtLt,C.shirtDk);
  limb(la.jx,la.jy,la.ex,la.ey,4.5,C.skin,C.skinLt,C.skinDk);
  vx.fillStyle=C.skin; vx.beginPath(); vx.ellipse(la.ex,la.ey,4,3,0,0,Math.PI*2); vx.fill();
  if (ch.lh!==null){ vx.fillStyle='rgba(255,255,255,0.25)'; vx.beginPath(); vx.ellipse(la.ex,la.ey,4.5,3.5,0,0,Math.PI*2); vx.fill(); }

  const ra=ik(rSh.x,rSh.y,rhx,rhy,ARM_SEG,1);
  limb(rSh.x,rSh.y,ra.jx,ra.jy,5,C.shirt,C.shirtLt,C.shirtDk);
  limb(ra.jx,ra.jy,ra.ex,ra.ey,4.5,C.skin,C.skinLt,C.skinDk);
  vx.fillStyle=C.skin; vx.beginPath(); vx.ellipse(ra.ex,ra.ey,4,3,0,0,Math.PI*2); vx.fill();
  if (ch.rh!==null){ vx.fillStyle='rgba(255,255,255,0.25)'; vx.beginPath(); vx.ellipse(ra.ex,ra.ey,4.5,3.5,0,0,Math.PI*2); vx.fill(); }

  // Torso
  vx.fillStyle=C.shirtDk; rr(vx,cx-9,cy-13,19,22,3); vx.fill();
  vx.fillStyle=C.shirt;   rr(vx,cx-8,cy-13,17,20,2); vx.fill();
  vx.fillStyle=C.shirtLt; vx.fillRect(cx-6,cy-12,6,3);
  vx.fillStyle='rgba(255,255,255,0.55)';
  vx.fillRect(cx-4,cy-7,1,8); vx.fillRect(cx+3,cy-7,1,8);
  vx.fillRect(cx-3,cy-5,1,3); vx.fillRect(cx+2,cy-5,1,3);
  vx.fillRect(cx-1,cy-3,2,1);

  // Neck
  vx.fillStyle=C.skinDk; vx.fillRect(cx-3,cy-18,7,7);
  vx.fillStyle=C.skin;   vx.fillRect(cx-2,cy-18,5,6);

  // Head — back-facing
  vx.fillStyle=C.skinDk; vx.beginPath(); vx.ellipse(cx,cy-27,10,11,0,0,Math.PI*2); vx.fill();
  vx.fillStyle=C.skin;   vx.beginPath(); vx.ellipse(cx,cy-27,9.5,10.5,0,0,Math.PI*2); vx.fill();
  vx.fillStyle=C.skinDk; vx.fillRect(cx-12,cy-28,4,7);
  vx.fillStyle=C.skin;   vx.fillRect(cx-12,cy-28,3,5);
  vx.fillStyle=C.skinDk; vx.fillRect(cx+8,cy-28,4,7);
  vx.fillStyle=C.skin;   vx.fillRect(cx+9,cy-28,3,5);
  vx.fillStyle=C.hair;   vx.beginPath(); vx.ellipse(cx,cy-27,10,11,0,0,Math.PI*2); vx.fill();
  vx.fillStyle=C.skin;   vx.beginPath(); vx.ellipse(cx,cy-18,5,4.5,0,0,Math.PI); vx.fill();
  vx.fillStyle=C.hairLt; vx.beginPath(); vx.ellipse(cx-2,cy-34,4,3.5,-0.3,0,Math.PI*2); vx.fill();
  vx.strokeStyle='rgba(0,0,0,0.22)'; vx.lineWidth=0.5;
  vx.beginPath(); vx.moveTo(cx-4,cy-38); vx.quadraticCurveTo(cx-6,cy-26,cx-5,cy-18); vx.stroke();
  vx.beginPath(); vx.moveTo(cx+4,cy-38); vx.quadraticCurveTo(cx+6,cy-26,cx+5,cy-18); vx.stroke();
  vx.beginPath(); vx.moveTo(cx,cy-38); vx.lineTo(cx,cy-18); vx.stroke();
}

function drawFallingChar() {
  const ch=state.ch;
  vx.save(); vx.translate(ch.fallX,ch.fallY); vx.rotate(ch.fallRot);
  limb(-6,8,-26,-6,6,C.pants,C.pantsLt,'#000');
  limb(6,8,24,-6,6,C.pants,C.pantsLt,'#000');
  limb(-11,-12,-30,-4,5,C.shirt,C.shirtLt,C.shirtDk);
  limb(-30,-4,-40,7,4.5,C.skin,C.skinLt,C.skinDk);
  limb(11,-12,30,-4,5,C.shirt,C.shirtLt,C.shirtDk);
  limb(30,-4,40,7,4.5,C.skin,C.skinLt,C.skinDk);
  vx.fillStyle=C.shirtDk; rr(vx,-9,-13,19,22,3); vx.fill();
  vx.fillStyle=C.shirt;   rr(vx,-8,-13,17,20,2); vx.fill();
  vx.fillStyle=C.skinDk; vx.beginPath(); vx.ellipse(0,-27,10,11,0,0,Math.PI*2); vx.fill();
  vx.fillStyle=C.skin;   vx.beginPath(); vx.ellipse(0,-27,9.5,10.5,0,0,Math.PI*2); vx.fill();
  vx.fillStyle=C.hair;   vx.beginPath(); vx.ellipse(0,-27,10,11,0,0,Math.PI*2); vx.fill();
  vx.fillStyle=C.skin;   vx.beginPath(); vx.ellipse(0,-18,5,4.5,0,0,Math.PI); vx.fill();
  vx.fillStyle=C.hairLt; vx.beginPath(); vx.ellipse(-2,-34,4,3.5,-0.3,0,Math.PI*2); vx.fill();
  vx.restore();
}

// ─── PARTICLES ───────────────────────────────────────────────────────────────
function spawnChalk(x,y) {
  for (let i=0;i<10;i++) {
    const a=Math.random()*Math.PI*2,spd=25+Math.random()*45;
    particles.push({x,y,vx:Math.cos(a)*spd,vy:Math.sin(a)*spd-22,r:1+Math.random()*2.5,life:1,max:.5+Math.random()*.4,type:'chalk'});
  }
}
function spawnDust(x,y) {
  for (let i=0;i<14;i++) {
    const a=Math.PI+(Math.random()-.5)*Math.PI,spd=20+Math.random()*40;
    particles.push({x,y,vx:Math.cos(a)*spd,vy:Math.sin(a)*spd-12,r:2+Math.random()*5,life:1,max:.8+Math.random()*.5,type:'dust'});
  }
}
function updateParticles(dt) {
  for (let i=particles.length-1;i>=0;i--) {
    const p=particles[i];
    p.x+=p.vx*dt; p.y+=p.vy*dt; p.vy+=70*dt; p.life-=dt/p.max;
    if (p.life<=0) particles.splice(i,1);
  }
}
function drawParticles() {
  for (const p of particles) {
    vx.globalAlpha=clamp(p.life,0,1)*.75;
    vx.fillStyle=p.type==='chalk'?'#fff':'#C8AA88';
    vx.beginPath(); vx.ellipse(p.x,p.y,p.r,p.r*.65,0,0,Math.PI*2); vx.fill();
  }
  vx.globalAlpha=1;
}

// ─── TIMING OVERLAY ──────────────────────────────────────────────────────────
function drawTimingOverlay() {
  const tm=state.tm;
  vx.fillStyle='rgba(0,0,0,0.5)'; vx.fillRect(52,VH-95,296,84);
  vx.strokeStyle=C.red; vx.lineWidth=2; vx.strokeRect(54,VH-93,292,80);
  if (tm.phase==='power') {
    const bx=75,by=VH-62,bw=250,bh=18;
    const hp=HOLD_PROPS[holds[tm.targetId].type];
    vx.fillStyle='#1a1a1a'; vx.fillRect(bx,by,bw,bh);
    const lo=(hp.powerMin/100)*bw, hi=(hp.powerMax/100)*bw;
    vx.fillStyle='#550000'; vx.fillRect(bx,by,lo,bh);
    vx.fillStyle='#004400'; vx.fillRect(bx+lo,by,hi-lo,bh);
    vx.fillStyle='#550000'; vx.fillRect(bx+hi,by,bw-hi,bh);
    vx.fillStyle='#00aa00'; vx.fillRect(bx+lo-1,by-4,2,4); vx.fillRect(bx+hi-1,by-4,2,4);
    vx.strokeStyle='#444'; vx.lineWidth=1; vx.strokeRect(bx,by,bw,bh);
    const nx=bx+(tm.pVal/100)*bw;
    vx.fillStyle='#fff'; vx.fillRect(nx-2,by-4,5,bh+8);
    vx.fillStyle='#ffff00'; vx.fillRect(nx-1,by-3,3,bh+6);
  } else {
    const dcx=VW/2,dcy=VH-54,dr=30;
    const hp=HOLD_PROPS[holds[tm.targetId].type];
    const idealR=tm.idealAngle*Math.PI/180, tolR=hp.angleTol*Math.PI/180;
    vx.fillStyle='#1a1a1a'; vx.beginPath(); vx.ellipse(dcx,dcy,dr,dr,0,0,Math.PI*2); vx.fill();
    vx.strokeStyle='#333'; vx.lineWidth=1;
    for (let i=0;i<12;i++) {
      const a=(i/12)*Math.PI*2;
      vx.beginPath(); vx.moveTo(dcx+Math.cos(a)*(dr-5),dcy+Math.sin(a)*(dr-5));
      vx.lineTo(dcx+Math.cos(a)*dr,dcy+Math.sin(a)*dr); vx.stroke();
    }
    vx.strokeStyle='#005500'; vx.lineWidth=9;
    vx.beginPath(); vx.arc(dcx,dcy,dr-6,idealR-tolR,idealR+tolR); vx.stroke();
    vx.strokeStyle='#00bb00'; vx.lineWidth=5;
    vx.beginPath(); vx.arc(dcx,dcy,dr-6,idealR-tolR,idealR+tolR); vx.stroke();
    vx.strokeStyle='#444'; vx.lineWidth=1;
    vx.beginPath(); vx.ellipse(dcx,dcy,dr,dr,0,0,Math.PI*2); vx.stroke();
    const cr=tm.aVal*Math.PI/180;
    const ax=dcx+Math.cos(cr)*(dr-7), ay=dcy+Math.sin(cr)*(dr-7);
    vx.strokeStyle='#fff'; vx.lineWidth=2;
    vx.beginPath(); vx.moveTo(dcx,dcy); vx.lineTo(ax,ay); vx.stroke();
    vx.fillStyle='#ffff00'; vx.beginPath(); vx.ellipse(ax,ay,3.5,3.5,0,0,Math.PI*2); vx.fill();
    vx.fillStyle='#888'; vx.beginPath(); vx.ellipse(dcx,dcy,3,3,0,0,Math.PI*2); vx.fill();
  }
}

// ─── HUD ─────────────────────────────────────────────────────────────────────
function drawHUD() {
  vx.fillStyle='#0a0a0a'; vx.fillRect(52,0,296,14);
  vx.fillStyle=C.red; vx.fillRect(52,13,296,2);
  if (!state.ch.fallPhase) {
    vx.strokeStyle='rgba(255,255,255,0.32)'; vx.lineWidth=1.5;
    vx.setLineDash([4,4]);
    vx.beginPath(); vx.ellipse(state.ch.x,state.ch.y,REACH,REACH,0,0,Math.PI*2); vx.stroke();
    vx.setLineDash([]);
  }
}

// ─── MENU ────────────────────────────────────────────────────────────────────
function drawMenu() {
  vx.fillStyle='#0d0d0d'; vx.fillRect(0,0,VW,VH);
  vx.fillStyle=C.red;   vx.fillRect(0,0,VW,22);
  vx.fillStyle=C.redLt; vx.fillRect(0,0,VW,3);
  vx.fillStyle=C.redDk; vx.fillRect(0,19,VW,3);
  vx.fillStyle=C.red;   vx.fillRect(0,0,5,VH); vx.fillRect(VW-5,0,5,VH);
  vx.fillStyle='#1a1a1a'; vx.fillRect(265,22,130,VH-22);
  for (let py=22;py<VH;py+=30)
    for (let px=265;px<VW-5;px+=30) {
      vx.fillStyle='#232323'; vx.fillRect(px+1,py+1,28,28);
      vx.fillStyle='#2a2a2a'; vx.fillRect(px+1,py+1,28,1);
    }
  // pixel M
  const mp=[[1,0,0,0,0,0,1],[1,1,0,0,0,1,1],[1,1,1,0,1,1,1],[1,0,1,1,1,0,1],[1,0,0,1,0,0,1],[1,0,0,0,0,0,1],[1,0,0,0,0,0,1],[1,0,0,0,0,0,1]];
  const msz=9,mox=65,moy=38;
  vx.fillStyle=C.red;
  for (let r=0;r<mp.length;r++) for (let c=0;c<mp[r].length;c++) if(mp[r][c]) vx.fillRect(mox+c*msz,moy+r*msz,msz-1,msz-1);
  vx.fillStyle=C.redLt;
  for (let r=0;r<mp.length;r++) for (let c=0;c<mp[r].length;c++) if(mp[r][c]){vx.fillRect(mox+c*msz,moy+r*msz,msz-1,1);vx.fillRect(mox+c*msz,moy+r*msz,1,msz-1);}
  // Route option boxes (3 routes + how to play)
  const optYs=[160,183,206,232];
  const tapes=['#22C55E','#3B82F6','#D00000','#888888'];
  for (let i=0;i<4;i++) {
    if (state.menuSel===i) {
      vx.fillStyle=i<3?tapes[i]:C.red;
      rr(vx,22,optYs[i]-2,205,16,2); vx.fill();
    }
    // tape swatch
    if (i<3) {
      vx.fillStyle=tapes[i]; vx.fillRect(26,optYs[i]+2,3,10);
    }
  }
  vx.fillStyle='#111'; vx.fillRect(0,VH-16,VW,16);
}

// ─── COMPLETE ────────────────────────────────────────────────────────────────
function drawComplete() {
  vx.fillStyle='#0d0d0d'; vx.fillRect(0,0,VW,VH);
  vx.fillStyle=C.gold;   vx.fillRect(0,0,VW,22);
  vx.fillStyle=C.goldLt; vx.fillRect(0,0,VW,3);
  vx.fillStyle=C.goldDk; vx.fillRect(0,19,VW,3);
  const n=calcStars();
  for (let i=0;i<3;i++) starShape(150+i*50,72,17,i<n?C.gold:'#2a2a2a',i<n?C.goldDk:'#1a1a1a');
  for (let i=0;i<3;i++){ const bx=14+i*130; vx.fillStyle='#111'; rr(vx,bx,105,118,40,3); vx.fill(); vx.strokeStyle=C.red; vx.lineWidth=1.5; rr(vx,bx,105,118,40,3); vx.stroke(); }
  const optYs=[168,192];
  for (let i=0;i<2;i++) if(state.completeSel===i){ vx.fillStyle=C.red; rr(vx,110,optYs[i]-3,180,18,3); vx.fill(); }
}

function drawHowToPlay() {
  vx.fillStyle='#0d0d0d'; vx.fillRect(0,0,VW,VH);
  vx.fillStyle=C.red; vx.fillRect(0,0,VW,20);
  vx.fillStyle=C.redLt; vx.fillRect(0,0,VW,2);
  const sw=[{col:C.jugG,lt:C.jugGLt,y:120},{col:C.crimpB,lt:C.crimpBLt,y:146},{col:C.slopR,lt:C.slopRLt,y:172},{col:C.fin,lt:C.finLt,y:198}];
  for (const s of sw){ vx.fillStyle=s.col; vx.beginPath(); vx.ellipse(30,s.y+4,8,5,0,0,Math.PI*2); vx.fill(); vx.fillStyle=s.lt; vx.beginPath(); vx.ellipse(27,s.y+2,3.5,2.5,-0.3,0,Math.PI*2); vx.fill(); }
}

// ─── UTILS ───────────────────────────────────────────────────────────────────
function fmtTime(s){ return Math.floor(s/60)+':'+String(Math.floor(s%60)).padStart(2,'0'); }
function calcStars(){
  if (state.falls===0&&state.time<40) return 3;
  if (state.falls<=2&&state.time<90)  return 2;
  return 1;
}
function flash(txt,col,dur=1.2){ state.flash={txt,col}; state.flashT=dur; state.flashMax=dur; }

// ─── GAME LOGIC ──────────────────────────────────────────────────────────────
function tryGrab(holdId) {
  const h=holds[holdId], ch=state.ch;
  if (dist(ch.x,ch.y,h.x,h.y)>REACH) return;
  const hp=HOLD_PROPS[h.type], tm=state.tm;
  tm.phase='power'; tm.targetId=holdId;
  tm.pVal=0; tm.pDir=1; tm.pSpd=hp.pSpd; tm.pLocked=false;
  tm.aVal=0; tm.aSpd=hp.aSpd; tm.aLocked=false;
  tm.idealAngle=ang(state.ch.x,state.ch.y,h.x,h.y);
  ch.reachArm=h.x<=ch.x?'left':'right';
  ch.reachX=h.x; ch.reachY=h.y;
  if (!state.timerOn) state.timerOn=true;
  state.screen='timing';
}

function resolve() {
  const tm=state.tm, ch=state.ch, h=holds[tm.targetId];
  const hp=HOLD_PROPS[h.type];
  const powerOk=tm.pLockedVal>=hp.powerMin&&tm.pLockedVal<=hp.powerMax;
  let diff=Math.abs(tm.aLockedVal-tm.idealAngle);
  if (diff>180) diff=360-diff;
  const angleOk=diff<=hp.angleTol;
  ch.reachArm=null;

  if (powerOk&&angleOk) {
    if (h.x<=ch.x) ch.lh=h.id; else ch.rh=h.id;
    const lh=holds[ch.lh], rh=holds[ch.rh];
    ch.tx=(lh.x+rh.x)/2; ch.ty=Math.max(lh.y,rh.y)+HANG;
    spawnChalk(h.x,h.y);
    const perfect=diff<hp.angleTol*.35&&Math.abs(tm.pLockedVal-(hp.powerMin+hp.powerMax)/2)<10;
    const pts=(h.type==='finish'?50:10)*(perfect?2:1);
    state.score+=pts;
    if (h.isFinish) {
      flash('SEND IT!',C.gold,2.2);
      state.screen='climbing';
      setTimeout(()=>{ state.screen='complete'; },2200);
    } else {
      flash(perfect?'PERFECT! +'+pts:'GRABBED! +'+pts, perfect?C.gold:'#22C55E', 1.1);
      state.screen='climbing';
      setTimeout(()=>{
        const r=reachable();
        if (r.length&&!r.find(h2=>h2.id===state.cursorId)) state.cursorId=r.reduce((a,b)=>a.y<b.y?a:b).id;
      },400);
    }
  } else {
    flash(!powerOk?(tm.pLockedVal<hp.powerMin?'TOO WEAK!':'TOO MUCH!'):'WRONG ANGLE!', C.red, 1.1);
    triggerFall();
  }
}

function triggerFall() {
  const ch=state.ch;
  ch.fallX=ch.x; ch.fallY=ch.y; ch.fallVy=-25; ch.fallRot=0; ch.fallTimer=0;
  ch.fallRotSpd=(Math.random()>.5?1:-1)*(3.5+Math.random()*4);
  ch.fallPhase='fall'; ch.lh=null; ch.rh=null;
  state.screen='falling';
}

function updateFall(dt) {
  const ch=state.ch, padY=VH-20;
  if (ch.fallPhase==='fall') {
    ch.fallVy+=320*dt; ch.fallY+=ch.fallVy*dt; ch.fallRot+=ch.fallRotSpd*dt;
    if (ch.fallY>=padY){ ch.fallY=padY; ch.fallVy=-75; ch.fallRotSpd*=.25; ch.fallPhase='bounce'; spawnDust(ch.fallX,padY); }
  } else if (ch.fallPhase==='bounce') {
    ch.fallVy+=270*dt; ch.fallY+=ch.fallVy*dt; ch.fallRot+=ch.fallRotSpd*dt*.4;
    if (ch.fallY>=padY){ ch.fallY=padY; ch.fallPhase='settle'; ch.fallTimer=0; }
  } else if (ch.fallPhase==='settle') {
    ch.fallRot=lerp(ch.fallRot,0,dt*6); ch.fallTimer+=dt;
    if (ch.fallTimer>.9) {
      state.falls++;
      const s=holds.filter(h=>h.isStart);
      ch.lh=s[0].id; ch.rh=s[1].id;
      const bp=bodyPos(s[0].id,s[1].id);
      ch.x=bp.x; ch.y=bp.y; ch.tx=bp.x; ch.ty=bp.y; ch.fallPhase=null;
      state.screen='climbing';
      const r=reachableFrom(bp.x,bp.y,s[0].id,s[1].id);
      if (r.length) state.cursorId=r.reduce((a,b)=>a.y<b.y?a:b).id;
    }
  }
}

function updateClimbing(dt) {
  const ch=state.ch;
  const dx=ch.tx-ch.x, dy=ch.ty-ch.y;
  if (Math.hypot(dx,dy)>.5){ ch.x+=dx*7*dt; ch.y+=dy*7*dt; }
  if (state.timerOn) state.time+=dt;
  if (state.flashT>0){ state.flashT-=dt; if(state.flashT<=0) state.flash=null; }
}

// ─── TEXT OVERLAY ────────────────────────────────────────────────────────────
function drawText() {
  ctx.save();
  const F=sz=>`bold ${sz}px "Courier New", monospace`;

  if (state.screen==='menu') {
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillStyle='#fff'; ctx.font=F(26); ctx.fillText('MAVERICK BOULDER',400,42);
    ctx.fillStyle='#777'; ctx.font=F(11); ctx.fillText('UNO MAVERICKS CLIMBING GYM',400,110);
    // Route options
    const opts=[
      'THE WARM UP   V0',
      'THE CRACK     V2',
      'THE OVERHANG  V4',
      'HOW TO PLAY',
    ];
    const cols=['#22C55E','#3B82F6','#D00000','#888888'];
    const oys=[322,368,414,466];
    for (let i=0;i<4;i++) {
      ctx.fillStyle=state.menuSel===i?'#fff':cols[i];
      ctx.font=F(16);
      ctx.fillText((state.menuSel===i?'▶  ':' ')+opts[i],400,oys[i]);
    }
    ctx.fillStyle='#333'; ctx.font=F(11);
    ctx.fillText('ARROWS  ·  ENTER to select',400,556);

  } else if (state.screen==='howtoplay') {
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillStyle='#fff'; ctx.font=F(20); ctx.fillText('HOW TO PLAY',400,28);
    ctx.fillStyle='#555'; ctx.font=F(11); ctx.textAlign='right'; ctx.fillText('[ ESC ]',780,28);
    const lines=[
      {t:'ARROWS — move cursor between holds',     c:'#ccc',    y:78 },
      {t:'SPACE / ENTER — attempt selected hold',  c:'#ccc',    y:108},
      {t:'SPACE — lock POWER, then lock ANGLE',    c:'#ccc',    y:138},
      {t:'Both in the GREEN = successful grab!',   c:'#22C55E', y:168},
      {t:'Fail either = you FALL to the pad',      c:C.red,     y:198},
      {t:'HOLD TYPES:',                            c:'#fff',    y:246},
      {t:'       JUG    — wide timing windows',    c:C.jugG,    y:278},
      {t:'       CRIMP  — tight power window',     c:C.crimpB,  y:308},
      {t:'       SLOPER — tight angle window',     c:C.slopR,   y:338},
      {t:'       FINISH — reach the top!',         c:C.fin,     y:368},
      {t:'ESC — return to menu',                   c:'#444',    y:430},
    ];
    ctx.textAlign='left';
    for (const l of lines){ ctx.fillStyle=l.c; ctx.font=F(13); ctx.fillText(l.t,56,l.y); }

  } else if (['climbing','timing','falling'].includes(state.screen)) {
    const route=ROUTES[state.routeIdx];
    ctx.fillStyle='#fff'; ctx.font=F(13); ctx.textBaseline='middle';
    ctx.textAlign='left';  ctx.fillText('SCORE: '+state.score,118,14);
    ctx.textAlign='right'; ctx.fillText(fmtTime(state.time),678,14);
    ctx.textAlign='center';
    ctx.fillStyle=route.tape; ctx.font=F(11);
    ctx.fillText(route.name+'  ·  '+route.grade,400,14);
    ctx.fillStyle='#666'; ctx.font=F(11);
    ctx.textAlign='left'; ctx.fillText('FALLS: '+state.falls,118,32);
    ctx.fillStyle='#fff'; ctx.textAlign='center'; ctx.fillText('MAVERICK CLIMBING GYM',400,32);

    if (state.screen==='climbing') {
      ctx.fillStyle='#333'; ctx.font=F(10); ctx.textBaseline='bottom';
      ctx.fillText('ARROWS: select hold   SPACE: attempt',400,598);
      const r=reachable();
      if (r.length===0) {
        ctx.fillStyle='#f97316'; ctx.font=F(13); ctx.textBaseline='middle';
        ctx.fillText('No holds in reach!',400,300);
      }
      const cur=holds[state.cursorId];
      if (cur) {
        const inR=!!r.find(h=>h.id===cur.id);
        const nm={jug:'JUG',crimp:'CRIMP',sloper:'SLOPER',finish:'TOP HOLD'};
        ctx.fillStyle=inR?'#22C55E':'#f97316';
        ctx.font=F(11); ctx.textAlign='center'; ctx.textBaseline='bottom';
        ctx.fillText(nm[cur.type]+(inR?'':' (out of reach)'),cur.x*2,(cur.y-HOLD_SIZE[cur.type]-10)*2);
      }
    }

    if (state.screen==='timing') {
      ctx.fillStyle='#fff'; ctx.font=F(15); ctx.textAlign='center'; ctx.textBaseline='top';
      if (state.tm.phase==='power') {
        ctx.fillText('POWER  —  SPACE TO LOCK!',400,420);
        ctx.fillStyle='#888'; ctx.font=F(11); ctx.fillText('Keep needle in the GREEN zone',400,440);
      } else {
        ctx.fillText('ANGLE  —  SPACE TO LOCK!',400,420);
        ctx.fillStyle='#888'; ctx.font=F(11); ctx.fillText('Stop the arrow in the GREEN arc',400,440);
      }
    }

    if (state.flash&&state.flashT>0) {
      const a=clamp(state.flashT/state.flashMax,0,1);
      ctx.save(); ctx.globalAlpha=a;
      ctx.fillStyle=state.flash.col; ctx.font=F(34);
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.shadowColor='#000'; ctx.shadowBlur=10;
      ctx.fillText(state.flash.txt,400,300);
      ctx.restore();
    }

  } else if (state.screen==='complete') {
    const route=ROUTES[state.routeIdx];
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillStyle=C.gold; ctx.font=F(34); ctx.fillText('ROUTE COMPLETE!',400,38);
    ctx.fillStyle='#aaa'; ctx.font=F(14); ctx.fillText(route.name+'  ·  '+route.grade,400,68);
    ctx.fillStyle='#666'; ctx.font=F(10); ctx.fillText(calcStars()+' / 3  STARS',400,100);
    const stats=[{lbl:'TIME',val:fmtTime(state.time),cx:128},{lbl:'SCORE',val:String(state.score),cx:400},{lbl:'FALLS',val:String(state.falls),cx:672}];
    for (const s of stats){ ctx.fillStyle='#777'; ctx.font=F(11); ctx.fillText(s.lbl,s.cx,222); ctx.fillStyle='#fff'; ctx.font=F(22); ctx.fillText(s.val,s.cx,248); }
    const opts=['PLAY AGAIN','MAIN MENU'], oys=[338,386];
    for (let i=0;i<2;i++){ ctx.fillStyle=state.completeSel===i?'#fff':'#555'; ctx.font=F(20); ctx.fillText((state.completeSel===i?'▶  ':'   ')+opts[i],400,oys[i]); }
    ctx.fillStyle='#3a3a3a'; ctx.font=F(11); ctx.fillText('ENTER to select',400,440);
  }

  ctx.restore();
}

// ─── UPDATE ──────────────────────────────────────────────────────────────────
let lastTs=null;
function update(dt) {
  const jp=keys.jp;

  if (state.screen==='menu') {
    if (jp.has('ArrowUp'))   state.menuSel=(state.menuSel+3)%4;
    if (jp.has('ArrowDown')) state.menuSel=(state.menuSel+1)%4;
    if (jp.has('Enter')||jp.has(' ')) {
      if (state.menuSel===3) { state.screen='howtoplay'; }
      else { initState(state.menuSel,'climbing'); state.screen='climbing'; }
    }
    if (jp.has('Escape')) history.back();

  } else if (state.screen==='howtoplay') {
    if (jp.has('Escape')||jp.has('Enter')||jp.has(' ')) state.screen='menu';

  } else if (state.screen==='climbing') {
    updateClimbing(dt); updateParticles(dt);
    if (jp.has('Escape')) state.screen='menu';
    if (jp.has('ArrowUp'))    moveCursor('up');
    if (jp.has('ArrowDown'))  moveCursor('down');
    if (jp.has('ArrowLeft'))  moveCursor('left');
    if (jp.has('ArrowRight')) moveCursor('right');
    if (jp.has(' ')||jp.has('Enter')) {
      const r=reachable();
      if (r.find(h=>h.id===state.cursorId)) tryGrab(state.cursorId);
      else flash('OUT OF REACH',C.red,.8);
    }

  } else if (state.screen==='timing') {
    const tm=state.tm;
    updateClimbing(dt); updateParticles(dt);
    if (jp.has('Escape')){ state.ch.reachArm=null; state.screen='climbing'; }
    else if (tm.phase==='power'&&!tm.pLocked) {
      tm.pVal+=tm.pDir*tm.pSpd*dt;
      if (tm.pVal>=100){ tm.pVal=100; tm.pDir=-1; }
      if (tm.pVal<=0)  { tm.pVal=0;   tm.pDir=1;  }
      if (jp.has(' ')||jp.has('Enter')){ tm.pLocked=true; tm.pLockedVal=tm.pVal; tm.phase='angle'; }
    } else if (tm.phase==='angle'&&!tm.aLocked) {
      tm.aVal=(tm.aVal+tm.aSpd*dt)%360;
      if (jp.has(' ')||jp.has('Enter')){ tm.aLocked=true; tm.aLockedVal=tm.aVal; resolve(); }
    }

  } else if (state.screen==='falling') {
    updateFall(dt); updateParticles(dt);
    if (state.flashT>0) state.flashT-=dt;

  } else if (state.screen==='complete') {
    if (jp.has('ArrowUp')||jp.has('ArrowDown')) state.completeSel^=1;
    if (jp.has('Enter')||jp.has(' ')) {
      if (state.completeSel===0){ initState(state.routeIdx,'climbing'); state.screen='climbing'; }
      else { initState(0,'menu'); state.screen='menu'; }
    }
  }

  jp.clear();
}

// ─── DRAW ────────────────────────────────────────────────────────────────────
function draw() {
  vx.clearRect(0,0,VW,VH);
  if (state.screen==='menu')        { drawMenu(); }
  else if (state.screen==='howtoplay'){ drawHowToPlay(); }
  else if (state.screen==='complete') { drawComplete(); }
  else {
    drawWall();
    const reach=new Set(reachable().map(h=>h.id));
    for (const h of holds) drawHold(h,h.id===state.cursorId,reach.has(h.id));
    drawParticles();
    drawCharacter();
    if (state.screen==='timing') drawTimingOverlay();
    drawHUD();
  }
  ctx.fillStyle='#000'; ctx.fillRect(0,0,800,600);
  ctx.imageSmoothingEnabled=false;
  ctx.drawImage(vc,0,0,800,600);
  drawText();
}

// ─── LOOP ────────────────────────────────────────────────────────────────────
function loop(ts) {
  if (!lastTs) lastTs=ts;
  const dt=Math.min((ts-lastTs)/1000,.05);
  lastTs=ts;
  update(dt); draw();
  requestAnimationFrame(loop);
}
initState(0,'menu');
requestAnimationFrame(loop);
