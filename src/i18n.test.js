// Every piece of English text needs a Spanish twin.
import test from "node:test";
import assert from "node:assert/strict";
import { T, LESSONS } from "./i18n.js";
import { LEVELS } from "./levels.js";
import { STEPS } from "./tutorial.js";

test("English and Spanish have the same keys, none empty", () => {
  assert.deepEqual(Object.keys(T.es).sort(), Object.keys(T.en).sort());
  for (const lang of ["en", "es"]) for (const [k, v] of Object.entries(T[lang])) assert.ok(v, `${lang}.${k} is empty`);
});

test("levels, lessons and tutorial steps are in both languages", () => {
  for (const L of LEVELS) assert.ok(L.en.length === 2 && L.es.length === 2, `level ${L.id}`);
  for (const l of LESSONS) assert.ok(l.en.length === l.es.length, l.tag);
  for (const s of STEPS) assert.ok(s.en && s.es, s.en);
});
