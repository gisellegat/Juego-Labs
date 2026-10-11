import { useEffect, useMemo, useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { Toaster, toast } from "sonner";
import { T, fmt } from "./i18n.js";
import { PREMADE, makeSheet, cropParts, loadSaved, saveAll } from "./character.js";
import { LEVELS } from "./levels.js";
import Pick from "./components/Pick.jsx";
import Draw from "./components/Draw.jsx";
import Play from "./components/Play.jsx";
import WorldMap from "./components/Map.jsx";
import Tutorial from "./components/Tutorial.jsx";

const read = (key, fallback) => { try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; } };
const write = (key, v) => { try { localStorage.setItem(key, v); } catch { /* private mode: progress lasts until the tab closes */ } };
const startLang = () => read("gl-lang", navigator.language.startsWith("es") ? "es" : "en");

export default function App() {
  const [lang, setLang] = useState(startLang);
  const [screen, setScreen] = useState("pick");
  const [saved, setSaved] = useState([]);
  const [choice, setChoice] = useState({ kind: "premade", key: "robot" });
  const [asking, setAsking] = useState(false);
  const [bg, setBg] = useState("park");
  const [levelIdx, setLevelIdx] = useState(null); // null = free play
  const [attempt, setAttempt] = useState(0);
  // judges: open the site with #unlock to play every level without clearing them first
  const [cleared, setCleared] = useState(() => location.hash === "#unlock" ? LEVELS.length : Number(read("gl-progress", 0)) || 0);
  const t = T[lang];

  useEffect(() => { loadSaved().then(setSaved); }, []);
  useEffect(() => { document.documentElement.lang = lang; write("gl-lang", lang); }, [lang]);

  const premade = useMemo(() => Object.fromEntries(Object.keys(PREMADE).map(k => [k, cropParts(makeSheet(PREMADE[k]))])), []);
  const savedChar = choice.kind === "saved" ? saved.find(c => c.id === choice.id) : null;
  const parts = savedChar?.parts ?? premade[choice.key] ?? premade.robot;
  const charName = savedChar?.name ?? t[choice.key] ?? t.robot;

  function pick(c) { setChoice(c); setAsking(true); }
  function addCharacter(newParts, name) {
    const ch = { id: Date.now().toString(36), name, parts: newParts }, list = [...saved, ch];
    setSaved(list); setScreen("pick"); pick({ kind: "saved", id: ch.id });
    if (!saveAll(list)) toast(t.noSave);
  }
  function deleteCharacter(id) {
    const list = saved.filter(c => c.id !== id); setSaved(list); saveAll(list);
    if (choice.kind === "saved" && choice.id === id) setChoice({ kind: "premade", key: "robot" });
  }
  const play = idx => { setLevelIdx(idx); setAttempt(a => a + 1); setScreen("play"); };
  function levelWon() {
    if (levelIdx + 1 > cleared) { setCleared(levelIdx + 1); write("gl-progress", levelIdx + 1); }
  }
  const go = s => { setAsking(false); setScreen(s); };

  return (
    <>
      <header>
        <div>
          <h1 className="logo"><span>Juego</span> Labs</h1>
          <p className="tag">{t.tagline}</p>
        </div>
        <div className="lang" role="group" aria-label="Language / Idioma">
          {["en", "es"].map(l => <button key={l} aria-pressed={lang === l} onClick={() => setLang(l)}>{l.toUpperCase()}</button>)}
        </div>
      </header>
      <main>
        {screen === "pick" && <Pick t={t} premade={premade} saved={saved} choice={choice} onPick={pick} bg={bg} setBg={setBg}
          onAdd={() => setScreen("draw")} onDelete={deleteCharacter} />}
        {screen === "draw" && <Draw t={t} toast={toast} onBack={() => setScreen("pick")} onDone={addCharacter} />}
        {screen === "map" && <WorldMap t={t} lang={lang} cleared={cleared} onLevel={play} onFree={() => play(null)} onTutorial={() => go("tutorial")} />}
        {screen === "play" && <Play key={`${levelIdx}-${attempt}`} t={t} lang={lang} parts={parts} bg={bg} setBg={setBg}
          level={levelIdx === null ? null : LEVELS[levelIdx]} onWin={levelWon} onRetry={() => play(levelIdx)}
          onNext={levelIdx !== null && levelIdx + 1 < LEVELS.length ? () => play(levelIdx + 1) : null}
          onMap={() => go("map")} onChangeChar={() => go("pick")} onLearn={() => go("tutorial")} />}
        {screen === "tutorial" && <Tutorial t={t} lang={lang} onBack={() => go("map")} onDone={() => go("map")} />}
      </main>
      {/* base-ui handles focus trapping, Esc, click-outside and returning focus to the card */}
      <Dialog.Root open={asking} onOpenChange={setAsking}>
        <Dialog.Portal>
          <Dialog.Backdrop className="backdrop" />
          <Dialog.Popup className="modal">
            <Dialog.Title render={<h2 />}>{fmt(t.choiceTitle, { name: charName })}</Dialog.Title>
            <Dialog.Description className="hint">{t.choiceSub}</Dialog.Description>
            <div className="choices">
              <button className="choice go" onClick={() => go("map")}><b>{t.play}</b><small>{t.choicePlaySub}</small></button>
              <button className="choice yel" onClick={() => go("tutorial")}><b>{t.choiceTut}</b><small>{t.choiceTutSub}</small></button>
            </div>
            <Dialog.Close className="mini">{t.close}</Dialog.Close>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
      <Toaster position="bottom-center" duration={2600} toastOptions={{ className: "jl-toast" }} />
    </>
  );
}
