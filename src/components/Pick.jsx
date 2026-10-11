import { useEffect, useRef } from "react";
import { previewFrom, S } from "../character.js";
import { SCENES } from "../scenes.js";
import SceneThumb from "./SceneThumb.jsx";

function Preview({ parts }) {
  const ref = useRef(null);
  useEffect(() => { const c = previewFrom(parts), x = ref.current.getContext("2d"); x.clearRect(0, 0, c.width, c.height); x.drawImage(c, 0, 0); }, [parts]);
  return <canvas ref={ref} width={90 * S} height={195 * S} aria-hidden="true" />;
}

export default function Pick({ t, premade, saved, choice, onPick, bg, setBg, onAdd, onDelete }) {
  const isOn = c => choice.kind === c.kind && (c.kind === "saved" ? choice.id === c.id : choice.key === c.key);
  return (
    <section>
      <h2>{t.pickTitle}</h2>
      <div>
        <h3>{t.premade}</h3>
        <div className="cards">
          {Object.keys(premade).map(k => (
            <button key={k} className="card" aria-pressed={isOn({ kind: "premade", key: k })} onClick={() => onPick({ kind: "premade", key: k })}>
              <Preview parts={premade[k]} /><b>{t[k]}</b>
            </button>))}
        </div>
      </div>
      <div>
        <h3>{t.mine}</h3>
        <div className="cards">
          {saved.map(ch => (
            <div key={ch.id} style={{ position: "relative", display: "grid" }}>
              <button className="card" aria-pressed={isOn({ kind: "saved", id: ch.id })} onClick={() => onPick({ kind: "saved", id: ch.id })}>
                <Preview parts={ch.parts} /><b>{ch.name}</b>
              </button>
              <button className="mini del" style={{ position: "absolute", top: 6, right: 6 }} aria-label={`${t.deleteChar}: ${ch.name}`} onClick={() => onDelete(ch.id)}>✕</button>
            </div>))}
          <button className="card add" onClick={onAdd}><span className="plus" aria-hidden="true">+</span><b>{t.addNew}</b><small>{t.addNewSub}</small></button>
        </div>
      </div>
      <div>
        <h3>{t.backgrounds}</h3>
        <div className="bgcards">
          {SCENES.map(s => (
            <button key={s} className="bgcard" aria-pressed={bg === s} onClick={() => setBg(s)}>
              <SceneThumb theme={s} /><b>{t["bg_" + s]}</b>
            </button>))}
        </div>
      </div>
    </section>
  );
}
