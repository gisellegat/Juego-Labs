// Stage backgrounds, drawn in stage units (960x540). Same five themes as the Figma "Scene" component.
export const SCENES = ["paper", "park", "space", "ocean", "desert"];
export const GROUND = 40;

const ell = (x, cx, cy, rx, ry, f) => { x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, 7); x.fillStyle = f; x.fill(); };
const rect = (x, X, Y, w, h, f) => { x.fillStyle = f; x.fillRect(X, Y, w, h); };

// "custom": the background the player drew (an image, set once it has loaded)
let custom = null;
export const setCustomScene = img => { custom = img; };

export function drawScene(x, theme, W, H, tok) {
  const gy = H - GROUND;
  if (theme === "custom" && custom) return void x.drawImage(custom, 0, 0, W, H);
  if (theme === "park") {
    rect(x, 0, 0, W, H, "#bfe6ff"); ell(x, W * .82, 90, 50, 50, "#ffcd3c");
    ell(x, 190, 90, 75, 25, "#fff"); ell(x, 520, 130, 55, 18, "#fff");
    ell(x, 170, gy + 40, 330, 160, "#7cd38f"); ell(x, 720, gy + 60, 390, 170, "#5fbf77"); rect(x, 0, gy, W, GROUND, "#6ab04c");
  } else if (theme === "space") {
    rect(x, 0, 0, W, H, "#141a3a");
    for (let i = 0; i < 50; i++) { const s = 1 + (i * 7) % 3; rect(x, (i * 157) % W, (i * 89) % (gy - 40), s, s, "rgba(255,255,255,.85)"); }
    ell(x, W * .76, 120, 68, 68, "#c7a2ff"); ell(x, W * .76, 120, 105, 10, "rgba(255,205,60,.8)");
    rect(x, 0, gy, W, GROUND, "#4a4f6e"); ell(x, 200, gy + 18, 36, 8, "#3a3f5c"); ell(x, 610, gy + 22, 48, 9, "#3a3f5c");
  } else if (theme === "ocean") {
    const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#7fd0f5"); g.addColorStop(1, "#1f6fb2"); rect(x, 0, 0, W, H, g);
    for (const [cx, cy, r] of [[150, 150, 11], [180, 105, 6], [740, 200, 13], [790, 140, 7], [470, 80, 9]]) ell(x, cx, cy, r, r, "rgba(255,255,255,.5)");
    for (const sx of [70, 105, 850, 885]) rect(x, sx, gy - 135, 16, 135, "#2bb673");
    rect(x, 0, gy, W, GROUND, "#f3d58a");
  } else if (theme === "desert") {
    rect(x, 0, 0, W, H, "#ffe1a8"); ell(x, W * .78, 100, 55, 55, "#ff9f43");
    ell(x, 200, gy + 30, 310, 120, "#f0b862"); ell(x, 780, gy + 40, 320, 120, "#e9a94f");
    rect(x, 170, gy - 150, 26, 150, "#2bb673"); rect(x, 144, gy - 110, 26, 14, "#2bb673"); rect(x, 196, gy - 92, 26, 14, "#2bb673");
    rect(x, 0, gy, W, GROUND, "#d99a45");
  } else {
    rect(x, 0, 0, W, H, tok("--paper"));
    x.strokeStyle = tok("--grid"); x.lineWidth = 1; x.beginPath();
    for (let X = 0; X < W; X += 40) { x.moveTo(X + .5, 0); x.lineTo(X + .5, gy); }
    for (let Y = 0; Y < gy; Y += 40) { x.moveTo(0, Y + .5); x.lineTo(W, Y + .5); }
    x.stroke(); rect(x, 0, gy, W, GROUND, tok("--ground"));
  }
}
