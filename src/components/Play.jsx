import { useEffect, useRef, useState } from "react";
import * as Blockly from "blockly";
import { Dialog } from "@base-ui/react/dialog";
import * as BlocklyEn from "blockly/msg/en";
import * as BlocklyEs from "blockly/msg/es";
import { createSim, TOYS } from "../sim.js";
import { SCENES } from "../scenes.js";
import { defineBlocks, toolbox, blocklyTheme, starterScripts, createRunner, terminalLines } from "../blocks.js";
import { fmt } from "../i18n.js";
import SceneThumb from "./SceneThumb.jsx";

const KEYMAP = { " ": "space", ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down" };
const WS_KEY = "gl-ws";

// Scratch-style layout: Blockly (palette + scripts) on the left, stage + terminal on the right.
// level = null is free play; otherwise a level from levels.js (the parent remounts Play per attempt)
export default function Play({ t, lang, parts, bg, setBg, level, onMap, onWin, onNext, onRetry, onChangeChar, onLearn }) {
  const stageRef = useRef(null), blocklyRef = useRef(null), stageWrapRef = useRef(null);
  const ws = useRef(null), sim = useRef(null), runner = useRef(null), live = useRef({});
  const [lines, setLines] = useState([]);
  const [mode, setMode] = useState("js");
  const [grav, setGrav] = useState(level?.gravity ?? 1);
  const [bounce, setBounce] = useState(0.2);
  const [status, setStatus] = useState(null);
  live.current = { t, lang, mode };

  // physics + runner
  useEffect(() => {
    const s = createSim(stageRef.current, (evt, data) => {
      if (evt === "win") { runner.current.stop(); setStatus({ type: "win", ...data }); onWin?.(); }
      else if (evt === "lose") { runner.current.stop(); setStatus({ type: "lose" }); }
      else if (evt === "needBoss") s.act.say(live.current.t.needBoss);
      else if (evt !== "hurt" && ws.current) runner.current.fire(ws.current, evt);
    }, level);
    sim.current = s; runner.current = createRunner(s.act);
    return () => { runner.current.stop(); s.destroy(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { sim.current.spawnChar(parts); }, [parts]);
  useEffect(() => { if (!level) sim.current.setScene(bg); }, [bg, level]);
  useEffect(() => { if (level) sim.current.setTitle(level[lang][0]); }, [level, lang]);
  useEffect(() => { if (ws.current) setLines(terminalLines(ws.current, t, lang, mode)); }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

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
      setLines(terminalLines(w, live.current.t, live.current.lang, live.current.mode));
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
    setLines(terminalLines(w, t, lang, live.current.mode));
  }, [lang, t]);

  // keyboard
  useEffect(() => {
    const onKey = e => {
      const k = KEYMAP[e.key];
      if (!k || e.target.closest?.("input,select,textarea,[contenteditable],.blocklyWidgetDiv") || blocklyRef.current?.contains(e.target)) return;
      e.preventDefault(); runner.current.fire(ws.current, "key", k);
    };
    addEventListener("keydown", onKey); return () => removeEventListener("keydown", onKey);
  }, []);

  const fire = (evt, key) => ws.current && runner.current.fire(ws.current, evt, key);
  // touch buttons repeat while held, like holding a key; keyboard activation (detail 0) fires once
  const held = useRef(null);
  const release = () => { clearInterval(held.current); held.current = null; };
  const hold = k => ({
    onPointerDown: e => { e.preventDefault(); e.currentTarget.setPointerCapture?.(e.pointerId); release(); fire("key", k); held.current = setInterval(() => fire("key", k), 70); },
    onPointerUp: release, onPointerCancel: release, onLostPointerCapture: release,
    onClick: e => { if (e.detail === 0) fire("key", k); },
    onContextMenu: e => e.preventDefault()
  });
  useEffect(() => release, []);
  const [full, setFull] = useState(false);
  useEffect(() => {
    if (!full) return;
    const esc = e => e.key === "Escape" && setFull(false);
    // everything behind the Game Boy goes inert, so Tab can't wander onto the blocks underneath
    // (a base-ui Dialog would portal the canvas elsewhere and restart the game, so this stays native)
    const behind = [...document.querySelectorAll("header, .codepane, .stagepane > :not(.gbwrap)")];
    behind.forEach(el => { el.inert = true; });
    document.body.style.overflow = "hidden"; addEventListener("keydown", esc);
    return () => { behind.forEach(el => { el.inert = false; }); document.body.style.overflow = ""; removeEventListener("keydown", esc); };
  }, [full]);
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
          {level
            ? <button className="btn" onClick={onRetry}>{t.tryAgain}</button>
            : <button className="btn" onClick={() => { runner.current.stop(); setGrav(sim.current.setGravity(1)); sim.current.spawnChar(); }}>{t.reset}</button>}
          <button className="btn" onClick={onMap}>{t.backToMap}</button>
          {!level && <button className="btn" onClick={onChangeChar}>{t.newChar}</button>}
          <button className="btn yel" onClick={onLearn}>{t.learn}</button>
        </div>
        {level
          ? <p className="goal"><b>{level[lang][0]}</b> · {t.goal} {level[lang][1]}</p>
          : <div className="thumbs"><b>{t.background}</b>
              {SCENES.map(s => <button key={s} className="thumb" aria-label={t["bg_" + s]} aria-pressed={bg === s} onClick={() => setBg(s)}><SceneThumb theme={s} /></button>)}
            </div>}
        {/* Game Boy shell: the same stage, with touch controls; "full" pops it over the whole screen */}
        <div className={`gbwrap${full ? " full" : ""}`} onClick={e => full && e.target === e.currentTarget && setFull(false)}>
          <div className="gb" role={full ? "dialog" : undefined} aria-modal={full || undefined} aria-label={full ? t.fullScreen : undefined}>
            <div className="gb-top">
              <span className="gb-brand">JUEGO LABS</span>
              <button className="gb-icon" onClick={() => setFull(!full)} aria-label={full ? t.exitFull : t.fullScreen} title={full ? t.exitFull : t.fullScreen}>{full ? "✕" : "⛶"}</button>
            </div>
            <div className="gb-bezel">
              <span className="gb-led" aria-hidden="true" />
              <div className="stagewrap" ref={stageWrapRef}>
                <canvas ref={stageRef} width="960" height="540" aria-label={level ? level[lang][0] : "Playground"} />
                {/* base-ui: focus stays on these buttons until the player picks one; Esc and outside taps can't dismiss it */}
                <Dialog.Root open={!!status} onOpenChange={() => {}} disablePointerDismissal>
                  <Dialog.Portal container={stageWrapRef}>
                    <Dialog.Popup className="overlay">
                      <Dialog.Title render={<h2 />}>{status?.type === "win" ? t.win : t.lose}</Dialog.Title>
                      <Dialog.Description>{status?.type === "win" ? fmt(t.winCoins, status) : t.loseSub}</Dialog.Description>
                      <div className="row">
                        {status?.type === "win" && onNext && <button className="btn go big" onClick={onNext}>{t.nextLevel}</button>}
                        <button className="btn" onClick={onRetry}>{status?.type === "win" ? t.replay : t.tryAgain}</button>
                        <button className="btn" onClick={() => { setFull(false); onMap(); }}>{t.backToMap}</button>
                      </div>
                    </Dialog.Popup>
                  </Dialog.Portal>
                </Dialog.Root>
              </div>
            </div>
            <div className="gb-controls">
              <div className="dpad" role="group" aria-label={t.dpad}>
                {[["up", "▲"], ["left", "◀"], ["right", "▶"], ["down", "▼"]].map(([k, l]) => <button key={k} className={"d-" + k} aria-label={t["k_" + k]} {...hold(k)}>{l}</button>)}
              </div>
              <div className="ab">
                <button className="b-btn" aria-label={t.gbB} onPointerDown={e => { e.preventDefault(); fire("click"); }} onClick={e => e.detail === 0 && fire("click")}>B</button>
                <button className="a-btn" aria-label={t.gbA} {...hold("space")}>A</button>
              </div>
            </div>
            <div className="gb-sys">
              <button onClick={() => runner.current.stop()}>{t.gbStop}</button>
              <button onClick={() => fire("run")}>{t.gbRun}</button>
            </div>
          </div>
        </div>
        <div className="row"><b>{t.toys}</b>
          {TOYS.map(k => <button key={k} className="btn" onClick={() => sim.current.spawnProp(k)}>+ {t[k]}</button>)}
          <button className="mini" onClick={() => sim.current.clearToys()}>{t.clearToys}</button>
        </div>
        <div className="row">
          <label className="rng">{t.gravity}<input type="range" min="-1" max="2" step="0.1" value={grav} onChange={e => setGrav(sim.current.setGravity(e.target.value))} /></label>
          <label className="rng">{t.bounce}<input type="range" min="0" max="1" step="0.05" value={bounce} onChange={e => { setBounce(+e.target.value); sim.current.setBounce(+e.target.value); }} /></label>
        </div>
        <p className="hint">{t.dragHint}</p>
        <div className="terminal" aria-label={t.terminalTitle}>
          <div className="bar"><i style={{ background: "#ff5f57" }} /><i style={{ background: "#febc2e" }} /><i style={{ background: "#28c840" }} /><span>{t.terminalTitle}</span>
            <span className="tabs" role="group">{["js", "html"].map(m => <button key={m} aria-pressed={mode === m} onClick={() => setMode(m)}>{m === "js" ? t.tabJs : t.tabHtml}</button>)}</span>
          </div>
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
