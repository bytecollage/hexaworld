// =====================================================================================
//  CONTAINERS: the house storage (2 rows), an open chest and an open cage (1 row each) are shown as rows of slots
//  just above the inventory, aligned with its 10 slots; the open one's icon (with its life bar) sits at the right edge, above the
//  basket's. Drag between any of them, or double click to send to the other side; Ctrl+click uses the hand on a slot (combine.js).
// =====================================================================================
const CHEST_SLOTS = 10;
let openChestRef = null;
// zone → its slot list (null if it is not open now)
function zoneList(z) {
  if (z === "inv") return inventory;
  if (z === "house") return player.inside?.storage ?? null;
  if (z === "chest") return openChestRef?.storage ?? null;
  if (z === "cage") return openCageRef?.storage ?? null;
  return null;
}
const openZones = () => ["cage", "chest", "house"].filter(z => zoneList(z));
const anyContainerOpen = () => openZones().length > 0;
function openChest(o) { openChestRef = o; renderContainers(); renderWorkshop(); }   // what it holds counts for crafting (crafting.js)
function closeChest() { if (!openChestRef) return; openChestRef = null; renderContainers(); renderWorkshop(); }
function watchChest() {                                // the chest closes if you walk away from it (slow systems tick)
  const o = openChestRef; if (!o) return;
  if (o.removed || player.i < 0 || wrapDistance(o.i, player.i) > cellsFor(2)) closeChest();
}
function closeContainersExcept(cell) {                  // any order somewhere else closes an open chest or cage (not when clicking it again)
  if (openChestRef && cell !== openChestRef.i) closeChest();
  if (openCageRef && cell !== openCageRef.i) closeCage();
}
function closeContainers() {                             // Esc: closes the chest and leaves the house
  closeChest();
  if (player.inside && !player.sleeping) leaveHouse();
}
const ROW = 10;                                         // slots per row: the same as the inventory, so they line up
function containerSlot(z, r, k) {
  const icon = t => animalIconHTML(t) || ICONS[t] || RECIPE_ICON[t] || "?";   // live animals: their map drawing
  return `<div class="slot" data-zone="${z}" data-k="${k}" data-full="${r ? 1 : 0}"
      title="${r ? `${RESOURCE_NAME[r.type] || r.type}: ${r.amount} · drag it (or double click)` : "empty"}">` +
    (r ? `${icon(r.type)}<span class="qty">${r.amount}</span>${r.type === "jar" ? `<span class="water">💧${r.water || 0}</span>` : ""}${wearBar(r)}${healthBar(r)}` : "") + `</div>`;
}
function renderContainers() {                           // no close button: a click on the map (or Esc, or walking away) closes them
  if (dragging) return;
  const el = $("containers"), parts = [];
  let side = "";                                        // the container's icon (and the sleep button) at the right edge, above the basket's
  for (const z of openZones()) {
    const list = zoneList(z);
    const home = z === "house" ? player.inside : null, cage = z === "cage" ? openCageRef : null, chest = z === "chest" ? openChestRef : null;   // house or hut; cage; chest
    const name = home ? DEF[home.type].name : cage ? "Cage: live animals, their food and jars of water" : "Chest";
    const worn = cage || home || chest, life = 1 - Math.min(1, worn.wear || 0);   // cages and chests (2 years), the house (5) and the hut (1) wear out
    const days = home ? DEF[home.type].shelter.life * life : LIFE_DAYS[z] * life;
    const leave = home ? ` · click outside to leave` : ` · click elsewhere to close`;
    const badge = `<div class="slot containerIcon" title="${name} · ${Math.max(0, Math.ceil(days))} days of use left${leave} (Esc)">${RECIPE_ICON[home ? home.type : z]}<span class="life" style="width:${Math.round(44 * life)}px"></span></div>`;
    let sleep = "";
    if (home) {
      const night = currentPhase().name !== "Day";
      sleep = `<button class="slot containerSleep" data-container="sleep" ${night ? "" : "disabled"} title="${night ? "Sleep until dawn (the night goes by quickly)" : "You can only sleep at dusk or at night"}">💤</button>`;
    }
    side = sleep + badge;
    for (let r0 = 0; r0 < list.length; r0 += ROW) {     // the hut has no storage: no rows, just its icon
      parts.push(`<div class="containerRow ${z}">
        <div class="slotList">${list.slice(r0, r0 + ROW).map((r, k) => containerSlot(z, r, r0 + k)).join("")}${(() => { const free = ROW - Math.min(ROW, list.length - r0);   // empty places; an open cage below its maximum: a + button in the first one
          const plus = cage && list.length < CAGE_STORAGE_MAX && list.length - r0 < ROW && free > 0;
          return (plus ? `<button class="slot containerGrow" data-container="grow-cage" title="Add a slot: ${recipeText({ cost: CAGE_SLOT_COST })} (up to ${CAGE_STORAGE_MAX})">+</button>` : "") + `<div class="slot placeholder"></div>`.repeat(free - (plus ? 1 : 0)); })()}</div></div>`);
    }
  }
  el.innerHTML = parts.join("") + (side ? `<div class="containerSide">${side}</div>` : "");
  el.classList.toggle("visible", !!side);
  renderBasketButton();
}
function renderBasketButton() {                         // at the right end of the inventory bar: the basket's icon and wear bar
  const b = $("basketButton");
  if (b) {
    b.hidden = !basket;
    b.innerHTML = RECIPE_ICON.basket + (basket ? `<span class="life" style="width:${Math.round(44 * (1 - basketWear()))}px"></span>` : "");
    if (basket) b.title = `Basket: ${basket} more slots in the inventory · ${Math.max(0, Math.ceil(BASKET_LIFE * (1 - basketWear())))} days of use left`;
  }
}
const renderHouse = renderContainers;                   // older name, still used by the house code
document.addEventListener("click", e => {
  const b = e.target.closest?.("[data-container]"); if (!b || b.disabled) return;
  const a = b.dataset.container;
  if (a === "sleep" && player.inside) sleep(player.inside);
  else if (a === "grow-cage") growCage(openCageRef);
});
