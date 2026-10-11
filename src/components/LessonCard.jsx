import { fmt } from "../i18n.js";

const TAG = { HTML: "var(--tag-html)", CSS: "var(--tag-css)", JavaScript: "var(--tag-js)" };

// One "How it works" card (same layout as the Figma Tutorial Card): number, tag, title, explanation, code, task.
export default function LessonCard({ lesson, n, m, t, lang, taskLabel, done, children }) {
  const [title, body, task] = lesson[lang];
  return (
    <article className={"lesson" + (done ? " done" : "")}>
      <div className="top">
        <span className="num">{n}</span>
        <span className="tagl" style={{ background: TAG[lesson.tag] }}>{lesson.tag}</span>
        <span className="hint">{fmt(t.guideStep, { n, m })}</span>
      </div>
      <h3>{title}</h3>
      <p>{body}</p>
      <pre><code>{lesson.code}</code></pre>
      <p className="try"><b>{taskLabel}</b> {task}</p>
      {done && <p className="done-badge" role="status">{t.guideDone}</p>}
      {children}
    </article>
  );
}
