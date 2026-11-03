#!/bin/bash
DIR="/opt/inventario-edumind"
NODE="$DIR/runtime/bin/node"
DATA="${XDG_DATA_HOME:-$HOME/.local/share}/inventario-edumind"
mkdir -p "$DATA"
rm -f "$DATA/url.txt"
( for i in $(seq 1 40); do if [ -f "$DATA/url.txt" ]; then xdg-open "$(cat "$DATA/url.txt")" >/dev/null 2>&1; break; fi; sleep 0.5; done ) &
cd "$DIR"
exec "$NODE" --experimental-sqlite scripts/run.mjs
