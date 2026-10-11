// Hand-drawn icons (24×24, drawn with currentColor), so the UI never depends on emoji or symbol fonts.
const P = {
  arrowRight: <path d="M5 12h13M12 6l6 6-6 6" />,
  arrowLeft: <path d="M19 12H6M12 6l-6 6 6 6" />,
  arrowUp: <path d="M12 19V6M6 12l6-6 6 6" />,
  arrowDown: <path d="M12 5v13M6 12l6 6 6-6" />,
  play: <path d="M8 5.5v13l10.5-6.5z" fill="currentColor" />,
  stop: <rect x="6.5" y="6.5" width="11" height="11" rx="2" fill="currentColor" />,
  pause: <path d="M8.5 5.5v13M15.5 5.5v13" />,
  undo: <path d="M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  fullscreen: <path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" />,
  pencil: <path d="M4 20l1.2-4.6L15.6 5a2 2 0 0 1 2.8 0l.6.6a2 2 0 0 1 0 2.8L8.6 18.8zM13.5 7l3.5 3.5" />,
  upload: <path d="M12 16V4M7 9l5-5 5 5M5 20h14" />,
  eye: <><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" /><circle cx="12" cy="12" r="2.8" /></>,
  eyeOff: <><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" /><path d="M4 4l16 16" /></>,
  star: <path d="M12 3.2l2.6 5.5 6 .7-4.4 4.1 1.2 5.9L12 16.5l-5.4 2.9 1.2-5.9-4.4-4.1 6-.7z" fill="currentColor" strokeWidth="1.5" />,
  lock: <><rect x="5" y="11" width="14" height="9.5" rx="2" /><path d="M8.5 11V8a3.5 3.5 0 0 1 7 0v3" /></>,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  brush: <><path d="M19.5 4.5 11 13" /><path d="M10.5 12.5c-2.8 0-4.5 1.9-4.5 4.2 0 1.6-.9 2.6-2.5 3 4.6 1.2 9.5-.4 9.5-4.4 0-1.2-1-2.8-2.5-2.8z" /></>,
  eraser: <><path d="M14.5 4.5l5 5-8.5 8.5H6.5l-3-3z" /><path d="M9 10l5 5M6.5 18H20" /></>,
  bucket: <><path d="M4 11.5 11 4.5l6.5 6.5-7 7z" /><path d="M4 11.5h13.5" /><path d="M20 14.5c0 1.5 1.5 2.4 1.5 3.8a1.5 1.5 0 0 1-3 0c0-1.4 1.5-2.3 1.5-3.8z" fill="currentColor" strokeWidth="1" /></>,
  line: <><path d="M6 18 18 6" /><circle cx="5" cy="19" r="1.6" fill="currentColor" /><circle cx="19" cy="5" r="1.6" fill="currentColor" /></>
};

export default function Icon({ name, size = "1.15em", stroke = 2.4, className = "icon", ...rest }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...rest}>{P[name]}</svg>
  );
}

// The check badge from the Figma level selection (Level Node, State=Cleared): green circle, ink outline, black check.
export function CheckBadge({ size = 28, className = "check-badge" }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 36 36" fill="none" aria-hidden="true" focusable="false">
      <rect x="1" y="1" width="34" height="34" rx="17" fill="#5BAF2B" stroke="#1D2433" strokeWidth="2" />
      <path d="M26.2031 11.3965H24.7696C24.5686 11.3965 24.3779 11.4888 24.2548 11.6467L15.7995 22.3579L11.7451 17.2207C11.6837 17.1428 11.6056 17.0799 11.5164 17.0365C11.4273 16.9932 11.3295 16.9706 11.2303 16.9705H9.79684C9.65944 16.9705 9.58356 17.1284 9.66764 17.2351L15.2847 24.3513C15.5472 24.6835 16.0517 24.6835 16.3163 24.3513L26.3323 11.659C26.4164 11.5544 26.3405 11.3965 26.2031 11.3965Z" fill="#000" />
    </svg>
  );
}
