import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Deck, FieldKind, Item, RoundResult } from "../types";

export function Tile(props: {
  kind: FieldKind;
  text: string;
  lang: string;
  keyLabel: string;
  pressed?: boolean;
  onPick: () => void;
}) {
  const { kind, text, lang, keyLabel, pressed, onPick } = props;
  return (
    <button
      type="button"
      className={`card t-${kind}`}
      aria-pressed={pressed ? "true" : "false"}
      aria-label={`${keyLabel}: ${text}`}
      onClick={onPick}
    >
      <span className="key" aria-hidden="true">{keyLabel}</span>
      {kind === "glyph" ? <FitGlyph text={text} lang={lang} /> : <span lang={kind === "text" ? undefined : lang}>{text}</span>}
    </button>
  );
}

/** A glyph that shrinks to fit its tile. Some letters (ఋ, ౠ, అః) are much wider than they are tall. */
function FitGlyph(props: { text: string; lang: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    const box = el?.parentElement;
    if (!el || !box) return;
    const fit = () => {
      el.style.transform = "";
      const cs = getComputedStyle(box);
      const avail = box.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - 8;
      const w = el.scrollWidth;
      el.style.transform = w > avail && avail > 0 ? `scale(${avail / w})` : "";
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(box);
    document.fonts?.ready.then(fit).catch(() => {});
    return () => ro.disconnect();
  }, [props.text]);
  return <span ref={ref} className="fit" lang={props.lang}>{props.text}</span>;
}

/** A practice chip: the character large, what it is, and a prompt to drill it. */
export function Chip(props: { deck: Deck; item: Item; note?: string; onDrill: () => void }) {
  const d = props.deck.describe(props.item);
  return (
    <button type="button" className="chip" onClick={props.onDrill} aria-label={`Drill ${d.big}: ${d.title}`}>
      <span className="cg" lang={props.deck.lang}>{d.big}</span>
      <span>
        <span className="ct" style={{ display: "block" }}>{d.title}</span>
        {d.sub && <span className="cs" style={{ display: "block" }} lang={props.deck.lang}>{d.sub}</span>}
        {props.note && <span className="cn" style={{ display: "block" }}>{props.note}</span>}
        <span className="go" style={{ display: "block" }}>Drill this →</span>
      </span>
    </button>
  );
}

export function History(props: { deck: Deck; history: RoundResult[] }) {
  const { deck, history } = props;
  if (!history.length) {
    return <div className="history"><span className="h-lbl">Finished rounds will show your score here.</span></div>;
  }
  return (
    <div className="history" aria-label="Right the first time, by round">
      <span className="h-lbl">Right first time:</span>
      {history.slice(-30).map(h => (
        <span key={h.n} className={`h${h.right === h.total ? " perfect" : ""}`}>
          Round {h.n} ({deck.modes.find(m => m.id === h.mode)?.name ?? "?"}): <b>{h.right}</b>/{h.total}
        </span>
      ))}
    </div>
  );
}

/** Two taps, so a stray tap next to Start doesn't wipe the scores. */
export function TwoStepButton(props: { label: string; armedLabel: string; onConfirm: () => void }) {
  const [armed, setArmed] = useState(false);
  const timer = useRef<number>();
  useEffect(() => () => window.clearTimeout(timer.current), []);
  return (
    <button
      type="button"
      className={`btn${armed ? " danger" : ""}`}
      onClick={() => {
        window.clearTimeout(timer.current);
        if (armed) { setArmed(false); props.onConfirm(); return; }
        setArmed(true);
        timer.current = window.setTimeout(() => setArmed(false), 4000);
      }}
    >
      {armed ? props.armedLabel : props.label}
    </button>
  );
}
