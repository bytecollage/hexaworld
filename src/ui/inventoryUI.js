// ---- drag and drop: containers (house, chest: see containers.js) <-> inventory (with the basket's slots) <-> hand
let dragging = false;
const readSlot = (z, k) => z === "hand" ? hand.item : zoneList(z)?.[k] ?? null;
function writeSlot(z, k, v) {
  if (z === "hand") { hand.item = v; if (v?.type === "torch" && hand.torchLeft <= 0) hand.torchLeft = TORCH_DURATION; }
  else zoneList(z)[k] = v;
}
const capZ = z => z === "hand" ? STACK_LIMIT.inventory : capOf(zoneList(z));
function moveBetween(a, b) {                           // drops a onto b: the same type piles up to b's limit; otherwise they swap (if both fit)
  if (a.z === b.z && a.k === b.k) return;
  const A = readSlot(a.z, a.k), B = readSlot(b.z, b.k);
  if (!A) return;
  const capA = capZ(a.z), capB = capZ(b.z);
  if (B && B.type === A.type && !single(A) && !single(B)) {
    const m = Math.min(A.amount, capB - B.amount);
    if (m <= 0) { notify("That slot is full"); return; }
    B.amount += m; A.amount -= m; B.wear = Math.max(B.wear || 0, A.wear || 0);
    if (!A.amount) writeSlot(a.z, a.k, null);
  } else if (!B) {
    if (A.amount > capB) { writeSlot(b.z, b.k, { ...A, amount: capB }); A.amount -= capB; }   // only what fits in that slot
    else { writeSlot(b.z, b.k, A); writeSlot(a.z, a.k, null); }
  } else if (A.amount <= capB && B.amount <= capA) { writeSlot(b.z, b.k, A); writeSlot(a.z, a.k, B); }
  else { notify("It does not fit there"); return; }
  if (player.job && (a.z === "hand" || b.z === "hand")) cancelWork("I stopped what I was doing");
  renderInventory(); renderContainers();
}
function storeStack(r) {                          // a whole stack into the inventory (piling up with its type); false if not all of it fits (r keeps the rest)
  const left = addStack(inventory, r); renderInventory(); return !left;
}
function quickMove(z, k) {                          // double click: to the other side (a container -> inventory; inventory -> the open container)
  const A = readSlot(z, k); if (!A) return;
  const to = z === "inv" || z === "hand" ? openZones()[0] ?? null : "inv";
  if (!to) return;
  const moving = { ...A, living: A.living && [...A.living] }, left = addStack(zoneList(to), moving, capZ(to));
  const placed = A.amount - (left ? left.amount : 0);
  if (!placed) { notify(to === "inv" ? "My hands are full: no room left" : "It is full"); return; }
  if (left) { A.amount = left.amount; if (A.living) A.living = left.living; } else writeSlot(z, k, null);
  if (player.job && z === "hand") cancelWork("I stopped what I was doing");
  renderInventory(); renderContainers();
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
  if (over) moveBetween(a.fromCell, slotData(over));
  else if (document.elementFromPoint(e.clientX, e.clientY) === canvas) {   // dropped on the map: placed or left there (actions.js)
    const b = canvas.getBoundingClientRect(); dropOnWorld(a.fromCell, e.clientX - b.left, e.clientY - b.top);
  } else { renderInventory(); renderContainers(); }
});
document.addEventListener("click", e => { if (ignoreClick) { ignoreClick = false; e.stopPropagation(); e.preventDefault(); } }, true);
document.addEventListener("dblclick", e => {
  const el = e.target.closest?.(DRAG_SLOTS); if (!el || !anyContainerOpen()) return;
  const d = slotData(el); quickMove(d.z, d.k);
});
function renderInventory() {                         // the first slot (against the edge) is what is carried in the hand
  if (dragging) return;                            // do not re-render while dragging
  const icon = t => animalIconHTML(t) || ICONS[t] || RECIPE_ICON[t] || "?";   // live animals: their map drawing
  const t = inHand(), flame = t === "torch" ? `<span class="flame" style="width:${Math.round(44 * Math.max(0, hand.torchLeft) / TORCH_DURATION)}px"></span>` : "";
  const handSlot = `<div class="slot hand ${t ? "filled" : ""}" data-hand="1" data-full="${t ? 1 : 0}"
      title="${t ? `In hand: ${RESOURCE_NAME[t]} · click: put away` : "Empty hand · key 1-0: take what is in that slot"}">
      ${t ? icon(t) : ""}${t && hand.item.amount > 1 ? `<span class="qty">${hand.item.amount}</span>` : ""}${t === "jar" ? `<span class="water">💧${hand.item.water || 0}</span>` : ""}${flame}${wearBar(hand.item)}${healthBar(hand.item)}</div>`;
  const slot = (r, k) => {                          // keys 1-0 for the first 10; the basket's come after them, Ctrl+1…5
    const inBasket = k >= SLOTS, key = inBasket ? k - SLOTS + 1 : (k + 1) % 10;
    return `<div class="slot${inBasket ? " basketSlot" : ""}" data-k="${k}" data-full="${r ? 1 : 0}"
      title="${r ? `${RESOURCE_NAME[r.type] || r.type}: ${r.amount} · ` : ""}${inBasket ? `basket · Ctrl+${key}` : `key ${key}`}"><span class="keyHint">${key}</span>` +
      (r ? `${icon(r.type)}<span class="qty">${r.amount}</span>${r.type === "jar" ? `<span class="water">💧${r.water || 0}</span>` : ""}${wearBar(r)}${healthBar(r)}` : "") + `</div>`;
  };
  const extra = inventory.length > SLOTS ? `<div class="basketSlots">${inventory.slice(SLOTS).map((r, k) => slot(r, SLOTS + k)).join("")}</div>` : "";
  $("inventory").innerHTML = handSlot + `<div class="slotList">` + inventory.slice(0, SLOTS).map(slot).join("") + extra + `</div>` +
    `<div class="slot basketButton" id="basketButton" hidden></div>`;
  const bs = document.querySelector("#inventory .basketSlots");   // the row is centered with the basket's slots: the containers follow
  document.documentElement.style.setProperty("--inv-shift", bs ? `${-(bs.offsetWidth + 14) / 2}px` : "0px");
  renderBasketButton();
  renderWorkshop(); renderContainers();
}
