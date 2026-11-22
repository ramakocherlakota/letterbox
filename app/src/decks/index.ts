import type { Deck } from "../types";
import { kanji } from "./kanji";
import { kana } from "./kana";
import { telugu } from "./telugu";

export const DECKS: Deck[] = [kanji, kana, telugu];
export const DECK_BY_ID: Record<string, Deck> = Object.fromEntries(DECKS.map(d => [d.id, d]));
