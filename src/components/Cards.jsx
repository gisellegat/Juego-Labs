import { useEffect, useState } from "react";
import { LESSONS } from "../i18n.js";
import LessonCard from "./LessonCard.jsx";

const EVERY = 9000; // ms each card stays up: enough to read the card aloud

// Tutorial: the same "How it works" cards, cycling one by one (no Game Boy).
export default function Cards({ t, lang, onPlay, onHtml }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const last = i === LESSONS.length - 1;
  useEffect(() => {
    if (paused || last) return; // stops on the last card so the buttons stay put
    const id = setTimeout(() => setI(i + 1), EVERY);
    return () => clearTimeout(id);
  }, [i, paused, last]);
  useEffect(() => {
    const key = e => {
      if (e.key === "ArrowRight") setI(n => Math.min(LESSONS.length - 1, n + 1));
      if (e.key === "ArrowLeft") setI(n => Math.max(0, n - 1));
    };
    addEventListener("keydown", key); return () => removeEventListener("keydown", key);
  }, []);
  return (
    <section className="cards-page">
      <div>
        <h2>{t.cardsTitle}</h2>
        <p className="hint">{t.cardsSub}</p>
      </div>
      <div className="carousel" aria-roledescription="carousel" onPointerEnter={() => setPaused(true)} onPointerLeave={() => setPaused(false)}>
        <LessonCard key={i} lesson={LESSONS[i]} n={i + 1} m={LESSONS.length} t={t} lang={lang} taskLabel={t.tryIt} />
        {!paused && !last && <div className="timer" key={"t" + i} style={{ animationDuration: EVERY + "ms" }} aria-hidden="true" />}
      </div>
      <div className="row">
        <button className="btn" onClick={() => setI(Math.max(0, i - 1))} disabled={i === 0}>← {t.prev}</button>
        <button className="btn" onClick={() => setPaused(!paused)} aria-pressed={paused}>{paused ? "▶ " + t.resume : "❚❚ " + t.pause}</button>
        <button className="btn" onClick={() => setI(Math.min(LESSONS.length - 1, i + 1))} disabled={last}>{t.next} →</button>
        <span className="dots" aria-hidden="true">{LESSONS.map((_, n) => <i key={n} className={n === i ? "on" : ""} />)}</span>
      </div>
      <div className="row">
        <button className="btn go big" onClick={onPlay}>{t.play}</button>
        <button className="btn yel" onClick={onHtml}>{t.writeHtml}</button>
      </div>
    </section>
  );
}
