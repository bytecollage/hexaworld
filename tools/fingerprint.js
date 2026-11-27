// Deterministic fingerprint of the simulation, used to prove that a refactor did not change behavior.
// Needs a global `FP` adapter (see fp-adapter-*.js) that exposes the game's internals under neutral names.
// Writes the result as JSON into <pre id="fp-out"> and sets document.title = "FP_DONE".
(function () {
  const CASES = window.FP_CASES || [
    { seed: 1, test: false, days: [0, 40, 120] },
    { seed: 42, test: false, days: [0, 60] },
    { seed: 1, test: true, days: [0, 100, 200] },
    { seed: 777, test: true, days: [0, 200] },
  ];

  function hashStep(h, v) { return (Math.imul(h ^ (v | 0), 16777619) >>> 0); }
  const r3 = v => Math.round(v * 1000);

  function snapshot() {
    const w = FP.world();
    const terrainNames = FP.terrains();
    let terrain = 2166136261;
    for (let i = 0; i < w.cells.length; i++) terrain = hashStep(terrain, terrainNames.indexOf(FP.terrainAt(i)));
    const objects = {};
    for (let i = 0; i < w.cells.length; i++) for (const o of FP.objectsAt(i)) {
      const e = objects[o.type] || (objects[o.type] = [0, 2166136261]);
      e[0]++; e[1] = hashStep(hashStep(hashStep(e[1], i), r3(o.ox)), r3(o.oy));
    }
    const animals = {};
    for (const a of w.animals) {
      const e = animals[a.type] || (animals[a.type] = { alive: 0, dead: 0, pos: 2166136261 });
      if (a.dead) e.dead++; else e.alive++;
      e.pos = hashStep(hashStep(e.pos, r3(a.x)), r3(a.y));
    }
    return { cells: w.cells.length, day: FP.day(), terrain, objects, animals, stats: JSON.parse(JSON.stringify(FP.stats())) };
  }

  async function run() {
    const out = [];
    for (const c of CASES) {
      FP.newWorld(c.seed, c.test);
      let done = 0;
      for (const d of c.days) {
        if (d > done) { await FP.simulate(d - done); done = d; }
        out.push({ seed: c.seed, test: c.test, day: d, ...snapshot() });
      }
    }
    return out;
  }

  window.addEventListener("load", () => setTimeout(async () => {
    let text;
    await booted;                                   // the game's own first world is made after the loading screen: wait for it
    try { if (window.__errors && window.__errors.length) throw new Error("load errors: " + window.__errors.join(" | ")); text = JSON.stringify(await run()); } catch (e) { text = "FP_ERROR " + (e && e.stack || e); }
    const pre = document.createElement("pre"); pre.id = "fp-out"; pre.textContent = text;
    document.body.appendChild(pre); document.title = "FP_DONE";
  }, 0));
})();
