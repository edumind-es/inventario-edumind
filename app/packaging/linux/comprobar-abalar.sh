#!/bin/bash
# Comprueba si Inventario EDUmind puede funcionar SIN root en este equipo.
# Uso:  bash comprobar-abalar.sh
set -u

ok=0; ko=0
si()  { echo "  [ OK ]  $1"; ok=$((ok+1)); }
no()  { echo "  [FALLA] $1"; ko=$((ko+1)); }

echo "=== Inventario EDUmind — comprobación de equipo ==="
echo
echo "Sistema: $( (lsb_release -ds 2>/dev/null || cat /etc/os-release 2>/dev/null | grep PRETTY | cut -d'"' -f2) )"
echo "Arquitectura: $(uname -m)"
echo

# 1. Arquitectura
if [ "$(uname -m)" = "x86_64" ]; then
  si "Arquitectura x86_64 (usa el ZIP linux-x64)"
else
  no "Arquitectura $(uname -m) — necesitas el ZIP linux-arm64"
fi

# 2. glibc: el Node incluido exige 2.28 o superior
glibc=$(ldd --version 2>/dev/null | head -1 | grep -oE '[0-9]+\.[0-9]+$')
if [ -n "$glibc" ]; then
  mayor=${glibc%%.*}; menor=${glibc##*.}
  if [ "$mayor" -gt 2 ] || { [ "$mayor" -eq 2 ] && [ "$menor" -ge 28 ]; }; then
    si "glibc $glibc (hace falta 2.28 o superior)"
  else
    no "glibc $glibc — DEMASIADO ANTIGUA, el Node incluido no arrancará (hace falta 2.28+)"
  fi
else
  no "no se ha podido leer la versión de glibc"
fi

# 3. ¿Se puede EJECUTAR algo desde la carpeta del usuario?
tmpd="$HOME/.cache/edumind-prueba.$$"
mkdir -p "$tmpd" 2>/dev/null
if printf '#!/bin/sh\nexit 0\n' > "$tmpd/p.sh" 2>/dev/null && chmod +x "$tmpd/p.sh" 2>/dev/null && "$tmpd/p.sh" 2>/dev/null; then
  si "se pueden ejecutar programas desde tu carpeta personal"
else
  no "tu carpeta personal está montada con 'noexec': NO se puede ejecutar nada desde ahí"
fi
rm -rf "$tmpd" 2>/dev/null

# 4. Espacio libre en HOME (hacen falta ~200 MB)
libre=$(df -Pm "$HOME" 2>/dev/null | awk 'NR==2{print $4}')
if [ -n "$libre" ] && [ "$libre" -ge 300 ]; then
  si "espacio libre en tu carpeta: ${libre} MB"
else
  no "solo ${libre:-?} MB libres — hacen falta unos 300 MB"
fi

# 5. Navegador para abrirlo
if command -v xdg-open >/dev/null 2>&1; then
  si "xdg-open disponible (abrirá el navegador solo)"
else
  no "sin xdg-open — tendrás que abrir http://localhost:4600 a mano"
fi

# 6. Puerto 4600 libre
if command -v ss >/dev/null 2>&1 && ss -ltn 2>/dev/null | grep -q ':4600 '; then
  no "el puerto 4600 ya está ocupado"
else
  si "puerto 4600 libre"
fi

echo
if [ "$ko" -eq 0 ]; then
  echo ">>> TODO CORRECTO. Descomprime el ZIP en tu carpeta personal y ejecuta"
  echo "    iniciar-inventario.sh. No hace falta sudo ni instalar nada."
else
  echo ">>> $ko comprobación(es) fallidas. Manda esta salida a contacto@edumind.es"
  echo "    y se busca alternativa (por ejemplo, usar el modo red desde otro equipo)."
fi
