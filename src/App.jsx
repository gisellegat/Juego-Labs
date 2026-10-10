import { useEffect, useMemo, useState } from "react";
import { T } from "./i18n.js";
import { PREMADE, makeSheet, cropParts, loadSaved, saveAll } from "./character.js";
import Pick from "./components/Pick.jsx";
import Draw from "./components/Draw.jsx";
import Play from "./components/Play.jsx";
import Learn from "./components/Learn.jsx";

const startLang = () => { try { return localStorage.getItem("gl-lang") || (navigator.language.startsWith("es") ? "es" : "en"); } catch { return "en"; } };
export default function App() {
  const [lang, setLang] = useState(startLang);
  const [screen, setScreen] = useState("pick");
  const [saved, setSaved] = useState([]);
  const [choice, setChoice] = useState({ kind: "premade", key: "robot" });
  const [bg, setBg] = useState("park");
  const [toastMsg, setToastMsg] = useState("");
  const t = T[lang];

  useEffect(() => { loadSaved().then(setSaved); }, []);
  useEffect(() => { document.documentElement.lang = lang; try { localStorage.setItem("gl-lang", lang); } catch { /* private mode */ } }, [lang]);
  useEffect(() => { if (!toastMsg) return; const id = setTimeout(() => setToastMsg(""), 2600); return () => clearTimeout(id); }, [toastMsg]);

  const premade = useMemo(() => Object.fromEntries(Object.keys(PREMADE).map(k => [k, cropParts(makeSheet(PREMADE[k]))])), []);
  const parts = choice.kind === "saved" ? saved.find(c => c.id === choice.id)?.parts ?? premade.robot : premade[choice.key];

  function addCharacter(newParts, name) {
    const ch = { id: Date.now().toString(36), name, parts: newParts }, list = [...saved, ch];
    setSaved(list); setChoice({ kind: "saved", id: ch.id });
    if (!saveAll(list)) setToastMsg(t.noSave);
    setScreen("play");
  }
  function deleteCharacter(id) {
    const list = saved.filter(c => c.id !== id); setSaved(list); saveAll(list);
    if (choice.kind === "saved" && choice.id === id) setChoice({ kind: "premade", key: "robot" });
  }

  return (
    <>
      <header>
        <div>
          <h1 className="logo"><span>Garabato</span> Lab</h1>
          <p className="tag">{t.tagline}</p>
        </div>
        <div className="lang" role="group" aria-label="Language / Idioma">
          {["en", "es"].map(l => <button key={l} aria-pressed={lang === l} onClick={() => setLang(l)}>{l.toUpperCase()}</button>)}
        </div>
      </header>
      <main>
        {screen === "pick" && <Pick t={t} premade={premade} saved={saved} choice={choice} setChoice={setChoice} bg={bg} setBg={setBg}
          onAdd={() => setScreen("draw")} onDelete={deleteCharacter} onPlay={() => setScreen("play")} onLearn={() => setScreen("learn")} />}
        {screen === "draw" && <Draw t={t} toast={setToastMsg} onBack={() => setScreen("pick")} onDone={addCharacter} />}
        {screen === "play" && <Play t={t} lang={lang} parts={parts} bg={bg} setBg={setBg} onChangeChar={() => setScreen("pick")} onLearn={() => setScreen("learn")} />}
        {screen === "learn" && <Learn t={t} lang={lang} onBack={() => setScreen("pick")} onPlay={() => setScreen("play")} />}
      </main>
      <div id="toast" role="status" hidden={!toastMsg}>{toastMsg}</div>
    </>
  );
}
