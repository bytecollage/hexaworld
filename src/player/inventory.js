// ---- Inventory: slots for gathered elements (empty for now; they fill up when gathering)
const SLOTS = 10;
const inventory = Array(SLOTS).fill(null);      // each slot: null or { type, amount }

// ---- stack sizes: things of one type pile up in a slot up to the limit of its container, then take another slot.
//      A live animal always takes a whole slot of its own (one per slot), and so does each jar (it keeps its own water).
const STACK_LIMIT = { inventory: 20, chest: 50, house: 100, cage: 10 };   // the inventory's limit is also the hand's and the basket's
function capOf(list) {
  if (list === inventory) return STACK_LIMIT.inventory;
  if ((world.houses || []).some(h => h.storage === list)) return STACK_LIMIT.house;
  if ((world.cages || []).some(c => c.storage === list)) return STACK_LIMIT.cage;
  return STACK_LIMIT.chest;
}
const single = r => !!r?.living || r?.type === "jar";   // stacks that never merge
function roomFor(list, type, cap = capOf(list)) {       // how many more of `type` fit in the list
  const alone = type === "jar" || LIVE.has(type);
  let n = 0;
  for (const r of list) { if (!r) n += alone ? 1 : cap; else if (!alone && r.type === type && !single(r)) n += Math.max(0, cap - r.amount); }
  return n;
}
function addStack(list, r, cap = capOf(list)) {         // puts the stack r into the list (r keeps what did not fit); returns that rest, or null
  if (r.living) {
    while (r.living.length) { const k = list.indexOf(null); if (k < 0) break; list[k] = { type: r.type, amount: 1, living: [r.living.shift()] }; }
    r.amount = r.living.length; return r.amount ? r : null;
  }
  if (r.type === "jar") {
    while (r.amount > 0) { const k = list.indexOf(null); if (k < 0) break; list[k] = { ...r, amount: 1 }; r.water = 0; r.amount--; }
    return r.amount ? r : null;
  }
  for (const s of list) if (s && s.type === r.type && !single(s) && s.amount < cap && r.amount > 0) {
    const m = Math.min(cap - s.amount, r.amount); s.amount += m; r.amount -= m; s.wear = Math.max(s.wear || 0, r.wear || 0);
  }
  while (r.amount > 0) { const k = list.indexOf(null); if (k < 0) break; const m = Math.min(cap, r.amount); list[k] = { ...r, amount: m }; r.amount -= m; }
  return r.amount > 0 ? r : null;
}
function mergeSame(list, cap = capOf(list)) {           // tidies a list: each type packed into as few full slots as it needs, in place
  for (const t of new Set(list.filter(r => r && !single(r)).map(r => r.type))) {
    const ks = list.map((r, k) => r && r.type === t && !single(r) ? k : -1).filter(k => k >= 0);
    let total = ks.reduce((n, k) => n + list[k].amount, 0);
    const wear = Math.max(...ks.map(k => list[k].wear || 0)), proto = list[ks[0]];
    for (const k of ks) { const m = Math.min(cap, total); list[k] = m ? { ...proto, amount: m, wear } : null; total -= m; }
  }
}
