import { useState } from "react";
import type { Deck, DeckProgress, Settings } from "../types";
import { itemMap, needsPractice, pool } from "../engine";
import { Chip } from "./Bits";
import { speak, speechSupported, useVoices } from "../speech";

function Radios<T extends string | number>(props: {
  legend: string; name: string; value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; hint?: string;
}) {
  return (
    <fieldset className="field">
      <legend>{props.legend}</legend>
      <div className="row">
        {props.options.map(o => (
          <label className="opt" key={String(o.value)}>
            <input type="radio" name={props.name} id={`${props.name}-${o.value}`} checked={props.value === o.value} onChange={() => props.onChange(o.value)} />
            {o.label}
          </label>
        ))}
      </div>
      {props.hint && <p className="hint">{props.hint}</p>}
    </fieldset>
  );
}

function Checks(props: {
  legend: string; idPrefix: string; options: { id: string; label: string }[]; value: string[]; onChange: (v: string[]) => void; hint?: string;
}) {
  return (
    <fieldset className="field">
      <legend>{props.legend}</legend>
      <div className="row">
        {props.options.map(o => (
          <label className="opt" key={o.id}>
            <input
              type="checkbox"
              id={`${props.idPrefix}-${o.id}`}
              checked={props.value.includes(o.id)}
              onChange={e => {
                const next = e.target.checked ? [...props.value, o.id] : props.value.filter(x => x !== o.id);
                if (next.length) props.onChange(props.options.map(x => x.id).filter(x => next.includes(x)));
              }}
            />
            {o.label}
          </label>
        ))}
      </div>
      {props.hint && <p className="hint">{props.hint}</p>}
    </fieldset>
  );
}

export function SettingsPanel(props: { deck: Deck; settings: Settings; onChange: (s: Settings) => void }) {
  const { deck, settings: s, onChange } = props;
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => onChange({ ...s, [k]: v });
  const ds = s.decks[deck.id];
  const setDeck = (patch: Partial<typeof ds>) => onChange({ ...s, decks: { ...s.decks, [deck.id]: { ...ds, ...patch } } });
  return (
    <details className="panel" open>
      <summary>Settings</summary>
      <div className="settings">
        <div className="field">
          <label htmlFor="glyphSize">Character size: {s.glyphSize} px</label>
          <input type="range" id="glyphSize" min={56} max={260} step={4} value={s.glyphSize} onChange={e => set("glyphSize", +e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="textSize">Word and reading size: {s.textSize} px</label>
          <input type="range" id="textSize" min={18} max={56} step={2} value={s.textSize} onChange={e => set("textSize", +e.target.value)} />
        </div>
        {deck.lang === "ja" && (
          <Radios legend="Japanese style" name="jaFont" value={s.jaFont} onChange={v => set("jaFont", v)}
            options={[{ value: "klee", label: "Textbook" }, { value: "sans", label: "Gothic" }, { value: "serif", label: "Mincho" }]}
            hint="Textbook style shows strokes the way you would write them by hand." />
        )}
        {deck.lang === "te" && (
          <Radios legend="Telugu style" name="teFont" value={s.teFont} onChange={v => set("teFont", v)}
            options={[{ value: "sans", label: "Plain" }, { value: "serif", label: "Traditional" }]} />
        )}
        <Checks legend={`Modes to practise (${deck.name})`} idPrefix="mode" value={ds.modes} onChange={v => setDeck({ modes: v })}
          options={deck.modes.map(m => ({ id: m.id, label: m.name }))}
          hint="Each round picks one of the ticked modes at random. Keep at least one ticked." />
        <Checks legend={`${deck.name} sets`} idPrefix="set" value={ds.sets} onChange={v => setDeck({ sets: v })}
          options={deck.sets.map(x => ({ id: x.id, label: `${x.name} (${pool(deck, [x.id]).length})` }))} />
        <Radios legend="Words in a round" name="roundSize" value={s.roundSize} onChange={v => set("roundSize", v)}
          options={[5, 10, 15, 20].map(v => ({ value: v, label: String(v) }))} />
        <Radios legend="Words on the board at once" name="pairs" value={s.pairs} onChange={v => set("pairs", v)}
          options={[2, 3, 4, 5].map(v => ({ value: v, label: String(v) }))} />
        <Radios legend="Extra choices with no match" name="extra" value={s.extra} onChange={v => set("extra", v)}
          options={[0, 2, 4, 6].map(v => ({ value: v, label: String(v) }))}
          hint="Extra choices stop you from finding the last answer by elimination." />
        <label className="opt">
          <input type="checkbox" id="alike" checked={s.alike} onChange={e => set("alike", e.target.checked)} />
          Use look-alike characters for the extras
        </label>
        <label className="opt">
          <input type="checkbox" id="speak" checked={s.speak} onChange={e => set("speak", e.target.checked)} />
          Say the correct answer aloud after each guess
        </label>
        <VoicePicker deck={deck} settings={s} onChange={onChange} />
        <p className="hint">Changes to modes, sets and round size apply when you press Start.</p>
      </div>
    </details>
  );
}

const LANG_NAME: Record<string, string> = { ja: "Japanese", te: "Telugu" };

function VoicePicker(props: { deck: Deck; settings: Settings; onChange: (s: Settings) => void }) {
  const { deck, settings: s, onChange } = props;
  const voices = useVoices(deck.lang);
  const langName = LANG_NAME[deck.lang] ?? deck.name;
  if (!speechSupported()) return <p className="hint">This browser can't speak aloud.</p>;
  const chosen = s.voices[deck.lang] ?? "";
  const sample = deck.items.find(x => !x.decoyOnly)?.speak;
  return (
    <div className="field">
      <label htmlFor="voiceSel">{langName} voice</label>
      {voices.length ? (
        <div className="row">
          <select id="voiceSel" value={chosen} onChange={e => onChange({ ...s, voices: { ...s.voices, [deck.lang]: e.target.value } })}>
            <option value="">Best available ({voices[0].name})</option>
            {voices.map(v => <option key={v.voiceURI} value={v.voiceURI}>{v.name}</option>)}
          </select>
          <button type="button" className="btn" onClick={() => speak(sample, deck.lang, chosen || undefined, s.speechRate)}>Test</button>
        </div>
      ) : (
        <p className="hint">No {langName} voice is installed on this device or browser, so nothing will be spoken. See the note below on adding one.</p>
      )}
      <label htmlFor="speechRate">Speaking speed: {Math.round(s.speechRate * 100)}%</label>
      <input type="range" id="speechRate" min={0.5} max={1.2} step={0.05} value={s.speechRate} onChange={e => onChange({ ...s, speechRate: +e.target.value })} />
      <p className="hint">
        Voices come from your device and browser. For better ones, install a {langName} voice in your system's
        speech settings, or use Microsoft Edge, which has natural-sounding online voices. New voices appear in this list
        after you reload the page.
      </p>
    </div>
  );
}

export function ReviewPanel(props: {
  deck: Deck; progress: DeckProgress; onDrill: (id: string, mode: string) => void; onReset: () => void;
}) {
  const { deck, progress } = props;
  const [confirming, setConfirming] = useState(false);
  const byId = itemMap(deck);
  const list = needsPractice(deck, progress).slice(0, 16);
  return (
    <details className="panel" open>
      <summary>Needs practice</summary>
      {list.length ? (
        <div className="review">
          {list.map(x => (
            <Chip key={x.id} deck={deck} item={byId[x.id]} note={`missed ${x.wrong}×`} onDrill={() => props.onDrill(x.id, x.mode)} />
          ))}
        </div>
      ) : (
        <p className="empty">Characters you miss collect here. Tap one to drill it: five quick questions on just that character.</p>
      )}
      <div className="confirm">
        {confirming ? (
          <>
            <span>Clear your {deck.name} practice list and scores?</span>
            <button className="btn danger" type="button" onClick={() => { setConfirming(false); props.onReset(); }}>Yes, clear it</button>
            <button className="btn" type="button" onClick={() => setConfirming(false)}>Keep it</button>
          </>
        ) : (
          <button className="btn danger" type="button" onClick={() => setConfirming(true)}>Reset {deck.name} progress</button>
        )}
      </div>
    </details>
  );
}
