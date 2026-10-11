// The D-pad is one surface, like a real one: roll your thumb from right to up-right to up without lifting.
// dx, dy run from -1 to 1 across the pad (0, 0 is the centre). Returns the arrow keys held there.
export function padKeys(dx, dy) {
  if (Math.hypot(dx, dy) < 0.2) return []; // small dead zone in the middle
  const keys = [], ax = Math.abs(dx), ay = Math.abs(dy);
  // within ±22.5° of a diagonal both arrows are held (tan 22.5° ≈ 0.414), e.g. right + up
  if (ax > ay * 0.414) keys.push(dx > 0 ? "right" : "left");
  if (ay > ax * 0.414) keys.push(dy > 0 ? "down" : "up");
  return keys;
}
