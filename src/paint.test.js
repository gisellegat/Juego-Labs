import { test } from "node:test";
import assert from "node:assert/strict";
import { floodFill } from "./paint.js";

// a fake 2D context over a W×H RGBA buffer
function fakeCtx(W, H) {
  const data = new Uint8ClampedArray(W * H * 4);
  return { canvas: { width: W, height: H }, data,
    getImageData: () => ({ data: data.slice(), width: W, height: H }),
    putImageData(img) { data.set(img.data); } };
}
const px = (c, x, y) => [...c.data.slice((x + y * c.canvas.width) * 4, (x + y * c.canvas.width) * 4 + 4)];

test("paint bucket fills the enclosed area and stops at the wall", () => {
  const c = fakeCtx(5, 3);
  for (let y = 0; y < 3; y++) c.data.set([0, 0, 0, 255], (2 + y * 5) * 4); // black wall at x = 2
  assert.equal(floodFill(c, 0, 0, "#ff0000"), true);
  assert.deepEqual(px(c, 1, 2), [255, 0, 0, 255]);
  assert.deepEqual(px(c, 2, 1), [0, 0, 0, 255]); // wall untouched
  assert.deepEqual(px(c, 4, 1), [0, 0, 0, 0]);   // other side untouched
});

test("paint bucket respects the inside() limit and ignores clicks outside it", () => {
  const c = fakeCtx(4, 4), inside = (x, y) => x < 2 && y < 2;
  floodFill(c, 0, 0, "#00ff00", inside);
  assert.deepEqual(px(c, 1, 1), [0, 255, 0, 255]);
  assert.deepEqual(px(c, 3, 3), [0, 0, 0, 0]);
  assert.equal(floodFill(c, 3, 3, "#00ff00", inside), false);
});

test("filling with the color already there does nothing", () => {
  const c = fakeCtx(2, 2);
  floodFill(c, 0, 0, "#0000ff");
  assert.equal(floodFill(c, 1, 1, "#0000ff"), false);
});
