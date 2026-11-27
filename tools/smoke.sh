#!/bin/sh
# Usage: tools/smoke.sh <page.html> <out.png> — loads the page in headless Chrome for a few (virtual) seconds,
# saves a screenshot and prints any script errors and console warnings (written into the page title).
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"   # another Chrome (e.g. google-chrome on Linux, in GitHub Actions); CHROME_FLAGS: extra flags
set -e
PAGE="$1"; OUT="$2"
TMP="$(cd "$(dirname "$PAGE")" && pwd)/.smoke-$$.html"
node -e '
const fs=require("fs"),[page,tmp]=process.argv.slice(1);
let h=fs.readFileSync(page,"utf8");
h=h.replace("<head>",`<head><script>window.__log=[];addEventListener("error",e=>__log.push("ERROR "+e.message+" @ "+(e.filename||"").split("/").slice(-2).join("/")+":"+e.lineno));
const w=console.warn;console.warn=(...a)=>{__log.push("WARN "+a.join(" "));w(...a)};
addEventListener("load",()=>setTimeout(()=>{document.title="SMOKE["+__log.join(" | ")+"]"},1500));</script>`);
fs.writeFileSync(tmp,h);' "$PAGE" "$TMP"
"$CHROME" $CHROME_FLAGS --headless=new --disable-gpu --user-data-dir="$TMP.profile" --no-first-run \
  --allow-file-access-from-files --window-size=1400,900 --virtual-time-budget=4000 --screenshot="$OUT" "file://$TMP" 2>/dev/null >/dev/null
"$CHROME" $CHROME_FLAGS --headless=new --disable-gpu --user-data-dir="$TMP.profile" --no-first-run \
  --allow-file-access-from-files --window-size=1400,900 --virtual-time-budget=4000 --dump-dom "file://$TMP" 2>/dev/null | grep -o 'SMOKE\[[^"+]*\]' || echo "no title (page did not finish loading)"
rm -rf "$TMP" "$TMP.profile"
