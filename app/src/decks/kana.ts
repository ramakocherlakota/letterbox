import type { Deck, Item } from "../types";

// hiragana | katakana | sound (romaji) | set
const RAW = `
あ|ア|a|basic
い|イ|i|basic
う|ウ|u|basic
え|エ|e|basic
お|オ|o|basic
か|カ|ka|basic
き|キ|ki|basic
く|ク|ku|basic
け|ケ|ke|basic
こ|コ|ko|basic
さ|サ|sa|basic
し|シ|shi|basic
す|ス|su|basic
せ|セ|se|basic
そ|ソ|so|basic
た|タ|ta|basic
ち|チ|chi|basic
つ|ツ|tsu|basic
て|テ|te|basic
と|ト|to|basic
な|ナ|na|basic
に|ニ|ni|basic
ぬ|ヌ|nu|basic
ね|ネ|ne|basic
の|ノ|no|basic
は|ハ|ha|basic
ひ|ヒ|hi|basic
ふ|フ|fu|basic
へ|ヘ|he|basic
ほ|ホ|ho|basic
ま|マ|ma|basic
み|ミ|mi|basic
む|ム|mu|basic
め|メ|me|basic
も|モ|mo|basic
や|ヤ|ya|basic
ゆ|ユ|yu|basic
よ|ヨ|yo|basic
ら|ラ|ra|basic
り|リ|ri|basic
る|ル|ru|basic
れ|レ|re|basic
ろ|ロ|ro|basic
わ|ワ|wa|basic
を|ヲ|wo|basic
ん|ン|n|basic
が|ガ|ga|voiced
ぎ|ギ|gi|voiced
ぐ|グ|gu|voiced
げ|ゲ|ge|voiced
ご|ゴ|go|voiced
ざ|ザ|za|voiced
じ|ジ|ji|voiced
ず|ズ|zu|voiced
ぜ|ゼ|ze|voiced
ぞ|ゾ|zo|voiced
だ|ダ|da|voiced
ぢ|ヂ|ji (di)|voiced
づ|ヅ|zu (du)|voiced
で|デ|de|voiced
ど|ド|do|voiced
ば|バ|ba|voiced
び|ビ|bi|voiced
ぶ|ブ|bu|voiced
べ|ベ|be|voiced
ぼ|ボ|bo|voiced
ぱ|パ|pa|voiced
ぴ|ピ|pi|voiced
ぷ|プ|pu|voiced
ぺ|ペ|pe|voiced
ぽ|ポ|po|voiced
`;

const items: Item[] = RAW.trim().split("\n").map(line => {
  const [hira, kata, sound, set] = line.split("|");
  return { id: hira, set, values: { hira, kata, sound }, speak: hira };
});

export const kana: Deck = {
  id: "kana",
  name: "Kana",
  native: "かな",
  lang: "ja",
  fields: {
    sound: { label: "Sound", kind: "text" },
    hira: { label: "Hiragana", kind: "glyph" },
    kata: { label: "Katakana", kind: "glyph" }
  },
  modes: [
    { id: "s2h", name: "Sound → Hiragana", prompt: "sound", choice: "hira" },
    { id: "h2s", name: "Hiragana → Sound", prompt: "hira", choice: "sound" },
    { id: "s2k", name: "Sound → Katakana", prompt: "sound", choice: "kata" },
    { id: "k2s", name: "Katakana → Sound", prompt: "kata", choice: "sound" },
    { id: "h2k", name: "Hiragana → Katakana", prompt: "hira", choice: "kata" },
    { id: "k2h", name: "Katakana → Hiragana", prompt: "kata", choice: "hira" }
  ],
  sets: [
    { id: "basic", name: "Basic kana" },
    { id: "voiced", name: "With ゛ and ゜ (が, ぱ…)" }
  ],
  defaultSets: ["basic"],
  items,
  lookalikes: {
    hira: [
      "あお", "ぬめ", "ねれ", "れわ", "ねわ", "るろ", "いり", "さき", "さち", "ちら", "はほ", "はけ",
      "ほま", "くへ", "こい", "しつ", "うら", "ゆよ", "たな", "ぬね", "めあ", "そて", "もし", "ばぱ",
      "びぴ", "ぶぷ", "べぺ", "ぼぽ", "じぢ", "ずづ", "かが", "さざ", "ただ",
      "あおめぬ", "ねれわ", "るろら", "さきち", "はほけま", "いりこ", "うらつ", "ぬめね"
    ],
    kata: [
      "シツ", "ソン", "ンノ", "ソリ", "クケ", "クタ", "ワウ", "ウフ", "フラ", "スヌ", "スフ", "チテ",
      "ナメ", "ユコ", "ヨユ", "コロ", "アマ", "マム", "セヤ", "エユ", "ニコ", "ルレ", "ノメ", "ヒセ",
      "ヤマ", "サセ", "ヲフ", "ハヘ", "バパ", "ビピ", "ブプ", "ベペ", "ボポ", "ジヂ", "ズヅ",
      "シツソンノ", "クケタワウフ", "ラフヲウ", "スヌフ", "チテナ", "コユヨロ", "アマヤム", "エユニ"
    ]
  },
  chart: {
    main: "hira",
    second: "kata",
    label: "sound",
    columns: ["a", "i", "u", "e", "o"],
    groups: [
      {
        title: "Basic kana (hiragana and katakana)",
        rows: [
          { label: "", cells: ["あ", "い", "う", "え", "お"] },
          { label: "k", cells: ["か", "き", "く", "け", "こ"] },
          { label: "s", cells: ["さ", "し", "す", "せ", "そ"] },
          { label: "t", cells: ["た", "ち", "つ", "て", "と"] },
          { label: "n", cells: ["な", "に", "ぬ", "ね", "の"] },
          { label: "h", cells: ["は", "ひ", "ふ", "へ", "ほ"] },
          { label: "m", cells: ["ま", "み", "む", "め", "も"] },
          { label: "y", cells: ["や", null, "ゆ", null, "よ"] },
          { label: "r", cells: ["ら", "り", "る", "れ", "ろ"] },
          { label: "w", cells: ["わ", null, null, null, "を"] },
          { label: "n", cells: ["ん", null, null, null, null] }
        ]
      },
      {
        title: "With ゛ and ゜ (voiced)",
        rows: [
          { label: "g", cells: ["が", "ぎ", "ぐ", "げ", "ご"] },
          { label: "z", cells: ["ざ", "じ", "ず", "ぜ", "ぞ"] },
          { label: "d", cells: ["だ", "ぢ", "づ", "で", "ど"] },
          { label: "b", cells: ["ば", "び", "ぶ", "べ", "ぼ"] },
          { label: "p", cells: ["ぱ", "ぴ", "ぷ", "ぺ", "ぽ"] }
        ]
      }
    ]
  },
  describe: x => ({ big: x.values.hira, title: `${x.values.hira} ${x.values.kata}`, sub: `sounds like “${x.values.sound}”` })
};
