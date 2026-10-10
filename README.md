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
- **Let's play or Tutorial.** Picking or saving a character opens a popup with both choices.
- **Adventure levels.** A Mario-style world map with 6 levels that unlock in order: walk with your arrow-key blocks, grab coins, stomp slimes, bats and a boss (land on their heads), dodge spikes and pits, say the password to open a gate, float on the moon, and touch the flag. You have 3 hearts per try. Progress is saved in this browser. Free play (the sandbox, no monsters) is on the map too.
- **Hands-on HTML tutorial.** 7 steps where students type real HTML, see their page live, and press "Check my code" for ✓/✗ feedback (button, style, width: 100%, onclick, lists, a range slider, the game's canvas).
- **Terminal.** Under the stage, a terminal shows every block next to its code. The JavaScript tab uses the game's short functions (Spanish names in ES mode); the HTML tab shows the same scripts as a real web page with `<canvas>`, `<button>` and `addEventListener`.
- **Relative sizing.** Columns are fractions of the window, the stage keeps a 16:9 shape, and blocks scale with the code pane, so it works from a big screen down to a phone held sideways.
- **EN / ES toggle.** Every label, block, level, tutorial step and terminal name switches together. `npm test` fails if any English text is missing its Spanish version.

## Design

The editable Figma template lives here: https://www.figma.com/design/en67Sfnugtzp8HmcmZMedS

- **Screens:** Pick, the Let's play / Tutorial popup, Draw, World map, Level, Play (free play), the hands-on Tutorial, and How the game works, each in English and Spanish, plus narrower tablet and phone copies.
- **Components:** Button, Code Block, Character Card, Background Card, Scene, Tutorial Card, Terminal, Part Chip, Swatch, Text Field, Language Toggle, Speech Bubble, Header.
- **Character Parts:** a 600×600 drawing template whose part frames match `PARTS` and `JOINTS` in `src/character.js`. Draw a character there, export each part as PNG, and upload them in the game.
- **Variables:** light and dark colors that match the CSS tokens at the top of `src/styles.css`, plus a Copy collection with the EN / ES lesson text.

If you change a color, change it in both places.

The display and button text styles use Puffin Arcade and Circular Std, which are installed on the designer's computer only. Text that was written by tools uses a stand-in font (Baloo 2 or Lexend) and its layer name ends in `· needs <style name>`: search the layers panel for "needs" and reapply the style.

## Project layout

```
src/
  App.jsx            screens, language, saved characters, the Let's play / Tutorial popup, level progress
  components/        Pick, Draw, Map (world map), Play (sandbox + levels), Tutorial, SceneThumb
  i18n.js            all English + Spanish text and lesson cards
  levels.js          the 6 adventure levels (blocks, coins, monsters, spikes, gate, flag)
  tutorial.js        hands-on HTML steps and the checks that grade them
  character.js       body parts, joints, premade characters, saving
  scenes.js          the five stage backgrounds
  sim.js             Matter.js physics + canvas drawing (sandbox and side-scrolling levels)
  blocks.js          Blockly blocks, the script runner, terminal lines (JavaScript and HTML)
  *.test.js          tests: block runner + terminal, HTML checker, English/Spanish coverage (npm test)
```
