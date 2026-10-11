// Drawing helpers shared by the character canvas and the background canvas.
export const TOOLS = ["brush", "eraser", "bucket", "line"];
export const COLORS = ["#1d2433", "#ff5d73", "#ff9f43", "#ffcd3c", "#2bb673", "#2f6bff", "#a26bff", "#f1c27d", "#8d5524", "#ffffff"];

const rgba = hex => { const n = parseInt(hex.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255, 255]; };

// Paint bucket: fills the area of matching color around (x, y). inside(px, py) limits it (e.g. to one body part).
// Returns false when there was nothing to fill.
export function floodFill(ctx, x, y, hex, inside = () => true) {
  const { width: W, height: H } = ctx.canvas, img = ctx.getImageData(0, 0, W, H), d = img.data;
  x = Math.floor(x); y = Math.floor(y);
  if (x < 0 || y < 0 || x >= W || y >= H || !inside(x, y)) return false;
  const at = (x + y * W) * 4, start = [d[at], d[at + 1], d[at + 2], d[at + 3]], fill = rgba(hex);
  if (start.every((v, i) => v === fill[i])) return false;
  // small tolerance so the soft (anti-aliased) edges of strokes still stop the fill
  const same = p => Math.abs(d[p] - start[0]) + Math.abs(d[p + 1] - start[1]) + Math.abs(d[p + 2] - start[2]) + Math.abs(d[p + 3] - start[3]) <= 48;
  const seen = new Uint8Array(W * H), stack = [x, y];
  while (stack.length) {
    const py = stack.pop(), px = stack.pop(), i = px + py * W;
    if (px < 0 || py < 0 || px >= W || py >= H || seen[i] || !inside(px, py) || !same(i * 4)) continue;
    seen[i] = 1; d.set(fill, i * 4);
    stack.push(px + 1, py, px - 1, py, px, py + 1, px, py - 1);
  }
  ctx.putImageData(img, 0, 0);
  return true;
}
