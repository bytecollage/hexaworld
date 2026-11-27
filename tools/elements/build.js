// Dev tool: builds hexaworld.html, the element map (how every species, plant, item and building depends on and
// interacts with the others). Run it with `node tools/elements/build.js` after changing content or game rules.
//   - Content traits are read from the definitions (extract.js): preys, diets, fruit, sprouts, harvest, strip,
//     useWith, fuel, recipes and builds.
//   - Rules that live in the engine code, not in traits, are written by hand below ("ENGINE RULES"), from BEHAVIOR.md.
//     Keep them in sync with BEHAVIOR.md until they become traits (see CONTENT_MODEL_PLAN.md).
//   - Pictures come from pictures.json, made from the running game by capture.sh (run it when a drawing changes).
"use strict";
const fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..", "..");
const D = require("./extract.js")(ROOT);
const N = {};            // id -> { name, kind, sub }
const add = (id, name, kind, sub = "") => { if (!N[id]) N[id] = { name, kind, sub }; return id; };
const nameOf = d => typeof d.name === "string" ? d.name : d.name?.one ?? d.id;
const S = x => x?.set ?? x ?? [];

// ---- nodes
const recipeGroup = {};
for (const r of D.recipes) recipeGroup[r.id] = r.group;
const PRODUCTS = new Set([...D.recipes.map(r => r.id), ...Object.keys(D.builds)]);
for (const d of D.item) add(d.id, nameOf(d), PRODUCTS.has(d.id) ? ({ crafts: "craft", tools: "tool", fire: "fire", capture: "capture" })[recipeGroup[d.id]] : "resource");
for (const r of D.recipes) add(r.id, r.name, ({ crafts: "craft", tools: "tool", fire: "fire", capture: "capture" })[r.group]);
for (const [id, b] of Object.entries(D.builds)) add(id, b.name.replace(/ \(.*\)/, ""), b.group === "capture" ? "capture" : "build");
for (const d of D.flora) add(d.id, nameOf(d), "plant", d.tree ? "tree" : "");
for (const d of D.feature) add(d.id, nameOf(d), "feature");
for (const d of D.structure) add(d.id, nameOf(d), PRODUCTS.has(d.id) ? N[d.id]?.kind : "build");
for (const d of D.fauna) add(d.id, nameOf(d), d.hunt ? "predator" : "animal", S(d.tags).includes?.("underwater") || S(d.tags).includes?.("drawnInWater") ? "water" : "");
add("flowers", "Flowers", "plant");
add("carcass", "Carcass", "special"); add("lake", "Lake water", "special"); add("water", "Water", "resource");
add("sapling", "Sapling", "resource"); add("live", "Live animal", "resource"); add("wood", "Wood", "resource");

N.house.name = "House";

// ---- 1. crafting tree
const tree = [];
const all = [...D.recipes, ...Object.entries(D.builds).map(([id, b]) => ({ id, ...b }))];
for (const r of all) {
  for (const [m, q] of Object.entries(r.cost || {})) tree.push({ f: m, t: r.id, r: "cost", q });
  for (const p of r.requires || []) tree.push({ f: p, t: r.id, r: "learn" });
  for (const p of r.tools || []) tree.push({ f: p, t: r.id, r: "tool" });
}
const extra = {};          // per product: needsFire, container, hidden, text
for (const r of all) extra[r.id] = { fire: !!r.needsFire, container: r.container || 0, hidden: !!r.hidden, text: r.text };

// =====================================================================================
// ENGINE RULES: sections 2-4 mix traits with rules written by hand from BEHAVIOR.md (amounts, tools, links
// coded in the engine). Each entry names the engine file that implements it.
// =====================================================================================
// ---- 2. where things come from: { res, from, tool, act, amt, file }
const src = [];
const S1 = (res, from, tool, act, amt, file) => src.push({ res, from, tool, act, amt, file });
for (const d of [...D.item, ...D.flora]) {
  const h = d.harvest; if (!h) continue;
  if (h.stack) { S1("pile", d.id, "hand", "pick up a pile", "the whole stack it holds", "content/items/pile.js"); continue; }
  const k = d.harvest.knife;
  S1(h.gives, d.id, "hand", d.id === h.gives ? "gather from the ground" : "gather", `${h.time} s`, "src/player/gathering.js");
  if (k) S1(h.gives, d.id, "knife", "cut with the knife", `×${k.more} in ×${k.faster} the time`, "src/player/gathering.js");
}
for (const d of D.flora) if (d.strip) S1(d.strip.gives, d.id, "knife", "strip without felling", `${d.strip.amount}${d.strip.adultAmount ? "-" + d.strip.adultAmount : ""}, again after ${d.strip.rest} day`, "src/player/tools.js");
const CHOP = { fruitTree: "5 / 10 fruit", palm: "10 coconuts (adult)", pine: "1-2 pine cones (adult)" };
for (const d of D.flora) if (d.tree) {
  S1("branches", d.id, "axe", "chop down", "5 young / 10 adult", "src/player/tools.js");
  const f = d.tree.fruit || d.tree.fallFruit;
  S1(f, d.id, "axe", "chop down", CHOP[d.id], "src/player/tools.js");
  if (d.tree.fruit) S1(d.tree.fruit, d.id, "nature", "drops it in summer", "1-2 at its foot", "src/sim/flora.js");
  if (d.tree.fallFruit) S1(d.tree.fallFruit, d.id, "nature", "left when it dies", "1-3", "src/sim/flora.js");
  S1("charcoal", d.id, "torch", "burn it (wildfire)", "2 young / 5 adult", "src/sim/wildfire.js");
}
for (const d of D.feature) if (d.outcrop) S1("stones", d.id, "pickaxe", "break off rock", "falls around it, never runs out", "src/player/capture.js");
for (const d of D.fauna) {
  const tags = S(d.tags);
  if (tags.includes("huntable") || tags.includes("stunnable")) {
    S1("meat", d.id, "knife", "cut a dead one", `${d.meat || 1}`, "src/player/tools.js");
    if (d.hide) S1("hide", d.id, "knife", "cut a dead one", `${d.hide}`, "src/player/tools.js");
    if (d.bones) S1("bones", d.id, "knife", "cut a dead one", `${d.bones}`, "src/player/tools.js");
  }
  if (d.grab) S1("meat", d.id, "knife", "grab it with the knife", d.id === "turtle" ? "1 young / 3 adult" : "1", "src/player/tools.js");
  if (d.grab) S1("live", d.id, "hand", "grab it", "alive", "src/player/tools.js");
  if (tags.includes("stunnable")) S1("live", d.id, "stones", "stun it, then take it", "alive", "src/player/tools.js");
  if (d.needs?.diet?.takesBait || (d.needs?.diet?.set && tags.includes("smallMammal"))) S1("live", d.id, "trap", "baited trap", "alive", "src/player/capture.js");
}
S1("bones", "carcass", "torch", "burnt by a wildfire", "bones on the ground", "src/sim/wildfire.js");
for (const d of D.item) for (const [hand, u] of Object.entries(d.useWith || {})) S1(u.gives, d.id, hand, `Ctrl+click ${u.take} in the inventory`, `${u.amount}`, "src/player/combine.js");
for (const d of D.flora) if (d.plantable) S1("sapling", d.id, "shovel", "dig it up", "1 sapling", "src/player/capture.js");
S1("water", "lake", "jar", "fill the jar", "5 water (not the sea)", "src/player/capture.js");
for (const r of D.recipes) if (Object.keys(r.cost).length) S1(r.id, "workshop", "workshop", "craft", Object.entries(r.cost).map(([m, q]) => `${q} ${m}`).join(" + "), "src/player/crafting.js");

// ---- 3. ecosystem
const eco = [];
const E = (f, t, r, note) => { if (N[f] && N[t]) eco.push({ f, t, r, note }); };
const ITEMFROM = { bush: "bush" };
for (const d of D.fauna) {
  for (const x of S(d.needs?.diet)) E(x, d.id, "eats");
  for (const x of S(d.needs?.hungryDiet)) E(x, d.id, "starving", "only when very hungry");
  for (const x of S(d.hunt?.preys)) E(x, d.id, "hunts");
  if (d.hunt?.fallbackFood) E(d.hunt.fallbackFood, d.id, "starving", "when it finds no prey");
  for (const x of S(d.chasesOff?.ids)) E(d.id, x, "rival", "chases it off");
  if (S(d.tags).includes("bigPrey") || d.leavesCarcass) E(d.id, "carcass", "carcass", S(d.tags).includes("bigPrey") ? "left when it is hunted" : "left when it dies");
  if (d.hunt?.mode === "scavenger") E("carcass", d.id, "eats", "searches up to 14 cells");
  if (d.needs?.house) E("burrow", d.id, "home");
}
E("fruitTree", "parrot", "eats", "eats tree fruit"); E("palm", "parrot", "home"); E("fruitTree", "parrot", "home");
E("parrot", "fruitTree", "cycle", "drops seeds 5-15 cells away");
E("flowers", "beehive", "eats", "needs ≥4 nearby to survive winter");
E("beehive", "fruitTree", "pollinates", "full fruit only with a hive ≤6 cells"); E("beehive", "bush", "pollinates", "4 berries instead of 2");
E("turtle", "nest", "cycle", "lays 3-5 eggs on the beach"); E("nest", "turtle", "cycle", "hatches after 5 days");
E("burrow", "fox", "home"); E("pine", "eagle", "home", "nest in an adult pine");
E("carcass", "tallGrass", "fertilizes"); E("carcass", "flowers", "fertilizes");
for (const d of D.flora) {
  if (d.tree?.beehives) E(d.id, "beehive", "home");
  if (d.tree?.fruit) E(d.id, d.tree.fruit, "cycle", "drops it in summer");
  else if (d.tree?.fallFruit) E(d.id, d.tree.fallFruit, "cycle", "left when it dies");
  if (d.tree?.shelter) for (const a of ["deer", "peccary", "coati", "raccoon", "opossum", "armadillo"]) E(d.id, a, "home", "groves are shelter");
}
for (const d of D.item) if (d.sprouts) E(d.id, d.sprouts.plant, "cycle", d.id === "berries" ? "sown by hand" : "sprouts when it rots");
E("bush", "berries", "cycle", "4 per season");
E("lake", "caiman", "home", "lies in wait on the shore");

// ---- 4. in your hand: { hand, target, does, result, file }
const hand = [];
const H = (h, targets, does, result, file) => hand.push({ hand: h, targets, does, result, file });
const fa = D.fauna, ids = f => fa.filter(f).map(d => d.id);
const huntable = ids(d => S(d.tags).includes("huntable"));
H("axe", D.flora.filter(d => d.tree).map(d => d.id), "chop it down", "wood and fruit", "src/player/tools.js");
H("axe", huntable, "throw it (≤ 4.5 cells, 55%)", "dead animal; the axe stays on the ground", "src/player/tools.js");
H("bow", huntable, "shoot (≤ 9 cells, up to 75%)", "dead animal", "src/player/capture.js");
H("stones", ids(d => S(d.tags).includes("stunnable")), "throw 1 stone (≤ 4.5 cells, 60%)", "stunned for about 30 s", "src/player/tools.js");
H("knife", ["carcass"], "cut the meat", "meat, hide, bones", "src/player/tools.js");
H("knife", ids(d => d.grab), "grab it", "meat instead of a live animal", "src/player/tools.js");
H("knife", ["tallGrass"], "cut grass", "double grass in half the time", "src/player/gathering.js");
H("knife", D.flora.filter(d => d.strip).map(d => d.id), "strip branches", "wood without felling", "src/player/tools.js");
H("hammer", ["campfire", "bonfire", "trap", "cage", "fence", "gate", "chest", "house", "hut"], "dismantle", "its materials back", "src/player/building.js");
H("pickaxe", D.feature.filter(d => d.outcrop).map(d => d.id), "break off rock", "stones around it", "src/player/capture.js");
H("shovel", D.flora.filter(d => d.plantable).map(d => d.id), "dig it up", "a sapling to replant", "src/player/capture.js");
H("torch", [...D.flora.map(d => d.id), ...D.item.filter(d => d.fuel && D.item.find(x => x.id === d.id)?.layer === "low").map(d => d.id)], "set it on fire", "a wildfire: charcoal, bones, scorched ground", "src/sim/wildfire.js");
H("jar", ["lake"], "fill it", "5 water for caged animals", "src/player/capture.js");
H("seed", D.item.filter(d => d.sprouts).map(d => d.id), "sow it on free ground", D.item.filter(d => d.sprouts).map(d => `${d.id} → ${d.sprouts.plant}`).join(", "), "src/player/capture.js");
H("sapling", ["sapling"], "replant it", "the plant, growing in a day", "src/player/capture.js");
H("trap", ["trap"], "place it (uses 1 fruit or berry as bait)", "catches small mammals alive", "src/player/capture.js");
H("hand", D.item.filter(d => d.harvest).map(d => d.id).concat(D.flora.filter(d => d.harvest).map(d => d.id)), "gather", "into the inventory", "src/player/gathering.js");
H("hand", ids(d => d.grab), "grab it", "a live animal", "src/player/tools.js");
H("hand", ["campfire", "bonfire"], "feed it", "throws one unit of fuel", "src/player/work.js");
H("hand", ["hut", "house", "chest", "cage"], "enter or open", "safety, sleep, storage", "src/ui/containers.js");
H("ctrl", ["coconut"], "Ctrl+click with a knife, axe, hammer, pickaxe or stones", "open coconut", "src/player/combine.js");
H("ctrl", ["pineCone"], "Ctrl+click 2 with the torch", "resin", "src/player/combine.js");

const danger = fa.filter(d => d.hunt?.threatensPlayer || d.provoke).map(d => ({ id: d.id, how: d.hunt?.threatensPlayer, provoke: d.provoke ? { radius: d.provoke.radius, times: d.provoke.times, kills: d.provoke.kills } : null }));
const fuel = [...D.item, ...D.flora].filter(d => d.fuel).map(d => ({ id: d.id, days: d.fuel })).sort((a, b) => b.days - a.days);
const captive = fa.filter(d => d.live).map(d => ({ id: d.id, diet: d.live.diet || [...S(d.needs?.diet)] }));

// ---- pictures as the game shows them (pictures.json, made by capture.sh from the running game)
const IC = fs.existsSync(path.join(__dirname, "pictures.json")) ? require("./pictures.json") : { draw: {}, icon: {}, emoji: {} };
const svgUri = v => "data:image/svg+xml;charset=utf-8," + encodeURIComponent(v.includes("xmlns") ? v : v.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"'));
const UI_KINDS = new Set(["resource", "craft", "tool", "fire", "capture", "build"]);   // seen in the inventory or the workshop
const img = {};
for (const id of Object.keys(N)) {
  const ui = IC.icon[id] ? { src: svgUri(IC.icon[id]) } : IC.emoji[id] ? { emoji: IC.emoji[id] } : null;
  const map = IC.draw[id] ? { src: IC.draw[id], map: true } : null;
  const pic = UI_KINDS.has(N[id].kind) ? ui || map : map || ui;
  if (pic) img[id] = pic;
}
if (img.axe) img.groundAxe = img.axe;   // the thrown axe lying on the ground
img.sapling = { emoji: IC.emoji.sapling_tallGrass || "🌱" }; img.water = { emoji: "💧" };
if (IC.draw.waterLily) img.lake = { src: IC.draw.waterLily, map: true };
const DATA = { nodes: N, tree, extra, src, eco, hand, danger, fuel, captive, img };
const tpl = fs.readFileSync(path.join(__dirname, "template.html"), "utf8");
const today = new Date().toISOString().slice(0, 10);
fs.writeFileSync(path.join(ROOT, "hexaworld.html"), tpl.replaceAll("{{GENERATED}}", today).replace("/*DATA*/null", () => JSON.stringify(DATA)));
console.log("hexaworld.html:", Object.keys(N).length, "elements,", tree.length + src.length + eco.length, "relations,", Object.keys(img).length, "pictures");
