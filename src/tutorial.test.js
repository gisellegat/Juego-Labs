import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { STEPS, checkStep } from "./tutorial.js";

const { DOMParser } = new JSDOM().window;
const parse = html => new DOMParser().parseFromString(html, "text/html");
const passes = (i, html) => checkStep(i, html, parse).every(([ok]) => ok);

test("every starter fails its own check, so there is something to do", () => {
  STEPS.forEach((s, i) => assert.equal(passes(i, s.starter), false, `step ${i + 1}`));
});

test("correct answers pass, in English or Spanish", () => {
  assert.ok(passes(0, "<button>Run</button>"));
  assert.ok(passes(0, "<button>Ejecutar</button>"));
  assert.ok(passes(1, '<button style="background: yellow">Run</button>'));
  assert.ok(passes(2, '<div style="background: skyblue; width: 100%"></div>'));
  assert.ok(passes(3, '<button onclick="saltar()">Saltar</button>'));
  assert.ok(passes(4, "<ol><li>say</li><li>jump</li><li>wave</li></ol>"));
  assert.ok(passes(5, '<input type="range" min="0" max="30">'));
  assert.ok(passes(6, '<canvas id="stage" width="960" height="540"></canvas>'));
});

test("near misses are caught", () => {
  assert.equal(passes(0, "<button>Stop</button>"), false);
  assert.equal(passes(5, '<input type="range" min="-1" max="2">'), false);
  assert.equal(passes(6, '<canvas id="game" width="960" height="540"></canvas>'), false);
});
