// =====================================================================================
//  PERFORMANCE PANEL (Options → FPS, top right): frames per second, how busy the game's thread is, where each frame's
//  time goes, how many things exist and how many are drawn, JS memory and the system's CPU pressure. Refreshed every
//  0.5 s. The game runs on a single thread (no workers); the browser does not expose the process's real CPU use, so the
//  "thread busy" share (the game's work / the time between frames) is the measure of its CPU load.
// =====================================================================================
const PERF_WINDOW = 500;                               // ms between refreshes
const perf = {
  frames: 0, since: performance.now(), work: 0,        // this window: frames, ms of work
  sim: 0, draw: 0, slow: 0, slowRuns: 0,               // ms in the animals' simulation, in drawing, in the slow systems (every 0.5 s)
  stepped: 0,                                          // animals simulated (not skipped by the level of detail)
  longTasks: 0, longHistory: [],                       // browser tasks over 50 ms: this window and the last 20 windows (10 s)
  pressure: null,                                      // "nominal" | "fair" | "serious" | "critical" (Compute Pressure API), if available
  objects: null,                                       // what exists in the world (counted when the panel refreshes)
};
const drawStats = { items: 0 };                        // things drawn in the last frame (scene.js)
try { new PerformanceObserver(list => { perf.longTasks += list.getEntries().length; }).observe({ type: "longtask" }); } catch (e) { /* not in this browser */ }
try {
  if ("PressureObserver" in window) new PressureObserver(rs => { perf.pressure = rs[rs.length - 1].state; }).observe("cpu", { sampleInterval: 1000 }).catch(() => {});
} catch (e) { /* not in this browser, or not allowed from file:// */ }
const timed = (key, f) => { const t = performance.now(); f(); perf[key] += performance.now() - t; };   // loop.js: time one part of the frame

function countObjects() {                              // trees, other plants, things on the ground (items and piles), features (nests, burrows…), builds
  const c = { trees: 0, plants: 0, ground: 0, features: 0, builds: 0 };
  for (const l of world.objects || []) if (l) for (const o of l) {
    const d = DEF[o.type];
    if (TREES.has(o.type)) c.trees++;
    else if (d?.kind === "flora") c.plants++;
    else if (d?.kind === "structure") c.builds++;
    else if (d?.kind === "feature") c.features++;
    else c.ground++;
  }
  return c;
}
const PRESSURE_NAME = { nominal: "low", fair: "moderate", serious: "high", critical: "critical" };
function updateFps(t, workMs) {
  const m = perf, el = $("fps"), on = $("showFps").checked;
  el.hidden = !on;
  m.frames++; m.work += workMs;
  if (t - m.since < PERF_WINDOW) return;
  m.longHistory.push(m.longTasks); if (m.longHistory.length > 20) m.longHistory.shift();
  if (on) {
    const span = t - m.since, n = m.frames, fps = n * 1000 / span, busy = Math.min(100, m.work / span * 100);
    const o = countObjects(), alive = world.animals.filter(a => !a.dead && !a.toRemove).length;
    const mem = performance.memory ? `JS memory ${(performance.memory.usedJSHeapSize / 1048576).toFixed(0)} MB · ` : "";
    const cpu = m.pressure ? `CPU pressure ${PRESSURE_NAME[m.pressure] || m.pressure} · ` : "";
    el.textContent = [
      `${fps.toFixed(0)} fps · ${(m.work / n).toFixed(1)} ms/frame · thread ${busy.toFixed(0)}% busy · zoom ${cam.zoom.toFixed(0)}`,
      `animals ${(m.sim / n).toFixed(1)} ms · drawing ${(m.draw / n).toFixed(1)} ms · slow systems ${m.slowRuns ? (m.slow / m.slowRuns).toFixed(1) : "–"} ms (every 0.5 s)`,
      `animals ${alive} (${Math.round(m.stepped / n)} simulated/frame) · drawn ${drawStats.items}`,
      `trees ${o.trees} · plants ${o.plants} · on the ground ${o.ground} · nests and burrows ${o.features} · builds ${o.builds}`,
      `${mem}${cpu}long tasks ${m.longHistory.reduce((s, k) => s + k, 0)} in 10 s · 1 thread of ${navigator.hardwareConcurrency || "?"} cores`,
    ].join("\n");
    el.className = "fps" + (fps < 30 ? " bad" : fps < 50 ? " slow" : "");
  }
  Object.assign(m, { frames: 0, work: 0, sim: 0, draw: 0, slow: 0, slowRuns: 0, stepped: 0, longTasks: 0, since: t });
}
