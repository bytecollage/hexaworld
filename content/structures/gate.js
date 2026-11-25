// Gate: a fence post the character can pass through (animals cannot).
defineStructure({
  id: "gate",
  name: "Gate",
  draw(it) { drawPost(it, true); },
});
