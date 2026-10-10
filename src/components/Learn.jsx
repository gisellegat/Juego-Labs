import { LESSONS } from "../i18n.js";

const TAG = { HTML: "var(--tag-html)", CSS: "var(--tag-css)", JavaScript: "var(--tag-js)" };

// Kid-friendly lesson cards about the HTML, CSS and JavaScript behind the game.
export default function Learn({ t, lang, onBack, onPlay }) {
  return (
    <section>
      <div>
        <h2>{t.learnTitle}</h2>
        <p className="hint">{t.learnSub}</p>
      </div>
      <div className="lessons">
        {LESSONS.map((l, i) => {
          const [title, body, challenge] = l[lang];
          return (
            <article key={i} className="lesson">
              <div className="top"><span className="num">{i + 1}</span><span className="tagl" style={{ background: TAG[l.tag] }}>{l.tag}</span></div>
              <h3>{title}</h3>
              <p>{body}</p>
              <pre><code>{l.code}</code></pre>
              <p className="try"><b>{t.tryIt}</b> {challenge}</p>
            </article>
          );
        })}
      </div>
      <div className="row">
        <button className="btn" onClick={onBack}>{t.backToGame}</button>
        <button className="btn go big" onClick={onPlay}>{t.play}</button>
      </div>
    </section>
  );
}
