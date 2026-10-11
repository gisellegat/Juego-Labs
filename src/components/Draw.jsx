import { useEffect, useRef, useState } from "react";
import { PARTS, JOINTS, S, cropParts } from "../character.js";
import { fmt } from "../i18n.js";

const COLORS = ["#1d2433", "#ff5d73", "#ff9f43", "#ffcd3c", "#2bb673", "#2f6bff", "#a26bff", "#f1c27d", "#8d5524", "#ffffff", "erase"];
const SIZE = 200 * S;
const MAX_LAYERS = 6;
// the whole figure's box in figure units: where an uploaded buddy gets fitted
const FIG = { x: 62, y: 5, w: 76, h: 186 };
const loadImg = f => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = URL.createObjectURL(f); });
// the head is drawn and clipped as a circle; every other part as its box
const outline = (x, p) => { x.beginPath(); if (p.round) x.arc((p.x + p.w / 2) * S, (p.y + p.h / 2) * S, (p.w * S) / 2, 0, 7); else x.rect(p.x * S, p.y * S, p.w * S, p.h * S); };

// Limb-by-limb drawing wizard with layers: strokes go to the selected layer, clipped to the current part.
export default function Draw({ t, toast, onBack, onDone }) {
  const guide = useRef(null), last = useRef(null), canvases = useRef({}), nextId = useRef(2);
  const [step, setStep] = useState(0);
  const [color, setColor] = useState(COLORS[0]);
  const [size, setSize] = useState(14);
  const [trace, setTrace] = useState("");
  const [name, setName] = useState("");
  const [zoom, setZoom] = useState(true);
  const [layers, setLayers] = useState([{ id: 1, n: 1, visible: true }]); // index 0 is the bottom layer
  const [active, setActive] = useState(1);
  const history = useRef([]), [canUndo, setCanUndo] = useState(false);
  // undo: copy the layer before each change; 15 steps of an 800×800 layer is ~38 MB
  function snap() {
    history.current.push({ id: active, data: ctx().getImageData(0, 0, SIZE, SIZE) });
    if (history.current.length > 15) history.current.shift();
    setCanUndo(true);
  }
  function undo() {
    let h; while ((h = history.current.pop()) && !canvases.current[h.id]); // skip steps on deleted layers
    if (h) canvases.current[h.id].getContext("2d").putImageData(h.data, 0, 0);
    setCanUndo(history.current.length > 0);
  }
  const p = PARTS[step], ctx = () => canvases.current[active].getContext("2d");

  useEffect(() => {
    const css = getComputedStyle(document.documentElement), tok = n => css.getPropertyValue(n).trim();
    const g = guide.current.getContext("2d"); g.clearRect(0, 0, SIZE, SIZE);
    g.fillStyle = tok("--veil"); g.beginPath(); g.rect(0, 0, SIZE, SIZE);
    if (p.round) { g.moveTo((p.x + p.w) * S, (p.y + p.h / 2) * S); g.arc((p.x + p.w / 2) * S, (p.y + p.h / 2) * S, (p.w * S) / 2, 0, Math.PI * 2, true); }
    else g.rect(p.x * S, p.y * S, p.w * S, p.h * S);
    g.fill("evenodd");
    g.setLineDash([12, 8]);
    PARTS.forEach((q, i) => { g.strokeStyle = i === step ? tok("--accent") : tok("--line"); g.lineWidth = i === step ? 5 : 2; outline(g, q); g.stroke(); });
    g.setLineDash([]);
    for (const [, b, x, y] of JOINTS) {
      const done = PARTS.findIndex(q => q.id === b) < step; g.beginPath(); g.arc(x * S, y * S, 9, 0, 7);
      if (done) { g.fillStyle = tok("--accent"); g.fill(); } else { g.strokeStyle = tok("--muted"); g.lineWidth = 2; g.stroke(); }
    }
  }, [step, p]);

  const at = e => { const r = guide.current.getBoundingClientRect(); return { x: ((e.clientX - r.left) * SIZE) / r.width, y: ((e.clientY - r.top) * SIZE) / r.height }; };
  function stroke(a, b) {
    const x = ctx(); x.save(); outline(x, p); x.clip();
    x.globalCompositeOperation = color === "erase" ? "destination-out" : "source-over";
    x.strokeStyle = color === "erase" ? "#000" : color; x.lineWidth = size; x.lineCap = x.lineJoin = "round";
    x.beginPath(); x.moveTo(a.x, a.y); x.lineTo(b.x + 0.01, b.y); x.stroke(); x.restore();
  }
  function fillBehind() {
    if (color === "erase") return;
    snap(); const x = ctx(); x.save(); x.globalCompositeOperation = "destination-over"; x.fillStyle = color;
    if (p.round) { x.beginPath(); x.arc((p.x + p.w / 2) * S, (p.y + p.h / 2) * S, (p.w * S) / 2 - 3, 0, 7); } else { x.beginPath(); x.roundRect(p.x * S + 3, p.y * S + 3, p.w * S - 6, p.h * S - 6, 18); }
    x.fill(); x.restore();
  }
  function clearPart() { snap(); wipePart(); }
  function wipePart() { const x = ctx(); x.save(); outline(x, p); x.clip(); x.clearRect(p.x * S, p.y * S, p.w * S, p.h * S); x.restore(); }
  const fit = (img, box) => { const sc = Math.min((box.w * S) / img.width, (box.h * S) / img.height), w = img.width * sc, h = img.height * sc; return [box.x * S + (box.w * S - w) / 2, box.y * S + (box.h * S - h) / 2, w, h]; };
  async function upload(e) {
    const f = e.target.files[0]; e.target.value = ""; if (!f) return;
    try { const img = await loadImg(f); snap(); wipePart(); const x = ctx(); x.save(); outline(x, p); x.clip(); x.drawImage(img, ...fit(img, p)); x.restore(); } catch { toast(t.badImg); }
  }
  // a whole buddy in one picture: fit it to the figure, then every part box cuts out its own piece
  async function uploadBuddy(e) {
    const f = e.target.files[0]; e.target.value = ""; if (!f) return;
    try { const img = await loadImg(f); snap(); ctx().clearRect(0, 0, SIZE, SIZE); ctx().drawImage(img, ...fit(img, FIG)); setStep(PARTS.length - 1); toast(t.buddyPlaced); }
    catch { toast(t.badImg); }
  }
  async function pickTrace(e) { const f = e.target.files[0]; e.target.value = ""; if (!f) return; try { setTrace((await loadImg(f)).src); } catch { toast(t.badImg); } }
  function next() {
    if (step < PARTS.length - 1) { toast(t["j_" + p.id]); setStep(step + 1); return; }
    const merged = document.createElement("canvas"); merged.width = merged.height = SIZE;
    for (const l of layers) if (l.visible) merged.getContext("2d").drawImage(canvases.current[l.id], 0, 0); // bottom to top
    onDone(cropParts(merged), name.trim() || t.defaultName);
  }

  // layers
  function addLayer() {
    if (layers.length >= MAX_LAYERS) return;
    const id = nextId.current++, idx = layers.findIndex(l => l.id === active) + 1;
    setLayers([...layers.slice(0, idx), { id, n: Math.max(...layers.map(l => l.n)) + 1, visible: true }, ...layers.slice(idx)]); setActive(id);
  }
  function removeLayer(id) {
    if (layers.length === 1) return;
    const rest = layers.filter(l => l.id !== id); setLayers(rest); delete canvases.current[id];
    if (active === id) setActive(rest[Math.max(0, layers.findIndex(l => l.id === id) - 1)].id);
  }
  const move = (id, d) => { const i = layers.findIndex(l => l.id === id), j = i + d; if (j < 0 || j >= layers.length) return; const c = [...layers]; [c[i], c[j]] = [c[j], c[i]]; setLayers(c); };
  const toggle = id => setLayers(layers.map(l => (l.id === id ? { ...l, visible: !l.visible } : l)));

  // zoom: magnify the part being drawn so small parts like arms have room for detail
  const z = zoom ? Math.min(3.2, 0.82 / Math.max(p.w / 200, p.h / 200)) : 1;
  const cx = (p.x + p.w / 2) / 200, cy = (p.y + p.h / 2) / 200;
  const view = zoom ? `translate(${(0.5 - cx * z) * 100}%, ${(0.5 - cy * z) * 100}%) scale(${z})` : "none";

  return (
    <section>
      <label className="buddy-upload">
        <span className="buddy-icon" aria-hidden="true">⬆</span>
        <span><b>{t.uploadBuddy}</b><small>{t.uploadBuddySub}</small></span>
        <input type="file" accept="image/*" onChange={uploadBuddy} />
      </label>
      <div className="chips">{PARTS.map((q, i) => <button key={q.id} className={`chip ${i < step ? "done" : i === step ? "now" : ""}`} onClick={() => setStep(i)}>{t[q.id]}</button>)}</div>
      <div className="draw">
        <div className="stack">
          <div className="view" style={{ transform: view }}>
            {trace && <img src={trace} alt="" />}
            {layers.map(l => <canvas key={l.id} ref={c => { if (c) canvases.current[l.id] = c; }} width={SIZE} height={SIZE} hidden={!l.visible} aria-hidden="true" />)}
            <canvas ref={guide} className="guide" width={SIZE} height={SIZE} aria-label={t["draw_" + p.id]}
              onPointerDown={e => { try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* pointer gone */ } snap(); last.current = at(e); stroke(last.current, last.current); }}
              onPointerMove={e => { if (!last.current) return; const q = at(e); stroke(last.current, q); last.current = q; }}
              onPointerUp={() => { last.current = null; }} onPointerCancel={() => { last.current = null; }} />
          </div>
        </div>
        <div className="tools">
          <p className="prompt">{t["draw_" + p.id]}</p>
          <p className="hint">{t.drawHint}</p>
          <label className="rng"><input type="checkbox" checked={zoom} onChange={e => setZoom(e.target.checked)} /> {t.zoomPart}</label>
          <div className="swatches">
            {COLORS.map(c => <button key={c} className={"sw" + (c === "erase" ? " erase" : "")} style={c === "erase" ? undefined : { background: c }}
              aria-label={c === "erase" ? "eraser / borrador" : c} aria-pressed={c === color} onClick={() => setColor(c)} />)}
          </div>
          <label className="rng">{t.brush}<input type="range" min="4" max="60" value={size} onChange={e => setSize(+e.target.value)} /></label>
          <div className="layers" role="group" aria-label={t.layers}>
            <div className="layers-head"><b>{t.layers}</b><button className="mini" onClick={addLayer} disabled={layers.length >= MAX_LAYERS}>{t.addLayer}</button></div>
            {/* top layer first, like every drawing app */}
            {[...layers].reverse().map(l => (
              <div key={l.id} className={"layer" + (l.id === active ? " on" : "")}>
                <button className="mini eye" onClick={() => toggle(l.id)} aria-pressed={l.visible} aria-label={(l.visible ? t.hideLayer : t.showLayer) + ": " + fmt(t.layerN, { n: l.n })}>{l.visible ? "👁" : "—"}</button>
                <button className="layer-name" onClick={() => setActive(l.id)} aria-pressed={l.id === active}>{fmt(t.layerN, { n: l.n })}</button>
                <button className="mini" onClick={() => move(l.id, 1)} aria-label={t.layerUp}>↑</button>
                <button className="mini" onClick={() => move(l.id, -1)} aria-label={t.layerDown}>↓</button>
                <button className="mini" onClick={() => removeLayer(l.id)} disabled={layers.length === 1} aria-label={t.deleteLayer}>✕</button>
              </div>
            ))}
          </div>
          <div className="row">
            <button className="btn" onClick={undo} disabled={!canUndo}>↶ {t.undo}</button>
            <button className="btn" onClick={fillBehind}>{t.fill}</button>
            <button className="btn" onClick={clearPart}>{t.clear}</button>
            <span className="btn file">{t.upload}<input type="file" accept="image/*" onChange={upload} /></span>
            <span className="btn file">{t.trace}<input type="file" accept="image/*" onChange={pickTrace} /></span>
          </div>
          <label className="field">{t.nameLabel}<input id="char-name" value={name} maxLength={24} placeholder={t.defaultName} onChange={e => setName(e.target.value)} /></label>
          <p className="hint">{t.emptyHint}</p>
          <div className="row">
            <button className="btn" onClick={() => (step ? setStep(step - 1) : onBack())}>{t.back}</button>
            <button className="btn big yel" onClick={next}>{step === PARTS.length - 1 ? t.done : t.next}</button>
          </div>
        </div>
      </div>
    </section>
  );
}
