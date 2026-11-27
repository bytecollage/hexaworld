// Dev tool: reads every content definition and the workshop's recipes and builds, without a browser.
// The content files run in a Node sandbox whose define*() functions only collect the definitions; every engine
// helper is a harmless stub (content files call the engine only inside functions, never while loading).
// Used by tools/elements/build.js; `node tools/elements/extract.js` prints what it found.
"use strict";
const fs = require("fs"), vm = require("vm"), path = require("path");

function extract(root = path.join(__dirname, "..", "..")) {
  const defs = { fauna: [], flora: [], item: [], feature: [], structure: [] };
  const stub = new Proxy(function () {}, { get: (t, k) => k === Symbol.toPrimitive ? () => 0 : stub, apply: () => stub, construct: () => stub });
  const ctx = {
    Set, Map, Math, Object, Array, JSON, Number, String, console,
    defineFauna: d => defs.fauna.push(d), defineFlora: d => defs.flora.push(d), defineItem: d => defs.item.push(d),
    defineFeature: d => defs.feature.push(d), defineStructure: d => defs.structure.push(d), defineSpawner: () => {},
  };
  const sandbox = new Proxy(ctx, { has: () => true, get: (t, k) => k in t ? t[k] : (k === Symbol.unscopables ? undefined : stub) });
  vm.createContext(ctx);
  ctx.__s = sandbox;
  const reg = fs.readFileSync(path.join(root, "content/registry.js"), "utf8");
  const list = eval(reg.match(/const CONTENT = (\[[\s\S]*?\]);/)[1]);
  // all files in one scope, in registry order, like the browser does (shared bases such as SMALL_MAMMAL must be visible)
  const all = list.map(f => `try {\n${fs.readFileSync(path.join(root, "content", f), "utf8")}\n} catch (e) { console.error("content/${f}:", e.message); }`).join("\n")
    .replace(/^const ([A-Z_]+) = /gm, "var $1 = ");
  vm.runInContext(`with (__s) {\n${all}\n}`, ctx);

  const plain = (v, d = 0) => {                        // Sets become { set: [...] }, functions "fn", drawings dropped
    if (v instanceof Set) return Object.assign({ set: [...v] }, v.takesBait ? { takesBait: true } : {});
    if (typeof v === "function") return "fn";
    if (Array.isArray(v)) return v.map(x => plain(x, d + 1));
    if (v && typeof v === "object") { if (d > 4) return "…"; const o = {}; for (const k in v) if (k !== "draw") o[k] = plain(v[k], d + 1); return o; }
    return v;
  };
  const out = {};
  for (const k in defs) out[k] = defs[k].map(d => plain(d));
  const craft = fs.readFileSync(path.join(root, "src/player/crafting.js"), "utf8");
  out.recipes = eval(craft.match(/const RECIPES = (\[[\s\S]*?\n\]);/)[1]);
  const bld = fs.readFileSync(path.join(root, "src/player/building.js"), "utf8");
  out.builds = eval("(" + bld.match(/const BUILDS = (\{[\s\S]*?\n\});/)[1] + ")");
  return out;
}

module.exports = extract;
if (require.main === module) {
  const out = extract();
  for (const k in out) console.log(k.padEnd(10), Array.isArray(out[k]) ? out[k].map(d => d.id).join(", ") : Object.keys(out[k]).join(", "));
}
