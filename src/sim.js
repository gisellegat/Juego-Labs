// Physics playground: Matter.js bodies, drawn by hand on an HTML5 canvas 60 times a second.
// With a level it becomes a side-scroller: blocks, coins, monsters, spikes, a gate and a flag.
import Matter from "matter-js";
import { PARTS, JOINTS, INK } from "./character.js";
import { drawScene, GROUND } from "./scenes.js";

const { Engine, Bodies, Body, Composite, Mouse, MouseConstraint, Events, Query, Vector } = Matter;
export const W = 960, H = 540;
const FLOOR = H - GROUND, TILE = 40;
const TOY_COLOR = { ball: "#ff5d73", box: "#ffcd3c", balloon: "#a26bff", plank: "#c98d4b" };
const MONSTER = { slime: [44, 36, 1.2], bat: [46, 30, 0], boss: [90, 80, 1.6] }; // width, height, walk speed
export const TOYS = Object.keys(TOY_COLOR);
const clamp = (v, a, b) => Math.min(b, Math.max(a, Number(v) || 0));
export const sleep = ms => new Promise(r => setTimeout(r, ms));

// onEvent(name, data): "click" | "ground" | "toy" for scripts; "win" | "lose" | "hurt" for levels
// HUD heart (drawn as a path, centered on x, y)
function heart(c, x, y) {
  c.beginPath(); c.moveTo(x, y + 7);
  c.bezierCurveTo(x - 9, y + 1, x - 8, y - 7, x - 3.5, y - 7); c.bezierCurveTo(x - 1.5, y - 7, x, y - 5.5, x, y - 4);
  c.bezierCurveTo(x, y - 5.5, x + 1.5, y - 7, x + 3.5, y - 7); c.bezierCurveTo(x + 8, y - 7, x + 9, y + 1, x, y + 7); c.fill();
}

export function createSim(canvas, onEvent, level = null) {
  const ctx = canvas.getContext("2d");
  const css = getComputedStyle(document.documentElement), tok = n => css.getPropertyValue(n).trim();
  const reduce = matchMedia("(prefers-reduced-motion: reduce)"); // read live: decorative motion stops, gameplay stays
  const sway = () => (reduce.matches ? 0 : 1);
  const engine = Engine.create(); engine.constraintIterations = 4; const world = engine.world;
  const K = level ? 0.8 : 1.25, startX = level ? 140 : W / 2, worldW = level ? level.width : W;
  const stat = (x, y, w, h, label, o = {}) => Bodies.rectangle(x, y, w, h, { isStatic: true, label, ...o });
  Composite.add(world, [stat(-50, H / 2, 100, H * 4, "wall"), stat(worldW + 50, H / 2, 100, H * 4, "wall"), stat(worldW / 2, -600, worldW * 3, 100, "wall")]);
  if (!level) Composite.add(world, stat(W / 2, FLOOR + 50, W * 3, 100, "ground", { friction: 0.9 }));
  const mouse = Mouse.create(canvas); canvas.removeEventListener("wheel", mouse.mousewheel); // let the page scroll over the stage
  const mc = MouseConstraint.create(engine, { mouse, constraint: { stiffness: 0.2, render: { visible: false } } });
  Composite.add(world, mc);

  let char = null, pose = null, imgs = null, props = [], bounce = 0.2, bubble = null, fx = [], scene = level?.scene || "park", raf = 0, title = "";
  let camX = 0, hearts = 3, coins = 0, hurtUntil = 0, done = false, lastGround = 0, lastMove = -99, gate = null, tick = 0;
  const monsters = [], coinBodies = [];

  if (level) {
    const tile = o => ({ ...o, plugin: { tile: true } });
    for (const [a, b] of level.ground) Composite.add(world, stat((a + b) / 2, FLOOR + TILE / 2, b - a, TILE, "ground", tile({ friction: 0.9 })));
    for (const [x, y, w] of level.platforms) Composite.add(world, stat(x + w / 2, y + TILE / 2, w, TILE, "ground", tile({ friction: 0.9 })));
    for (const [a, b] of level.spikes || []) Composite.add(world, stat((a + b) / 2, FLOOR - 9, b - a, 18, "spike", { isSensor: true }));
    if (level.gate) Composite.add(world, gate = stat(level.gate, FLOOR - 260, 40, 520, "gate"));
    Composite.add(world, stat(level.flag, FLOOR / 2 - 300, 24, FLOOR + 600, "flag", { isSensor: true })); // full height: you can't float over it
    for (const [x, y] of level.coins) { const c = Bodies.circle(x, y, 12, { isStatic: true, isSensor: true, label: "coin" }); coinBodies.push(c); Composite.add(world, c); }
    for (const m of level.monsters) {
      const [w, h] = MONSTER[m.kind], y = m.kind === "bat" ? m.y : FLOOR - h / 2;
      const b = stat(m.x, y, w, h, "monster", { chamfer: { radius: 10 } });
      b.plugin = { m, y0: y, dir: 1, hp: m.kind === "boss" ? 3 : 1, hitUntil: 0 }; monsters.push(b); Composite.add(world, b);
    }
  }

  // The buddy is ONE rigid body built from its six parts: it can't fall apart at the joints, and with
  // infinite rotational inertia it always stands upright. Arms and legs only swing in the drawing (drawChar).
  function spawnChar(parts) {
    if (parts) imgs = parts;
    if (char) Composite.remove(world, char.body);
    const x0 = startX - 100 * K, y0 = FLOOR - 192 * K - 4, by = {};
    const pivot = Object.fromEntries(JOINTS.map(([, b, x, y]) => [b, { x, y }])); pivot.head = { x: 100, y: 56 };
    for (const p of PARTS) {
      const cx = x0 + (p.x + p.w / 2) * K, cy = y0 + (p.y + p.h / 2) * K;
      const o = { friction: 0, frictionStatic: 0, restitution: bounce, density: p.id === "torso" ? 0.002 : 0.0015 }; // no foot friction: walking is set directly, stopping is handled below
      const b = p.round ? Bodies.circle(cx, cy, (p.w * K) / 2, o) : Bodies.rectangle(cx, cy, p.w * K, p.h * K, { ...o, chamfer: { radius: 5 } });
      // offset from the part's centre to the joint it swings around
      const pv = pivot[p.id], off = pv ? { x: (pv.x - (p.x + p.w / 2)) * K, y: (pv.y - (p.y + p.h / 2)) * K } : null;
      b.plugin = { char: true, leg: p.id.startsWith("leg"), img: imgs[p.id], w: p.w * K, h: p.h * K, off };
      by[p.id] = b;
    }
    const body = Body.create({ parts: Object.values(by), friction: 0, frictionStatic: 0, frictionAir: 0.01, restitution: bounce });
    Body.setInertia(body, Infinity);
    body.plugin = { char: true };
    char = { body, parts: by, bodies: [body] };
    pose = { walk: 0, waveUntil: 0, spin: null };
    Composite.add(world, body);
  }
  function spawnProp(kind, x = camX + 160 + Math.random() * (W - 320), y = 60) {
    if (!TOY_COLOR[kind]) return;
    const o = { restitution: bounce, friction: 0.5 }; let b;
    if (kind === "ball") b = Bodies.circle(x, y, 22, { ...o, restitution: Math.max(bounce, 0.75) });
    if (kind === "box") b = Bodies.rectangle(x, y, 52, 52, { ...o, chamfer: { radius: 4 } });
    if (kind === "balloon") b = Bodies.circle(x, y, 26, { ...o, density: 0.0004, frictionAir: 0.03 });
    if (kind === "plank") b = Bodies.rectangle(x, y, 190, 18, { ...o, chamfer: { radius: 3 } });
    b.plugin = { prop: kind, color: TOY_COLOR[kind], lift: kind === "balloon" };
    props.push(b); Composite.add(world, b);
    if (props.length > 60) Composite.remove(world, props.shift()); // keep it fast on school laptops
  }
  function setBounce(v) { bounce = v; for (const b of Composite.allBodies(world)) if (!b.isStatic) for (const q of b.parts) q.restitution = b.plugin.prop === "ball" ? Math.max(v, 0.75) : v; }

  function hurt(from) {
    const now = performance.now();
    if (done || now < hurtUntil || !char) return;
    hearts--; hurtUntil = now + 1200; onEvent("hurt", hearts);
    const away = from && from.x > char.parts.torso.position.x ? -7 : 7;
    char.bodies.forEach(b => Body.setVelocity(b, { x: away, y: -7 }));
    if (hearts <= 0) { done = true; onEvent("lose"); }
  }

  Events.on(engine, "beforeUpdate", () => {
    tick++;
    for (const b of props) if (b.plugin.lift) Body.applyForce(b, b.position, { x: 0, y: -engine.gravity.y * engine.gravity.scale * b.mass * 1.5 });
    // let go of the arrows and the buddy slows to a stop on the ground (no friction, so it would glide forever)
    if (char && tick - lastMove > 6 && tick - lastGround < 8) Body.setVelocity(char.body, { x: char.body.velocity.x * 0.8, y: char.body.velocity.y });
    if (!level || !char) return;
    for (const b of monsters) {
      const p = b.plugin, { m } = p;
      if (m.kind === "bat") Body.setPosition(b, { x: m.x, y: p.y0 + Math.sin(tick / 40 + m.x) * (m.range / 2) });
      else { const nx = b.position.x + p.dir * MONSTER[m.kind][2]; if (nx > m.x + m.range || nx < m.x) p.dir *= -1; Body.setPosition(b, { x: nx, y: b.position.y }); }
    }
    if (char.parts.torso.position.y > H + 150 && !done) { // fell in a pit
      hurtUntil = 0; hurt(null);
      if (!done) { spawnChar(); hurtUntil = performance.now() + 1200; }
    }
  });
  const lastFire = {};
  const fire = evt => { const n = performance.now(); if (n - (lastFire[evt] || 0) < 300) return; lastFire[evt] = n; onEvent(evt); };
  const touchGround = e => { for (const { bodyA: a, bodyB: b } of e.pairs) if ((a.plugin.leg && b.label === "ground") || (b.plugin.leg && a.label === "ground")) lastGround = tick; };
  Events.on(engine, "collisionActive", touchGround);
  Events.on(engine, "collisionStart", e => {
    touchGround(e);
    for (const { bodyA: a, bodyB: b } of e.pairs) for (const [p, q] of [[a, b], [b, a]]) {
      if (p.plugin.leg && q.label === "ground") fire("ground");
      if (p.plugin.char && q.plugin.prop) fire("toy");
      if (!p.plugin.char || done) continue;
      if (q.label === "coin" && !q.plugin.taken) { q.plugin.taken = true; Composite.remove(world, q); coins++; fx.push({ x: q.position.x, y: q.position.y, t: performance.now(), coin: true }); }
      if (q.label === "flag") {
        if (monsters.some(m => m.plugin.m.kind === "boss" && m.plugin.hp > 0)) { fire("needBoss"); continue; } // beat the boss first
        done = true; onEvent("win", { coins, total: coinBodies.length });
      }
      if (q.label === "spike") hurt(q.position);
      if (q.label === "monster" && q.plugin.hp > 0) {
        if (p.plugin.leg && p.bounds.max.y <= q.bounds.min.y + 14) { // landed on its head: stomp
          if (performance.now() < q.plugin.hitUntil) continue;
          q.plugin.hp--; q.plugin.hitUntil = performance.now() + 400;
          char.bodies.forEach(c => Body.setVelocity(c, { x: c.velocity.x, y: -9 }));
          if (q.plugin.hp <= 0) { Composite.remove(world, q); fx.push({ x: q.position.x, y: q.position.y, t: performance.now() }); }
        } else hurt(q.position);
      }
    }
  });
  Events.on(mc, "mousedown", () => { if (char && Query.point(char.bodies, mouse.position).length) onEvent("click"); });
  Events.on(mc, "startdrag", e => {
    if (!e.body.plugin.char) return;
    if (level) { mc.body = null; mc.constraint.bodyB = null; } // no carrying yourself to the flag
    else onEvent("drag");
  });

  // What each action block does. Missing character = nothing to move yet.
  const act = {
    jump: n => { if (!char || (level && tick - lastGround > 8)) return; // levels: only jump from the ground (within 8 physics steps), like Mario
      char.bodies.forEach(b => Body.setVelocity(b, { x: b.velocity.x, y: -clamp(n, 0, 40) })); },
    move: n => { if (!char) return; lastMove = tick; Body.setVelocity(char.body, { x: clamp(n, -30, 30), y: char.body.velocity.y }); },
    // spin and wave are drawn, not simulated, so the body stays upright and in one piece
    spin: async n => { if (!char) return; pose.spin = { t: performance.now(), dir: Number(n) < 0 ? -1 : 1 }; await sleep(600); },
    wave: async () => { if (!char) return; pose.waveUntil = performance.now() + 1000; await sleep(1000); },
    say: t => {
      bubble = { text: String(t).slice(0, 40), until: performance.now() + 2200 };
      if (gate && char && Math.abs(char.parts.torso.position.x - gate.position.x) < 360 && level.password.includes(String(t).trim().toLowerCase().replace(/[!¡.]/g, ""))) {
        Composite.remove(world, gate); fx.push({ x: gate.position.x, y: FLOOR - 120, t: performance.now() }); gate = null;
      }
    },
    spawn: k => { if (!char) return spawnProp(k); const p = char.parts.torso.position; spawnProp(k, clamp(p.x + (Math.random() - 0.5) * 160, 40, worldW - 40), Math.max(40, p.y - 200)); },
    explode: n => { if (!char) return; const c = char.parts.torso.position; fx.push({ x: c.x, y: c.y, t: performance.now() });
      for (const b of Composite.allBodies(world)) if (!b.isStatic && !b.plugin.char) { const d = Vector.sub(b.position, c), len = Vector.magnitude(d) || 1;
        Body.setVelocity(b, Vector.add(b.velocity, Vector.mult(Vector.normalise(d), (clamp(n, 0, 5) * 18) / (1 + len / 120)))); } },
    wait: n => sleep(clamp(n, 0, 10) * 1000)
  };

  // --- drawing ---
  const rr = (x, y, w, h, r, f, s = INK) => { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fillStyle = f; ctx.fill(); ctx.strokeStyle = s; ctx.lineWidth = 2.5; ctx.stroke(); };
  const dot = (x, y, r, f) => { ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fillStyle = f; ctx.fill(); };
  function drawTiles(b) { // Minecraft-style grass blocks
    for (let x = b.bounds.min.x; x < b.bounds.max.x - 1; x += TILE) {
      if (x + TILE < camX || x > camX + W) continue;
      const y = b.bounds.min.y, s = (x / TILE) | 0;
      ctx.fillStyle = "#8b5a2b"; ctx.fillRect(x, y, TILE, TILE);
      ctx.fillStyle = "#6e4420"; ctx.fillRect(x + (s * 13) % 28 + 4, y + 18, 6, 6); ctx.fillRect(x + (s * 7) % 24 + 8, y + 28, 6, 6);
      ctx.fillStyle = "#5fbf3c"; ctx.fillRect(x, y, TILE, 10); ctx.fillStyle = "#4aa32c"; ctx.fillRect(x + (s * 5) % 30, y + 10, 8, 4);
      ctx.strokeStyle = "rgba(0,0,0,.25)"; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, TILE - 1, TILE - 1);
    }
  }
  function drawMonster(b) {
    const { m, dir, hp } = b.plugin, { x, y } = b.position, [w, h] = MONSTER[m.kind], hit = performance.now() < b.plugin.hitUntil;
    if (m.kind === "bat") {
      const flap = Math.sin(tick / 4) * 10;
      ctx.fillStyle = "#6b4bd6"; ctx.strokeStyle = INK; ctx.lineWidth = 2.5;
      for (const sx of [-1, 1]) { ctx.beginPath(); ctx.moveTo(x + sx * 10, y); ctx.lineTo(x + sx * 38, y - 8 + flap); ctx.lineTo(x + sx * 26, y + 10); ctx.closePath(); ctx.fill(); ctx.stroke(); }
      rr(x - w / 2 + 8, y - h / 2, w - 16, h, 12, "#8a6cf0");
    } else rr(x - w / 2, y - h / 2, w, h, m.kind === "boss" ? 18 : 14, hit ? "#ffffff" : m.kind === "boss" ? "#ff5d73" : "#5fd36b");
    const ex = m.kind === "boss" ? 16 : 9, er = m.kind === "boss" ? 8 : 5;
    for (const sx of [-1, 1]) { dot(x + sx * ex, y - h / 6, er, "#fff"); dot(x + sx * ex + (dir || 1) * 2, y - h / 6, er / 2, INK); }
    if (m.kind === "boss") {
      ctx.fillStyle = "#ffcd3c"; ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(x - 30, y - 40); ctx.lineTo(x - 30, y - 62); ctx.lineTo(x - 15, y - 50); ctx.lineTo(x, y - 66); ctx.lineTo(x + 15, y - 50); ctx.lineTo(x + 30, y - 62); ctx.lineTo(x + 30, y - 40); ctx.closePath(); ctx.fill(); ctx.stroke();
      for (let i = 0; i < 3; i++) dot(x - 16 + i * 16, y - 76, 5, i < hp ? "#ff5d73" : "rgba(0,0,0,.25)");
    }
  }
  function drawLevel() {
    for (const b of Composite.allBodies(world)) {
      if (b.plugin.tile) drawTiles(b);
      if (b.label === "spike") { ctx.fillStyle = "#cfd6e4"; ctx.strokeStyle = INK; ctx.lineWidth = 2;
        for (let x = b.bounds.min.x; x < b.bounds.max.x - 1; x += 20) { ctx.beginPath(); ctx.moveTo(x, FLOOR); ctx.lineTo(x + 10, FLOOR - 18); ctx.lineTo(x + 20, FLOOR); ctx.closePath(); ctx.fill(); ctx.stroke(); } }
    }
    if (gate) { const { min, max } = gate.bounds;
      for (let y = min.y; y < max.y; y += 26) for (let x = min.x + ((y / 26) % 2 ? 0 : -10); x < max.x; x += 20) rr(Math.max(min.x, x), y, 20, 26, 2, "#9aa3b5");
      ctx.font = "800 28px Figtree, sans-serif"; ctx.fillStyle = INK; ctx.textAlign = "center"; ctx.fillText("?", (min.x + max.x) / 2, FLOOR - 140); ctx.textAlign = "start"; }
    const fx0 = level.flag; ctx.fillStyle = INK; ctx.fillRect(fx0 - 3, FLOOR - 220, 6, 220);
    ctx.beginPath(); ctx.moveTo(fx0 + 3, FLOOR - 218); ctx.lineTo(fx0 + 70, FLOOR - 196 + Math.sin(tick / 10) * 4 * sway()); ctx.lineTo(fx0 + 3, FLOOR - 172); ctx.closePath(); ctx.fillStyle = tok("--accent"); ctx.fill(); ctx.stroke();
    for (const c of coinBodies) if (!c.plugin.taken) { const y = c.position.y + Math.sin(tick / 15 + c.position.x) * 3 * sway(); dot(c.position.x, y, 12, "#ffcd3c"); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.stroke(); dot(c.position.x, y, 5, "#f0a500"); }
    for (const b of monsters) if (b.plugin.hp > 0 && Composite.get(world, b.id, "body")) drawMonster(b);
  }
  function drawHud() {
    rr(10, 10, 300, 40, 12, "rgba(255,255,255,.92)");
    ctx.font = "700 22px Figtree, sans-serif"; ctx.textBaseline = "middle";
    for (let i = 0; i < 3; i++) { ctx.fillStyle = i < hearts ? "#ff5d73" : "rgba(0,0,0,.2)"; heart(ctx, 30 + i * 26, 31); }
    dot(115, 30, 10, "#ffcd3c"); ctx.fillStyle = INK; ctx.fillText(`${coins}/${coinBodies.length}`, 131, 31);
    ctx.font = "600 15px Lexend, sans-serif"; ctx.fillText(title, 185, 31, 120);
  }
  function drawChar(now) {
    const vx = char.body.velocity.x, onGround = tick - lastGround < 8;
    if (onGround && !reduce.matches) pose.walk += Math.abs(vx) * 0.06;
    const stride = onGround ? Math.min(1, Math.abs(vx) / 4) : 0, swing = Math.sin(pose.walk) * 0.45 * stride;
    const waving = now < pose.waveUntil, flap = Math.sin(now / 80) * 0.35;
    const angle = { legL: swing, legR: -swing, armL: waving ? 2.5 - flap : -swing * 0.8, armR: waving ? -2.5 + flap : swing * 0.8, head: 0, torso: 0 };
    const torso = char.parts.torso.position;
    ctx.save();
    if (pose.spin) { // one full turn, eased out, then back to standing
      const k = Math.min(1, (now - pose.spin.t) / 600);
      if (k >= 1) pose.spin = null;
      else { ctx.translate(torso.x, torso.y); ctx.rotate(pose.spin.dir * Math.PI * 2 * (1 - (1 - k) ** 3)); ctx.translate(-torso.x, -torso.y); }
    }
    for (const id of ["legL", "legR", "armR", "torso", "armL", "head"]) {
      const b = char.parts[id], { img, w, h, off } = b.plugin;
      ctx.save();
      if (off) { ctx.translate(b.position.x + off.x, b.position.y + off.y); ctx.rotate(angle[id]); ctx.translate(-off.x, -off.y); }
      else ctx.translate(b.position.x, b.position.y);
      ctx.drawImage(img, -w / 2, -h / 2, w, h);
      ctx.restore();
    }
    ctx.restore();
  }
  function draw() {
    const now = performance.now();
    Mouse.setOffset(mouse, { x: camX, y: 0 });
    drawScene(ctx, scene, W, H, tok);
    if (level) { ctx.fillStyle = "rgba(20,20,30,.85)"; ctx.fillRect(0, FLOOR, W, GROUND); } // pits are dark; blocks cover the rest
    ctx.save(); ctx.translate(-camX, 0);
    if (level) drawLevel();
    const ink = tok("--ink"); ctx.lineJoin = "round";
    for (const b of props) {
      if (b.plugin.lift) { ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(b.position.x, b.position.y + 26); ctx.lineTo(b.position.x + Math.sin(now / 300) * 6 * sway(), b.position.y + 70); ctx.stroke(); }
      ctx.beginPath(); b.vertices.forEach((v, i) => (i ? ctx.lineTo(v.x, v.y) : ctx.moveTo(v.x, v.y))); ctx.closePath();
      ctx.fillStyle = b.plugin.color; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.stroke();
    }
    if (char) {
      // hurt: 2.5 blinks/s (WCAG: under 3 flashes/s); reduced motion holds a steady fade instead
      ctx.globalAlpha = now >= hurtUntil ? 1 : reduce.matches ? 0.6 : Math.floor(now / 200) % 2 ? 0.35 : 1;
      drawChar(now);
      ctx.globalAlpha = 1;
    }
    if (mc.body) {
      const p = Vector.add(mc.body.position, Vector.rotate(mc.constraint.pointB, mc.body.angle - (mc.constraint.angleB || 0)));
      ctx.strokeStyle = tok("--accent"); ctx.lineWidth = 2; ctx.setLineDash([6, 5]); ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mouse.position.x, mouse.position.y); ctx.stroke(); ctx.setLineDash([]);
    }
    fx = fx.filter(f => now - f.t < 500);
    for (const f of fx) {
      const k = Math.min(1, (now - f.t) / (f.coin ? 200 : 500)), e = 1 - (1 - k) ** 3; // ease-out: fast burst, soft finish
      const grow = reduce.matches ? 0 : e;
      ctx.strokeStyle = f.coin ? `rgba(255,205,60,${1 - e})` : `rgba(255,140,60,${1 - e})`; ctx.lineWidth = f.coin ? 4 : 6;
      ctx.beginPath(); ctx.arc(f.x, f.y, f.coin ? 12 + grow * 10 : 20 + grow * 220, 0, 7); ctx.stroke();
    }
    if (char && bubble && now < bubble.until) {
      const hd = char.parts.head.position; ctx.font = "600 20px Lexend, system-ui, sans-serif"; ctx.textBaseline = "middle";
      const w = ctx.measureText(bubble.text).width + 28, x = clamp(hd.x - w / 2, camX + 6, camX + W - w - 6), y = Math.max(6, hd.y - 92);
      ctx.fillStyle = tok("--panel"); ctx.strokeStyle = ink; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.roundRect(x, y, w, 42, 14); ctx.fill(); ctx.stroke();
      ctx.fillStyle = ink; ctx.fillText(bubble.text, x + 14, y + 21);
    }
    ctx.restore();
    if (level) drawHud();
  }
  // Fixed 60 Hz game time, whatever the screen's refresh rate: 120 Hz tablets don't play at double speed,
  // slow laptops don't play in slow motion. Capped so a backgrounded tab doesn't fast-forward on return.
  const STEP = 1000 / 60;
  let last = performance.now(), acc = 0;
  const frame = now => {
    acc += Math.min(now - last, 250); last = now;
    while (acc >= STEP) {
      Engine.update(engine, STEP); acc -= STEP;
      // camera eases toward the buddy instead of copying every ragdoll wobble (and pans back after a pit)
      if (char) camX += (clamp(char.parts.torso.position.x - W * 0.4, 0, worldW - W) - camX) * 0.15;
    }
    draw(); raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);

  return {
    act, spawnChar, spawnProp, setBounce,
    setScene: s => { scene = s; },
    setTitle: s => { title = s; },
    clearToys: () => { Composite.remove(world, props); props = []; },
    destroy: () => { cancelAnimationFrame(raf); Engine.clear(engine); }
  };
}
