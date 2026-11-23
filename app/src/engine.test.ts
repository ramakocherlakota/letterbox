import { describe, expect, it } from "vitest";
import { DECKS } from "./decks";
import {
  answerRound, buildSimilar, drillMode, emptyBoard, face, fillBoard, itemMap, pickDecoys, pickMode, pickRound, pool
} from "./engine";
import type { DeckProgress } from "./types";

const empty: DeckProgress = { cards: {}, rounds: 0, history: [] };

describe.each(DECKS)("$name deck", deck => {
  const allSets = deck.sets.map(s => s.id);
  const similar = buildSimilar(deck);
  const byId = itemMap(deck);

  it("has unique ids, and every item has every field", () => {
    expect(new Set(deck.items.map(x => x.id)).size).toBe(deck.items.length);
    for (const x of deck.items) for (const f of Object.keys(deck.fields)) expect(face(x, f), `${x.id}.${f}`).not.toBe("");
  });

  it("only names real items in look-alike groups", () => {
    for (const [field, groups] of Object.entries(deck.lookalikes)) {
      const values = new Set(deck.items.map(x => face(x, field)));
      for (const g of groups) {
        const vs = typeof g === "string" ? [...g] : g;
        // Kanji groups may mention kanji outside the deck; the other decks must not.
        if (deck.id !== "kanji") for (const v of vs) expect(values.has(v), `${field}: ${v}`).toBe(true);
      }
    }
  });

  it.each(deck.modes)("plays a full round of $name with exactly one right answer per word", mode => {
    const words = pickRound(deck, allSets, empty, mode.id, 15);
    let round = { num: 1, mode: mode.id, words, queue: words.slice(), cleared: [] as string[], missed: [] as string[], mistakes: 0 };
    let board = emptyBoard;
    ({ round, board } = fillBoard({ deck, mode, similar, round, board, pairs: 5, extra: 6, alike: true, sets: allSets }));
    let guesses = 0;
    while (board.targets.length && guesses < 100) {
      for (const t of board.targets) {
        const matches = board.cOrder.filter(c =>
          face(byId[c], mode.choice) === face(byId[t], mode.choice) || face(byId[c], mode.prompt) === face(byId[t], mode.prompt));
        expect(matches).toEqual([t]);
      }
      const t = board.pOrder[0];
      const ok = guesses % 4 !== 1; // miss now and then
      round = answerRound(round, t, ok);
      board = { ...board, targets: board.targets.filter(x => x !== t) };
      ({ round, board } = fillBoard({ deck, mode, similar, round, board, pairs: 5, extra: 6, alike: true, sets: allSets }));
      guesses++;
    }
    expect(round.queue).toEqual([]);
    expect(new Set(round.cleared)).toEqual(new Set(words));
  });

  it("drills with the character on the right", () => {
    for (const m of deck.modes) expect(deck.fields[drillMode(deck, m.id).choice].kind).toBe("glyph");
  });
});

describe("look-alikes", () => {
  const kanji = DECKS.find(d => d.id === "kanji")!;
  const similar = buildSimilar(kanji);
  it("offers 木 as an extra for 本 in Kanji → Meaning", () => {
    const mode = kanji.modes.find(m => m.id === "kj2en")!;
    for (let i = 0; i < 20; i++) {
      const d = pickDecoys({ deck: kanji, mode, similar, targets: ["本"], n: 1, alike: true, sets: ["N5"] });
      expect(d).toEqual(["木"]);
    }
  });
  it("never puts two same-reading kanji on one board", () => {
    const mode = kanji.modes.find(m => m.id === "kana2kj")!;
    const words = ["医", "意", "以", "員", "院"];
    const round = { num: 1, mode: mode.id, words, queue: words.slice(), cleared: [], missed: [], mistakes: 0 };
    const { board } = fillBoard({ deck: kanji, mode, similar, round, board: emptyBoard, pairs: 5, extra: 4, alike: true, sets: ["N5", "N4"] });
    const readings = board.targets.map(id => kanji.items.find(x => x.id === id)!.values.reading);
    expect(new Set(readings).size).toBe(readings.length);
  });
  it("picks modes without repeating", () => {
    for (let i = 0; i < 50; i++) expect(pickMode(["a", "b", "c"], "a")).not.toBe("a");
    expect(pickMode(["a"], "a")).toBe("a");
  });
  it("keeps decoy-only kanji out of rounds", () => {
    expect(pool(kanji, ["N5", "N4"]).some(x => x.decoyOnly)).toBe(false);
  });
});

describe("study sheet tables", () => {
  for (const deck of DECKS.filter(d => d.chart)) {
    it(`${deck.name}: every cell is a real item and every item has a cell`, () => {
      const ids = new Set(deck.items.map(x => x.id));
      const cells = deck.chart!.groups.flatMap(g => g.rows.flatMap(r => r.cells)).filter((c): c is string => !!c);
      for (const c of cells) expect(ids.has(c), c).toBe(true);
      expect(new Set(cells)).toEqual(new Set(deck.items.filter(x => !x.decoyOnly).map(x => x.id)));
    });
  }
});
