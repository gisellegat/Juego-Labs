// Hands-on HTML tutorial: each step has a task, starter code and checks.
// check(doc) gets the student's HTML parsed as a Document and returns [ok, en message, es message] rows.
const has = (cond, en, es) => [!!cond, en, es];
const text = el => (el?.textContent || "").trim().toLowerCase();

export const STEPS = [
  { lesson: 0,
    en: "Type a <button> tag that says Run.", es: "Escribe una etiqueta <button> que diga Ejecutar.",
    starter: "<!-- Type your button below -->\n",
    check: d => { const b = d.querySelector("button");
      return [has(b, "There is a <button>", "Hay un <button>"),
        has(/run|ejecutar/.test(text(b)), "The button says Run", "El botón dice Ejecutar")]; } },
  { lesson: 1,
    en: "Paint the button: add style=\"background: yellow\" inside the <button> tag.", es: "Pinta el botón: agrega style=\"background: yellow\" dentro de la etiqueta <button>.",
    starter: "<button>Run</button>\n",
    check: d => { const b = d.querySelector("button");
      return [has(b, "There is a <button>", "Hay un <button>"),
        has(b && (b.style.background || b.style.backgroundColor), "The button has a background color", "El botón tiene color de fondo")]; } },
  { lesson: 2,
    en: "Make the blue bar stretch across the page: add width: 100% to its style.", es: "Haz que la barra azul cruce toda la página: agrega width: 100% a su style.",
    starter: "<div style=\"background: skyblue; height: 40px;\"></div>\n",
    check: d => { const v = d.querySelector("div");
      return [has(v, "There is a <div>", "Hay un <div>"),
        has(v?.style.width === "100%", "The div is 100% wide", "El div mide 100% de ancho")]; } },
  { lesson: 3,
    en: "Make the button listen for clicks: add onclick=\"jump()\" to the <button> tag.", es: "Haz que el botón escuche los clics: agrega onclick=\"saltar()\" a la etiqueta <button>.",
    starter: "<button>Jump</button>\n",
    check: d => { const b = d.querySelector("button"), on = b?.getAttribute("onclick") || "";
      return [has(b, "There is a <button>", "Hay un <button>"),
        has(/(jump|saltar)\s*\(/.test(on), "Clicking it calls jump()", "Al hacer clic llama a saltar()")]; } },
  { lesson: 4,
    en: "Blocks run in order, like a list. Make an <ol> with 3 <li> steps: say, jump, wave.", es: "Los bloques se ejecutan en orden, como una lista. Haz una <ol> con 3 pasos <li>: decir, saltar, saludar.",
    starter: "<ol>\n  <li>say Hi!</li>\n</ol>\n",
    check: d => { const ol = d.querySelector("ol");
      return [has(ol, "There is an <ol> list", "Hay una lista <ol>"),
        has(ol && ol.querySelectorAll("li").length >= 3, "The list has 3 or more <li> steps", "La lista tiene 3 o más pasos <li>")]; } },
  { lesson: 5,
    en: "Build a gravity slider: <input type=\"range\" min=\"-1\" max=\"2\">", es: "Construye un control de gravedad: <input type=\"range\" min=\"-1\" max=\"2\">",
    starter: "<label>Gravity</label>\n",
    check: d => { const i = d.querySelector("input");
      return [has(i?.getAttribute("type") === "range", "There is an <input type=\"range\">", "Hay un <input type=\"range\">"),
        has(i?.getAttribute("min") === "-1" && i?.getAttribute("max") === "2", "It goes from -1 to 2", "Va de -1 a 2")]; } },
  { lesson: 6,
    en: "Make the stage your buddy lives on: <canvas id=\"stage\" width=\"960\" height=\"540\">", es: "Haz el escenario donde vive tu amigo: <canvas id=\"stage\" width=\"960\" height=\"540\">",
    starter: "<!-- the game draws everything on a canvas -->\n",
    check: d => { const c = d.querySelector("canvas");
      return [has(c, "There is a <canvas>", "Hay un <canvas>"),
        has(c?.id === "stage", "Its id is stage", "Su id es stage"),
        has(c?.getAttribute("width") === "960" && c?.getAttribute("height") === "540", "It is 960 by 540", "Mide 960 por 540")]; } }
];

export const checkStep = (i, html, parse) => STEPS[i].check(parse(html));
