// the character's thoughts, at the top of the screen (in first person: "I feel safe here")
const an = (w, A = "a") => (/^[aeiou]/i.test(w) ? (A === "A" ? "An " : "an ") : A + " ") + w;   // "a fox", "an armadillo"
// moments with several things the character may say: one is picked at random each time (notify(SAY.enterHouse))
const SAY = {
  enterHouse:  ["Home sweet home", "I feel safe here", "This is my place", "I can get some rest now"],
  houseDone:   ["My house is finished!", "A roof over my head, at last", "Home, finally!"],
  chestDone:   ["A place to keep my things", "Now my things have a home", "This chest will be handy"],
  basketDone:  ["Now I can carry more things", "This basket will help a lot", "More room for my things"],
  sleep:       ["Time to rest…", "Good night…", "My eyes are closing…"],
  wakeUp:      ["Good morning! I slept well", "What a night! I feel rested", "A new day begins"],
  notSleepy:   ["I am not sleepy yet: maybe at dusk", "It is too early to sleep", "Sleep? The sun is still up"],
  full:        ["I cannot carry any more", "My hands are full", "No more room for that"],
  noWay:       ["I cannot get there", "There is no way there", "I cannot reach that"],
  gotAway:     ["It got away!", "Too slow… it escaped", "Gone!"],
  missed:      ["Missed! It ran off", "So close… it got away", "Missed!"],
  torchLit:    ["Some light for the night", "Better with a little light", "Now I can see a bit"],
  torchOut:    ["My torch went out", "Darkness again… the torch is out"],
  crafted:     [n => `I made ${an(n)}`, n => `Done: ${an(n)}`, n => `That ${n} came out well`],
};
function notify(text, ...args) {                     // text: a string, or a list of options (strings or functions of args)
  if (Array.isArray(text)) text = text[Math.floor(Math.random() * text.length)];   // Math.random: never the world's seeded rnd
  if (typeof text === "function") text = text(...args);
  const el = $("notice"); el.textContent = text; el.classList.add("visible");
  clearTimeout(notify.t); notify.t = setTimeout(() => el.classList.remove("visible"), 2200);
}
