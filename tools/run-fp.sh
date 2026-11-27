#!/bin/sh
# Usage: tools/run-fp.sh <page.html> <adapter.js> <out.json>
# Injects a frozen requestAnimationFrame + the fingerprint scripts into a copy of the page and runs it in headless Chrome.
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"   # another Chrome (e.g. google-chrome on Linux, in GitHub Actions); CHROME_FLAGS: extra flags
set -e
PAGE="$1"; ADAPTER="$2"; OUT="$3"
DIR=$(cd "$(dirname "$0")" && pwd)
TMP="$(cd "$(dirname "$PAGE")" && pwd)/.fp-run-$$.html"
node -e '
const fs=require("fs"),[page,adapter,fp,tmp]=process.argv.slice(1);
let h=fs.readFileSync(page,"utf8");
const cases=process.env.FP_CASES?`window.FP_CASES=${process.env.FP_CASES};`:"";
h=h.replace("<head>",`<head><script>window.__errors=[];addEventListener("error",e=>__errors.push(e.message+" @ "+(e.filename||"").split("/").slice(-2).join("/")+":"+e.lineno));window.requestAnimationFrame=()=>0;{let s=987654321;Math.random=()=>((s=(Math.imul(s,1103515245)+12345)>>>0)/4294967296);}${cases}</script>`);
h=h.replace(/<\/body>/i,`<script src="${adapter}"></script><script src="${fp}"></script></body>`);
fs.writeFileSync(tmp,h);' "$PAGE" "file://$DIR/$(basename "$ADAPTER")" "file://$DIR/fingerprint.js" "$TMP"
"$CHROME" $CHROME_FLAGS --headless=new --disable-gpu --user-data-dir="$TMP.profile" --no-first-run ${FP_JSFLAGS:+--js-flags=$FP_JSFLAGS} --allow-file-access-from-files \
  --virtual-time-budget=100000000 --run-all-compositor-stages-before-draw --dump-dom "file://$TMP" 2>/dev/null \
  | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const m=s.match(/<pre id="fp-out">([\s\S]*?)<\/pre>/);
     if(!m){console.error("no fingerprint output");process.exit(1)}
     const t=m[1].replace(/&quot;/g,"\"").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&amp;/g,"&");
     require("fs").writeFileSync(process.argv[1],t);console.log(t.slice(0,300))})' "$OUT"
rm -rf "$TMP" "$TMP.profile"
