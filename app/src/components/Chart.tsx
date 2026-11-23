import { useState } from "react";
import type { Deck, Item } from "../types";

/**
 * A study sheet: every character in the writing system, laid out the way it is usually taught
 * (the kana table), or as cards grouped by set. Tapping one shows it large, with buttons to
 * hear it and to drill it.
 */
export function Chart(props: {
  deck: Deck;
  byId: Record<string, Item>;
  onDrill: (id: string) => void;
  onSpeak: (item: Item) => void;
}) {
  const { deck, byId } = props;
  const askable = deck.items.filter(x => !x.decoyOnly);
  const [selId, setSelId] = useState(askable[0]?.id);
  const sel = selId ? byId[selId] : undefined;
  const canSpeak = typeof window !== "undefined" && "speechSynthesis" in window;

  const cell = (id: string) => {
    const x = byId[id];
    const d = deck.describe(x);
    const chart = deck.chart;
    return (
      <button
        type="button"
        key={id}
        className="cell"
        aria-pressed={selId === id ? "true" : "false"}
        aria-label={`${d.big}: ${d.title}`}
        onClick={() => setSelId(id)}
      >
        <span className="cg" lang={deck.lang}>{chart ? x.values[chart.main] : d.big}</span>
        {chart?.second && <span className="c2" lang={deck.lang}>{x.values[chart.second]}</span>}
        <span className="cl">{chart ? x.values[chart.label] : x.values.sound ?? d.title}</span>
      </button>
    );
  };

  return (
    <section className="sheet" aria-labelledby="sheetHead">
      <h2 id="sheetHead">{deck.name} study sheet</h2>
      <p className="hint">Tap any character to see it large{canSpeak ? ", hear it" : ""} or drill it.</p>

      {sel && (() => {
        const d = deck.describe(sel);
        return (
          <div className="focus" aria-live="polite">
            <span className="fg" lang={deck.lang}>{d.big}</span>
            <div className="ft">
              <div className="fh">{d.title}</div>
              {d.sub && <div className="fs" lang={deck.lang}>{d.sub}</div>}
              <div className="row">
                {canSpeak && <button type="button" className="btn" onClick={() => props.onSpeak(sel)}>Say it</button>}
                <button type="button" className="btn" onClick={() => props.onDrill(sel.id)}>Drill this</button>
              </div>
            </div>
          </div>
        );
      })()}

      {deck.chart
        ? deck.chart.groups.map(g => (
            <div key={g.title} className="group">
              <h3>{g.title}</h3>
              <div className="tablewrap">
                <table className="kanatable">
                  <thead>
                    <tr>
                      <th scope="col"><span className="sr">Row</span></th>
                      {deck.chart!.columns.map(c => <th key={c} scope="col">{c}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {g.rows.map(r => (
                      <tr key={r.label + r.cells.join()}>
                        <th scope="row">{r.label}</th>
                        {r.cells.map((id, i) => <td key={i}>{id && byId[id] ? cell(id) : null}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        : deck.sets.map(s => {
            const items = askable.filter(x => x.set === s.id);
            if (!items.length) return null;
            return (
              <div key={s.id} className="group">
                <h3>{s.name} ({items.length})</h3>
                <div className="cards">{items.map(x => cell(x.id))}</div>
              </div>
            );
          })}
    </section>
  );
}
