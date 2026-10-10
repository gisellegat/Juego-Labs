# Garabato Lab

A bilingual (English / Español) sandbox game that teaches kids to code. Pick a character or draw your own, limb by limb, and the game rigs it into a physics ragdoll you can fling around and program with Scratch-style blocks.

## Run it

You need [Node.js](https://nodejs.org) 20 or newer.

```bash
npm install
```

```bash
npm run dev
```

Then open http://localhost:5173. Other scripts: `npm test` runs the block tests, and `npm run build` makes the static site in `dist/`.

### Publish on GitHub Pages

The workflow in `.github/workflows/deploy.yml` tests, builds and publishes the site on every push to `main`. Turn it on once: repo **Settings → Pages → Source: GitHub Actions**.

## Tech stack

| Part | Tool | What it does here |
|------|------|-------------------|
| Frontend framework | React + Vite | Screens (pick, draw, play, lessons) and builds to static files |
| Physics engine | Matter.js | Ragdoll joints, collisions, drag-and-fling |
| Block coding | Google Blockly | Scratch-style blocks (Zelos renderer), toolbox categories, workspace save |
| Drawing canvas | HTML5 Canvas API | Limb-by-limb drawing, part stickers, the stage |

## What's in it

- **Pick or draw.** Three premade characters, or "Add new character": a 6-step drawing wizard (head, body, arms, legs). Each step clips your strokes to that part and shows the joints that will bend. You can upload a picture per part, or trace over a photo of a paper drawing. Finished characters are saved under My characters, in this browser only.
- **Backgrounds.** Paper, Park, Space, Ocean or Desert, on the pick screen or above the stage.
- **Code on the left, like Scratch.** The Blockly toolbox and your scripts sit on the left; the stage is on the right. Event blocks (Run, key press, click, touch ground, touch toy) start scripts; action blocks (jump, move, spin, wave, say, spawn, gravity, explode, wait, repeat, forever) run in order.
- **Terminal.** Under the stage, a terminal shows every block next to the JavaScript it becomes, with Spanish function names in ES mode.
- **Lessons.** "How the game works" has 7 cards for elementary and middle schoolers about the HTML, CSS and JavaScript behind the game.
- **Relative sizing.** Columns are fractions of the window, the stage keeps a 16:9 shape, and blocks scale with the code pane, so it works from a big screen down to a phone held sideways.
- **EN / ES toggle.** Every label, block, lesson and terminal name switches together.

## Design

The editable Figma template lives here: https://www.figma.com/design/en67Sfnugtzp8HmcmZMedS

- **Screens:** Pick, Draw, Play, and How the game works (EN and ES), plus narrower tablet and phone copies.
- **Components:** Button, Code Block, Character Card, Background Card, Scene, Tutorial Card, Terminal, Part Chip, Swatch, Text Field, Language Toggle, Speech Bubble, Header.
- **Character Parts:** a 600×600 drawing template whose part frames match `PARTS` and `JOINTS` in `src/character.js`. Draw a character there, export each part as PNG, and upload them in the game.
- **Variables:** light and dark colors that match the CSS tokens at the top of `src/styles.css`, plus a Copy collection with the EN / ES lesson text.

If you change a color, change it in both places.

## Project layout

```
src/
  App.jsx            screens, language, saved characters
  components/        Pick, Draw, Play, Learn, SceneThumb
  i18n.js            all English + Spanish text and lesson cards
  character.js       body parts, joints, premade characters, saving
  scenes.js          the five stage backgrounds
  sim.js             Matter.js physics + canvas drawing
  blocks.js          Blockly blocks, the script runner, terminal lines
  blocks.test.js     tests for the runner and terminal (npm test)
```
