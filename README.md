# Garabato Lab

A bilingual (English / Español) sandbox game that teaches kids to code. Pick a character or draw your own, limb by limb, and the game rigs it into a physics ragdoll you can fling around and program with Scratch-style blocks.

## Run it

It is one static file. Open `index.html` in a browser, or serve the folder:

```bash
python -m http.server 8000
```

Then go to http://localhost:8000. To publish it, turn on GitHub Pages (Settings → Pages → deploy from the `main` branch, root folder).

## What's in it

- **Pick or draw.** Three premade characters, or a 6-step drawing wizard (head, body, arms, legs). Each step clips your strokes to that part and shows the joints that will bend. You can upload a picture per part, or trace over a photo of a paper drawing.
- **Physics sandbox.** [Matter.js](https://brm.io/matter-js/) ragdoll with drag-and-fling, toys (ball, box, balloon, plank), and gravity and bounce sliders.
- **Code blocks.** Events (Run, key press, click, touch ground, touch toy) start scripts; actions (jump, move, spin, wave, say, spawn, gravity, explode, wait, repeat, forever) run in order. "Show as text code" turns the blocks into JavaScript-style code, with Spanish function names in ES mode.
- **EN / ES toggle.** Every label, block and code name switches together.

## Design

The editable Figma template lives here: https://www.figma.com/design/en67Sfnugtzp8HmcmZMedS

- **Screens:** Pick, Draw and Play, built from components.
- **Components:** Button, Code Block (5 categories), Character Card, Part Chip, Swatch, Language Toggle, Speech Bubble, Header.
- **Character Parts:** a 600×600 drawing template whose part frames match `PARTS` and `JOINTS` in `index.html`. Draw a character there, export each part as PNG, and upload them in the game.
- **Variables:** light and dark color modes that match the CSS tokens at the top of `index.html`.

If you change a color, change it in both places: the Figma variables and the `:root` CSS tokens.

## Project layout

```
index.html   the whole game: HTML, CSS and JS (Matter.js loads from cdnjs)
README.md
```
