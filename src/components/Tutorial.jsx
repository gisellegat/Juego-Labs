import { useState } from "react";
import { LESSONS, fmt } from "../i18n.js";
import { STEPS, checkStep } from "../tutorial.js";

const parse = html => new DOMParser().parseFromString(html, "text/html");
// Makes canvases visible in the preview; scripts never run (sandbox="").
const PREVIEW_CSS = "<style>body{font-family:system-ui,sans-serif;margin:12px}canvas{border:2px dashed #8a94a8;max-width:100%}</style>";

// Hands-on HTML: type code, see the page, press Check.
export default function Tutorial({ t, lang, onDone, onBack }) {
  const [i, setI] = useState(0);
  const [code, setCode] = useState(STEPS[0].starter);
  const [result, setResult] = useState(null);
  const step = STEPS[i], [title, body] = LESSONS[step.lesson][lang], passed = result?.every(([ok]) => ok);
  const go = n => { setI(n); setCode(STEPS[n].starter); setResult(null); };

  return (
    <section>
      <div>
        <h2>{t.tutTitle}</h2>
        <p className="hint">{t.tutSub}</p>
      </div>
      <div className="chips">{STEPS.map((_, n) => <span key={n} className={`chip ${n < i ? "done" : n === i ? "now" : ""}`}>{n + 1}</span>)}</div>
      <div className="tut">
        <div className="tutpane">
          <p className="hint">{fmt(t.step, { n: i + 1, m: STEPS.length })}</p>
          <h3>{title}</h3>
          <p>{body}</p>
          <p className="task"><b>{t.task}</b> {step[lang]}</p>
          <label className="editor-label" htmlFor="html-editor">{t.yourCode}</label>
          <textarea id="html-editor" className="editor" spellCheck="false" value={code} rows={8}
            onChange={e => { setCode(e.target.value); setResult(null); }} />
          <div className="row">
            <button className="btn yel big" onClick={() => setResult(checkStep(i, code, parse))}>{t.check}</button>
            <button className="mini" onClick={() => go(i)}>{t.startOver}</button>
          </div>
          {result && (
            <div className={`checks ${passed ? "ok" : ""}`} role="status">
              <b>{passed ? t.passed : t.notYet}</b>
              <ul>{result.map(([ok, en, es], n) => <li key={n} className={ok ? "ok" : "bad"}>{ok ? "✓" : "✗"} {lang === "es" ? es : en}</li>)}</ul>
            </div>
          )}
          <div className="row">
            <button className="btn" onClick={() => (i ? go(i - 1) : onBack())}>{t.back}</button>
            {passed && (i < STEPS.length - 1
              ? <button className="btn go big" onClick={() => go(i + 1)}>{t.nextStep}</button>
              : <button className="btn go big" onClick={onDone}>{t.tutDone}</button>)}
          </div>
        </div>
        <div className="tutpane">
          <p className="editor-label">{t.yourPage}</p>
          <iframe className="preview" title={t.yourPage} sandbox="" srcDoc={PREVIEW_CSS + code} />
        </div>
      </div>
    </section>
  );
}
