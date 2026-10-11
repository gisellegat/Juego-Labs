import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import * as Blockly from "blockly";
import { Dialog } from "@base-ui/react/dialog";
import * as BlocklyEn from "blockly/msg/en";
import * as BlocklyEs from "blockly/msg/es";
import { createSim, TOYS } from "../sim.js";
import { SCENES } from "../scenes.js";
import { defineBlocks, toolbox, blocklyTheme, starterScripts, createRunner, terminalLines } from "../blocks.js";
import { fmt, LESSONS } from "../i18n.js";
import LessonCard from "./LessonCard.jsx";
import { padKeys } from "../controls.js";
import SceneThumb from "./SceneThumb.jsx";

const KEYMAP = { " ": "space", ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down" };
const WS_KEY = "gl-ws";

// Scratch-style layout: Blockly (palette + scripts) on the left, stage + terminal on the right.
// level = null is free play; otherwise a level from levels.js (the parent remounts Play per attempt)
// guide = true: the "How it works" cards walk the student through the game one step at a time, then onMonsters
export default function Play({ t, lang, parts, bg, setBg, level, guide, onMonsters, onMap, onWin, onNext, onRetry, onChangeChar, onLearn }) {
  const stageRef = useRef(null), blocklyRef = useRef(null), stageWrapRef = useRef(null);
  const ws = useRef(null), sim = useRef(null), runner = useRef(null), live = useRef({});
  const [lines, setLines] = useState([]);
  const [mode, setMode] = useState("js");
  const [bounce, setBounce] = useState(0.2);
  const [status, setStatus] = useState(null);
  live.current = { t, lang, mode };

  // Guided cards: each card's step is checked by the thing the student actually does; a ✓ shows, then the next card.
  const [card, setCard] = useState(0);
  const [cardDone, setCardDone] = useState(false);
  const [intro, setIntro] = useState(true); // the card's pop-up is showing
  useEffect(() => { if (guide) setIntro(true); }, [card, guide]);
  // after the pop-up, light up the exact thing the card asks the student to use
  useEffect(() => {
    const step = LESSONS[card]?.step;
    if (!guide || intro || !step) return;
    const find = {
      run: () => document.querySelector(".stagepane .btn.go"),
      bg: () => document.querySelector(".thumbs"),
      full: () => document.querySelector(".gb-icon"),
      key: () => document.querySelector(".a-btn"),
      html: () => document.querySelectorAll(".terminal .tabs button")[1],
      jump: () => [...document.querySelectorAll(".blocklyEditableField")].find(f => f.textContent.trim() === "12") || document.querySelector(".blockly"),
      drag: () => document.querySelector(".stagewrap")
    }[step];
    const el = find?.(); if (!el) return;
    el.classList.add("coach");
    el.scrollIntoView?.({ block: "nearest", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    return () => el.classList.remove("coach");
  }, [card, intro, guide]);
  const guideRef = useRef({ card: 0, done: false });
  function progress(step) {
    const g = guideRef.current;
    if (!guide || g.done || g.card >= LESSONS.length || LESSONS[g.card].step !== step) return;
    g.done = true; setCardDone(true);
    setTimeout(() => { g.card++; g.done = false; setCard(g.card); setCardDone(false); }, 1100);
  }
  const jumpChanged = () => ws.current?.getAllBlocks(false).some(b => b.type === "gl_jump" && Number(b.getFieldValue("N")) !== 12);
  useEffect(() => { if (LESSONS[card]?.step === "jump" && jumpChanged()) progress("jump"); }, [card]); // eslint-disable-line react-hooks/exhaustive-deps

  // physics + runner
  useEffect(() => {
    const s = createSim(stageRef.current, (evt, data) => {
      if (evt === "win") { runner.current.stop(); setStatus({ type: "win", ...data }); onWin?.(); navigator.vibrate?.([20, 40, 20]); }
      else if (evt === "lose") { runner.current.stop(); setStatus({ type: "lose" }); navigator.vibrate?.(60); }
      else if (evt === "hurt") navigator.vibrate?.(30); // same moment as the blink (Android; iOS ignores it)
      else if (evt === "needBoss") s.act.say(live.current.t.needBoss);
      else if (evt === "drag") progress("drag");
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
      if (jumpChanged()) progress("jump");
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

  const fire = (evt, key) => {
    if (evt === "run") progress("run");
    if (evt === "key" && key === "space") progress("key");
    return ws.current && runner.current.fire(ws.current, evt, key);
  };
  // Touch controls repeat while held, like holding a key. Each finger has its own loop,
  // so holding → on the D-pad keeps running while the other thumb presses A to jump.
  const loops = useRef(new Map());
  const [padDirs, setPadDirs] = useState([]);
  function press(id, keys) {
    const cur = loops.current.get(id);
    if (cur && cur.keys.join() === keys.join()) return;
    if (cur) clearInterval(cur.timer);
    loops.current.delete(id);
    if (!keys.length) return;
    keys.forEach(k => fire("key", k)); // respond on touch-down, not on release
    loops.current.set(id, { keys, timer: setInterval(() => keys.forEach(k => fire("key", k)), 70) });
  }
  useEffect(() => () => loops.current.forEach(l => clearInterval(l.timer)), []);
  const padAt = e => {
    const r = e.currentTarget.getBoundingClientRect();
    return padKeys(((e.clientX - r.left) / r.width) * 2 - 1, ((e.clientY - r.top) / r.height) * 2 - 1);
  };
  const pad = {
    onPointerDown: e => { e.preventDefault(); try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* pointer already gone */ } const k = padAt(e); press("pad" + e.pointerId, k); setPadDirs(k); },
    onPointerMove: e => { if (!loops.current.has("pad" + e.pointerId) && !e.currentTarget.hasPointerCapture?.(e.pointerId)) return; const k = padAt(e); press("pad" + e.pointerId, k); setPadDirs(k); },
    onPointerUp: e => { press("pad" + e.pointerId, []); setPadDirs([]); },
    onPointerCancel: e => { press("pad" + e.pointerId, []); setPadDirs([]); },
    onContextMenu: e => e.preventDefault()
  };
  const hold = k => ({
    onPointerDown: e => { e.preventDefault(); try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* pointer already gone */ } press(k + e.pointerId, [k]); },
    onPointerUp: e => press(k + e.pointerId, []), onPointerCancel: e => press(k + e.pointerId, []),
    onClick: e => { if (e.detail === 0) fire("key", k); }, // keyboard activation fires once
    onContextMenu: e => e.preventDefault()
  });

  // Full screen grows out of the Game Boy's place on the page and shrinks back along the same path.
  // It starts from wherever the Game Boy is on screen right now, so tapping ✕ mid-way reverses smoothly.
  const [full, setFull] = useState(false);
  const gbRef = useRef(null), flight = useRef(null);
  function toggleFull(next) {
    if (next) progress("full");
    const el = gbRef.current, from = el.getBoundingClientRect(); // on-screen (presentation) position
    flight.current?.cancel();
    flushSync(() => setFull(next));
    const to = el.getBoundingClientRect();
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      flight.current = el.animate([{ opacity: 0.4 }, { opacity: 1 }], { duration: 180, easing: "ease-out" });
      return;
    }
    const s = from.width / to.width;
    const dx = from.left + from.width / 2 - (to.left + to.width / 2), dy = from.top + from.height / 2 - (to.top + to.height / 2);
    // critically damped feel (no overshoot): Apple's move/reposition spring, damping 1.0, response 0.4
    flight.current = el.animate([{ transform: `translate(${dx}px, ${dy}px) scale(${s})` }, { transform: "none" }],
      { duration: 420, easing: "cubic-bezier(0.32, 0.72, 0, 1)" });
  }
  useEffect(() => {
    if (!full) return;
    const esc = e => e.key === "Escape" && toggleFull(false);
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
      <div className="termpane">
      <div className="terminal" aria-label={t.terminalTitle}>
        <div className="bar"><i style={{ background: "#ff5f57" }} /><i style={{ background: "#febc2e" }} /><i style={{ background: "#28c840" }} /><span>{t.terminalTitle}</span>
          <span className="tabs" role="group">{["js", "html"].map(m => <button key={m} aria-pressed={mode === m} onClick={() => { setMode(m); if (m === "html") progress("html"); }}>{m === "js" ? t.tabJs : t.tabHtml}</button>)}</span>
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
      <div className="stagepane">
        <div className="row">
          <button className="btn go big" onClick={() => fire("run")}>{t.run}</button>
          <button className="btn stop big" onClick={() => runner.current.stop()}>{t.stop}</button>
          {level
            ? <button className="btn" onClick={onRetry}>{t.tryAgain}</button>
            : <button className="btn" onClick={() => { runner.current.stop(); sim.current.spawnChar(); }}>{t.reset}</button>}
          <button className="btn" onClick={onMap}>{t.backToMap}</button>
          {!level && <button className="btn" onClick={onChangeChar}>{t.newChar}</button>}
          <button className="btn yel" onClick={onLearn}>{t.learn}</button>
        </div>
        {guide && (card < LESSONS.length
          ? <LessonCard key={card} lesson={LESSONS[card]} n={card + 1} m={LESSONS.length} t={t} lang={lang} taskLabel={t.guideDo} done={cardDone} compact>
              <button className="mini" onClick={onMonsters}>{t.skipGuide}</button>
            </LessonCard>
          : <div className="lesson finish" role="status">
              <h3>{t.guideFinish}</h3>
              <p>{t.guideFinishSub}</p>
              <button className="btn go big" onClick={onMonsters}>{t.fightMonsters}</button>
            </div>)}
        {/* the card's pop-up: the code you're about to learn, before the game walks you through it */}
        <Dialog.Root open={!!guide && intro && card < LESSONS.length} onOpenChange={open => { if (!open) setIntro(false); }}>
          <Dialog.Portal>
            <Dialog.Backdrop className="backdrop" />
            <Dialog.Popup className="modal card-pop">
              <Dialog.Title render={<p className="hint" />}>{t.guideNext}</Dialog.Title>
              {card < LESSONS.length && <LessonCard lesson={LESSONS[card]} n={card + 1} m={LESSONS.length} t={t} lang={lang} taskLabel={t.guideDo} />}
              <Dialog.Close className="btn go big">{t.guideGo}</Dialog.Close>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
        {level
          ? <p className="goal"><b>{level[lang][0]}</b> · {t.goal} {level[lang][1]}</p>
          : <div className="thumbs"><b>{t.background}</b>
              {SCENES.map(s => <button key={s} className="thumb" aria-label={t["bg_" + s]} aria-pressed={bg === s} onClick={() => { if (s !== bg) progress("bg"); setBg(s); }}><SceneThumb theme={s} /></button>)}
            </div>}
        {/* Game Boy shell: the same stage, with touch controls; "full" pops it over the whole screen */}
        <div className={`gbwrap${full ? " full" : ""}`} onClick={e => full && e.target === e.currentTarget && toggleFull(false)}>
          <div className="gb" ref={gbRef} role={full ? "dialog" : undefined} aria-modal={full || undefined} aria-label={full ? t.fullScreen : undefined}>
            <div className="gb-top">
              <span className="gb-brand">JUEGO LABS</span>
              <button className="gb-icon" onClick={() => toggleFull(!full)} aria-label={full ? t.exitFull : t.fullScreen} title={full ? t.exitFull : t.fullScreen}>{full ? "✕" : "⛶"}</button>
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
              <div className="dpad" role="group" aria-label={t.dpad} {...pad}>
                {[["up", "▲"], ["left", "◀"], ["right", "▶"], ["down", "▼"]].map(([k, l]) => <button key={k} className={"d-" + k + (padDirs.includes(k) ? " on" : "")} aria-label={t["k_" + k]} onClick={e => { if (e.detail === 0) fire("key", k); }}>{l}</button>)}
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
          <label className="rng">{t.bounce}<input type="range" min="0" max="1" step="0.05" value={bounce} onChange={e => { setBounce(+e.target.value); sim.current.setBounce(+e.target.value); }} /></label>
        </div>
        <p className="hint">{t.dragHint}</p>
      </div>
    </section>
  );
}
