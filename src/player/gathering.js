function store(type, n) {                          // into the inventory, grouped by type (no amount limit for now)
  if (n <= 0) return;
  if (hand.item?.type === type) { hand.item.amount += n; renderInventory(); return; }   // adds to what is in the hand
  let r = inventory.find(r => r && r.type === type);
  if (!r) {
    const k = inventory.indexOf(null);
    if (k < 0) { if (!hand.item) hand.item = { type, amount: n }; else notify(SAY.full); renderInventory(); return; }
    r = inventory[k] = { type, amount: 0 };
  }
  r.amount += n;
  renderInventory();
}
function dropHand(type, i) {                          // the whole hand stack goes to the ground (a pile you can gather again)
  const r = hand.item;
  if (!r || r.type !== type) return;
  if (r.living) { for (const v of r.living) freeIndividual(v, i); hand.item = null; renderInventory(); notify(`I set the ${(r.living.length > 1 ? RESOURCE_NAME[type] : SINGULAR[type]).toLowerCase()} free`); return; }
  if (!addAround(i, "pile", { stack: r }, 3)) { notify("There is no room to leave it here"); return; }
  hand.item = null; if (type === "torch") hand.torchLeft = 0;
  renderInventory();
  notify(`I leave ${r.amount > 1 ? r.amount + " " : "the "}${(RESOURCE_NAME[type] || type).toLowerCase()} here`);
}
// harvestable: anything whose definition has a `harvest` rule that is ready now (see ARCHITECTURE.md)
const HARVESTABLE = o => { const h = DEF[o.type]?.harvest; return !!h && (!h.ready || h.ready(o)); };
const hasHarvestable = i => i !== undefined && i >= 0 && objs(i).some(HARVESTABLE);
function harvestAtNow(i) {                           // gathers everything harvestable in the cell
  const done = {}, sum = (t, n) => { if (n > 0) { done[t] = (done[t] || 0) + n; store(t, n); } };
  let full = false;
  for (const o of [...objs(i)]) {
    if (!HARVESTABLE(o)) continue;
    const h = DEF[o.type].harvest;
    if (h.stack) {                                       // a pile: gives back whole stacks (tools keep their wear, jars their water…)
      const r = h.stack(o);
      if (!storeStack(r)) { full = true; continue; }
      done[r.type] = (done[r.type] || 0) + r.amount; removeObject(o); continue;
    }
    if (!hasRoom(h.gives)) { full = true; continue; }   // does not fit: stays on the ground
    sum(h.gives, h.amount(o));
    if (o.wear) keepWear(h.gives, o.wear);               // e.g. the thrown axe keeps its wear
    if (h.remove) removeObject(o); else h.take(o);
  }
  const parts = Object.entries(done).map(([t, n]) => `${n} ${(RESOURCE_NAME[t] || t).toLowerCase()}`);
  if (parts.length) notify("I got " + parts.join(", ") + (full ? " (I cannot carry more)" : ""));
  else if (full) notify(SAY.full);
}
