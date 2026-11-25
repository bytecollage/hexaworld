#!/bin/sh
# Usage: [GALLERY_SET=2] [GALLERY_FOCUS=cage] tools/gallery.sh <out-prefix> [rot ...] — screenshots of the render test scene (tools/gallery.js) at each camera turn.
set -e
OUT="$1"; shift; ROTS="${*:-0 45 90 180}"
ROOT=$(cd "$(dirname "$0")/.." && pwd); TMP="$ROOT/.gallery-$$.html"
sed 's|</body>|<script src="tools/gallery.js"></script></body>|' "$ROOT/index.html" > "$TMP"
for R in $ROTS; do
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --user-data-dir="$TMP.profile" --no-first-run \
    --allow-file-access-from-files --window-size=1000,700 --virtual-time-budget=3000 --screenshot="$OUT-$R.png" "file://$TMP?rot=$R&set=${GALLERY_SET:-1}&focus=${GALLERY_FOCUS:-}" >/dev/null 2>&1
done
rm -rf "$TMP" "$TMP.profile"
