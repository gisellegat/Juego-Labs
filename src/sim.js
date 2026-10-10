// Physics playground: Matter.js bodies, drawn by hand on an HTML5 canvas 60 times a second.
import Matter from "matter-js";
import { PARTS, JOINTS, INK } from "./character.js";
import { drawScene, GROUND } from "./scenes.js";

const { Engine, Bodies, Body, Composite, Constraint, Mouse, MouseConstraint, Events, Query, Vector } = Matter;
export const W = 960, H = 540;
const K = 1.25, FLOOR = H - GROUND;
const TOY_COLOR = { ball: "#ff5d73", box: "#ffcd3c", balloon: "#a26bff", plank: "#c98d4b" };
export const TOYS = Object.keys(TOY_COLOR);
const clamp = (v, a, b) => Math.min(b, Math.max(a, Number(v) || 0));
export const sleep = ms => new Promise(r => setTimeout(r, ms));

// onEvent(name) fires for "click", "ground" and "toy" so scripts can react
export function createSim(canvas, onEvent) {
  const ctx = canvas.getContext("2d");
  const css = getComputedStyle(document.documentElement), tok = n => css.getPropertyValue(n).trim();
  const engine = Engine.create(); engine.constraintIterations = 4; const world = engine.world;
  Composite.add(world, [
    Bodies.rectangle(W / 2, FLOOR + 50, W * 3, 100, { isStatic: true, label: "ground", friction: 0.9 }),
    Bodies.rectangle(-50, H / 2, 100, H * 4, { isStatic: true }), Bodies.rectangle(W + 50, H / 2, 100, H * 4, { isStatic: true }),
    Bodies.rectangle(W / 2, -600, W * 3, 100, { isStatic: true })]);
  const mouse = Mouse.create(canvas); canvas.removeEventListener("wheel", mouse.mousewheel); // let the page scroll over the stage
  const mc = MouseConstraint.create(engine, { mouse, constraint: { stiffness: 0.2, render: { visible: false } } });
  Composite.add(world, mc);

  let char = null, imgs = null, props = [], bounce = 0.2, bubble = null, fx = [], scene = "park", raf = 0;

  function spawnChar(parts) {
    if (parts) imgs = parts;
    if (char) Composite.remove(world, [...char.bodies, ...char.cons]);
    const group = Body.nextGroup(true), x0 = W / 2 - 100 * K, y0 = FLOOR - 192 * K - 4, by = {};
    for (const p of PARTS) {
      const cx = x0 + (p.x + p.w / 2) * K, cy = y0 + (p.y + p.h / 2) * K;
      const o = { collisionFilter: { group }, friction: 0.8, frictionAir: 0.01, restitution: bounce, density: p.id === "torso" ? 0.002 : 0.0015 };
      const b = p.round ? Bodies.circle(cx, cy, (p.w * K) / 2, o) : Bodies.rectangle(cx, cy, p.w * K, p.h * K, { ...o, chamfer: { radius: 5 } });
      b.plugin = { char: true, leg: p.id.startsWith("leg"), img: imgs[p.id], w: p.w * K, h: p.h * K }; by[p.id] = b;
    }
    const cons = JOINTS.map(([a, b, x, y]) => { const A = by[a], B = by[b], pt = { x: x0 + x * K, y: y0 + y * K };
      return Constraint.create({ bodyA: A, bodyB: B, pointA: Vector.sub(pt, A.position), pointB: Vector.sub(pt, B.position), length: 0, stiffness: 0.95, damping: 0.05 }); });
    char = { parts: by, bodies: Object.values(by), cons };
    Composite.add(world, [...char.bodies, ...cons]);
  }
  function spawnProp(kind, x = 160 + Math.random() * (W - 320), y = 60) {
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
  const setGravity = n => { engine.gravity.y = clamp(n, -2, 3); return engine.gravity.y; };
  function setBounce(v) { bounce = v; for (const b of Composite.allBodies(world)) if (!b.isStatic) b.restitution = b.plugin.prop === "ball" ? Math.max(v, 0.75) : v; }

  Events.on(engine, "beforeUpdate", () => { for (const b of props) if (b.plugin.lift) Body.applyForce(b, b.position, { x: 0, y: -engine.gravity.y * engine.gravity.scale * b.mass * 1.5 }); });
  const lastFire = {};
  const fire = evt => { const n = performance.now(); if (n - (lastFire[evt] || 0) < 300) return; lastFire[evt] = n; onEvent(evt); };
  Events.on(engine, "collisionStart", e => {
    for (const { bodyA: a, bodyB: b } of e.pairs) for (const [p, q] of [[a, b], [b, a]]) {
      if (p.plugin.leg && q.label === "ground") fire("ground");
      if (p.plugin.char && q.plugin.prop) fire("toy");
    }
  });
  Events.on(mc, "mousedown", () => { if (char && Query.point(char.bodies, mouse.position).length) onEvent("click"); });

  // What each action block does. Missing character = nothing to move yet.
  const act = {
    jump: n => char?.bodies.forEach(b => Body.setVelocity(b, { x: b.velocity.x, y: -clamp(n, 0, 40) })),
    move: n => char?.bodies.forEach(b => Body.setVelocity(b, { x: clamp(n, -30, 30), y: b.velocity.y })),
    spin: n => char && Body.setAngularVelocity(char.parts.torso, clamp(n, -1, 1)),
    wave: async () => { if (!char) return; const { armL, armR } = char.parts;
      for (let i = 0; i < 3; i++) { Body.setAngularVelocity(armL, -0.5); Body.setAngularVelocity(armR, 0.5); await sleep(170); Body.setAngularVelocity(armL, 0.5); Body.setAngularVelocity(armR, -0.5); await sleep(170); } },
    say: t => { bubble = { text: String(t).slice(0, 40), until: performance.now() + 2200 }; },
    spawn: k => { if (!char) return spawnProp(k); const p = char.parts.torso.position; spawnProp(k, clamp(p.x + (Math.random() - 0.5) * 160, 40, W - 40), Math.max(40, p.y - 200)); },
    gravity: n => setGravity(n),
    explode: n => { if (!char) return; const c = char.parts.torso.position; fx.push({ x: c.x, y: c.y, t: performance.now() });
      for (const b of Composite.allBodies(world)) if (!b.isStatic && !b.plugin.char) { const d = Vector.sub(b.position, c), len = Vector.magnitude(d) || 1;
        Body.setVelocity(b, Vector.add(b.velocity, Vector.mult(Vector.normalise(d), (clamp(n, 0, 5) * 18) / (1 + len / 120)))); } },
    wait: n => sleep(clamp(n, 0, 10) * 1000)
  };

  function draw() {
    const now = performance.now();
    drawScene(ctx, scene, W, H, tok);
    const ink = tok("--ink"); ctx.lineJoin = "round";
    for (const b of props) {
      if (b.plugin.lift) { ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(b.position.x, b.position.y + 26); ctx.lineTo(b.position.x + Math.sin(now / 300) * 6, b.position.y + 70); ctx.stroke(); }
      ctx.beginPath(); b.vertices.forEach((v, i) => (i ? ctx.lineTo(v.x, v.y) : ctx.moveTo(v.x, v.y))); ctx.closePath();
      ctx.fillStyle = b.plugin.color; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.stroke();
    }
    if (char) for (const id of ["legL", "legR", "armR", "torso", "armL", "head"]) {
      const b = char.parts[id], { img, w, h } = b.plugin;
      ctx.save(); ctx.translate(b.position.x, b.position.y); ctx.rotate(b.angle); ctx.drawImage(img, -w / 2, -h / 2, w, h); ctx.restore();
    }
    if (mc.body) {
      const p = Vector.add(mc.body.position, Vector.rotate(mc.constraint.pointB, mc.body.angle - (mc.constraint.angleB || 0)));
      ctx.strokeStyle = tok("--accent"); ctx.lineWidth = 2; ctx.setLineDash([6, 5]); ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mouse.position.x, mouse.position.y); ctx.stroke(); ctx.setLineDash([]);
    }
    fx = fx.filter(f => now - f.t < 500);
    for (const f of fx) { const k = (now - f.t) / 500; ctx.strokeStyle = `rgba(255,140,60,${1 - k})`; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(f.x, f.y, 20 + k * 220, 0, 7); ctx.stroke(); }
    if (char && bubble && now < bubble.until) {
      const hd = char.parts.head.position; ctx.font = "600 20px Lexend, system-ui, sans-serif";
      const w = ctx.measureText(bubble.text).width + 28, x = clamp(hd.x - w / 2, 6, W - w - 6), y = Math.max(6, hd.y - 92);
      ctx.fillStyle = tok("--panel"); ctx.strokeStyle = ink; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.roundRect(x, y, w, 42, 14); ctx.fill(); ctx.stroke();
      ctx.fillStyle = ink; ctx.textBaseline = "middle"; ctx.fillText(bubble.text, x + 14, y + 21);
    }
  }
  const frame = () => { Engine.update(engine, 1000 / 60); draw(); raf = requestAnimationFrame(frame); };
  raf = requestAnimationFrame(frame);

  return {
    act, spawnChar, spawnProp, setGravity, setBounce,
    setScene: s => { scene = s; },
    clearToys: () => { Composite.remove(world, props); props = []; },
    destroy: () => { cancelAnimationFrame(raf); Engine.clear(engine); }
  };
}
