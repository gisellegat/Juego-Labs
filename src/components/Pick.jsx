import { useEffect, useRef } from "react";
import Icon from "./Icon.jsx";
import { previewFrom, S } from "../character.js";
import SceneThumb from "./SceneThumb.jsx";

function Preview({ parts }) {
  const ref = useRef(null);
  useEffect(() => { const c = previewFrom(parts), x = ref.current.getContext("2d"); x.clearRect(0, 0, c.width, c.height); x.drawImage(c, 0, 0); }, [parts]);
  return <canvas ref={ref} width={90 * S} height={195 * S} aria-hidden="true" />;
}

// Two sections on one page: characters, then backgrounds. They slide sideways instead of changing page.
export default function Pick({ t, premade, saved, choice, onPick, step, setStep, scenes, sceneVer, bg, setBg, onAdd, onDelete, onDrawBg, onContinue }) {
  const next = () => (step === 0 ? setStep(1) : onContinue());
  const isOn = c => choice.kind === c.kind && (c.kind === "saved" ? choice.id === c.id : choice.key === c.key);
  return (
    <section className="pick">
      {/* slow, hazy circles in the J-U-E-G-O colors behind both sections, with a light noise grain */}
      <div className="haze" aria-hidden="true"><i /><i /><i /><i /><i /></div>
      {step === 1 && <button className="back-arrow" onClick={() => setStep(0)} aria-label={t.backToChars}><Icon name="arrowLeft" size="28" stroke={3.4} /></button>}
      <div className="pick-track slides" style={{ transform: `translateX(calc(${-100 * step}% - ${80 * step}px))` }}>
        <div className="pick-panel" inert={step !== 0}>
          <h2>{t.pickTitle}</h2>
          <h3>{t.premade}</h3>
          <div className="cards">
            {Object.keys(premade).map(k => (
              <button key={k} className="card" aria-pressed={isOn({ kind: "premade", key: k })} onClick={() => onPick({ kind: "premade", key: k })}>
                <Preview parts={premade[k]} /><b>{t[k]}</b>
              </button>))}
          </div>
          <h3>{t.mine}</h3>
          <div className="cards">
            {saved.map(ch => (
              <div key={ch.id} style={{ position: "relative", display: "grid" }}>
                <button className="card" aria-pressed={isOn({ kind: "saved", id: ch.id })} onClick={() => onPick({ kind: "saved", id: ch.id })}>
                  <Preview parts={ch.parts} /><b>{ch.name}</b>
                </button>
                <button className="mini del" style={{ position: "absolute", top: 6, right: 6 }} aria-label={`${t.deleteChar}: ${ch.name}`} onClick={() => onDelete(ch.id)}><Icon name="close" /></button>
              </div>))}
            <button className="card add" onClick={onAdd}><span className="plus" aria-hidden="true">+</span><b>{t.addNew}</b><small>{t.addNewSub}</small></button>
          </div>
        </div>
        <div className="pick-panel bg-panel" inert={step !== 1}>
          <h2>{t.backgrounds}</h2>
          <div className="bgcards">
            {scenes.map(s => (
              <button key={s + sceneVer} className="bgcard" aria-pressed={bg === s} onClick={() => setBg(s)}>
                <SceneThumb theme={s} /><b>{t["bg_" + s]}</b>
              </button>))}
            <button className="bgcard add" onClick={onDrawBg}>
              <span className="add-art"><Icon name="pencil" size="40" stroke={2.2} /><small>{t.drawBgCardSub}</small></span><b>{t.drawBgCard}</b>
            </button>
          </div>
        </div>
      </div>
      {/* Next sits bottom-right on both sections: characters → backgrounds → the Let's play / Tutorial popup */}
      <button className="next-btn" onClick={next}>{t.nextBtn} <Icon name="arrowRight" stroke={3} /></button>
    </section>
  );
}
