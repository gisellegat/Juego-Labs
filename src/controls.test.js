import test from "node:test";
import assert from "node:assert/strict";
import { padKeys } from "./controls.js";

test("D-pad reads straight directions, diagonals and the dead zone", () => {
  assert.deepEqual(padKeys(1, 0), ["right"]);
  assert.deepEqual(padKeys(-1, 0.1), ["left"]);
  assert.deepEqual(padKeys(0, -1), ["up"]);
  assert.deepEqual(padKeys(0.7, -0.7), ["right", "up"]);
  assert.deepEqual(padKeys(0.9, -0.3), ["right"]); // shallow angle stays a single arrow
  assert.deepEqual(padKeys(0.05, -0.05), []);
});
