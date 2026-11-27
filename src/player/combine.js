// =====================================================================================
//  USING THE HAND ON A SLOT: Ctrl+click (or Cmd+click) on a slot of the inventory or of an open container (chest, house,
//  cage) uses what is in the hand on it. What it gives stays where the thing was (in the container; if it does not fit
//  there, in the inventory). The relations are declared by the item clicked, with
//  `useWith: { <item in the hand>: { take, gives, amount, time, say } }` (e.g. pine cones: with the torch, 2 → 1 resin).
//  The knife on a live animal kills it for its meat (any `live` species).
// =====================================================================================
const countIn = (list, type) => list.reduce((n, r) => n + (r && r.type === type ? r.amount : 0), 0);
function useHandOn(k, z = "inv") {
  const tool = inHand(), list = zoneList(z), r = list?.[k];
  if (!r || player.dead || player.sleeping) return;
  const name = t => (RESOURCE_NAME[t] || t).toLowerCase();
  if (!tool) { notify("I have nothing in my hand to use on it"); return; }
  if (tool === "knife" && LIVE.has(r.type) && r.living?.length) {      // a live animal: its meat (with hide and bones)
    work("meat", 1.5, () => butcherLive(z, r.type));
    return;
  }
  const rule = DEF[r.type]?.useWith?.[tool], take = rule?.take || 1, gives = rule?.amount || 1;
  if (!rule) { notify(`I cannot do anything with the ${name(tool)} on the ${name(r.type)}`); return; }
  if (r.amount < take) { notify(`I need ${take} ${name(r.type)} for that`); return; }
  if (z !== "inv" && roomFor(list, rule.gives) + (countIn(list, r.type) <= take ? capOf(list) : 0) + roomFor(inventory, rule.gives) < gives) {
    notify("There is no room for what it would give"); return;   // a container: what it gives must fit in it (or in the inventory)
  }
  work("build", rule.time || 1.5, () => {
    const now = zoneList(z); if (!now || inHand() !== tool) return;
    if ((z === "inv" ? amountOf(r.type) - (inHand() === r.type ? hand.item.amount : 0) : countIn(now, r.type)) < take) return;
    spendFromList(now, r.type, take);
    giveTo(z, rule.gives, gives);
    if (WEAR_PER_USE[tool]) wearTool(tool);
    notify(rule.say || `I made ${gives} ${name(rule.gives)} from ${take} ${name(r.type)}`);
  });
}
function spendFromList(list, type, n) {                // like spend(), but never from the hand (the hand holds the tool)
  for (let k = 0; k < list.length && n > 0; k++) {
    const r = list[k]; if (!r || r.type !== type) continue;
    const m = Math.min(n, r.amount); r.amount -= m; n -= m; if (r.amount <= 0) list[k] = null;
  }
  renderInventory();
}
function giveTo(z, type, n) {                          // into that container (what does not fit: the inventory), or the inventory
  if (z === "inv") { store(type, n); return; }
  const rest = addStack(zoneList(z), { type, amount: n });
  if (rest) store(type, rest.amount); else renderInventory();
}
function butcherLive(z, type) {
  const list = zoneList(z); if (!list) return;
  const k = list.findIndex(x => x && x.type === type && x.living?.length); if (k < 0 || inHand() !== "knife") return;
  const r = list[k], ind = r.living.shift(); r.amount = r.living.length; if (!r.amount) list[k] = null;
  const e = SPECIES[type], a = { type, born: ind.born ?? 0 }, n = e.grab ? e.grab.meat(a) : MEAT[type] ?? 1;   // turtles: by their size
  recordDeath(a, "hunted by the character");
  giveTo(z, "meat", n); wearTool("knife");
  notify(`I got ${n} meat${z === "inv" ? partsOf(a) : partsInto(z, a)}`);
}
function partsInto(z, a) {                             // hide and bones of an animal killed in a container: into that container
  const e = SPECIES[a.type], got = [];
  for (const [t, n] of [["hide", e.hide], ["bones", e.bones]]) if (n) { giveTo(z, t, n); got.push(`${n} ${n === 1 && t === "bones" ? "bone" : RESOURCE_NAME[t].toLowerCase()}`); }
  return got.length ? ", " + got.join(", ") : "";
}
