// Browser storage. Everything is wrapped in try/catch: storage can be blocked or empty,
// and the app must still work without it.
import type { DeckProgress, Settings } from "./types";
import { DECKS } from "./decks";

function get<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}
function set(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ }
}

export const DEFAULT_SETTINGS: Settings = {
  deck: "kanji",
  glyphSize: 112,
  textSize: 28,
  jaFont: "klee",
  teFont: "sans",
  roundSize: 10,
  pairs: 4,
  extra: 4,
  alike: true,
  speak: false,
  voices: {},
  speechRate: 0.8,
  decks: Object.fromEntries(DECKS.map(d => [d.id, { sets: d.defaultSets, modes: d.modes.map(m => m.id) }]))
};

/** Settings from the single-file Kanji Shuffle version, before the app became Letterbox. */
interface OldSettings {
  kj?: number; en?: number; font?: Settings["jaFont"]; roundSize?: number; pairs?: number;
  extra?: number; alike?: boolean; speak?: boolean; levels?: string[]; modes?: string[];
}

export function loadSettings(): Settings {
  const saved = get<Partial<Settings> | null>("lb-settings", null);
  const s: Settings = structuredClone(DEFAULT_SETTINGS);
  if (saved) {
    Object.assign(s, saved, { decks: { ...s.decks, ...(saved.decks ?? {}) } });
  } else {
    const old = get<OldSettings | null>("ks-settings", null);
    if (old) {
      if (old.kj) s.glyphSize = old.kj;
      if (old.en) s.textSize = old.en;
      if (old.font) s.jaFont = old.font;
      for (const k of ["roundSize", "pairs", "extra", "alike", "speak"] as const) {
        if (old[k] !== undefined) (s as unknown as Record<string, unknown>)[k] = old[k];
      }
      s.decks.kanji = { sets: old.levels ?? s.decks.kanji.sets, modes: old.modes ?? s.decks.kanji.modes };
    }
  }
  // Drop sets or modes a deck no longer has; never leave a deck with none.
  for (const d of DECKS) {
    const ds = s.decks[d.id] ?? { sets: d.defaultSets, modes: d.modes.map(m => m.id) };
    const sets = ds.sets.filter(x => d.sets.some(y => y.id === x));
    const modes = ds.modes.filter(x => d.modes.some(y => y.id === x));
    s.decks[d.id] = { sets: sets.length ? sets : d.defaultSets, modes: modes.length ? modes : d.modes.map(m => m.id) };
  }
  if (!DECKS.some(d => d.id === s.deck)) s.deck = DECKS[0].id;
  return s;
}
export function saveSettings(s: Settings) { set("lb-settings", s); }

const EMPTY: DeckProgress = { cards: {}, rounds: 0, history: [] };

export function loadProgress(deckId: string): DeckProgress {
  const saved = get<DeckProgress | null>(`lb-progress-${deckId}`, null);
  if (saved) return { ...EMPTY, ...saved };
  if (deckId === "kanji") {
    // Carry over progress from Kanji Shuffle; its cards used the same "mode|kanji" keys.
    const old = get<Partial<DeckProgress> | null>("ks-progress", null);
    if (old) {
      const cards: DeckProgress["cards"] = {};
      for (const [k, v] of Object.entries(old.cards ?? {})) cards[k.includes("|") ? k : `en2kj|${k}`] = v;
      return { cards, rounds: old.rounds ?? 0, history: old.history ?? [] };
    }
  }
  return structuredClone(EMPTY);
}
export function saveProgress(deckId: string, p: DeckProgress) { set(`lb-progress-${deckId}`, p); }

export function loadFlag(key: string, fallback: boolean): boolean { return get(key, fallback); }
export function saveFlag(key: string, v: boolean) { set(key, v); }
