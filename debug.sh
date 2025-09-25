#!/bin/bash

echo "=== DEBUG CONTAINER ==="

echo "1. Verificando estrutura de diretórios:"
ls -la /
ls -la /app/
ls -la /app/backend/
ls -la /usr/share/nginx/html/

echo "2. Verificando arquivos de configuração:"
ls -la /etc/nginx/http.d/
cat /etc/nginx/http.d/default.conf

echo "3. Verificando variáveis de ambiente:"
env

echo "4. Testando nginx:"
nginx -t

echo "5. Verificando package.json do backend:"
cat /app/backend/package.json | grep -A5 "scripts"

echo "6. Verificando se server.js existe:"
ls -la /app/backend/src/

echo "7. Testando se node funciona:"
node --version

echo "8. Verificando se npm funciona:"
npm --version

echo "=== FIM DO DEBUG ==="
