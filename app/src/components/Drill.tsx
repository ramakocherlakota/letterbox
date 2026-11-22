import type { Deck, Item, Mode } from "../types";
import { face } from "../engine";
import { Tile } from "./Bits";

export const DRILL_LENGTH = 5;

export interface DrillState {
  itemId: string;
  mode: Mode;
  results: boolean[];
  choices: string[];
  verdict: boolean | null;
  anim: number;
}

export const DRILL_KEYS = "ABCD";

/** Drill one character: the same clue five times, four look-alike choices, reshuffled each time. */
export function Drill(props: {
  deck: Deck;
  byId: Record<string, Item>;
  drill: DrillState;
  onPick: (id: string) => void;
  onAgain: () => void;
  onBack: () => void;
}) {
  const { deck, byId, drill } = props;
  const target = byId[drill.itemId];
  const prompt = deck.fields[drill.mode.prompt];
  const choice = deck.fields[drill.mode.choice];
  const done = drill.results.length >= DRILL_LENGTH;
  const right = drill.results.filter(Boolean).length;
  const d = deck.describe(target);
  return (
    <section className="drill" aria-labelledby="drillHead">
      <h2 id="drillHead" tabIndex={-1}>Drill: {prompt.label} → {choice.label}</h2>
      <div className="pips" role="img" aria-label={`${drill.results.length} of ${DRILL_LENGTH} done, ${right} correct`}>
        {Array.from({ length: DRILL_LENGTH }, (_, i) => (
          <span key={i} className={`pip${i < drill.results.length ? (drill.results[i] ? " done" : " bad") : ""}`} />
        ))}
      </div>
      {!done ? (
        <>
          <p>Which {choice.label.toLowerCase()} is this?</p>
          <div className={`clue${prompt.kind === "reading" ? " reading" : ""}`} lang={prompt.kind === "text" ? undefined : deck.lang}>
            {face(target, drill.mode.prompt)}
          </div>
          <div className="verdict-wrap" aria-live="polite">
            <div className={`verdict${drill.verdict === null ? "" : drill.verdict ? " good" : " bad"}`}>
              {drill.verdict === null ? "" : drill.verdict ? "✓ Correct" : "✗ Incorrect"}
            </div>
          </div>
          <div className="choices fade" key={drill.anim}>
            {drill.choices.map((id, i) => (
              <Tile key={id} kind={choice.kind} lang={deck.lang} keyLabel={DRILL_KEYS[i]} text={face(byId[id], drill.mode.choice)} onPick={() => props.onPick(id)} />
            ))}
          </div>
        </>
      ) : (
        <>
          <p aria-live="polite">
            <b>{right} of {DRILL_LENGTH} correct.</b>{" "}
            {right === DRILL_LENGTH ? "Nice work. It's off your practice list for now." : "Try it again, or go back to the round."}
          </p>
          <div className="row">
            <span className="g" lang={deck.lang} style={{ fontSize: "calc(var(--glyph-size) * 0.7)", lineHeight: 1 }}>{d.big}</span>
            <span>
              <b>{d.title}</b>
              {d.sub && <span className="g" lang={deck.lang} style={{ display: "block" }}>{d.sub}</span>}
            </span>
          </div>
          <div className="row">
            <button type="button" className="btn-big" onClick={props.onAgain}>Drill again</button>
            <button type="button" className="btn" onClick={props.onBack}>Back to the round</button>
          </div>
        </>
      )}
    </section>
  );
}
