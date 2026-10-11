import { useEffect, useRef, useState } from "react";
import Icon from "./Icon.jsx";
import { fmt } from "../i18n.js";

const GRADES = ["K", "1", "2", "3", "4", "5", "6", "7", "8", "other"];
const STEPS = 4; // language, name, grade, welcome

// First visit: a white screen that asks for the language, name and grade, one question per slide,
// then says welcome and fades into character selection.
export default function Welcome({ t, lang, setLang, onDone }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [grade, setGrade] = useState(null);
  const [leaving, setLeaving] = useState(false);
  const nameRef = useRef(null);
  const canNext = [true, name.trim().length > 0, grade !== null][step];
  const next = () => { if (canNext && step < STEPS - 1) setStep(step + 1); };

  useEffect(() => {
    // focus the field once the slide has arrived, so the keyboard doesn't fight the motion
    if (step === 1) { const id = setTimeout(() => nameRef.current?.focus(), 450); return () => clearTimeout(id); }
    if (step === 3) { const id = setTimeout(() => setLeaving(true), 1800); return () => clearTimeout(id); }
  }, [step]);
  useEffect(() => {
    if (!leaving) return;
    const id = setTimeout(() => onDone({ lang, name: name.trim(), grade }), 520);
    return () => clearTimeout(id);
  }, [leaving]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={"welcome" + (leaving ? " leaving" : "")} role="dialog" aria-modal="true" aria-label={t.welcomeTitle}>
      <div className="welcome-frame">
        <div className="slides" style={{ transform: `translateX(calc(${-100 * step}% - ${80 * step}px))` }}>
          <section className="welcome-step" inert={step !== 0}>
            <h2>{t.qLang}</h2>
            <div className="lang-pick">
              {[["en", "English"], ["es", "Español"]].map(([l, label]) => (
                <button key={l} lang={l} className="choice-big" aria-pressed={lang === l} onClick={() => setLang(l)}>{label}</button>))}
            </div>
          </section>
          <section className="welcome-step" inert={step !== 1}>
            <h2><label htmlFor="coder-name">{t.qName}</label></h2>
            <input id="coder-name" ref={nameRef} className="big-field" value={name} maxLength={24} autoComplete="given-name" placeholder={t.qNamePh}
              onChange={e => setName(e.target.value)} onKeyDown={e => { if (e.key === "Enter") next(); }} />
          </section>
          <section className="welcome-step" inert={step !== 2}>
            <h2 id="grade-q">{t.qGrade}</h2>
            <div className="grades" role="group" aria-labelledby="grade-q">
              {GRADES.map(g => <button key={g} className="grade" aria-pressed={grade === g} onClick={() => setGrade(g)}>{g === "K" ? t.gradeK : g === "other" ? t.gradeOther : g}</button>)}
            </div>
          </section>
          <section className="welcome-step" inert={step !== 3}>
            <h2 className="welcome-hi" role="status">{fmt(t.welcomeHi, { name: name.trim() })}</h2>
            <p className="hint">{t.welcomeSub}</p>
          </section>
        </div>
      </div>
      {(step === 1 || step === 2) && <button className="back-arrow" onClick={() => setStep(step - 1)} aria-label={t.back}><Icon name="arrowLeft" size="28" stroke={3.4} /></button>}
      {step < STEPS - 1 && <button className="next-btn" onClick={next} disabled={!canNext}>{t.nextBtn} <Icon name="arrowRight" stroke={3} /></button>}
    </div>
  );
}
