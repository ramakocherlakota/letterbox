// A deck is one writing system (kanji, kana, Telugu...). Each item has a value for every
// field, and a mode says which field is shown on the left (prompt) and which on the right (choices).

export type FieldKind = "glyph" | "text" | "reading";

export interface Field {
  label: string;
  kind: FieldKind;
}

export interface Mode {
  id: string;
  name: string;
  prompt: string; // field id
  choice: string; // field id
}

export interface Item {
  id: string;
  set: string;
  values: Record<string, string>;
  /** Only ever offered as an extra choice, never asked. */
  decoyOnly?: boolean;
  /** What to say aloud for this item. */
  speak?: string;
  /** Extra help shown with the answer, e.g. a pronunciation hint. */
  hint?: string;
}

export interface Description {
  big: string;
  title: string;
  sub?: string;
}

export interface Deck {
  id: string;
  name: string;
  /** The deck's name in its own script, shown next to the English name. */
  native: string;
  /** BCP 47 language for glyphs and readings ("ja", "te"). */
  lang: string;
  fields: Record<string, Field>;
  modes: Mode[];
  sets: { id: string; name: string }[];
  defaultSets: string[];
  items: Item[];
  /** Per field: groups of values that look alike. Smaller groups are closer matches.
   *  A string group is split into single characters; use an array for multi-character values. */
  lookalikes: Record<string, (string | string[])[]>;
  describe: (item: Item) => Description;
  /** Optional table layout for the study sheet (e.g. the kana table). Cells are item ids. */
  chart?: {
    main: string;    // field shown large in each cell
    second?: string; // field shown smaller beside it
    label: string;   // field shown underneath
    columns: string[];
    groups: { title: string; rows: { label: string; cells: (string | null)[] }[] }[];
  };
}

/** Leitner-style record for one item in one mode. Box 0 = just missed, 5 = well known. */
export interface CardStat {
  box: number;
  right: number;
  wrong: number;
}

export interface RoundResult {
  n: number;
  mode: string;
  right: number;
  total: number;
}

export interface DeckProgress {
  cards: Record<string, CardStat>; // key: `${modeId}|${itemId}`
  rounds: number;
  history: RoundResult[];
}

export interface DeckSettings {
  sets: string[];
  modes: string[];
}

export interface Settings {
  deck: string;
  glyphSize: number;
  textSize: number;
  jaFont: "klee" | "sans" | "serif";
  teFont: "sans" | "serif";
  roundSize: number;
  pairs: number;
  extra: number;
  alike: boolean;
  speak: boolean;
  decks: Record<string, DeckSettings>;
}
