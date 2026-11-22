// Make artifact/letterbox.html from the built index.html: the claude.ai artifact host adds its own
// <!doctype>, <html>, <head> and <body>, so this keeps only what goes inside them.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const head = html.match(/<head>([\s\S]*?)<\/head>/)[1]
  .replace(/<meta charset[^>]*>\s*/, "")
  .replace(/<meta name="viewport"[^>]*>\s*/, "");
const body = html.match(/<body>([\s\S]*?)<\/body>/)[1];
mkdirSync(new URL("../artifact/", import.meta.url), { recursive: true });
writeFileSync(new URL("../artifact/letterbox.html", import.meta.url), head.trim() + "\n" + body.trim() + "\n");
