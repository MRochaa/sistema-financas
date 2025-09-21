#!/bin/bash

echo "=== Iniciando Sistema de Finanças ==="

# Configurar variáveis
export NODE_ENV=${NODE_ENV:-production}
export PORT=${PORT:-3001}

# Iniciar backend
echo "Iniciando backend..."
cd /app/backend
node src/server.js &

# Aguardar backend iniciar
sleep 3

# Iniciar nginx
echo "Iniciando Nginx..."
nginx -g "daemon off;"
