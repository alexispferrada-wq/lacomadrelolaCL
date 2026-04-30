#!/bin/bash
# start-mac.sh — La Comadre Lola
# Arranque rapido para Mac/Linux

cd "$(dirname "$0")"

# Crear .env si no existe
if [ ! -f .env ]; then
  cp .env.example .env
  echo "[OK] .env creado desde .env.example"
fi

# Instalar dependencias si falta
if [ ! -d node_modules ]; then
  echo "[..] Instalando dependencias..."
  npm install
fi

echo ""
echo " La Comadre Lola — Dev Server"
echo " ======================================"
echo " Sitio : http://localhost:3001"
echo " Admin : http://localhost:3001/admin"
echo " Editor: http://localhost:3001/editor"
echo " Login : http://localhost:3001/login"
echo " ======================================"
echo " Ctrl+C para detener"
echo ""

node server.js
