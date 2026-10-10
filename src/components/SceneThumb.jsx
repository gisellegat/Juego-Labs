import { useEffect, useRef } from "react";
import { drawScene } from "../scenes.js";

// Small canvas preview of a stage background, used by the pickers.
export default function SceneThumb({ theme }) {
  const ref = useRef(null);
  useEffect(() => {
    const css = getComputedStyle(document.documentElement);
    drawScene(ref.current.getContext("2d"), theme, 960, 540, n => css.getPropertyValue(n).trim());
  }, [theme]);
  return <canvas ref={ref} width="960" height="540" aria-hidden="true" />;
}
