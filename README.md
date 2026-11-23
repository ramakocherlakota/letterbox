# Letterbox

A large-print drill for learning writing systems: match each character to its meaning or sound.
It started as Kanji Shuffle and now covers:

- **Kanji**: 103 JLPT N5 and 160 JLPT N4 kanji, with meanings and readings, plus 30 extra kanji used
  only as look-alike distractors.
- **Kana**: the 46 basic hiragana and katakana, and the 25 voiced ones (が, ぱ…).
- **Telugu**: the 16 vowels (అచ్చులు).

## How it works

- Press **Start** for a round. Each round picks one of the modes ticked in Settings at random
  (never the same twice in a row), for example Meaning → Kanji or Sound → Letter.
- A round has 5–20 words shown a few at a time. As soon as you pick a pair, the next word comes in
  and the choices reshuffle. A missed word comes back later in the same round.
- Extra choices are look-alikes (木/本, シ/ツ, ఇ/ఈ), so you can't win by elimination. Items that share
  a reading or meaning are never on the board together.
- **Study sheet** (button at the top): every character in the current writing system — the kana table,
  the Telugu vowels with how to say them, or the kanji list. Tap one to see it large, hear it or drill it.
- Every answer is listed under the board. Tap a missed one, or anything under **Needs practice**,
  to **drill** it: five quick questions on that one character, with four look-alike choices.
  A perfect drill takes it off the practice list.
- Large, adjustable character and text sizes; several typefaces; light and dark themes;
  keyboard play (number keys pick on the left, letter keys on the right); optional spoken answers.
- Progress is saved in your browser, separately for each writing system.

## Development

The app is React + TypeScript, built with Vite into one self-contained `index.html` at the
repository root, which GitHub Pages serves.

```sh
npm install
npm run dev     # local server with hot reload
npm test        # game-logic tests
npm run build   # type-check, then write index.html (and artifact/letterbox.html)
```

- `app/src/decks/`: one file per writing system. To add one, describe its fields, modes, sets,
  items and look-alike groups, then list it in `app/src/decks/index.ts`.
- `app/src/engine.ts`: rounds, extras, look-alikes and spaced repetition, with no React.
- `app/src/App.tsx` and `app/src/components/`: the screens.

Commit the rebuilt `index.html` along with source changes so the live site updates.

Live version: https://ramakocherlakota.github.io/letterbox/ (the old address, ramakocherlakota.github.io/kanji-app/, redirects here).
