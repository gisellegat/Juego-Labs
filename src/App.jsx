import { useEffect, useMemo, useState } from "react";
import Icon from "./components/Icon.jsx";
import { flushSync } from "react-dom";
import logo from "./assets/logo.png";
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
import Cards from "./components/Cards.jsx";
import Intro from "./components/Intro.jsx";
import Welcome from "./components/Welcome.jsx";
import DrawBg from "./components/DrawBg.jsx";
import { SCENES, setCustomScene } from "./scenes.js";

const read = (key, fallback) => { try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; } };
const write = (key, v) => { try { localStorage.setItem(key, v); } catch { /* private mode: progress lasts until the tab closes */ } };
const startLang = () => read("gl-lang", navigator.language.startsWith("es") ? "es" : "en");

export default function App() {
  const [lang, setLang] = useState(startLang);
  const [screen, setScreenNow] = useState("pick");
  // first visit: the welcome questions (language, name, grade); kept in this browser afterwards
  const [profile, setProfile] = useState(() => { try { return JSON.parse(localStorage.getItem("gl-profile")); } catch { return null; } });
  const finishWelcome = p => { setProfile(p); write("gl-profile", JSON.stringify(p)); };
  const [intro, setIntro] = useState(() => { try { return !sessionStorage.getItem("gl-intro"); } catch { return true; } });
  const endIntro = () => { setIntro(false); try { sessionStorage.setItem("gl-intro", "1"); } catch { /* private mode */ } };
  // page transitions: the browser cross-slides from the old screen to the new one (instant where unsupported)
  const setScreen = s => document.startViewTransition && !document.hidden ? document.startViewTransition(() => flushSync(() => setScreenNow(s))) : setScreenNow(s);
  const [saved, setSaved] = useState([]);
  const [choice, setChoice] = useState({ kind: "premade", key: "robot" });
  const [asking, setAsking] = useState(false);
  const [bg, setBg] = useState("park");
  const [pickStep, setPickStep] = useState(0); // 0 characters, 1 backgrounds (same page, slides sideways)
  // the background the player drew, saved in this browser
  const [customBg, setCustomBg] = useState(() => read("gl-bg-custom", ""));
  const [customImg, setCustomImg] = useState(null), [sceneVer, setSceneVer] = useState(0);
  useEffect(() => {
    if (!customBg) return;
    const img = new Image(); img.onload = () => { setCustomScene(img); setCustomImg(img); setSceneVer(v => v + 1); }; img.src = customBg;
  }, [customBg]);
  const scenes = customImg ? [...SCENES, "custom"] : SCENES;
  function saveBackground(url) {
    setCustomBg(url); setBg("custom"); setPickStep(1); setScreen("pick");
    try { localStorage.setItem("gl-bg-custom", url); } catch { toast(t.noSave); }
  }
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

  function pick(c) { setChoice(c); }
  function addCharacter(newParts, name) {
    const ch = { id: Date.now().toString(36), name, parts: newParts }, list = [...saved, ch];
    setSaved(list); setScreen("pick"); pick({ kind: "saved", id: ch.id }); setPickStep(1);
    if (!saveAll(list)) toast(t.noSave);
  }
  function deleteCharacter(id) {
    const list = saved.filter(c => c.id !== id); setSaved(list); saveAll(list);
    if (choice.kind === "saved" && choice.id === id) setChoice({ kind: "premade", key: "robot" });
  }
  const [guided, setGuided] = useState(false); // "Let's play": the Game Boy with the How-it-works cards, then the monsters
  const play = (idx, guide = false) => { setAsking(false); setGuided(guide); setLevelIdx(idx); setAttempt(a => a + 1); setScreen("play"); };
  function levelWon() {
    if (levelIdx + 1 > cleared) { setCleared(levelIdx + 1); write("gl-progress", levelIdx + 1); }
  }
  const go = s => { setAsking(false); setScreen(s); };

  return (
    <>
      <header>
        <div>
          <h1 className="logo"><img src={logo} alt="Juego Labs" width="1134" height="347" /></h1>
          <p className="tag">{t.tagline}</p>
        </div>
        <div className="lang" role="group" aria-label="Language / Idioma">
          {["en", "es"].map(l => <button key={l} lang={l} aria-pressed={lang === l} onClick={() => setLang(l)}>{l === "en" ? "English" : "Español"}</button>)}
        </div>
      </header>
      <main>
        {screen === "pick" && <Pick t={t} premade={premade} saved={saved} choice={choice} onPick={pick} bg={bg} setBg={setBg}
          step={pickStep} setStep={setPickStep} scenes={scenes} sceneVer={sceneVer} onContinue={() => setAsking(true)}
          onAdd={() => setScreen("draw")} onDrawBg={() => setScreen("drawbg")} onDelete={deleteCharacter} />}
        {screen === "drawbg" && <DrawBg t={t} start={customImg} onBack={() => setScreen("pick")} onDone={saveBackground} />}
        {screen === "draw" && <Draw t={t} toast={toast} onBack={() => setScreen("pick")} onDone={addCharacter} />}
        {screen === "map" && <WorldMap t={t} lang={lang} cleared={cleared} onLevel={play} onFree={() => play(null)} onTutorial={() => go("cards")} />}
        {screen === "play" && <Play key={`${levelIdx}-${attempt}`} guide={guided} onMonsters={() => go("map")} t={t} lang={lang} parts={parts} bg={bg} setBg={setBg} scenes={scenes} sceneVer={sceneVer}
          level={levelIdx === null ? null : LEVELS[levelIdx]} onWin={levelWon} onRetry={() => play(levelIdx)}
          onNext={levelIdx !== null && levelIdx + 1 < LEVELS.length ? () => play(levelIdx + 1) : null}
          onMap={() => go("map")} onChangeChar={() => { setPickStep(0); go("pick"); }} onLearn={() => go("cards")} />}
        {screen === "cards" && <Cards t={t} lang={lang} onPlay={() => play(null, true)} onHtml={() => go("tutorial")} />}
        {screen === "tutorial" && <Tutorial t={t} lang={lang} onBack={() => go("cards")} onDone={() => go("map")} />}
      </main>
      {/* base-ui handles focus trapping, Esc, click-outside and returning focus to the card */}
      <Dialog.Root open={asking} onOpenChange={setAsking}>
        <Dialog.Portal>
          <Dialog.Backdrop className="backdrop" />
          <Dialog.Popup className="modal">
            <Dialog.Title render={<h2 />}>{fmt(t.choiceTitle, { name: charName })}</Dialog.Title>
            <Dialog.Description className="hint">{t.choiceSub}</Dialog.Description>
            <div className="choices">
              <button className="choice go" onClick={() => play(null, true)}><b><Icon name="play" /> {t.play}</b><small>{t.choicePlaySub}</small></button>
              <button className="choice yel" onClick={() => go("cards")}><b>{t.choiceTut}</b><small>{t.choiceTutSub}</small></button>
            </div>
            <Dialog.Close className="mini">{t.close}</Dialog.Close>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
      {!profile && <Welcome t={t} lang={lang} setLang={setLang} onDone={finishWelcome} />}
      {intro && <Intro onDone={endIntro} />}
      <Toaster position="bottom-center" duration={2600} toastOptions={{ className: "jl-toast" }} />
    </>
  );
}
