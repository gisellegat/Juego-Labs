// Google Blockly blocks for the game, the runner that executes them, and the
// terminal view that shows the JavaScript each block stands for.
import * as Blockly from "blockly";
import { CODE } from "./i18n.js";
import { sleep, TOYS } from "./sim.js";

export const KEYS = ["space", "left", "right", "up", "down"];
const COL = { event: "#ffbf00", motion: "#4c97ff", looks: "#9966ff", world: "#59c059", control: "#ffab19" };
const CATS = [
  ["events", COL.event, ["gl_when_run", "gl_when_key", "gl_when_click", "gl_when_ground", "gl_when_toy"]],
  ["motion", COL.motion, ["gl_jump", "gl_move", "gl_spin"]],
  ["looks", COL.looks, ["gl_wave", "gl_say"]],
  ["world", COL.world, ["gl_spawn", "gl_explode"]],
  ["control", COL.control, ["gl_wait", "gl_repeat", "gl_forever"]]
];
export const EVENT_OF = { gl_when_run: "run", gl_when_key: "key", gl_when_click: "click", gl_when_ground: "ground", gl_when_toy: "toy" };

// Block shapes and words. Called again on language switch (block text is baked into the definition).
export function defineBlocks(t) {
  const num = (name, value) => ({ type: "field_number", name, value });
  const hat = (type, extra = {}) => ({ type, message0: t["b_" + type.slice(3)], nextStatement: null, colour: COL.event, ...extra });
  const stmt = (type, colour, args0) => ({ type, message0: t["b_" + type.slice(3)], ...(args0 && { args0 }), previousStatement: null, nextStatement: null, colour });
  const defs = [
    hat("gl_when_run"),
    hat("gl_when_key", { args0: [{ type: "field_dropdown", name: "KEY", options: KEYS.map(k => [t["k_" + k], k]) }] }),
    hat("gl_when_click"), hat("gl_when_ground"), hat("gl_when_toy"),
    stmt("gl_jump", COL.motion, [num("N", 12)]), stmt("gl_move", COL.motion, [num("N", 6)]), stmt("gl_spin", COL.motion, [num("N", 0.3)]),
    stmt("gl_wave", COL.looks), stmt("gl_say", COL.looks, [{ type: "field_input", name: "TEXT", text: t.hi }]),
    stmt("gl_spawn", COL.world, [{ type: "field_dropdown", name: "TOY", options: TOYS.map(k => [t[k], k]) }]),
    stmt("gl_explode", COL.world, [num("N", 1)]),
    stmt("gl_wait", COL.control, [num("N", 0.5)]),
    { ...stmt("gl_repeat", COL.control, [num("N", 3)]), message1: "%1", args1: [{ type: "input_statement", name: "DO" }] },
    { type: "gl_forever", message0: t.b_forever, message1: "%1", args1: [{ type: "input_statement", name: "DO" }], previousStatement: null, colour: COL.control }
  ];
  for (const d of defs) delete Blockly.Blocks[d.type]; // redefine quietly when the language changes
  Blockly.common.defineBlocksWithJsonArray(defs);
}

export const toolbox = t => ({
  kind: "categoryToolbox",
  contents: CATS.map(([key, colour, types]) => ({ kind: "category", name: t["cat_" + key], colour, contents: types.map(type => ({ kind: "block", type })) }))
});

let theme;
export function blocklyTheme(tok) {
  theme ??= Blockly.Theme.defineTheme("juego-labs", {
    name: "juego-labs", base: Blockly.Themes.Classic, startHats: true,
    fontStyle: { family: "Lexend, system-ui, sans-serif", weight: "600", size: 11 },
    componentStyles: {
      workspaceBackgroundColour: tok("--paper"), toolboxBackgroundColour: tok("--panel"), toolboxForegroundColour: tok("--ink"),
      flyoutBackgroundColour: tok("--grid"), flyoutForegroundColour: tok("--ink"), flyoutOpacity: 1,
      scrollbarColour: tok("--line"), insertionMarkerColour: tok("--ink")
    }
  });
  return theme;
}

// Starter scripts so the game does something the moment it opens.
export const starterScripts = t => ({
  blocks: { languageVersion: 0, blocks: [
    { type: "gl_when_run", x: 20, y: 20, next: { block: { type: "gl_say", fields: { TEXT: t.hi }, next: { block: { type: "gl_repeat", fields: { N: 3 },
      inputs: { DO: { block: { type: "gl_spawn", fields: { TOY: "ball" }, next: { block: { type: "gl_wait", fields: { N: 0.4 } } } } } } } } } } },
    { type: "gl_when_key", x: 20, y: 230, fields: { KEY: "space" }, next: { block: { type: "gl_jump", fields: { N: 12 } } } },
    { type: "gl_when_key", x: 20, y: 330, fields: { KEY: "right" }, next: { block: { type: "gl_move", fields: { N: 6 } } } },
    { type: "gl_when_key", x: 20, y: 430, fields: { KEY: "left" }, next: { block: { type: "gl_move", fields: { N: -6 } } } },
    { type: "gl_when_click", x: 20, y: 530, next: { block: { type: "gl_wave", next: { block: { type: "gl_say", fields: { TEXT: t.hey } } } } } }
  ] }
});

const argOf = b => (b.getField("N") ? Number(b.getFieldValue("N")) : b.getField("TEXT") ? b.getFieldValue("TEXT") : b.getField("TOY") ? b.getFieldValue("TOY") : undefined);

// Runs scripts by walking the blocks. stop() bumps runId so every loop notices and quits.
export function createRunner(act) {
  let runId = 0; const busy = new Map();
  async function chain(b, id) {
    for (; b && id === runId; b = b.getNextBlock()) {
      if (!b.isEnabled()) continue;
      const op = b.type.slice(3), body = b.getInputTargetBlock("DO");
      if (op === "repeat") { const n = Math.min(100, Math.max(0, argOf(b) | 0)); for (let i = 0; i < n && id === runId; i++) { await chain(body, id); await sleep(16); } }
      else if (op === "forever") { while (id === runId) { await chain(body, id); await sleep(16); } }
      else await act[op]?.(argOf(b));
    }
  }
  return {
    fire(ws, evt, key) {
      const runs = [];
      for (const top of ws.getTopBlocks(false)) {
        if (EVENT_OF[top.type] !== evt || (evt === "key" && top.getFieldValue("KEY") !== key)) continue;
        if (busy.get(top.id) === runId) continue; // already running: don't stack copies
        const id = runId; busy.set(top.id, id);
        runs.push(chain(top.getNextBlock(), id).finally(() => { if (busy.get(top.id) === id) busy.delete(top.id); }));
      }
      return Promise.all(runs);
    },
    stop() { runId++; busy.clear(); }
  };
}

// The real web-page code each event block stands for, used by the HTML view.
const DOM_KEY = { space: " ", left: "ArrowLeft", right: "ArrowRight", up: "ArrowUp", down: "ArrowDown" };
const htmlHead = top => ({
  gl_when_run: ['run.addEventListener("click", () => {', "});"],
  gl_when_key: [`addEventListener("keydown", e => { if (e.key === ${JSON.stringify(DOM_KEY[top.getFieldValue("KEY")])}) {`, "}});"],
  gl_when_click: ['stage.addEventListener("click", () => {', "});"],
  gl_when_ground: ['stage.addEventListener("touchground", () => {', "});"],
  gl_when_toy: ['stage.addEventListener("touchtoy", () => {', "});"]
})[top.type];

// One row per block: what the student built, next to the code it means.
// mode "js" shows the short game functions; "html" shows the whole thing as a web page.
export function terminalLines(ws, t, lang, mode = "js") {
  const N = CODE[lang], out = [], q = v => JSON.stringify(v), html = mode === "html", base = html ? 1 : 0;
  const label = b => {
    const v = b.getField("KEY") ? t["k_" + b.getFieldValue("KEY")] : b.getField("TOY") ? t[b.getFieldValue("TOY")] : argOf(b);
    return t["b_" + b.type.slice(3)].replace("%1", v ?? "");
  };
  const walk = (b, d) => {
    for (; b; b = b.getNextBlock()) {
      const pad = "  ".repeat(d), op = b.type.slice(3);
      if (op === "repeat" || op === "forever") {
        out.push({ block: pad + label(b), code: pad + (op === "repeat" ? `${N.repeat}(${argOf(b)}, () => {` : `${N.forever}(() => {`) });
        walk(b.getInputTargetBlock("DO"), d + 1);
        out.push({ block: "", code: pad + "});" });
      } else {
        const v = argOf(b);
        out.push({ block: pad + label(b), code: `${pad}${N[op]}(${v === undefined ? "" : typeof v === "number" ? v : q(v)});` });
      }
    }
  };
  if (html) out.push({ block: "", code: '<canvas id="stage" width="960" height="540"></canvas>' }, { block: "", code: `<button id="run">${t.run}</button>` }, { block: "", code: "<script>" });
  const pad = "  ".repeat(base);
  for (const top of ws.getTopBlocks(true)) {
    if (!EVENT_OF[top.type]) continue;
    const [open, close] = html ? htmlHead(top) : [top.type === "gl_when_key" ? `${N.when_key}(${q(top.getFieldValue("KEY"))}, () => {` : `${N[top.type.slice(3)]}(() => {`, "});"];
    out.push({ block: label(top), code: pad + open });
    walk(top.getNextBlock(), base + 1);
    out.push({ block: "", code: pad + close });
  }
  if (html) out.push({ block: "", code: "</script>" });
  return out;
}
