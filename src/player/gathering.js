function store(type, n) {                          // into the hand (if it holds the same), then the inventory; what does not fit is left on the ground
  if (n <= 0) return;
  const r = { type, amount: n };
  if (hand.item?.type === type && !single(hand.item)) { const m = Math.min(STACK_LIMIT.inventory - hand.item.amount, r.amount); hand.item.amount += Math.max(0, m); r.amount -= Math.max(0, m); }
  if (r.amount) addStack(inventory, r);
  if (r.amount && !hand.item) { const m = Math.min(r.amount, type === "jar" ? 1 : STACK_LIMIT.inventory); hand.item = { type, amount: m }; r.amount -= m; }
  if (r.amount && player.i >= 0) { dropStack(player.inside ? doorOf(player.inside) : player.i, r); notify(`I cannot carry more: I leave ${r.amount} ${(RESOURCE_NAME[type] || type).toLowerCase()} on the ground`); }
  renderInventory();
}
function dropHand(type, i) {                          // the whole hand stack goes to the ground (a pile you can gather again)
  const r = hand.item;
  if (!r || r.type !== type) return;
  if (r.living) { for (const v of r.living) freeIndividual(v, i); hand.item = null; renderInventory(); notify(`I set the ${(r.living.length > 1 ? RESOURCE_NAME[type] : SINGULAR[type]).toLowerCase()} free`); return; }
  if (!dropStack(i, r)) { notify("There is no room to leave it here"); return; }
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
      const r = h.stack(o), before = r.amount;
      const ok = storeStack(r); done[r.type] = (done[r.type] || 0) + before - (ok ? 0 : r.amount);   // what fits (the rest stays in the pile)
      if (ok) removeObject(o); else full = true;
      continue;
    }
    if (!hasRoom(h.gives)) { full = true; continue; }   // does not fit: stays on the ground
    const knife = h.knife && inHand() === "knife";        // e.g. tall grass cut with the knife: more of it
    sum(h.gives, Math.round(h.amount(o) * (knife ? h.knife.more : 1)));
    if (knife) wearTool("knife");
    if (o.wear) keepWear(h.gives, o.wear);               // e.g. the thrown axe keeps its wear
    if (h.remove) removeObject(o); else h.take(o);
  }
  const parts = Object.entries(done).map(([t, n]) => `${n} ${(RESOURCE_NAME[t] || t).toLowerCase()}`);
  if (parts.length) notify("I got " + parts.join(", ") + (full ? " (I cannot carry more)" : ""));
  else if (full) notify(SAY.full);
}
