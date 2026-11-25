#!/usr/bin/env node
// Dev tool: token-aware renaming for a single-file HTML game (one inline <style>, one inline <script>).
//   node tools/rename.js extract <in.html>                         → vocabulary report (JSON) on stdout
//   node tools/rename.js apply <in.html> <out.html> <words.json> [texts.json]
// words.json : { "spanishWord": "englishWord" }  applied to whole words in identifiers, strings, templates, HTML and CSS
// texts.json : { "exact text": "replacement" }   applied to whole comments / string contents / template chunks / HTML text
// Comments are never word-mapped: they are matched by their original text in texts.json.
"use strict";
const fs = require("fs");

const WORD = /[\p{L}_$][\p{L}\p{N}_$]*/gu;
const REGEX_BEFORE = new Set(["(", ",", "=", ":", "[", "!", "&", "|", "?", "{", "}", ";", "+", "-", "*", "%", "<", ">", "~", "^", "=>", "return", "typeof"]);

// ---------- JS lexer: returns a flat token list; template literals carry nested token lists for ${...}
function lexJS(src, i = 0, untilBrace = false) {
  const out = [];
  let depth = 0, prev = null;
  const push = t => { out.push(t); if (t.t !== "ws" && t.t !== "com") prev = t; };
  while (i < src.length) {
    const c = src[i], d = src[i + 1];
    if (untilBrace && c === "}" && depth === 0) return { tokens: out, i };
    if (c === "/" && d === "/") { let j = src.indexOf("\n", i); if (j < 0) j = src.length; push({ t: "com", v: src.slice(i, j) }); i = j; continue; }
    if (c === "/" && d === "*") { const j = src.indexOf("*/", i + 2) + 2; push({ t: "com", v: src.slice(i, j) }); i = j; continue; }
    if (/\s/.test(c)) { let j = i; while (j < src.length && /\s/.test(src[j])) j++; push({ t: "ws", v: src.slice(i, j) }); i = j; continue; }
    if (c === '"' || c === "'") {
      let j = i + 1; while (src[j] !== c) { if (src[j] === "\\") j++; j++; }
      push({ t: "str", q: c, v: src.slice(i + 1, j) }); i = j + 1; continue;
    }
    if (c === "`") {
      const parts = []; let j = i + 1, chunk = "";
      while (src[j] !== "`") {
        if (src[j] === "\\") { chunk += src[j] + src[j + 1]; j += 2; continue; }
        if (src[j] === "$" && src[j + 1] === "{") {
          parts.push(chunk); chunk = "";
          const r = lexJS(src, j + 2, true); parts.push(r.tokens); j = r.i + 1; continue;
        }
        chunk += src[j++];
      }
      parts.push(chunk); push({ t: "tpl", parts }); i = j + 1; continue;
    }
    if (c === "/" && (prev === null || (prev.t === "punc" && REGEX_BEFORE.has(prev.v)) || (prev.t === "id" && REGEX_BEFORE.has(prev.v)))) {
      let j = i + 1, cls = false;
      while (true) { const x = src[j]; if (x === "\\") { j += 2; continue; } if (x === "[") cls = true; else if (x === "]") cls = false; else if (x === "/" && !cls) break; j++; }
      j++; while (/[a-z]/.test(src[j])) j++;
      push({ t: "re", v: src.slice(i, j) }); i = j; continue;
    }
    WORD.lastIndex = i; const m = WORD.exec(src);
    if (m && m.index === i) { push({ t: "id", v: m[0] }); i += m[0].length; continue; }
    if (/[0-9]/.test(c) || (c === "." && /[0-9]/.test(d))) { const m2 = /^(0x[0-9a-f]+|[0-9]*\.?[0-9]+(e[+-]?[0-9]+)?)/i.exec(src.slice(i)); push({ t: "num", v: m2[0] }); i += m2[0].length; continue; }
    if (c === "=" && d === ">") { push({ t: "punc", v: "=>" }); i += 2; continue; }
    if (c === "{") depth++; if (c === "}") depth--;
    push({ t: "punc", v: c }); i++;
  }
  return { tokens: out, i };
}

function emitJS(tokens, f) {
  let s = "";
  for (const t of tokens) {
    if (t.t === "id") s += f.id(t.v);
    else if (t.t === "str") s += t.q + f.str(t.v) + t.q;
    else if (t.t === "com") s += f.com(t.v);
    else if (t.t === "tpl") s += "`" + t.parts.map((p, k) => k % 2 ? "${" + emitJS(p, f) + "}" : f.chunk(p)).join("") + "`";
    else s += t.v;
  }
  return s;
}

function split(html) {
  const a = html.indexOf("<script>"), b = html.lastIndexOf("</script>");
  return { pre: html.slice(0, a + 8), js: html.slice(a + 8, b), post: html.slice(b) };
}

const wordMap = (s, W) => s.replace(WORD, w => (Object.prototype.hasOwnProperty.call(W, w) ? W[w] : w));

if (process.argv[2] === "strip") {               // code only: no comments, whitespace collapsed (for diffing)
  const { js } = split(fs.readFileSync(process.argv[3], "utf8"));
  const toks = lexJS(js).tokens.filter(t => t.t !== "com").map(t => (t.t === "ws" ? { t: "ws", v: /\n/.test(t.v) ? "\n" : " " } : t));
  console.log(emitJS(toks, { id: v => v, str: v => v, chunk: v => v, com: () => "" }).replace(/ *\n[\n ]*/g, "\n"));
} else if (process.argv[2] === "extract") {
  const { pre, js, post } = split(fs.readFileSync(process.argv[3], "utf8"));
  const ids = {}, strings = {}, chunks = {}, comments = [];
  emitJS(lexJS(js).tokens, {
    id: v => { ids[v] = (ids[v] || 0) + 1; return v; },
    str: v => { strings[v] = (strings[v] || 0) + 1; return v; },
    chunk: v => { if (v) chunks[v] = (chunks[v] || 0) + 1; return v; },
    com: v => { comments.push(v); return v; },
  });
  const markupWords = {}; for (const w of (pre + post).match(WORD) || []) markupWords[w] = (markupWords[w] || 0) + 1;
  console.log(JSON.stringify({ ids, strings, chunks, comments, markupWords }, null, 1));
} else if (process.argv[2] === "apply") {
  const [, , , inp, outp, wordsPath, textsPath] = process.argv;
  const W = JSON.parse(fs.readFileSync(wordsPath, "utf8"));
  const T = textsPath && fs.existsSync(textsPath) ? JSON.parse(fs.readFileSync(textsPath, "utf8")) : {};
  const has = k => Object.prototype.hasOwnProperty.call(T, k);
  const { pre, js, post } = split(fs.readFileSync(inp, "utf8"));
  const used = new Set();
  const text = v => { const m = wordMap(v, W); if (has(v)) { used.add(v); return T[v]; } if (has(m)) { used.add(m); return T[m]; } return m; };
  const outJS = emitJS(lexJS(js).tokens, {
    id: v => (Object.prototype.hasOwnProperty.call(W, v) ? W[v] : v),
    str: text, chunk: text,
    com: v => { if (has(v)) { used.add(v); return T[v]; } return v; },
  });
  // markup: whole-text replacements first (longest first), then the word map
  let markup = pre + "\u0000" + post;
  for (const k of Object.keys(T).sort((a, b) => b.length - a.length)) if (markup.includes(k)) { markup = markup.split(k).join(T[k]); used.add(k); }
  markup = wordMap(markup, W);
  const [p2, q2] = markup.split("\u0000");
  fs.writeFileSync(outp, p2 + outJS + q2);
  const unused = Object.keys(T).filter(k => !used.has(k));
  if (unused.length) console.error(`texts not applied (${unused.length}):\n` + unused.slice(0, 40).map(s => "  " + JSON.stringify(s).slice(0, 120)).join("\n"));
} else {
  console.error("usage: rename.js extract <in.html> | apply <in.html> <out.html> <words.json> [texts.json]");
  process.exit(1);
}
