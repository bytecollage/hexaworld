# hexaworld — notes for Claude

- Static page opened by double-click (`file://`): no server, no build step, no backend, no ES modules (classic `<script>` files only).
- Absolutely everything in English: identifiers, comments, data ids, DOM ids, CSS classes, UI text and docs.
- Read ARCHITECTURE.md before changing code; the game rules are in BEHAVIOR.md, which must be updated with every behavior change.
- Content (species, plants, items, structures) is one file per thing under `content/`, listed in `content/registry.js`; the engine asks for traits, not ids.
- To prove a refactor keeps behavior: `FP_QUICK=1 tools/fp-all.sh index.html tools/fp-adapter-new.js <out.json>` then `node tools/compare-fp.js <out.json> tools/baseline-quick.json` (full run without FP_QUICK against tools/baseline.json). Run them one at a time, never while editing the files they load.
- `world.old.html` and `index.old.html` are references: do not edit them.
