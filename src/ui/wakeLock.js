// ---- keep the computer awake while the game is open and visible: no screensaver, no sleep, no lock screen (Screen Wake
//      Lock API). The browser drops the lock when the tab is hidden, so it is asked for again when the game comes back.
//      Where the API is missing (some browsers) nothing happens.
let wakeLock = null;
async function keepAwake() {
  if (!("wakeLock" in navigator) || document.visibilityState !== "visible" || wakeLock) return;
  try {
    wakeLock = await navigator.wakeLock.request("screen");
    wakeLock.addEventListener("release", () => { wakeLock = null; });
  } catch (e) { wakeLock = null; }                     // refused (battery saver, no permission…): try again later
}
document.addEventListener("visibilitychange", keepAwake);
for (const ev of ["pointerdown", "keydown"]) document.addEventListener(ev, keepAwake);   // some browsers only grant it after a user action
keepAwake();
