#!/usr/bin/env node
// Compares a new fingerprint against tools/baseline.json (recorded from world.old.html with Spanish ids).
// Baseline keys and string values are translated with words.json (+ the few phrase ids below) before comparing.
// Usage: node tools/compare-fp.js <new.json> [baseline.json]
const fs = require("fs"), path = require("path");
const W = JSON.parse(fs.readFileSync(path.join(__dirname, "words.json"), "utf8"));
const PHRASES = { "cazado por ": "hunted by ", "sin flores": "no flowers", "cae su árbol": "its tree fell" };
const tr = s => { for (const [a, b] of Object.entries(PHRASES)) s = s.split(a).join(b); return s.replace(/[\p{L}_$][\p{L}\p{N}_$]*/gu, w => (Object.hasOwn(W, w) ? W[w] : w)); };
const map = x => Array.isArray(x) ? x.map(map) : x && typeof x === "object" ? Object.fromEntries(Object.entries(x).map(([k, v]) => [tr(k), map(v)])) : typeof x === "string" ? tr(x) : x;
const base = map(JSON.parse(fs.readFileSync(process.argv[3] || path.join(__dirname, "baseline.json"), "utf8")));
const now = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
let diffs = 0;
const sortKeys = x => Array.isArray(x) ? x.map(sortKeys) : x && typeof x === "object" ? Object.fromEntries(Object.keys(x).sort().map(k => [k, sortKeys(x[k])])) : x;
function diff(a, b, p) {
  if (JSON.stringify(sortKeys(a)) === JSON.stringify(sortKeys(b))) return;
  if (typeof a !== "object" || a === null || typeof b !== "object" || b === null) { if (diffs++ < 40) console.log("DIFF", p, JSON.stringify(a), "→", JSON.stringify(b)); return; }
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) diff(a[k], b[k], p + "." + k);
}
if (base.length !== now.length) console.log("DIFF snapshot count", base.length, "→", now.length);
base.forEach((s, i) => diff(s, now[i], `[seed ${s.seed}${s.test ? " test" : ""} day ${Math.round(s.day)}]`));
console.log(diffs ? `MISMATCH (${diffs} differences)` : `MATCH (${base.length} snapshots)`);
process.exit(diffs ? 1 : 0);
