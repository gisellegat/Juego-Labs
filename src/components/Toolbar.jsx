import { useRef } from "react";
import { TOOLS, COLORS, floodFill } from "../paint.js";

const ICON = { brush: "🖌", eraser: "🧽", bucket: "🪣", line: "╱" };

// Brush, eraser, paint bucket and line tool, plus colors and size: the same toolbar on both drawing canvases.
export default function Toolbar({ t, tool, setTool, color, setColor, size, setSize }) {
  return (
    <>
      <div className="toolset" role="group" aria-label={t.toolsLabel}>
        {TOOLS.map(k => <button key={k} className="tool" aria-pressed={tool === k} onClick={() => setTool(k)}><span aria-hidden="true">{ICON[k]}</span>{t["tool_" + k]}</button>)}
      </div>
      <div className="swatches">
        {COLORS.map(c => <button key={c} className="sw" style={{ background: c }} aria-label={c} aria-pressed={c === color && tool !== "eraser"}
          onClick={() => { setColor(c); if (tool === "eraser") setTool("brush"); }} />)}
      </div>
      <label className="rng">{t.brush}<input type="range" min="4" max="60" value={size} onChange={e => setSize(+e.target.value)} /></label>
    </>
  );
}

// Pointer handlers for a drawing canvas. ctx(): the canvas being painted; at(e): pointer → canvas units;
// clip(x): limits strokes (optional); inside(px, py): limits the paint bucket; snap(): saves an undo step.
export function usePaint({ ctx, at, clip, inside, snap, tool, color, size }) {
  const s = useRef(null);
  function seg(a, b, erase) {
    const x = ctx(); x.save(); clip?.(x);
    x.globalCompositeOperation = erase ? "destination-out" : "source-over";
    x.strokeStyle = erase ? "#000" : color; x.lineWidth = size; x.lineCap = x.lineJoin = "round";
    x.beginPath(); x.moveTo(a.x, a.y); x.lineTo(b.x + 0.01, b.y); x.stroke(); x.restore();
  }
  const end = () => { s.current = null; };
  return {
    onPointerDown(e) {
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* pointer gone */ }
      snap(); const p = at(e);
      if (tool === "bucket") return void floodFill(ctx(), p.x, p.y, color, inside);
      // the line tool redraws from a copy of the canvas on every move, so only the final line stays
      s.current = tool === "line" ? { start: p, base: ctx().getImageData(0, 0, ctx().canvas.width, ctx().canvas.height) } : { last: p };
      seg(p, p, tool === "eraser");
    },
    onPointerMove(e) {
      const st = s.current; if (!st) return; const q = at(e);
      if (st.base) { ctx().putImageData(st.base, 0, 0); seg(st.start, q, false); }
      else { seg(st.last, q, tool === "eraser"); st.last = q; }
    },
    onPointerUp: end, onPointerCancel: end
  };
}
