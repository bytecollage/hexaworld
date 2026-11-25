#!/bin/sh
# Usage: tools/fp-all.sh <page.html> <adapter.js> <out.json>
# Runs every fingerprint case in a fresh page, one after another, with the JIT disabled (see ARCHITECTURE.md, "Verifying a refactor"), then merges the results.
set -e
DIR=$(cd "$(dirname "$0")" && pwd)
export FP_JSFLAGS="${FP_JSFLAGS---jitless}"   # V8 JIT tiers make long runs depend on code layout; the interpreter is exact
PAGE="$1"; ADAPTER="$2"; OUT="$3"; PARTS=""
shift 3
CASES="'{seed:1,test:false,days:[0,40,120]}' '{seed:42,test:false,days:[0,60]}' '{seed:1,test:true,days:[0,100,200]}' '{seed:777,test:true,days:[0,200]}'"
[ -n "$FP_QUICK" ] && CASES="'{seed:1,test:false,days:[0,15]}' '{seed:1,test:true,days:[0,60]}'"   # quick check while iterating
eval "set -- $CASES"
for C in "$@"; do
  N=$(echo "$C" | tr -dc 'a-z0-9'); P="$OUT.$N.part"
  FP_CASES="[$C]" "$DIR/run-fp.sh" "$PAGE" "$ADAPTER" "$P" >/dev/null
  PARTS="$PARTS $P"
done

node -e 'const fs=require("fs");const [out,...p]=process.argv.slice(1);const all=p.flatMap(f=>JSON.parse(fs.readFileSync(f,"utf8")));fs.writeFileSync(out,JSON.stringify(all));p.forEach(f=>fs.unlinkSync(f));console.log(all.length+" snapshots")' "$OUT" $PARTS
