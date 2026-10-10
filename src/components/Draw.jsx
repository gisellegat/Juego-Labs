import { useEffect, useRef, useState } from "react";
import { PARTS, JOINTS, S, cropParts } from "../character.js";

const COLORS = ["#1d2433", "#ff5d73", "#ff9f43", "#ffcd3c", "#2bb673", "#2f6bff", "#a26bff", "#f1c27d", "#8d5524", "#ffffff", "erase"];
const SIZE = 200 * S;
const loadImg = f => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = URL.createObjectURL(f); });

// Limb-by-limb drawing wizard: strokes are clipped to the current part's box.
export default function Draw({ t, toast, onBack, onDone }) {
  const sheet = useRef(null), guide = useRef(null), last = useRef(null);
  const [step, setStep] = useState(0);
  const [color, setColor] = useState(COLORS[0]);
  const [size, setSize] = useState(12);
  const [trace, setTrace] = useState("");
  const [name, setName] = useState("");
  const p = PARTS[step], ctx = () => sheet.current.getContext("2d");

  useEffect(() => {
    const css = getComputedStyle(document.documentElement), tok = n => css.getPropertyValue(n).trim();
    const g = guide.current.getContext("2d"); g.clearRect(0, 0, SIZE, SIZE);
    g.fillStyle = tok("--veil"); g.beginPath(); g.rect(0, 0, SIZE, SIZE); g.rect(p.x * S, p.y * S, p.w * S, p.h * S); g.fill("evenodd");
    g.setLineDash([10, 7]);
    PARTS.forEach((q, i) => { g.strokeStyle = i === step ? tok("--accent") : tok("--line"); g.lineWidth = i === step ? 4 : 2; g.strokeRect(q.x * S, q.y * S, q.w * S, q.h * S); });
    g.setLineDash([]);
    for (const [, b, x, y] of JOINTS) {
      const done = PARTS.findIndex(q => q.id === b) < step; g.beginPath(); g.arc(x * S, y * S, 7, 0, 7);
      if (done) { g.fillStyle = tok("--accent"); g.fill(); } else { g.strokeStyle = tok("--muted"); g.lineWidth = 2; g.stroke(); }
    }
  }, [step, p]);

  const at = e => { const r = sheet.current.getBoundingClientRect(); return { x: ((e.clientX - r.left) * SIZE) / r.width, y: ((e.clientY - r.top) * SIZE) / r.height }; };
  function stroke(a, b) {
    const x = ctx(); x.save(); x.beginPath(); x.rect(p.x * S, p.y * S, p.w * S, p.h * S); x.clip();
    x.globalCompositeOperation = color === "erase" ? "destination-out" : "source-over";
    x.strokeStyle = color === "erase" ? "#000" : color; x.lineWidth = size; x.lineCap = x.lineJoin = "round";
    x.beginPath(); x.moveTo(a.x, a.y); x.lineTo(b.x + 0.01, b.y); x.stroke(); x.restore();
  }
  function fillBehind() {
    if (color === "erase") return;
    const x = ctx(); x.save(); x.globalCompositeOperation = "destination-over"; x.fillStyle = color; x.beginPath();
    if (p.round) x.arc((p.x + p.w / 2) * S, (p.y + p.h / 2) * S, (p.w * S) / 2 - 3, 0, 7); else x.roundRect(p.x * S + 3, p.y * S + 3, p.w * S - 6, p.h * S - 6, 18);
    x.fill(); x.restore();
  }
  async function upload(e) {
    const f = e.target.files[0]; e.target.value = ""; if (!f) return;
    try {
      const img = await loadImg(f), sc = Math.min((p.w * S) / img.width, (p.h * S) / img.height), w = img.width * sc, h = img.height * sc;
      ctx().clearRect(p.x * S, p.y * S, p.w * S, p.h * S); ctx().drawImage(img, p.x * S + (p.w * S - w) / 2, p.y * S + (p.h * S - h) / 2, w, h);
    } catch { toast(t.badImg); }
  }
  async function pickTrace(e) { const f = e.target.files[0]; e.target.value = ""; if (!f) return; try { setTrace((await loadImg(f)).src); } catch { toast(t.badImg); } }
  function next() {
    if (step === PARTS.length - 1) return onDone(cropParts(sheet.current), name.trim() || t.defaultName);
    toast(t["j_" + p.id]); setStep(step + 1);
  }

  return (
    <section>
      <div className="chips">{PARTS.map((q, i) => <span key={q.id} className={`chip ${i < step ? "done" : i === step ? "now" : ""}`}>{t[q.id]}</span>)}</div>
      <div className="draw">
        <div className="stack">
          {trace && <img src={trace} alt="" />}
          <canvas ref={sheet} className="sheet" width={SIZE} height={SIZE} aria-label={t["draw_" + p.id]}
            onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); last.current = at(e); stroke(last.current, last.current); }}
            onPointerMove={e => { if (!last.current) return; const q = at(e); stroke(last.current, q); last.current = q; }}
            onPointerUp={() => { last.current = null; }} onPointerCancel={() => { last.current = null; }} />
          <canvas ref={guide} className="guide" width={SIZE} height={SIZE} />
        </div>
        <div className="tools">
          <p className="prompt">{t["draw_" + p.id]}</p>
          <p className="hint">{t.drawHint}</p>
          <div className="swatches">
            {COLORS.map(c => <button key={c} className={"sw" + (c === "erase" ? " erase" : "")} style={c === "erase" ? undefined : { background: c }}
              aria-label={c === "erase" ? "eraser / borrador" : c} aria-pressed={c === color} onClick={() => setColor(c)} />)}
          </div>
          <label className="rng">{t.brush}<input type="range" min="4" max="40" value={size} onChange={e => setSize(+e.target.value)} /></label>
          <div className="row">
            <button className="btn" onClick={fillBehind}>{t.fill}</button>
            <button className="btn" onClick={() => ctx().clearRect(p.x * S, p.y * S, p.w * S, p.h * S)}>{t.clear}</button>
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
