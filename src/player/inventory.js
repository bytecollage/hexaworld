// ---- Inventory: slots for gathered elements (empty for now; they fill up when gathering)
const SLOTS = 10;
const inventory = Array(SLOTS).fill(null);      // each slot: null or { type, amount }
