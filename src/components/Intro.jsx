import { useEffect, useState } from "react";
import logo from "../assets/logo.png";

const reduce = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

// Opening splash, once per visit: the button colors flow behind the logo, the logo fades in, then it all fades away.
// Any tap or key skips it.
export default function Intro({ onDone }) {
  const [leaving, setLeaving] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setLeaving(true), reduce() ? 1200 : 2400);
    const skip = () => setLeaving(true);
    addEventListener("keydown", skip);
    return () => { clearTimeout(id); removeEventListener("keydown", skip); };
  }, []);
  // a timer, not transitionend: it fires even if the tab is in the background
  useEffect(() => { if (leaving) { const id = setTimeout(onDone, 520); return () => clearTimeout(id); } }, [leaving]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className={"intro" + (leaving ? " leaving" : "")} onPointerDown={() => setLeaving(true)} aria-hidden={leaving || undefined}>
      <img src={logo} alt="Juego Labs" />
    </div>
  );
}
