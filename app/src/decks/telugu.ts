import type { Deck, Item } from "../types";

// letter | sound | how to say it | set
// Vowels (అచ్చులు) as usually taught today; the rare ఌ and ౡ are left out.
const RAW = `
అ|a|a as in “about”|vowels
ఆ|ā (aa)|a as in “father”|vowels
ఇ|i|i as in “sit”|vowels
ఈ|ī (ee)|ee as in “see”|vowels
ఉ|u|u as in “put”|vowels
ఊ|ū (oo)|oo as in “food”|vowels
ఋ|ṛ (ru)|said “ru”, as in “rhythm” said quickly|vowels
ౠ|ṝ (rū)|a long “roo”|vowels
ఎ|e|e as in “bet”|vowels
ఏ|ē (ay)|a long e, like “ay” in “day”|vowels
ఐ|ai|ai as in “aisle”|vowels
ఒ|o|a short o, as in “obey”|vowels
ఓ|ō (oh)|o as in “go”|vowels
ఔ|au (ow)|ow as in “cow”|vowels
అం|aṁ (am)|a followed by a nasal “m” (anusvāram)|vowels
అః|aḥ (ah)|a followed by a breathy “h” (visargam)|vowels
`;

const items: Item[] = RAW.trim().split("\n").map(line => {
  const [letter, sound, hint, set] = line.split("|");
  return { id: letter, set, values: { letter, sound }, hint, speak: letter };
});

export const telugu: Deck = {
  id: "telugu",
  name: "Telugu",
  native: "తెలుగు",
  lang: "te",
  fields: {
    sound: { label: "Sound", kind: "text" },
    letter: { label: "Letter", kind: "glyph" }
  },
  modes: [
    { id: "s2l", name: "Sound → Letter", prompt: "sound", choice: "letter" },
    { id: "l2s", name: "Letter → Sound", prompt: "letter", choice: "sound" }
  ],
  sets: [{ id: "vowels", name: "Vowels (అచ్చులు)" }],
  defaultSets: ["vowels"],
  items,
  lookalikes: {
    // Arrays, because అం and అః are two characters each.
    letter: [
      ["ఇ", "ఈ"], ["ఉ", "ఊ"], ["ఋ", "ౠ"], ["ఎ", "ఏ"], ["ఒ", "ఓ"], ["ఓ", "ఔ"], ["అ", "ఆ"], ["ఏ", "ఐ"],
      ["అం", "అః"], ["ఎ", "ఏ", "ఐ"], ["ఒ", "ఓ", "ఔ"], ["అ", "ఆ", "అం", "అః"], ["ఉ", "ఊ", "ఋ", "ౠ"]
    ]
  },
  describe: x => ({ big: x.values.letter, title: `sounds like “${x.values.sound}”`, sub: x.hint })
};
