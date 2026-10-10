import { LEVELS } from "../levels.js";
import { fmt } from "../i18n.js";
import SceneThumb from "./SceneThumb.jsx";

// Mario-style world map: levels unlock one at a time.
export default function WorldMap({ t, lang, cleared, onLevel, onFree, onTutorial }) {
  return (
    <section>
      <div>
        <h2>{t.mapTitle}</h2>
        <p className="hint">{t.mapSub}</p>
      </div>
      <ol className="map">
        {LEVELS.map((L, i) => {
          const open = i <= cleared, done = i < cleared;
          return (
            <li key={L.id}>
              <button className="node" disabled={!open} onClick={() => onLevel(i)} aria-label={`${fmt(t.level, { n: L.id })}: ${L[lang][0]}${open ? "" : ` (${t.locked})`}`}>
                <SceneThumb theme={L.scene} />
                <span className="num">{done ? "★" : open ? L.id : "🔒"}</span>
                <b>{L[lang][0]}</b>
                <small>{done ? t.cleared : open ? fmt(t.level, { n: L.id }) : t.locked}</small>
              </button>
            </li>
          );
        })}
      </ol>
      {cleared >= LEVELS.length && <p className="prompt">{t.allDone}</p>}
      <div className="row">
        <button className="btn" onClick={onFree}>{t.freePlay}</button>
        <span className="hint">{t.freePlaySub}</span>
        <button className="btn yel" onClick={onTutorial}>{t.choiceTut}</button>
      </div>
    </section>
  );
}
