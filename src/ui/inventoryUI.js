// ---- drag and drop: containers (house, chest, basket: see containers.js) <-> inventory <-> hand
let dragging = false;
const readSlot = (z, k) => z === "hand" ? hand.item : zoneList(z)?.[k] ?? null;
function writeSlot(z, k, v) {
  if (z === "hand") { hand.item = v; if (v?.type === "torch" && hand.torchLeft <= 0) hand.torchLeft = TORCH_DURATION; }
  else zoneList(z)[k] = v;
}
function moveBetween(a, b) {                           // drops a onto b: they merge if they are the same type; otherwise they swap
  if (a.z === b.z && a.k === b.k) return;
  const A = readSlot(a.z, a.k), B = readSlot(b.z, b.k);
  if (!A) return;
  if (B && B.type === A.type && A.type !== "jar") {
    if (A.living || B.living) { B.living = [...(B.living || []), ...(A.living || [])]; B.amount = B.living.length; }
    else B.amount += A.amount;
    B.wear = Math.max(B.wear || 0, A.wear || 0);
    writeSlot(a.z, a.k, null);
  } else { writeSlot(b.z, b.k, A); writeSlot(a.z, a.k, B); }
  mergeSame(inventory); for (const z of openZones()) mergeSame(zoneList(z));
  if (player.job && (a.z === "hand" || b.z === "hand")) cancelWork("I stopped what I was doing");
  renderInventory(); renderContainers();
}
function storeStack(r) {                          // a whole stack into the inventory (merging with its type); false if there is no room
  const same = inventory.find(x => x && x.type === r.type && r.type !== "jar");
  if (same) { if (r.living || same.living) { same.living = [...(same.living || []), ...(r.living || [])]; same.amount = same.living.length; } else same.amount += r.amount;
              same.wear = Math.max(same.wear || 0, r.wear || 0); renderInventory(); return true; }
  const k = inventory.indexOf(null); if (k < 0) return false;
  inventory[k] = r; renderInventory(); return true;
}
function mergeSame(list) {                       // one stack per type (jars go one by one, each with its water)
  list.forEach((r, k) => {
    if (!r || r.type === "jar") return;
    const k0 = list.findIndex(x => x && x.type === r.type);
    if (k0 >= k) return;
    const B = list[k0];
    if (r.living || B.living) { B.living = [...(B.living || []), ...(r.living || [])]; B.amount = B.living.length; } else B.amount += r.amount;
    B.wear = Math.max(B.wear || 0, r.wear || 0);
    list[k] = null;
  });
}
function quickMove(z, k) {                          // double click: to the other side (a container -> inventory; inventory -> the open container)
  const A = readSlot(z, k); if (!A) return;
  const to = z === "inv" || z === "hand" ? openZones().filter(x => x !== "basket")[0] ?? (basketOpen ? "basket" : null) : "inv";
  if (!to) return;
  const al = zoneList(to), destination = al.findIndex(r => r && r.type === A.type && A.type !== "jar"), free = al.findIndex(r => !r);
  const k2 = destination >= 0 ? destination : free;
  if (k2 < 0) { notify(to === "inv" ? "My hands are full: no room left" : "It is full"); return; }
  moveBetween({ z, k }, { z: to, k: k2 });
}
const DRAG_SLOTS = "#inventory .slot:not(.basketButton), #containers .slot:not(.placeholder)";
const slotZone = el => el.dataset.zone || (el.dataset.hand ? "hand" : "inv");
const slotData = el => ({ z: slotZone(el), k: +(el.dataset.k ?? 0) });
let drag = null, ignoreClick = false;               // pointer drag: an icon follows the mouse to the destination slot
const slotUnder = (x, y) => document.elementFromPoint(x, y)?.closest(DRAG_SLOTS) || null;
const clearOver = (except = null) => document.querySelectorAll(".slot.over").forEach(x => x !== except && x.classList.remove("over"));
document.addEventListener("pointerdown", e => {
  ignoreClick = false;
  if (e.button !== 0) return;
  const el = e.target.closest?.(DRAG_SLOTS); if (!el || el.dataset.full !== "1") return;
  drag = { fromCell: slotData(el), x0: e.clientX, y0: e.clientY, isActive: false, html: el.innerHTML };
});
document.addEventListener("pointermove", e => {
  if (!drag) return;
  if (!drag.isActive) {
    if (Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) < 6) return;   // a normal click is not a drag
    drag.isActive = true; dragging = true;
    const f = document.createElement("div"); f.className = "slot ghost"; f.innerHTML = drag.html;
    document.body.appendChild(f); drag.f = f;
  }
  drag.f.style.left = e.clientX - 26 + "px"; drag.f.style.top = e.clientY - 26 + "px";
  const over = slotUnder(e.clientX, e.clientY); clearOver(over); over?.classList.add("over");
});
document.addEventListener("pointerup", e => {
  const a = drag; drag = null;
  if (!a?.isActive) return;
  a.f.remove(); dragging = false; clearOver(); ignoreClick = true;   // the click that follows the drop does not count
  const over = slotUnder(e.clientX, e.clientY);
  if (over) moveBetween(a.fromCell, slotData(over)); else { renderInventory(); renderContainers(); }
});
document.addEventListener("click", e => { if (ignoreClick) { ignoreClick = false; e.stopPropagation(); e.preventDefault(); } }, true);
document.addEventListener("dblclick", e => {
  const el = e.target.closest?.(DRAG_SLOTS); if (!el || !anyContainerOpen()) return;
  const d = slotData(el); quickMove(d.z, d.k);
});
function renderInventory() {                         // the first slot (against the edge) is what is carried in the hand
  if (dragging) return;                            // do not re-render while dragging
  const icon = t => ICONS[t] || RECIPE_ICON[t] || "?";
  const t = inHand(), flame = t === "torch" ? `<span class="flame" style="width:${Math.round(44 * Math.max(0, hand.torchLeft) / TORCH_DURATION)}px"></span>` : "";
  const handSlot = `<div class="slot hand ${t ? "filled" : ""}" data-hand="1" data-full="${t ? 1 : 0}"
      title="${t ? `In hand: ${RESOURCE_NAME[t]} · click: put away` : "Empty hand · key 1-0: take what is in that slot"}">
      ${t ? icon(t) : ""}${t && hand.item.amount > 1 ? `<span class="qty">${hand.item.amount}</span>` : ""}${t === "jar" ? `<span class="water">💧${hand.item.water || 0}</span>` : ""}${flame}${wearBar(hand.item)}</div>`;
  $("inventory").innerHTML = handSlot + `<div class="slotList">` + inventory.map((r, k) => `<div class="slot" data-k="${k}" data-full="${r ? 1 : 0}"
      title="${r ? `${RESOURCE_NAME[r.type] || r.type}: ${r.amount} · ` : ""}key ${(k + 1) % 10}"><span class="keyHint">${(k + 1) % 10}</span>` +
      (r ? `${icon(r.type)}<span class="qty">${r.amount}</span>${r.type === "jar" ? `<span class="water">💧${r.water || 0}</span>` : ""}${wearBar(r)}` : "") + `</div>`).join("") + `</div>` +
    `<button class="slot basketButton" id="basketButton" title="Basket: open or close (Shift)" hidden></button>`;
  renderWorkshop(); renderContainers();
}
