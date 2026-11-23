import { useEffect, useMemo, useRef, useState } from "react";
import type { Deck, DeckProgress, Item, Mode, Settings } from "./types";
import { DECKS, DECK_BY_ID } from "./decks";
import {
  answerRound, buildSimilar, drillMode, emptyBoard, face, fillBoard, itemMap, lookalikeField,
  pickDecoys, pickMode, pickRound, recordAnswer, shuffle, shuffleDifferent,
  type Board, type Round, type Similar
} from "./engine";
import { loadFlag, loadProgress, loadSettings, saveFlag, saveProgress, saveSettings } from "./storage";
import { Chip, History, Tile, TwoStepButton } from "./components/Bits";
import { ReviewPanel, SettingsPanel } from "./components/Panels";
import { Drill, DRILL_KEYS, DRILL_LENGTH, type DrillState } from "./components/Drill";
import { Chart } from "./components/Chart";

const KEYS = "ABCDEFGHIJKL";
const FONTS = {
  ja: {
    klee: '"Klee One", "Noto Sans JP", "Hiragino Sans", "Yu Gothic", sans-serif',
    sans: '"Noto Sans JP", "Hiragino Sans", "Yu Gothic", sans-serif',
    serif: '"Noto Serif JP", "Hiragino Mincho ProN", "Yu Mincho", serif'
  },
  te: {
    sans: '"Noto Sans Telugu", "Nirmala UI", "Telugu Sangam MN", sans-serif',
    serif: '"Noto Serif Telugu", "Telugu MN", "Nirmala UI", serif'
  }
} as const;
const SPEECH_LANG: Record<string, string> = { ja: "ja-JP", te: "te-IN" };

interface Entry { key: number; id: string; picked: string; ok: boolean; mode: string }

interface Game {
  round: Round;
  board: Board;
  sel: { p: string | null; c: string | null };
  log: Entry[];
  done: boolean;
  anim: number;
}

function newGame(deck: Deck, similar: Similar, settings: Settings, progress: DeckProgress, lastMode?: string): Game {
  const ds = settings.decks[deck.id];
  const modeId = pickMode(ds.modes, lastMode);
  const mode = deck.modes.find(m => m.id === modeId)!;
  const words = pickRound(deck, ds.sets, progress, modeId, settings.roundSize);
  const round: Round = { num: progress.rounds + 1, mode: modeId, words, queue: words.slice(), cleared: [], missed: [], mistakes: 0 };
  const filled = fillBoard({ deck, mode, similar, round, board: emptyBoard, pairs: settings.pairs, extra: settings.extra, alike: settings.alike, sets: ds.sets });
  return { ...filled, sel: { p: null, c: null }, log: [], done: false, anim: 0 };
}

function speak(text: string | undefined, lang: string) {
  if (!text || !("speechSynthesis" in window)) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = SPEECH_LANG[lang] ?? lang;
    u.rate = 0.8;
    speechSynthesis.speak(u);
  } catch { /* speech unavailable */ }
}

/** "You picked …" for a wrong answer, naming what the picked choice actually is. */
function describePick(deck: Deck, mode: Mode, p: Item): string {
  const glyphField = lookalikeField(deck, mode);
  if (deck.fields[mode.choice].kind === "glyph") return `You picked ${face(p, mode.choice)}, which is “${face(p, mode.prompt)}”.`;
  return `You picked “${face(p, mode.choice)}”, which is ${glyphField ? face(p, glyphField) : face(p, mode.prompt)}.`;
}

export default function App() {
  const [settings, setSettingsState] = useState(loadSettings);
  const deck = DECK_BY_ID[settings.deck];
  const similar = useMemo(() => buildSimilar(deck), [deck]);
  const byId = useMemo(() => itemMap(deck), [deck]);
  const [progress, setProgressState] = useState(() => loadProgress(settings.deck));
  const [game, setGame] = useState(() => newGame(deck, similar, settings, progress));
  const [drill, setDrill] = useState<DrillState | null>(null);
  const [view, setView] = useState<"play" | "chart">("play");
  const [status, setStatus] = useState("");
  const [howtoOpen, setHowtoOpen] = useState(() => loadFlag("lb-howto-open", true));
  const readyAt = useRef(0);
  const entryKey = useRef(0);

  const ds = settings.decks[deck.id];
  const mode = deck.modes.find(m => m.id === game.round.mode)!;

  const setSettings = (s: Settings) => { setSettingsState(s); saveSettings(s); };
  const setProgress = (p: DeckProgress, deckId = deck.id) => { setProgressState(p); saveProgress(deckId, p); };

  // Fonts and sizes follow the settings and the writing system.
  useEffect(() => {
    const r = document.documentElement.style;
    r.setProperty("--glyph-size", `${settings.glyphSize}px`);
    r.setProperty("--text-size", `${settings.textSize}px`);
    r.setProperty("--font-glyph", deck.lang === "te" ? FONTS.te[settings.teFont] : FONTS.ja[settings.jaFont]);
  }, [settings.glyphSize, settings.textSize, settings.jaFont, settings.teFont, deck.lang]);

  // ---- Rounds ----
  function start(deckOverride?: Deck, progressOverride?: DeckProgress, settingsOverride?: Settings) {
    const d = deckOverride ?? deck;
    const p = progressOverride ?? progress;
    const s = settingsOverride ?? settings;
    setGame(newGame(d, d === deck ? similar : buildSimilar(d), s, p, d === deck ? game.round.mode : undefined));
    setDrill(null);
    setView("play");
    readyAt.current = 0;
  }

  function switchDeck(id: string) {
    const d = DECK_BY_ID[id];
    const s = { ...settings, deck: id };
    const p = loadProgress(id);
    setSettings(s);
    setProgressState(p);
    start(d, p, s);
  }

  function choose(side: "p" | "c", id: string) {
    if (Date.now() < readyAt.current || game.done) return;
    const sel = { ...game.sel, [side]: game.sel[side] === id ? null : id };
    if (sel.p && sel.c) guess(sel.p, sel.c);
    else setGame({ ...game, sel });
  }

  function guess(target: string, picked: string) {
    const ok = target === picked;
    let p = recordAnswer(progress, mode.id, target, ok);
    const round = answerRound(game.round, target, ok);
    const log = [{ key: ++entryKey.current, id: target, picked, ok, mode: mode.id }, ...game.log];
    const board = { ...game.board, targets: game.board.targets.filter(x => x !== target) };
    const t = byId[target];
    const d = deck.describe(t);
    setStatus(ok ? `Right. ${d.big}, ${d.title}.` : `Missed. ${d.big} is ${d.title}. ${describePick(deck, mode, byId[picked])}`);
    if (settings.speak) speak(t.speak, deck.lang);

    if (!board.targets.length && !round.queue.length) {
      const right = round.words.length - round.missed.length;
      p = { ...p, rounds: round.num, history: [...p.history, { n: round.num, mode: mode.id, right, total: round.words.length }] };
      setProgress(p);
      setGame({ ...game, round, board, log, sel: { p: null, c: null }, done: true });
      return;
    }
    setProgress(p);
    const filled = fillBoard({ deck, mode, similar, round, board, pairs: settings.pairs, extra: settings.extra, alike: settings.alike, sets: ds.sets });
    setGame({ ...filled, log, sel: { p: null, c: null }, done: false, anim: game.anim + 1 });
    readyAt.current = Date.now() + 300; // ignore an accidental double tap
  }

  function resetRounds() {
    const p = { ...progress, rounds: 0, history: [] };
    setProgress(p);
    start(deck, p);
  }

  // ---- Drill ----
  function drillChoices(itemId: string, m: Mode, prev: string[]): string[] {
    // The closest look-alike every time, plus two others from the nearest few, so the extras vary.
    const near = pickDecoys({ deck, mode: m, similar, targets: [itemId], n: 6, alike: true, sets: ds.sets });
    const decoys = [near[0], ...shuffle(near.slice(1)).slice(0, 2)].filter(Boolean);
    return shuffleDifferent([itemId, ...decoys], prev);
  }

  function startDrill(itemId: string, originMode: string) {
    const m = drillMode(deck, originMode);
    setDrill({ itemId, mode: m, results: [], choices: drillChoices(itemId, m, []), verdict: null, anim: 0 });
    setView("play");
    readyAt.current = 0;
    requestAnimationFrame(() => {
      const h = document.getElementById("drillHead");
      h?.focus();
      h?.scrollIntoView({ block: "start", behavior: "smooth" });
    });
  }

  function drillPick(id: string) {
    if (!drill || drill.results.length >= DRILL_LENGTH || Date.now() < readyAt.current) return;
    const ok = id === drill.itemId;
    const results = [...drill.results, ok];
    let p = recordAnswer(progress, drill.mode.id, drill.itemId, ok);
    if (results.length === DRILL_LENGTH && results.every(Boolean)) {
      // A perfect drill takes the character off the practice list in every mode.
      const cards = { ...p.cards };
      for (const [k, c] of Object.entries(cards)) {
        if (k.endsWith(`|${drill.itemId}`) && c.box <= 1) cards[k] = { ...c, box: 2 };
      }
      p = { ...p, cards };
    }
    setProgress(p);
    if (settings.speak) speak(byId[drill.itemId].speak, deck.lang);
    setStatus(ok ? "Correct" : "Incorrect");
    setDrill({
      ...drill,
      results,
      verdict: ok,
      choices: results.length < DRILL_LENGTH ? drillChoices(drill.itemId, drill.mode, drill.choices) : drill.choices,
      anim: drill.anim + 1
    });
    readyAt.current = Date.now() + 300;
  }

  // ---- Keyboard ----
  const keyHandler = useRef<(e: KeyboardEvent) => void>(() => {});
  keyHandler.current = e => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const t = e.target as HTMLElement | null;
    if (t && (["INPUT", "TEXTAREA", "SELECT", "SUMMARY"].includes(t.tagName) || (t.tagName === "BUTTON" && !t.classList.contains("card")))) return;
    if (view === "chart") return;
    if (drill) {
      if (drill.results.length >= DRILL_LENGTH) {
        if (e.key === "Enter") { e.preventDefault(); startDrill(drill.itemId, drill.mode.id); }
        return;
      }
      const i = DRILL_KEYS.indexOf(e.key.toUpperCase());
      if (e.key.length === 1 && i >= 0 && i < drill.choices.length) { e.preventDefault(); drillPick(drill.choices[i]); }
      return;
    }
    if (game.done) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); start(); }
      return;
    }
    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= game.board.pOrder.length) { e.preventDefault(); choose("p", game.board.pOrder[n - 1]); return; }
    const i = KEYS.indexOf(e.key.toUpperCase());
    if (e.key.length === 1 && i >= 0 && i < game.board.cOrder.length) { e.preventDefault(); choose("c", game.board.cOrder[i]); }
  };
  useEffect(() => {
    const h = (e: KeyboardEvent) => keyHandler.current(e);
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, []);

  // ---- Render ----
  const r = game.round;
  const pField = deck.fields[mode.prompt];
  const cField = deck.fields[mode.choice];
  const listClass = (kind: string, many: boolean) => (kind === "glyph" ? "squares" : many ? "stack wide" : "stack");
  const firstTry = r.words.length - r.missed.length;

  return (
    <div className="wrap">
      <header>
        <h1><span className="logo" aria-hidden="true">字</span> Letterbox</h1>
        <div className="controls">
          <label htmlFor="deckSel">Writing system</label>
          <select id="deckSel" value={deck.id} onChange={e => switchDeck(e.target.value)}>
            {DECKS.map(d => <option key={d.id} value={d.id}>{d.name} ({d.native})</option>)}
          </select>
          <button className="btn-big" type="button" id="startBtn" onClick={() => start()}>Start</button>
          <button className="btn" type="button" id="sheetBtn" aria-pressed={view === "chart"}
            onClick={() => setView(view === "chart" ? "play" : "chart")}>
            {view === "chart" ? "Back to practice" : "Study sheet"}
          </button>
          <TwoStepButton label="Reset rounds" armedLabel="Tap again to reset" onConfirm={resetRounds} />
        </div>
      </header>

      <History deck={deck} history={progress.history} />

      <details className="howto" open={howtoOpen} onToggle={e => { const o = (e.target as HTMLDetailsElement).open; setHowtoOpen(o); saveFlag("lb-howto-open", o); }}>
        <summary>How to play</summary>
        <p className="instructions">
          Choose a writing system and press Start. Each round uses one of the modes ticked in Settings, picked at random,
          and has a set of words shown a few at a time. Pick one on the left, then its match on the right. As soon as you
          pick both, the next word takes its place and the choices reshuffle. A word you miss comes back later in the same
          round. Every answer is listed under the board; tap a missed one, or anything under Needs practice, to drill it.
          Keyboard: number keys pick on the left, letter keys pick on the right.
        </p>
      </details>

      {view === "chart" ? (
        <Chart deck={deck} byId={byId} onDrill={id => startDrill(id, game.round.mode)} onSpeak={x => speak(x.speak, deck.lang)} />
      ) : drill ? (
        <Drill deck={deck} byId={byId} drill={drill} onPick={drillPick}
          onAgain={() => startDrill(drill.itemId, drill.mode.id)} onBack={() => setDrill(null)} />
      ) : (
        <>
          <div className="roundbar">
            <span className="modetag" id="modeTag">{mode.name}</span>
            <span id="roundText">Round {r.num} · {r.cleared.length} of {r.words.length} matched · {r.mistakes} {r.mistakes === 1 ? "mistake" : "mistakes"}</span>
            <div className="pips" role="img" aria-label={`${r.cleared.length} of ${r.words.length} matched`}>
              {r.words.map(id => (
                <span key={id} className={`pip${r.cleared.includes(id) ? " done" : r.missed.includes(id) ? " redo" : ""}`} />
              ))}
            </div>
          </div>

          {game.done ? (
            <section className="summary" aria-live="polite">
              <h2>Round {r.num} complete</h2>
              <p id="sumText">
                {r.missed.length
                  ? `${firstTry} of ${r.words.length} right the first time. Tap one of these to drill it:`
                  : `All ${r.words.length} right the first time.`}
              </p>
              {r.missed.length > 0 && (
                <div className="review">
                  {r.missed.map(id => <Chip key={id} deck={deck} item={byId[id]} onDrill={() => startDrill(id, r.mode)} />)}
                </div>
              )}
              <div className="row"><button className="btn-big" type="button" id="nextRound" onClick={() => start()}>Start round {r.num + 1}</button></div>
            </section>
          ) : (
            <section className="board" aria-label="Matching board">
              <div className="col">
                <h2 id="pHead">{pField.label}</h2>
                <div id="pList" className={listClass(pField.kind, false)} role="group" aria-labelledby="pHead">
                  {game.board.pOrder.map((id, i) => (
                    <Tile key={id} kind={pField.kind} lang={deck.lang} keyLabel={String(i + 1)} text={face(byId[id], mode.prompt)}
                      pressed={game.sel.p === id} onPick={() => choose("p", id)} />
                  ))}
                </div>
              </div>
              <div className="col">
                <h2 id="cHead">{cField.label}</h2>
                <div id="cList" key={game.anim} className={`choices fade ${listClass(cField.kind, true)}`} role="group" aria-labelledby="cHead">
                  {game.board.cOrder.map((id, i) => (
                    <Tile key={id} kind={cField.kind} lang={deck.lang} keyLabel={KEYS[i]} text={face(byId[id], mode.choice)}
                      pressed={game.sel.c === id} onPick={() => choose("c", id)} />
                  ))}
                </div>
              </div>
            </section>
          )}

          <section className="log" aria-labelledby="logHead">
            <h2 id="logHead">This round</h2>
            {game.log.length === 0 && <p className="empty">Your answers will appear here, newest first.</p>}
            <ol id="log">
              {game.log.map((e, i) => {
                const it = byId[e.id];
                const d = deck.describe(it);
                const m = deck.modes.find(x => x.id === e.mode)!;
                return (
                  <li key={e.key} className={`entry${e.ok ? "" : " bad"}${i === 0 ? " new" : ""}`}>
                    <span className="mark" aria-hidden="true">{e.ok ? "✓" : "✗"}</span>
                    <span className="big" lang={deck.lang}>{d.big}</span>
                    <div className="txt">
                      <div className="m">{e.ok ? "Right" : "Missed"}: {d.title}</div>
                      {d.sub && <div className="sub" lang={deck.lang}>{d.sub}</div>}
                      {!e.ok && <div className="pick">{describePick(deck, m, byId[e.picked])}</div>}
                    </div>
                    {!e.ok && <button type="button" className="btn" onClick={() => startDrill(e.id, e.mode)}>Drill</button>}
                  </li>
                );
              })}
            </ol>
          </section>
        </>
      )}

      <div className="panels">
        <SettingsPanel deck={deck} settings={settings} onChange={setSettings} />
        <ReviewPanel deck={deck} progress={progress} onDrill={startDrill}
          onReset={() => { const p = { cards: {}, rounds: 0, history: [] }; setProgress(p); start(deck, p); }} />
      </div>
      <div className="sr" aria-live="assertive">{status}</div>
    </div>
  );
}
