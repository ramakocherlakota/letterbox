// Game rules, independent of React. Every function here is pure apart from using `rng`.
import type { CardStat, Deck, DeckProgress, Item, Mode } from "./types";

export type Rng = () => number;

export function shuffle<T>(a: readonly T[], rng: Rng = Math.random): T[] {
  const out = a.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Shuffle, trying a few times to get an order different from `prev`. */
export function shuffleDifferent<T>(a: readonly T[], prev: readonly T[], rng: Rng = Math.random): T[] {
  if (a.length < 2) return a.slice();
  let out = shuffle(a, rng);
  for (let i = 0; i < 6 && out.join() === prev.join(); i++) out = shuffle(a, rng);
  return out;
}

export function itemMap(deck: Deck): Record<string, Item> {
  return Object.fromEntries(deck.items.map(x => [x.id, x]));
}

export function face(item: Item, field: string): string {
  return item.values[field] ?? "";
}

/** Items that can be asked, given the chosen sets. */
export function pool(deck: Deck, sets: string[]): Item[] {
  return deck.items.filter(x => !x.decoyOnly && sets.includes(x.set));
}

// ---- Look-alikes ----

export type Similar = Record<string, Record<string, Record<string, number>>>; // field -> id -> other id -> closeness

/** For each field with look-alike groups: item id -> look-alike item id -> closeness (group size; smaller is closer). */
export function buildSimilar(deck: Deck): Similar {
  const out: Similar = {};
  for (const [field, groups] of Object.entries(deck.lookalikes)) {
    const byValue: Record<string, string> = {};
    for (const x of deck.items) byValue[face(x, field)] = x.id;
    const map: Record<string, Record<string, number>> = {};
    for (const g of groups) {
      const values = typeof g === "string" ? [...g] : g;
      const ids = values.map(v => byValue[v]).filter(Boolean);
      for (const a of ids) for (const b of ids) {
        if (a === b) continue;
        const m = (map[a] ??= {});
        m[b] = Math.min(m[b] ?? 99, ids.length);
      }
    }
    out[field] = map;
  }
  return out;
}

/** The field whose shape matters for look-alikes in this mode: the glyph side. */
export function lookalikeField(deck: Deck, mode: Mode): string | null {
  if (deck.fields[mode.choice]?.kind === "glyph") return mode.choice;
  if (deck.fields[mode.prompt]?.kind === "glyph") return mode.prompt;
  return null;
}

// ---- Spaced repetition ----

export const WEIGHTS = [9, 5, 3, 2, 1.2, 0.6]; // by box; box 0 = recently missed

export function cardKey(modeId: string, itemId: string) {
  return `${modeId}|${itemId}`;
}

export function box(progress: DeckProgress, modeId: string, itemId: string): number {
  return progress.cards[cardKey(modeId, itemId)]?.box ?? 1;
}

export function recordAnswer(progress: DeckProgress, modeId: string, itemId: string, ok: boolean): DeckProgress {
  const key = cardKey(modeId, itemId);
  const c: CardStat = { ...(progress.cards[key] ?? { box: 1, right: 0, wrong: 0 }) };
  if (ok) { c.box = Math.min(5, c.box + 1); c.right++; } else { c.box = 0; c.wrong++; }
  return { ...progress, cards: { ...progress.cards, [key]: c } };
}

/** Choose a round's words: weighted toward items you miss, without repeats. */
export function pickRound(deck: Deck, sets: string[], progress: DeckProgress, modeId: string, n: number, rng: Rng = Math.random): string[] {
  let cands = pool(deck, sets);
  const out: string[] = [];
  while (out.length < n && cands.length) {
    const w = (x: Item) => WEIGHTS[box(progress, modeId, x.id)];
    const total = cands.reduce((s, x) => s + w(x), 0);
    let r = rng() * total;
    let chosen = cands[cands.length - 1];
    for (const x of cands) { r -= w(x); if (r <= 0) { chosen = x; break; } }
    out.push(chosen.id);
    cands = cands.filter(x => x !== chosen);
  }
  return out;
}

// ---- Extras (decoys) ----

export interface DecoyArgs {
  deck: Deck;
  mode: Mode;
  similar: Similar;
  targets: string[];
  n: number;
  alike: boolean;
  sets: string[];
  rng?: Rng;
}

/**
 * Pick `n` extra choices. With `alike`, each target gets its closest look-alike before any
 * target gets a second. An extra never shares a prompt or choice value with a target, so every
 * prompt has exactly one right answer.
 */
export function pickDecoys({ deck, mode, similar, targets, n, alike, sets, rng = Math.random }: DecoyArgs): string[] {
  const byId = itemMap(deck);
  const faces = (id: string) => [face(byId[id], mode.prompt), face(byId[id], mode.choice)];
  const exclude = new Set(targets);
  const taken = new Set(targets.flatMap(faces));
  const ok = (id: string) => !exclude.has(id) && !faces(id).some(f => taken.has(f));
  const out: string[] = [];
  const add = (id: string) => { out.push(id); exclude.add(id); faces(id).forEach(f => taken.add(f)); };

  const field = lookalikeField(deck, mode);
  if (alike && field && similar[field]) {
    const inPool = new Set(pool(deck, sets).map(x => x.id));
    const lists = shuffle(targets, rng).map(t => {
      const sim = similar[field][t] ?? {};
      return shuffle(Object.keys(sim), rng).sort((a, b) => (sim[a] - sim[b]) || (Number(inPool.has(b)) - Number(inPool.has(a))));
    });
    let added = true;
    while (out.length < n && added) {
      added = false;
      for (const l of lists) {
        while (l.length && !ok(l[0])) l.shift();
        if (l.length && out.length < n) { add(l.shift()!); added = true; }
      }
    }
  }
  for (const x of shuffle(pool(deck, sets), rng)) {
    if (out.length >= n) break;
    if (ok(x.id)) add(x.id);
  }
  return out;
}

// ---- Rounds and the board ----

export interface Round {
  num: number;
  mode: string;
  words: string[];
  queue: string[];
  cleared: string[];
  missed: string[];
  mistakes: number;
}

export interface Board {
  targets: string[];
  decoys: string[];
  pOrder: string[]; // left column, stable order
  cOrder: string[]; // right column, reshuffled every time
}

export const emptyBoard: Board = { targets: [], decoys: [], pOrder: [], cOrder: [] };

export interface FillArgs {
  deck: Deck;
  mode: Mode;
  similar: Similar;
  round: Round;
  board: Board;
  pairs: number;
  extra: number;
  alike: boolean;
  sets: string[];
  rng?: Rng;
}

/**
 * Top the board up to `pairs` words from the round's queue, pick fresh extras and reshuffle the
 * choices. Words that would share a value with one already on the board wait in the queue.
 */
export function fillBoard({ deck, mode, similar, round, board, pairs, extra, alike, sets, rng = Math.random }: FillArgs): { round: Round; board: Board } {
  const byId = itemMap(deck);
  const faces = (id: string) => [face(byId[id], mode.prompt), face(byId[id], mode.choice)];
  const queue = round.queue.slice();
  const targets = board.targets.slice();
  for (let i = 0; targets.length < pairs && i < queue.length; ) {
    const id = queue[i];
    const used = new Set(targets.flatMap(faces));
    if (targets.includes(id) || faces(id).some(f => used.has(f))) { i++; continue; }
    targets.push(id);
    queue.splice(i, 1);
  }
  const decoys = pickDecoys({ deck, mode, similar, targets, n: extra, alike, sets, rng });
  // The left column keeps its order: a new word takes the answered word's slot.
  const fresh = targets.filter(id => !board.pOrder.includes(id));
  const pOrder = board.pOrder
    .map(id => (targets.includes(id) ? id : fresh.shift() ?? null))
    .filter((id): id is string => id !== null);
  pOrder.push(...fresh);
  const cOrder = shuffleDifferent([...targets, ...decoys], board.cOrder, rng);
  return { round: { ...round, queue }, board: { targets, decoys, pOrder, cOrder } };
}

/** Apply a guess to the round: a miss goes to the back of the queue. */
export function answerRound(round: Round, target: string, ok: boolean): Round {
  return ok
    ? { ...round, cleared: [...round.cleared, target] }
    : {
        ...round,
        missed: round.missed.includes(target) ? round.missed : [...round.missed, target],
        mistakes: round.mistakes + 1,
        queue: [...round.queue, target]
      };
}

/** Pick a mode at random from the allowed ones, avoiding `last` when there is a choice. */
export function pickMode(allowed: string[], last: string | undefined, rng: Rng = Math.random): string {
  const others = allowed.length > 1 ? allowed.filter(m => m !== last) : allowed;
  return others[Math.floor(rng() * others.length)];
}

// ---- Drill ----

/** A drill always shows the clue and asks for the character: glyph on the right. */
export function drillMode(deck: Deck, modeId: string): Mode {
  const m = deck.modes.find(x => x.id === modeId) ?? deck.modes[0];
  if (deck.fields[m.choice]?.kind === "glyph") return m;
  const flipped = deck.modes.find(x => x.prompt === m.choice && x.choice === m.prompt);
  return flipped ?? { id: m.id, name: m.name, prompt: m.choice, choice: m.prompt };
}

/** Items that need practice: missed at least once and not yet relearned (box 0 or 1). */
export function needsPractice(deck: Deck, progress: DeckProgress): { id: string; wrong: number; mode: string }[] {
  const byId = itemMap(deck);
  const agg: Record<string, { wrong: number; mode: string; worst: number }> = {};
  for (const [key, c] of Object.entries(progress.cards)) {
    const [mode, id] = key.split("|");
    if (!byId[id] || !c.wrong || c.box > 1) continue;
    const a = (agg[id] ??= { wrong: 0, mode, worst: -1 });
    a.wrong += c.wrong;
    if (c.wrong > a.worst) { a.worst = c.wrong; a.mode = mode; }
  }
  return Object.entries(agg)
    .map(([id, a]) => ({ id, wrong: a.wrong, mode: a.mode }))
    .sort((a, b) => b.wrong - a.wrong);
}
