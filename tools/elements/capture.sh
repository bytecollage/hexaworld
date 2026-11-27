#!/bin/sh
# Usage: tools/elements/capture.sh — draws every animal, plant and world feature with the game itself (headless Chrome)
# and saves the pictures, plus the inventory and workshop icons, in tools/elements/pictures.json.
# Run it when a drawing or an icon changes, then `node tools/elements/build.js`.
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"   # another Chrome (e.g. google-chrome on Linux, in GitHub Actions); CHROME_FLAGS: extra flags
set -e
HERE=$(cd "$(dirname "$0")" && pwd); ROOT=$(cd "$HERE/../.." && pwd); TMP="$ROOT/.capture-$$.html"; DOM="$TMP.dom"
sed 's|</body>|<script src="tools/elements/capture.js"></script></body>|' "$ROOT/index.html" > "$TMP"
"$CHROME" $CHROME_FLAGS --headless=new --disable-gpu --user-data-dir="$TMP.profile" --no-first-run --allow-file-access-from-files \
  --window-size=1000,700 --virtual-time-budget=60000 --dump-dom "file://$TMP" 2>/dev/null > "$DOM"
node -e '
const fs = require("fs"), s = fs.readFileSync(process.argv[1], "utf8"), m = s.match(/<pre id="out">([\s\S]*?)<\/pre>/);
if (!m) { console.error("capture: no output (the page did not finish)"); process.exit(1); }
const txt = m[1].replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "\"").replace(/&#39;/g, "\x27").replace(/&amp;/g, "&");
const d = JSON.parse(txt); fs.writeFileSync(process.argv[2], JSON.stringify(d) + "\n");
console.log("pictures.json:", Object.keys(d.draw).length, "drawings,", Object.keys(d.icon).length, "icons,", Object.keys(d.emoji).length, "emoji" + (d.miss ? "; empty: " + d.miss.join(", ") : ""));
' "$DOM" "$HERE/pictures.json"
rm -rf "$TMP" "$TMP.profile" "$DOM"
