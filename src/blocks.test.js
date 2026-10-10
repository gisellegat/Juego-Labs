// Run with: npm test. Uses Blockly headless (no browser needed).
import test from "node:test";
import assert from "node:assert/strict";
import * as Blockly from "blockly";
import { T } from "./i18n.js";
import { defineBlocks, starterScripts, terminalLines, createRunner } from "./blocks.js";

function workspace(lang) {
  defineBlocks(T[lang]);
  const ws = new Blockly.Workspace();
  Blockly.serialization.workspaces.load(starterScripts(T[lang]), ws);
  return ws;
}

test("terminal shows each block next to its JavaScript, with nesting", () => {
  const lines = terminalLines(workspace("en"), T.en, "en");
  assert.deepEqual(lines.slice(0, 7), [
    { block: "when ▶ Run clicked", code: "onStart(() => {" },
    { block: "  say Hi!", code: '  say("Hi!");' },
    { block: "  repeat 3 times", code: "  repeat(3, () => {" },
    { block: "    spawn Ball", code: '    spawn("ball");' },
    { block: "    wait 0.4 seconds", code: "    wait(0.4);" },
    { block: "", code: "  });" },
    { block: "", code: "});" }
  ]);
  assert.ok(lines.some(l => l.code === 'onKey("space", () => {'));
});

test("Spanish terminal uses Spanish function names", () => {
  const lines = terminalLines(workspace("es"), T.es, "es");
  assert.equal(lines[0].code, "alIniciar(() => {");
  assert.equal(lines[3].code, '    crear("ball");');
});

test("runner runs the matching script, repeats, and respects key choice", async () => {
  const calls = [];
  const act = { say: v => calls.push(["say", v]), spawn: v => calls.push(["spawn", v]), wait: () => {}, jump: v => calls.push(["jump", v]), move: v => calls.push(["move", v]) };
  const ws = workspace("en"), run = createRunner(act);
  await run.fire(ws, "run");
  assert.deepEqual(calls, [["say", "Hi!"], ["spawn", "ball"], ["spawn", "ball"], ["spawn", "ball"]]);
  calls.length = 0;
  await run.fire(ws, "key", "left");
  assert.deepEqual(calls, [["move", -6]]);
});
