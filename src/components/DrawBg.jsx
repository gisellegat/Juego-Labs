import { useEffect, useRef, useState } from "react";
import Icon from "./Icon.jsx";
import { SCENES, GROUND, drawScene } from "../scenes.js";
import { COLORS } from "../paint.js";
import Toolbar, { usePaint } from "./Toolbar.jsx";
import SceneThumb from "./SceneThumb.jsx";

const W = 960, H = 540; // stage units, same as the Game Boy screen

// Background canvas: draw your own stage. The dashed line is the floor your buddy stands on.
export default function DrawBg({ t, start, onBack, onDone }) {
  const sheet = useRef(null), guide = useRef(null), history = useRef([]);
  const [tool, setTool] = useState("brush"), [color, setColor] = useState(COLORS[5]), [size, setSize] = useState(18);
  const [canUndo, setCanUndo] = useState(false);
  const ctx = () => sheet.current.getContext("2d");
  const tok = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();

  useEffect(() => {
    if (start) ctx().drawImage(start, 0, 0, W, H); else { ctx().fillStyle = "#ffffff"; ctx().fillRect(0, 0, W, H); }
    const g = guide.current.getContext("2d");
    g.setLineDash([14, 10]); g.lineWidth = 3; g.strokeStyle = tok("--accent");
    g.beginPath(); g.moveTo(0, H - GROUND); g.lineTo(W, H - GROUND); g.stroke();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function snap() {
    history.current.push(ctx().getImageData(0, 0, W, H));
    if (history.current.length > 20) history.current.shift();
    setCanUndo(true);
  }
  function undo() { const d = history.current.pop(); if (d) ctx().putImageData(d, 0, 0); setCanUndo(history.current.length > 0); }
  function startFrom(theme) { snap(); drawScene(ctx(), theme, W, H, tok); }
  function clearAll() { snap(); ctx().fillStyle = "#ffffff"; ctx().fillRect(0, 0, W, H); }

  const at = e => { const r = guide.current.getBoundingClientRect(); return { x: ((e.clientX - r.left) * W) / r.width, y: ((e.clientY - r.top) * H) / r.height }; };
  const paint = usePaint({ ctx, at, snap, tool, color, size });

  return (
    <section>
      <h2>{t.drawBgTitle}</h2>
      <p className="hint">{t.drawBgHint}</p>
      <div className="draw">
        <div className="stack wide">
          <canvas ref={sheet} width={W} height={H} aria-hidden="true" />
          <canvas ref={guide} className="guide" width={W} height={H} aria-label={t.drawBgTitle} data-tool={tool} {...paint} />
        </div>
        <div className="tools">
          <Toolbar t={t} tool={tool} setTool={setTool} color={color} setColor={setColor} size={size} setSize={setSize} />
          <div className="thumbs"><b>{t.startFrom}</b>
            {SCENES.map(s => <button key={s} className="thumb" aria-label={t["bg_" + s]} onClick={() => startFrom(s)}><SceneThumb theme={s} /></button>)}
          </div>
          <div className="row">
            <button className="btn" onClick={undo} disabled={!canUndo}><Icon name="undo" /> {t.undo}</button>
            <button className="btn" onClick={clearAll}>{t.clearAll}</button>
          </div>
          <div className="row">
            <button className="btn" onClick={onBack}>{t.back}</button>
            <button className="btn big yel" onClick={() => onDone(sheet.current.toDataURL("image/png"))}>{t.saveBg}</button>
          </div>
        </div>
      </div>
    </section>
  );
}
