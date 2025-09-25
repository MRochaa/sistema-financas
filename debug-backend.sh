#!/bin/bash
echo "=== DEBUG DO BACKEND ==="
cd /app/backend

echo "1. Estrutura:"
ls -la

echo -e "\n2. Dependências instaladas:"
ls node_modules/ | head -10

echo -e "\n3. Variáveis de ambiente:"
env | grep -E "PORT|DATABASE_URL|NODE_ENV"

echo -e "\n4. Tentando iniciar backend direto:"
PORT=3001 node src/server.js
