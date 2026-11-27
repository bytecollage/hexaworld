// Coconut: falls from palms whole; rots after 5 days and may sprout on sand. Broken open with a tool (Ctrl+click on it with
// the knife, axe, hammer, pickaxe or stones in the hand) it gives an open coconut: food, and the material of the jar.
const OPEN_COCONUT = { take: 1, gives: "openCoconut", amount: 1, time: 1.5, say: "I broke the coconut open" };
defineItem({
  id: "coconut",
  name: "Coconuts",
  groundName: "Coconuts",
  fuel: 0.08,                                       // days of fire it adds when thrown on a fire (the dry husk burns well)
  layer: "low",
  movedByHouse: true,
  harvest: { gives: "coconut", time: 0.5, amount: () => 1, remove: true },
  sprouts: { plant: "palm", ground: "sand", chance: 0.8 },
  useWith: { knife: OPEN_COCONUT, axe: OPEN_COCONUT, hammer: OPEN_COCONUT, pickaxe: OPEN_COCONUT, stones: OPEN_COCONUT },
  draw(it) {                       // coconut fallen at the foot of the palm
    const p = it.p, scl = cam.zoom * p[2], tall = scl * Math.max(Math.sin(cam.tilt * Math.PI / 180), 0.45);
    ctx.beginPath(); groundEllipse(it.x, it.y, 0.12, 0.09); ctx.fillStyle = "rgba(0,0,0,.22)"; ctx.fill();
    circle(p[0], p[1] - tall * 0.08, scl * 0.09, "#6b4423");
    circle(p[0] - scl * 0.03, p[1] - tall * 0.08 - scl * 0.03, scl * 0.03, "rgba(255,255,255,.25)");
  },
});
