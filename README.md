# Draw, Code and Play with Juego Labs!

- A video-game playground where kids draw their own character, bring it to life with code blocks, and play through levels full of monsters.
- Made for elementary and middle school students (about ages 7–14), in **English and Spanish**.
- A great fit for classrooms, coding clubs and home: no account, no install, works on laptops, tablets and phones.

**[▶ Play Juego Labs now](https://gisellegat.github.io/Juego-Labs/)** · [Run it on your own computer](#run-it-yourself)

![Playing a level on the Game Boy, with code blocks on the left](docs/screens/level.png)

## How Juego Labs Works

- **Make your hero.** Pick a robot, cat or astronaut, or draw your own one body part at a time. The game turns your drawing into a puppet that walks, jumps and waves, and always stays on its feet.
- **Snap code blocks.** Like Scratch: "when space is pressed → jump 12". A terminal under the screen shows each block as real JavaScript or as a real HTML page.
- **Learn on a Game Boy.** "Let's play" puts the 7 How-it-works cards next to the Game Boy. Each card asks for one thing (press Run, jump, switch the terminal to HTML…), checks that you did it, and moves on.
- **Play on a Game Boy.** The game lives inside a Game Boy with a touch D-pad and A/B buttons. Tap ⛶ to pop it full screen on a tablet or phone; tap ✕ to go back.

![Game Boy in full screen on a phone held sideways](docs/screens/fullscreen-phone-landscape.png)

## Level Up as You Learn

- **Then face the monsters.** After the last card, 6 Mario-style levels test what you learned: grab coins, stomp slimes, bats and a boss, and open a password gate with code.
- **Levels unlock one by one**, and your stars stay saved in your browser.
- **Tutorial** plays the same cards one by one, like a slideshow. At the end, **Write real HTML** opens 7 hands-on steps: type HTML, watch your page appear, and press "Check my code" for ✓ and ✗ feedback.

![World map with cleared, open and locked levels](docs/screens/map.png)
![Tutorial cards](docs/screens/tutorial-cards.png)
![Hands-on HTML tutorial with live preview and checker](docs/screens/tutorial.png)

## Who It's For

- **Teachers and schools** — a free, bilingual intro to HTML, CSS and JavaScript that runs in any browser, with no logins to manage.
- **Students** — make a character that's truly yours, learn how real code works, and beat every level.

**[▶ Play Juego Labs now](https://gisellegat.github.io/Juego-Labs/)** · [Run it on your own computer](#run-it-yourself)

---

## Demo video

▶ **Demo video:** _add the video link here (YouTube, Loom or a file in this repo)_

## For Hacklanta judges

- **Live demo:** https://gisellegat.github.io/Juego-Labs/
- **Skip ahead:** open https://gisellegat.github.io/Juego-Labs/#unlock to unlock all 6 levels without beating them first (reload after typing it).
- **No test credentials needed.** There are no accounts, logins or API keys. Everything runs in the browser, and saved characters and progress stay in that browser only.
- **Quick tour (2 minutes):**
  1. Click a character. In the popup, choose **Let's play!**
  2. Follow the 7 cards beside the Game Boy: press ▶ Run, pick a background, tap ⛶ (✕ or Esc exits), jump with space or **A**, switch the terminal to **HTML**, change the jump block from 12 to 20, and drag your buddy.
  3. Click **Face the monsters →** and play **Grassy Start**: arrow keys or the D-pad to walk, space or **A** to jump, **B** to wave.
  4. Back on the map, click **Tutorial** to watch the cards cycle, then **Write real HTML →**: type `<button>Run</button>` and press **Check my code**.
  5. Press **ES** at the top right: everything switches to Spanish.
- **Level 3 password:** use a "say" block with the word `open` (or `abre`) next to the gate.

## Run it yourself

You need [Node.js](https://nodejs.org) 20 or newer.

```bash
npm install
```

```bash
npm run dev
```

Then open http://localhost:5173. Other commands: `npm test` runs the automated tests, and `npm run build` makes the website in `dist/`.

Every push to `main` is tested, built and published to GitHub Pages by `.github/workflows/deploy.yml`.

## Technologies, APIs, datasets and tools

| Part | What we used |
|------|--------------|
| Frontend | React 19 + Vite |
| Physics | Matter.js (collisions, drag-and-fling; the character is one rigid, always-upright body) |
| Block coding | Google Blockly (Scratch-style "Zelos" blocks) |
| Drawing and game rendering | HTML5 Canvas API |
| Dialogs | base-ui (accessible popups: focus trapping, Esc, focus return) |
| Toasts | Sonner |
| HTML checker | The browser's built-in DOMParser; jsdom for the automated tests |
| Fonts | Google Fonts (Baloo 2, Lexend) |
| Hosting | GitHub Pages + GitHub Actions |
| Design | Figma ([design file](https://www.figma.com/design/en67Sfnugtzp8HmcmZMedS)) |
| AI assistance | Claude Code (Anthropic) helped write code, tests and design files |

- **APIs:** no outside web APIs. Only browser features (Canvas, DOMParser, localStorage).
- **Datasets:** none. All levels, lessons and text were written for this project.
- **Sponsor tools:** _list any Hacklanta sponsor tools you used here._

## What was made before Hacklanta

- **Code:** none. All the code in this repo was written during Hacklanta; the full history is in the commits.
- **Open-source libraries** (React, Vite, Matter.js, Blockly) were made by others and are used under their open-source licenses.
- **Planning:** _note any ideas, sketches or designs made before the event here._

## Project layout

```
src/
  App.jsx            screens, language, saved characters, the Let's play / Tutorial popup, level progress
  components/        Pick, Draw, Map, Play (Game Boy, guided cards, levels, terminal), Cards (cycling tutorial), LessonCard, Tutorial (write HTML), SceneThumb
  i18n.js            all English + Spanish text and lesson cards
  levels.js          the 6 adventure levels (blocks, coins, monsters, spikes, gate, flag)
  tutorial.js        hands-on HTML steps and the checks that grade them
  character.js       body parts, joints, premade characters, saving
  scenes.js          the five stage backgrounds
  sim.js             Matter.js physics + canvas drawing (free play and side-scrolling levels)
  blocks.js          Blockly blocks, the script runner, terminal lines (JavaScript and HTML)
  *.test.js          tests: block runner + terminal, HTML checker, English/Spanish coverage
docs/screens/        screenshots used in this README
```

## Design notes

The Figma file has every screen in English and Spanish (an "Español (ES)" group), plus components and a 600×600 character-drawing template whose part frames match `PARTS` and `JOINTS` in `src/character.js`. Colors in Figma match the CSS tokens at the top of `src/styles.css`.

The display and button text styles use Puffin Arcade and Circular Std, which are installed on the designer's computer only. Text written by tools uses a stand-in font (Baloo 2 or Lexend), and its layer name ends in `· needs <style name>`: search the layers panel for "needs" and reapply the style.
