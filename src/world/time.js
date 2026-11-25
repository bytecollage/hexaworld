// =====================================================================================
//  MAIN LOOP: animals, character, camera and drawing every frame
// =====================================================================================
// ---- Day and night clock: a full day lasts 6 minutes ----
const DAY_DURATION = 6 * 60;                       // real seconds (at ×1)
const SEASON_DAYS = 5, YEAR_DAYS = 4 * SEASON_DAYS;
// each season splits the day differently: fraction of day and of dusk (the rest is night)
const SEASONS = [
  { name: "Spring", icon: "🌸", bg: "#7fbf6a", day: 0.50, dusk: 0.15 },
  { name: "Summer",    icon: "☀️", bg: "#f0b93a", day: 0.62, dusk: 0.12 },
  { name: "Autumn",     icon: "🍂", bg: "#c9743a", day: 0.45, dusk: 0.17 },
  { name: "Winter",  icon: "❄️", bg: "#8fb3d9", day: 0.33, dusk: 0.14 },
];
const PHASE_COLORS = {
  "Day":       { color: "#e8c547", dark: "#c9a632" },
  "Dusk": { color: "#c8643c", dark: "#a94f2d" },
  "Night":     { color: "#2f3f78", dark: "#24315f" },
};
function phasesOf(e) {
  return [{ name: "Day", until: e.day }, { name: "Dusk", until: e.day + e.dusk }, { name: "Night", until: 1 }]
    .map(f => ({ ...f, ...PHASE_COLORS[f.name] }));
}
const seasonIndex = () => Math.floor(((clock.day - 1) % YEAR_DAYS) / SEASON_DAYS);
const season = () => SEASONS[seasonIndex()];
const gameYear = () => Math.floor((clock.day - 1) / YEAR_DAYS);   // 0 = first year
const clock = { t: 0, day: 1, speed: 1, drawnAt: -1 };   // t = fraction of the current day (0..1); speed = acceleration (testing)
const gameDay = () => clock.day - 1 + clock.t;  // elapsed game time, in days
function currentPhase() { const F = phasesOf(season()); return F.find(f => clock.t < f.until) || F[2]; }
function resetClock() { clock.t = 0; clock.day = 1; clock.drawnAt = -1; }   // always starts in spring, at dawn
function advanceClock(dt) {
  clock.t += dt * clock.speed / DAY_DURATION;
  while (clock.t >= 1) { clock.t -= 1; clock.day++; }
}
