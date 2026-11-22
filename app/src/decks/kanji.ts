import type { Deck, Item } from "../types";

// kanji | meaning | on'yomi (katakana) | kun'yomi (hiragana) | set
// Sets N5 and N4 are practised. Set X kanji only ever appear as look-alike extras.
const RAW = `
一|one|イチ|ひと|N5
二|two|ニ|ふた|N5
三|three|サン|みっ|N5
四|four|シ|よん・よ|N5
五|five|ゴ|いつ|N5
六|six|ロク|むっ|N5
七|seven|シチ|なな|N5
八|eight|ハチ|やっ|N5
九|nine|キュウ・ク|ここの|N5
十|ten|ジュウ|とお|N5
百|hundred|ヒャク||N5
千|thousand|セン|ち|N5
万|ten thousand|マン・バン||N5
円|yen; circle|エン|まる|N5
日|day; sun|ニチ・ジツ|ひ・か|N5
月|month; moon|ゲツ・ガツ|つき|N5
火|fire|カ|ひ|N5
水|water|スイ|みず|N5
木|tree; wood|モク・ボク|き|N5
金|gold; money|キン|かね|N5
土|soil; earth|ド・ト|つち|N5
曜|day of the week|ヨウ||N5
本|book; origin|ホン|もと|N5
人|person|ジン・ニン|ひと|N5
今|now|コン|いま|N5
年|year|ネン|とし|N5
時|time; hour|ジ|とき|N5
分|minute; to divide|ブン・フン|わ|N5
半|half|ハン|なか|N5
午|noon|ゴ||N5
前|before; front|ゼン|まえ|N5
後|after; behind|ゴ・コウ|あと・うし|N5
上|up; above|ジョウ|うえ・あ|N5
下|down; below|カ・ゲ|した・さ|N5
左|left|サ|ひだり|N5
右|right (side)|ウ・ユウ|みぎ|N5
中|middle; inside|チュウ|なか|N5
外|outside|ガイ・ゲ|そと|N5
東|east|トウ|ひがし|N5
西|west|セイ・サイ|にし|N5
南|south|ナン|みなみ|N5
北|north|ホク|きた|N5
山|mountain|サン|やま|N5
川|river|セン|かわ|N5
天|heaven|テン|あめ|N5
気|spirit; energy|キ||N5
雨|rain|ウ|あめ|N5
電|electricity|デン||N5
車|car; vehicle|シャ|くるま|N5
駅|train station|エキ||N5
道|road; way|ドウ|みち|N5
国|country|コク|くに|N5
校|school|コウ||N5
学|study; learning|ガク|まな|N5
生|life; birth|セイ・ショウ|い・う|N5
先|ahead; previous|セン|さき|N5
大|big|ダイ・タイ|おお|N5
小|small|ショウ|ちい・こ|N5
高|tall; expensive|コウ|たか|N5
安|cheap; calm|アン|やす|N5
長|long; chief|チョウ|なが|N5
新|new|シン|あたら|N5
古|old|コ|ふる|N5
白|white|ハク|しろ|N5
父|father|フ|ちち|N5
母|mother|ボ|はは|N5
子|child|シ・ス|こ|N5
女|woman|ジョ・ニョ|おんな|N5
男|man|ダン・ナン|おとこ|N5
友|friend|ユウ|とも|N5
名|name|メイ・ミョウ|な|N5
口|mouth|コウ・ク|くち|N5
目|eye|モク|め|N5
耳|ear|ジ|みみ|N5
手|hand|シュ|て|N5
足|foot; leg|ソク|あし|N5
見|to see|ケン|み|N5
聞|to hear|ブン・モン|き|N5
言|to say|ゲン・ゴン|い|N5
話|to talk|ワ|はな|N5
語|language; word|ゴ|かた|N5
読|to read|ドク|よ|N5
書|to write|ショ|か|N5
食|to eat|ショク|た|N5
飲|to drink|イン|の|N5
行|to go|コウ・ギョウ|い・おこな|N5
来|to come|ライ|く|N5
出|to exit|シュツ|で・だ|N5
入|to enter|ニュウ|はい・い|N5
休|to rest|キュウ|やす|N5
立|to stand|リツ|た|N5
会|to meet|カイ|あ|N5
買|to buy|バイ|か|N5
何|what|カ|なに・なん|N5
毎|every|マイ||N5
週|week|シュウ||N5
店|shop|テン|みせ|N5
花|flower|カ|はな|N5
魚|fish|ギョ|さかな|N5
犬|dog|ケン|いぬ|N5
空|sky; empty|クウ|そら|N5
春|spring (season)|シュン|はる|N4
夏|summer|カ|なつ|N4
秋|autumn|シュウ|あき|N4
冬|winter|トウ|ふゆ|N4
朝|morning|チョウ|あさ|N4
昼|daytime|チュウ|ひる|N4
夜|night|ヤ|よる|N4
夕|evening|セキ|ゆう|N4
青|blue|セイ|あお|N4
赤|red|セキ|あか|N4
黒|black|コク|くろ|N4
色|colour|ショク|いろ|N4
肉|meat|ニク||N4
茶|tea|チャ・サ||N4
牛|cow|ギュウ|うし|N4
鳥|bird|チョウ|とり|N4
海|sea|カイ|うみ|N4
家|house; home|カ|いえ|N4
町|town|チョウ|まち|N4
村|village|ソン|むら|N4
田|rice field|デン|た|N4
石|stone|セキ|いし|N4
力|power|リョク|ちから|N4
体|body|タイ|からだ|N4
心|heart; mind|シン|こころ|N4
顔|face|ガン|かお|N4
音|sound|オン|おと|N4
楽|fun; music|ガク・ラク|たの|N4
歌|song|カ|うた|N4
画|picture|ガ||N4
走|to run|ソウ|はし|N4
歩|to walk|ホ|ある|N4
知|to know|チ|し|N4
思|to think|シ|おも|N4
待|to wait|タイ|ま|N4
持|to hold|ジ|も|N4
使|to use|シ|つか|N4
作|to make|サク|つく|N4
早|early|ソウ|はや|N4
近|near|キン|ちか|N4
遠|far|エン|とお|N4
重|heavy|ジュウ|おも|N4
軽|light (not heavy)|ケイ|かる|N4
明|bright|メイ|あか|N4
暗|dark|アン|くら|N4
病|illness|ビョウ|やまい|N4
医|doctor; medical|イ||N4
薬|medicine|ヤク|くすり|N4
写|to copy; photo|シャ|うつ|N4
真|true|シン|ま|N4
売|to sell|バイ|う|N4
勉|effort|ベン||N4
強|strong|キョウ|つよ|N4
弱|weak|ジャク|よわ|N4
広|wide|コウ|ひろ|N4
答|answer|トウ|こた|N4
間|interval; between|カン・ケン|あいだ・ま|N5
開|to open|カイ|ひら・あ|N4
問|question|モン|と|N4
自|self|ジ・シ|みずか|N4
主|master; main|シュ|ぬし・おも|N4
住|to live (reside)|ジュウ|す|N4
特|special|トク||N4
字|character; letter|ジ|あざ|N4
方|direction; side|ホウ|かた|N4
門|gate|モン|かど|X
閉|to close|ヘイ|し・と|X
夫|husband|フ|おっと|X
士|samurai; scholar|シ||X
太|fat; thick|タイ・タ|ふと|X
島|island|トウ|しま|X
末|tip; end of|マツ|すえ|X
未|not yet|ミ||X
矢|arrow|シ|や|X
失|to lose|シツ|うしな|X
刀|sword|トウ|かたな|X
王|king|オウ||X
玉|ball; jewel|ギョク|たま|X
貝|shellfish|バイ|かい|X
干|to dry|カン|ほ|X
氷|ice|ヒョウ|こおり|X
永|eternal|エイ|なが|X
少|few; a little|ショウ|すく・すこ|N5
内|within|ナイ|うち|X
申|to report (humble)|シン|もう|X
由|reason; cause|ユ・ユウ|よし|X
比|to compare|ヒ|くら|X
汽|steam|キ||X
馬|horse|バ|うま|X
交|to mix; cross|コウ|まじ|X
京|capital city|キョウ||N4
親|parent|シン|おや|N4
反|against|ハン|そ|X
取|to take|シュ|と|X
良|good|リョウ|よ|X
米|rice|ベイ|こめ|X
晴|clear weather|セイ|は|X
止|to stop|シ|と|N4
区|ward; district|ク||X
同|same|ドウ|おな|N4
事|matter; affair|ジ|こと|N4
発|to depart; emit|ハツ・ホツ||N4
者|someone; -er|シャ|もの|N4
地|ground; land|チ・ジ||N4
業|industry; work|ギョウ|わざ|N4
場|place|ジョウ|ば|N4
員|member|イン||N4
代|generation; substitute|ダイ・タイ|か・よ|N4
動|to move|ドウ|うご|N4
通|to pass through; commute|ツウ|とお・かよ|N4
理|logic; principle|リ||N4
題|topic; title|ダイ||N4
意|meaning; mind|イ||N4
不|not; un-|フ・ブ||N4
用|errand; task|ヨウ|もち|N4
度|degree|ド|たび|N4
公|public|コウ|おおやけ|N4
野|field|ヤ|の|N4
以|by means of; since|イ||N4
世|world; society|セ・セイ|よ|N4
正|correct|セイ・ショウ|ただ|N4
院|institution|イン||N4
教|to teach|キョウ|おし|N4
文|sentence; writing|ブン・モン|ふみ|N4
元|former; source|ゲン・ガン|もと|N4
考|to consider|コウ|かんが|N4
集|to gather|シュウ|あつ|N4
別|separate; different|ベツ|わか|N4
物|thing; object|ブツ・モツ|もの|N4
品|goods; article|ヒン|しな|N4
計|to measure|ケイ|はか|N4
死|death|シ|し|N4
私|I; private|シ|わたし|N4
始|to begin|シ|はじ|N4
運|to carry; luck|ウン|はこ|N4
終|to finish|シュウ|お|N4
台|stand; platform|ダイ・タイ||N4
無|nothing; without|ム・ブ|な|N4
有|to have; exist|ユウ・ウ|あ|N4
料|fee; materials|リョウ||N4
工|craft; construction|コウ・ク||N4
建|to build|ケン|た|N4
急|hurry; sudden|キュウ|いそ|N4
送|to send|ソウ|おく|N4
切|to cut|セツ|き|N4
転|to roll over|テン|ころ|N4
研|to polish; sharpen|ケン|と|N4
究|to research|キュウ|きわ|N4
起|to wake up|キ|お|N4
着|to arrive; to wear|チャク|き・つ|N4
質|quality|シツ||N4
試|to attempt|シ|ため|N4
験|examination|ケン||N4
族|tribe; family group|ゾク||N4
銀|silver|ギン||N4
映|to reflect; project|エイ|うつ|N4
英|England; English|エイ||N4
仕|to serve; do|シ|つか|N4
去|past; to leave|キョ・コ|さ|N4
味|taste|ミ|あじ|N4
注|to pour; note|チュウ|そそ|N4
帰|to return home|キ|かえ|N4
図|map; drawing|ズ・ト|はか|N4
室|room|シツ|むろ|N4
風|wind|フウ|かぜ|N4
紙|paper|シ|かみ|N4
館|large building|カン||N4
屋|roof; dealer|オク|や|N4
習|to learn|シュウ|なら|N4
洋|Western; ocean|ヨウ||N4
旅|trip|リョ|たび|N4
服|clothes|フク||N4
借|to borrow|シャク|か|N4
貸|to lend|タイ|か|N4
堂|hall; temple|ドウ||N4
飯|cooked rice; meal|ハン|めし|N4
弟|younger brother|テイ・ダイ|おとうと|N4
兄|older brother|ケイ・キョウ|あに|N4
妹|younger sister|マイ|いもうと|N4
姉|older sister|シ|あね|N4
漢|China (Han)|カン||N4
悪|bad|アク|わる|N4
便|convenience; mail|ベン・ビン|たよ|N4
利|profit; advantage|リ|き|N4
低|low|テイ|ひく|N4
説|to explain|セツ|と|N4
光|light (rays)|コウ|ひかり|N4
引|to pull|イン|ひ|N4
回|-times; to rotate|カイ|まわ|N4
声|voice|セイ|こえ|N4
頭|head|トウ・ズ|あたま|N4
首|neck|シュ|くび|N4
`;

// Kun readings (hiragana) first, then on readings (katakana).
function reading(on: string, kun: string): string {
  return [kun, on].filter(Boolean).map(s => s.split("・").join("、")).join("  ／  ");
}

const items: Item[] = RAW.trim().split("\n").map(line => {
  const [k, meaning, on, kun, set] = line.split("|");
  return {
    id: k,
    set,
    decoyOnly: set === "X",
    values: { glyph: k, meaning, reading: reading(on, kun) },
    speak: (kun || on).split("・")[0]
  };
});

// Groups of kanji that are easy to mix up. Smaller groups are closer matches and are offered first.
const LOOKALIKES = [
  // Closest pairs: these are offered first.
  "木本", "人入", "大犬", "大天", "午牛", "千干", "日目", "白百", "右石", "左右", "土上", "小少",
  "間聞", "母毎", "王玉", "九力", "夕多", "日月", "目見", "休体", "読語", "待持", "近遠",
  "土士", "天夫", "大太", "犬太", "未末", "木未", "本末", "矢失", "刀力", "見貝", "目自", "白自",
  "王主", "鳥島", "水氷", "氷永", "門問", "問間", "開閉", "門開", "待特", "持特", "字学", "子字",
  "万方", "住主", "入八", "四西", "今会", "話語", "書昼", "買売", "毎海", "持時", "広店", "暗音",
  "楽薬", "東車", "東重", "目日", "千午", "干千", "力刀",
  "円内", "年午", "分刀", "中申", "由田", "北比", "気汽", "駅馬", "校交", "父交", "高京", "新親",
  "友反", "耳取", "足走", "食良", "食飲", "来米", "青晴", "歩止", "歩少", "医区", "勉力",
  "族旅", "便使", "験駅", "映英", "洋海", "屋室", "銀金", "動重", "終冬", "紙低", "究空", "台始",
  "公分", "不下", "首道", "声売", "料米", "姉妹", "借貸", "研形", "試式", "理里", "起走", "回口",
  // Wider families: similar shapes or a shared part.
  "族旅方", "注住主", "館飯飲食", "員貝買質貸", "正止足", "文父交", "元兄先光", "者考教",
  "物牛特", "計話言試説", "私秋利", "始姉妹", "有右友", "送通近遠", "切刀七", "転軽車",
  "起走赤", "頭顔題", "悪思意急", "度広店席", "図国回", "代式試", "理野黒", "意音暗", "用月円",
  "門問間聞開閉", "自白目百", "王玉主", "土士上", "大太犬天夫", "未末木本", "矢失知", "刀力九",
  "中申由田", "友右左", "家字安", "見貝買", "水氷永", "干千午十", "鳥島", "持待特時", "字学子", "万方", "住主体",
  "木本休体", "木村休", "人入八", "大天犬", "午牛千十", "半千十", "手千午",
  "日目白百", "田口日目", "国口田", "田男町画", "男力", "思心田",
  "右左石", "右名古口", "夕多名外", "夜外夕", "今会金", "答会今",
  "見買目", "言話語読", "売買読", "間聞", "母毎海", "東車重", "軽車重",
  "雨電", "小少", "先生", "山出", "川三", "明時暗昼早曜", "花茶薬", "楽薬",
  "行待後", "持待時", "使体作休何", "鳥魚黒", "走赤", "夏顔", "秋火",
  "広店", "強弱", "近遠道週", "真目", "立音", "女安", "子学", "社土上",
  "歌飲", "上下", "万方", "円内", "王玉", "字学", "一二三", "月明朝肉", "四西", "五七", "九力", "白自", "冬夏", "火秋"
];

export const kanji: Deck = {
  id: "kanji",
  name: "Kanji",
  native: "漢字",
  lang: "ja",
  fields: {
    meaning: { label: "English", kind: "text" },
    glyph: { label: "Kanji", kind: "glyph" },
    reading: { label: "Reading", kind: "reading" }
  },
  modes: [
    { id: "en2kj", name: "Meaning → Kanji", prompt: "meaning", choice: "glyph" },
    { id: "kj2en", name: "Kanji → Meaning", prompt: "glyph", choice: "meaning" },
    { id: "kj2kana", name: "Kanji → Reading", prompt: "glyph", choice: "reading" },
    { id: "kana2kj", name: "Reading → Kanji", prompt: "reading", choice: "glyph" }
  ],
  sets: [
    { id: "N5", name: "JLPT N5" },
    { id: "N4", name: "JLPT N4" }
  ],
  defaultSets: ["N5"],
  items,
  lookalikes: { glyph: LOOKALIKES },
  describe: x => ({ big: x.values.glyph, title: x.values.meaning, sub: x.values.reading })
};
