#!/bin/bash
DIR="$(cd "$(dirname "$0")" && pwd)"
NODE="$DIR/runtime/bin/node"
chmod +x "$NODE" 2>/dev/null
DATA="${XDG_DATA_HOME:-$HOME/.local/share}/inventario-edumind"
mkdir -p "$DATA"
rm -f "$DATA/url.txt"
APPS="$HOME/.local/share/applications"; mkdir -p "$APPS"
cat > "$APPS/inventario-edumind.desktop" <<EOF
[Desktop Entry]
Type=Application
Name=Inventario EDUmind
Exec="$DIR/iniciar-inventario.sh"
Icon=$DIR/build/client/icons/icon-512.png
Terminal=false
Categories=Education;
EOF
( for i in $(seq 1 40); do if [ -f "$DATA/url.txt" ]; then xdg-open "$(cat "$DATA/url.txt")" >/dev/null 2>&1; break; fi; sleep 0.5; done ) &
cd "$DIR"
nohup "$NODE" --experimental-sqlite scripts/run.mjs >/dev/null 2>&1 &
disown 2>/dev/null || true
