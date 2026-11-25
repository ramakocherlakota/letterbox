// Text-to-speech using the voices installed on the viewer's device or browser.
import { useEffect, useState } from "react";

const SPEECH_LANG: Record<string, string> = { ja: "ja-JP", te: "te-IN" };

export function speechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/** Voices for a language ("ja", "te"), best first. */
export function voicesFor(lang: string): SpeechSynthesisVoice[] {
  if (!speechSupported()) return [];
  const all = speechSynthesis.getVoices().filter(v => v.lang.toLowerCase().replace("_", "-").startsWith(lang));
  return all.sort((a, b) => score(b) - score(a) || a.name.localeCompare(b.name));
}

/** Natural/neural/online voices usually sound far better than the built-in ones. */
function score(v: SpeechSynthesisVoice): number {
  const n = v.name.toLowerCase();
  let s = 0;
  if (/natural|neural|premium|enhanced|wavenet/.test(n)) s += 4;
  if (/online|google/.test(n)) s += 2;
  if (!v.localService) s += 1;
  return s;
}

/** The voice list, kept up to date: browsers load voices after the page starts. */
export function useVoices(lang: string): SpeechSynthesisVoice[] {
  const [voices, setVoices] = useState(() => voicesFor(lang));
  useEffect(() => {
    if (!speechSupported()) return;
    const update = () => setVoices(voicesFor(lang));
    update();
    speechSynthesis.addEventListener("voiceschanged", update);
    return () => speechSynthesis.removeEventListener("voiceschanged", update);
  }, [lang]);
  return voices;
}

/** Say `text` with the chosen voice (by voiceURI), or the best available one. */
export function speak(text: string | undefined, lang: string, voiceURI?: string, rate = 0.8) {
  if (!text || !speechSupported()) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const voices = voicesFor(lang);
    const voice = voices.find(v => v.voiceURI === voiceURI) ?? voices[0];
    if (voice) u.voice = voice;
    u.lang = voice?.lang ?? SPEECH_LANG[lang] ?? lang;
    u.rate = rate;
    speechSynthesis.speak(u);
  } catch { /* speech unavailable */ }
}
