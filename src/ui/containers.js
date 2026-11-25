// =====================================================================================
//  CONTAINERS: the house storage (2 rows), an open chest (1 row) and the basket (Shift) are shown as rows of slots
//  just above the inventory, aligned with its 10 slots. Drag between any of them, or double click to send to the other side.
// =====================================================================================
const CHEST_SLOTS = 10, BASKET_SLOTS = 5;
let openChestRef = null, basketOpen = false;
// zone → its slot list (null if it is not open now)
function zoneList(z) {
  if (z === "inv") return inventory;
  if (z === "house") return player.inside?.storage ?? null;
  if (z === "chest") return openChestRef?.storage ?? null;
  if (z === "basket") return basketOpen ? basket : null;
  return null;
}
const openZones = () => ["basket", "chest", "house"].filter(z => zoneList(z));
const anyContainerOpen = () => openZones().length > 0;
function openChest(o) { openChestRef = o; renderContainers(); }
function closeChest() { if (!openChestRef) return; openChestRef = null; renderContainers(); }
function toggleBasket() {
  if (!basket) { notify("I have no basket yet: I could weave one (Crafts)"); return; }
  basketOpen = !basketOpen; renderContainers();
}
function watchChest() {                                // the chest closes if you walk away from it (slow systems tick)
  const o = openChestRef; if (!o) return;
  if (o.removed || player.i < 0 || wrapDistance(o.i, player.i) > cellsFor(2)) closeChest();
}
const CLOSE_ICON = `<svg viewBox="0 0 24 24"><path d="M6 6 L18 18 M18 6 L6 18" stroke="#f2e2bf" stroke-width="2.6" stroke-linecap="round"/></svg>`;
function closeContainers() {                             // Esc: closes the chest and the basket and leaves the house
  closeChest(); if (basketOpen) { basketOpen = false; renderContainers(); }
  if (player.inside && !player.sleeping) leaveHouse();
}
const ROW = 10;                                         // slots per row: the same as the inventory, so they line up
function containerSlot(z, r, k) {
  const icon = t => ICONS[t] || RECIPE_ICON[t] || "?";
  return `<div class="slot" data-zone="${z}" data-k="${k}" data-full="${r ? 1 : 0}"
      title="${r ? `${RESOURCE_NAME[r.type] || r.type}: ${r.amount} · drag it (or double click)` : "empty"}">` +
    (r ? `${icon(r.type)}<span class="qty">${r.amount}</span>${r.type === "jar" ? `<span class="water">💧${r.water || 0}</span>` : ""}${wearBar(r)}` : "") + `</div>`;
}
function renderContainers() {
  if (dragging) return;
  const el = $("containers"), parts = [];
  for (const z of openZones()) {
    const list = zoneList(z);
    const name = z === "house" ? "House" : z === "chest" ? "Chest" : "Basket";
    const badge = `<div class="slot containerIcon" title="${name}">${RECIPE_ICON[z]}</div>`;   // which container this is, as an icon
    const close = `<button class="slot containerClose" data-container="${z === "house" ? "leave" : "close-" + z}" title="${z === "house" ? "Leave the house" : "Close"} (Esc${z === "basket" ? " or Shift" : ""})">${CLOSE_ICON}</button>`;
    let buttons = close;
    if (z === "house") {
      const night = currentPhase().name !== "Day";
      buttons = `<button class="slot containerSleep" data-container="sleep" ${night ? "" : "disabled"} title="${night ? "Sleep until dawn (the night goes by quickly)" : "You can only sleep at dusk or at night"}">💤</button>`;
      buttons = close + buttons;                        // the close button first, so all of them line up
    }
    for (let r0 = 0; r0 < list.length; r0 += ROW) {
      const first = r0 === 0;
      parts.push(`<div class="containerRow ${z}"><span class="containerName">${first ? badge : ""}</span>
        <div class="slotList">${list.slice(r0, r0 + ROW).map((r, k) => containerSlot(z, r, r0 + k)).join("")}${`<div class="slot placeholder"></div>`.repeat(ROW - Math.min(ROW, list.length - r0))}</div>
        <span class="containerButtons">${first ? buttons : ""}</span></div>`);
    }
  }
  el.innerHTML = parts.join("");
  el.classList.toggle("visible", parts.length > 0);
  renderBasketButton();
}
function renderBasketButton() {                         // at the right end of the inventory bar, with the basket's wear bar
  const b = $("basketButton");
  if (b) {
    b.hidden = !basket; b.classList.toggle("open", basketOpen);
    b.innerHTML = RECIPE_ICON.basket + (basket ? `<span class="life" style="width:${Math.round(44 * (1 - basketWear()))}px"></span>` : "");
    if (basket) b.title = `Basket: open or close (Shift) · ${Math.max(0, Math.ceil(BASKET_LIFE * (1 - basketWear())))} days of use left`;
  }
}
const renderHouse = renderContainers;                   // older name, still used by the house code
// Shift alone (pressed and released with no other key) opens or closes the basket
let shiftAlone = false;
document.addEventListener("keydown", e => { shiftAlone = e.key === "Shift" && !e.repeat ? true : (e.key === "Shift" ? shiftAlone : false); });
document.addEventListener("keyup", e => {
  if (e.key !== "Shift" || !shiftAlone) return;
  shiftAlone = false;
  if (e.target.tagName === "INPUT" && e.target.type !== "checkbox") return;
  if (!player.dead && !player.sleeping) toggleBasket();
});
document.addEventListener("click", e => {
  const b = e.target.closest?.("[data-container]"); if (!b || b.disabled) return;
  const a = b.dataset.container;
  if (a === "sleep" && player.inside) sleep(player.inside);
  else if (a === "leave") leaveHouse();
  else if (a === "close-chest") closeChest();
  else if (a === "close-basket") { basketOpen = false; renderContainers(); }
});
