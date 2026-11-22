# Kanji Shuffle

A large-print kanji matching drill. Pick an English word, then the kanji that means it.

- Four modes: Meaning → Kanji, Kanji → Meaning, Kanji → Reading, Reading → Kanji.
- Practice in rounds (5–20 words, shown a few at a time). A missed word comes back later in
  the same round, so a round ends only when every word is matched.
- Each round picks one of the modes ticked in Settings at random (never the same twice in a row); press Start for a new round. As soon as you pick a pair, the next word comes in and the
  choices reshuffle; every answer is listed under the board for the round.
- Extra look-alike kanji (木/本, 人/入, 日/目 …) stop you from answering by elimination.
- Adjustable kanji and word size, three kanji typefaces, light/dark themes, keyboard play
  (number keys pick a word, letter keys pick a kanji), optional spoken readings.
- Missed kanji come back sooner and collect in a "Needs practice" list (saved in your browser).
- 103 JLPT N5 kanji plus 160 JLPT N4 kanji, and 30 extra kanji used only as look-alike distractors.

## Run it

Open `index.html` in a browser. It's a single self-contained file.

`src/app.html` is the source (the page body). After editing it, run `./build.sh` to regenerate `index.html`.

Live version: https://ramakocherlakota.github.io/kanji-app/ (served by GitHub Pages from `main`).
