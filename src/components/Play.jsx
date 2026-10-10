import { useEffect, useRef, useState } from "react";
import * as Blockly from "blockly";
import * as BlocklyEn from "blockly/msg/en";
import * as BlocklyEs from "blockly/msg/es";
import { createSim, TOYS } from "../sim.js";
import { SCENES } from "../scenes.js";
import { defineBlocks, toolbox, blocklyTheme, starterScripts, createRunner, terminalLines } from "../blocks.js";
import SceneThumb from "./SceneThumb.jsx";

const KEYMAP = { " ": "space", ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down" };
const WS_KEY = "gl-ws";

// Scratch-style layout: Blockly (palette + scripts) on the left, stage + terminal on the right.
export default function Play({ t, lang, parts, bg, setBg, onChangeChar, onLearn }) {
  const stageRef = useRef(null), blocklyRef = useRef(null);
  const ws = useRef(null), sim = useRef(null), runner = useRef(null), live = useRef({ t, lang });
  const [lines, setLines] = useState([]);
  const [grav, setGrav] = useState(1);
  const [bounce, setBounce] = useState(0.2);
  live.current = { t, lang };

  // physics + runner
  useEffect(() => {
    const s = createSim(stageRef.current, evt => ws.current && runner.current?.fire(ws.current, evt));
    sim.current = s; runner.current = createRunner(s.act);
    return () => { runner.current.stop(); s.destroy(); };
  }, []);
  useEffect(() => { sim.current.spawnChar(parts); }, [parts]);
  useEffect(() => { sim.current.setScene(bg); }, [bg]);

  // Blockly workspace
  useEffect(() => {
    const css = getComputedStyle(document.documentElement), tok = n => css.getPropertyValue(n).trim();
    Blockly.setLocale(lang === "es" ? BlocklyEs : BlocklyEn); defineBlocks(t);
    const box = blocklyRef.current;
    const w = Blockly.inject(box, {
      toolbox: toolbox(t), renderer: "zelos", theme: blocklyTheme(tok), trashcan: true,
      // block size is relative to the pane width, so narrow screens still fit a script
      zoom: { controls: true, wheel: false, startScale: Math.min(0.9, Math.max(0.5, box.clientWidth / 700)), minScale: 0.4, maxScale: 1.5 },
      move: { scrollbars: true, drag: true, wheel: true }
    });
    ws.current = w;
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(WS_KEY)); Blockly.serialization.workspaces.load(saved || starterScripts(t), w); }
    catch { saved = null; w.clear(); Blockly.serialization.workspaces.load(starterScripts(t), w); }
    if (!saved) w.cleanUp(); // space the starter scripts out at whatever size the blocks render
    const update = () => {
      setLines(terminalLines(w, live.current.t, live.current.lang));
      try { localStorage.setItem(WS_KEY, JSON.stringify(Blockly.serialization.workspaces.save(w))); } catch { /* private mode */ }
    };
    w.addChangeListener(e => { if (!e.isUiEvent) update(); });
    update();
    const ro = new ResizeObserver(() => Blockly.svgResize(w)); ro.observe(box);
    return () => { ro.disconnect(); w.dispose(); ws.current = null; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // language switch: block words are part of the definitions, so redefine and reload
  const mountedLang = useRef(lang);
  useEffect(() => {
    const w = ws.current; if (!w || mountedLang.current === lang) return; mountedLang.current = lang;
    const state = Blockly.serialization.workspaces.save(w);
    Blockly.setLocale(lang === "es" ? BlocklyEs : BlocklyEn); defineBlocks(t);
    w.clear(); Blockly.serialization.workspaces.load(state, w); w.updateToolbox(toolbox(t));
    setLines(terminalLines(w, t, lang));
  }, [lang, t]);

  // keyboard
  useEffect(() => {
    const onKey = e => {
      const k = KEYMAP[e.key];
      if (!k || e.target.closest("input,select,textarea,[contenteditable],.blocklyWidgetDiv") || blocklyRef.current?.contains(e.target)) return;
      e.preventDefault(); runner.current.fire(ws.current, "key", k);
    };
    addEventListener("keydown", onKey); return () => removeEventListener("keydown", onKey);
  }, []);

  const fire = (evt, key) => ws.current && runner.current.fire(ws.current, evt, key);
  return (
    <section className="play">
      <div className="codepane">
        <h3>{t.codeTitle}</h3>
        <div className="blockly" ref={blocklyRef} />
        <p className="hint">{t.codeHint}</p>
      </div>
      <div className="stagepane">
        <div className="row">
          <button className="btn go big" onClick={() => fire("run")}>{t.run}</button>
          <button className="btn stop big" onClick={() => runner.current.stop()}>{t.stop}</button>
          <button className="btn" onClick={() => { runner.current.stop(); setGrav(sim.current.setGravity(1)); sim.current.spawnChar(); }}>{t.reset}</button>
          <button className="btn" onClick={onChangeChar}>{t.newChar}</button>
          <button className="btn yel" onClick={onLearn}>{t.learn}</button>
        </div>
        <div className="thumbs"><b>{t.background}</b>
          {SCENES.map(s => <button key={s} className="thumb" aria-label={t["bg_" + s]} aria-pressed={bg === s} onClick={() => setBg(s)}><SceneThumb theme={s} /></button>)}
        </div>
        <div className="stagewrap"><canvas ref={stageRef} width="960" height="540" aria-label="Playground" /></div>
        <div className="row"><b>{t.toys}</b>
          {TOYS.map(k => <button key={k} className="btn" onClick={() => sim.current.spawnProp(k)}>+ {t[k]}</button>)}
          <button className="mini" onClick={() => sim.current.clearToys()}>{t.clearToys}</button>
        </div>
        <div className="row">
          <label className="rng">{t.gravity}<input type="range" min="-1" max="2" step="0.1" value={grav} onChange={e => setGrav(sim.current.setGravity(e.target.value))} /></label>
          <label className="rng">{t.bounce}<input type="range" min="0" max="1" step="0.05" value={bounce} onChange={e => { setBounce(+e.target.value); sim.current.setBounce(+e.target.value); }} /></label>
          <span className="row pad">
            {[["left", "←"], ["up", "↑"], ["right", "→"], ["space", t.k_space]].map(([k, l]) => <button key={k} className="btn" onPointerDown={() => fire("key", k)}>{l}</button>)}
          </span>
        </div>
        <p className="hint">{t.dragHint}</p>
        <div className="terminal" aria-label={t.terminalTitle}>
          <div className="bar"><i style={{ background: "#ff5f57" }} /><i style={{ background: "#febc2e" }} /><i style={{ background: "#28c840" }} /><span>{t.terminalTitle}</span></div>
          <div className="lines" aria-live="polite">
            <div className="p">$ run my-scripts</div>
            {lines.length ? lines.map((l, i) => (
              <div key={i} className="ln"><span className="b">{l.block}</span><span className="a">{l.block ? "→" : ""}</span><span className="c">{l.code}</span></div>
            )) : <div className="p">// {t.terminalEmpty}</div>}
            <div className="cur">$ ▌</div>
          </div>
        </div>
      </div>
    </section>
  );
}
