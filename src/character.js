// Character model. Figure coords are 200x200; the drawing sheet is S times bigger.
// These numbers match the "Character Parts" page in the Figma template.
export const S = 4; // drawing sheet is 800×800: room for detail
export const INK = "#1d2433";
export const PARTS = [
  { id: "head", x: 75, y: 5, w: 50, h: 50, round: true, fill: "#ffd9b3" },
  { id: "torso", x: 80, y: 57, w: 40, h: 70, fill: "#7fb3ff" },
  { id: "armL", x: 62, y: 60, w: 16, h: 58, fill: "#ffd9b3" },
  { id: "armR", x: 122, y: 60, w: 16, h: 58, fill: "#ffd9b3" },
  { id: "legL", x: 81, y: 129, w: 18, h: 62, fill: "#5b6578" },
  { id: "legR", x: 101, y: 129, w: 18, h: 62, fill: "#5b6578" }
];
// [bodyA, bodyB, pivotX, pivotY]; the joint is "added" when bodyB's part is drawn
export const JOINTS = [["head", "torso", 100, 56], ["torso", "armL", 70, 64], ["torso", "armR", 130, 64], ["torso", "legL", 90, 131], ["torso", "legR", 110, 131]];

const R = (x, X, Y, w, h, r, f) => { x.beginPath(); x.roundRect(X, Y, w, h, r); x.fillStyle = f; x.fill(); x.stroke(); };
const C = (x, X, Y, r, f) => { x.beginPath(); x.arc(X, Y, r, 0, 7); x.fillStyle = f; x.fill(); x.stroke(); };
const P = (x, pts, f) => { x.beginPath(); pts.forEach(([a, b], i) => (i ? x.lineTo(a, b) : x.moveTo(a, b))); x.closePath(); x.fillStyle = f; x.fill(); x.stroke(); };
const Ln = (x, a, b, c, d) => { x.beginPath(); x.moveTo(a, b); x.lineTo(c, d); x.stroke(); };
export function pen(x) { x.strokeStyle = INK; x.lineWidth = 2; x.lineJoin = "round"; x.lineCap = "round"; }

export const PREMADE = {
  robot(x) { const a = "#b9c6d8", b = "#9fb0c8";
    Ln(x, 100, 12, 100, 8); C(x, 100, 8, 2.5, "#ff5d73"); R(x, 78, 12, 44, 40, 8, a); C(x, 91, 29, 5, "#2f6bff"); C(x, 109, 29, 5, "#2f6bff"); R(x, 92, 40, 16, 4, 2, INK);
    R(x, 81, 58, 38, 68, 6, b); R(x, 90, 70, 20, 16, 3, "#ffcd3c"); C(x, 95, 100, 3, "#ff5d73"); C(x, 105, 100, 3, "#2bb673");
    for (const X of [64, 124]) { R(x, X, 61, 12, 52, 5, a); C(x, X + 6, 111, 5, "#7b8aa3"); }
    for (const X of [83, 103]) { R(x, X, 130, 14, 52, 4, b); R(x, X - 2, 178, 18, 11, 3, "#5b6578"); } },
  cat(x) { const o = "#ff9f43", c = "#ffe0b8";
    P(x, [[80, 22], [83, 7], [95, 14]], o); P(x, [[120, 22], [117, 7], [105, 14]], o); C(x, 100, 32, 21, o);
    C(x, 92, 29, 3, INK); C(x, 108, 29, 3, INK); P(x, [[97, 36], [103, 36], [100, 39]], "#ff7aa2"); Ln(x, 84, 38, 94, 37); Ln(x, 116, 38, 106, 37);
    R(x, 83, 58, 34, 68, 14, o); R(x, 90, 70, 20, 42, 10, c); Ln(x, 84, 66, 90, 68); Ln(x, 116, 66, 110, 68);
    for (const X of [65, 125]) { R(x, X, 61, 10, 52, 5, o); C(x, X + 5, 112, 5.5, c); }
    for (const X of [84, 104]) { R(x, X, 130, 12, 54, 6, o); R(x, X - 1, 180, 14, 9, 4, c); } },
  astro(x) { const w = "#f4f6fb";
    C(x, 100, 30, 23, w); R(x, 85, 19, 30, 21, 9, "#2f3d5c"); x.fillStyle = "#ffffff"; x.fillRect(90, 23, 5, 3);
    R(x, 81, 58, 38, 68, 8, w); R(x, 90, 70, 20, 14, 3, "#2f6bff"); C(x, 95, 77, 2, "#ffcd3c"); C(x, 105, 77, 2, "#ff5d73"); Ln(x, 85, 110, 115, 110);
    for (const X of [64, 124]) { R(x, X, 61, 12, 50, 6, w); C(x, X + 6, 112, 5, "#ff5d73"); }
    for (const X of [83, 103]) { R(x, X, 130, 14, 50, 6, w); R(x, X - 1, 177, 16, 12, 3, "#5b6578"); } }
};

export function makeSheet(paint) {
  const c = document.createElement("canvas"); c.width = c.height = 200 * S;
  const x = c.getContext("2d"); x.scale(S, S); pen(x); paint(x); return c;
}
function isEmpty(c) {
  const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
  for (let i = 3; i < d.length; i += 32) if (d[i] > 20) return false;
  return true;
}
// Cut the sheet into one sticker per part; blank parts get a simple filled shape.
export function cropParts(sheet) {
  const out = {};
  for (const p of PARTS) {
    const c = document.createElement("canvas"); c.width = p.w * S; c.height = p.h * S; const x = c.getContext("2d");
    x.drawImage(sheet, p.x * S, p.y * S, p.w * S, p.h * S, 0, 0, c.width, c.height);
    if (isEmpty(c)) {
      x.scale(S, S); pen(x); R(x, 2, 2, p.w - 4, p.h - 4, p.round ? (p.w - 4) / 2 : 6, p.fill);
      if (p.id === "head") { C(x, 18, 22, 3, INK); C(x, 32, 22, 3, INK); x.beginPath(); x.arc(25, 30, 8, 0.2, Math.PI - 0.2); x.stroke(); }
    }
    out[p.id] = c;
  }
  return out;
}
// Whole-figure preview for cards, from part stickers (canvases or images)
export function previewFrom(parts) {
  const c = document.createElement("canvas"); c.width = 90 * S; c.height = 195 * S; const x = c.getContext("2d");
  for (const p of PARTS) x.drawImage(parts[p.id], (p.x - 55) * S, p.y * S, p.w * S, p.h * S);
  return c;
}

// Saved characters live in this browser only (localStorage), as PNG data URLs per part.
const KEY = "gl-chars";
export async function loadSaved() {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) || "[]");
    return await Promise.all(list.map(async ch => {
      const parts = {};
      for (const [k, url] of Object.entries(ch.parts)) { const i = new Image(); i.src = url; await i.decode(); parts[k] = i; }
      return { ...ch, parts };
    }));
  } catch { return []; }
}
export function saveAll(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list.map(ch => ({ id: ch.id, name: ch.name, parts: Object.fromEntries(Object.entries(ch.parts).map(([k, c]) => [k, c.toDataURL ? c.toDataURL("image/png") : c.src])) }))));
    return true;
  } catch { return false; }
}
