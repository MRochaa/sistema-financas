#!/bin/bash

# Script de inicialização do container
echo "=== Iniciando Sistema de Finanças ==="
echo "Timestamp: $(date)"

# Exibe configuração do ambiente
echo "NODE_ENV: ${NODE_ENV:-production}"
echo "BACKEND_PORT: ${BACKEND_PORT:-3001}"

# Navega para o diretório do backend
cd /app/backend

# Verifica se o diretório existe
if [ ! -d "/app/backend" ]; then
    echo "❌ Erro: Diretório /app/backend não encontrado!"
    exit 1
fi

# Lista arquivos para debug
echo "Arquivos no backend:"
ls -la src/ 2>/dev/null || echo "Diretório src/ não encontrado"

# Inicia o backend Node.js
echo "Iniciando backend na porta ${BACKEND_PORT:-3001}..."

# Verifica se o arquivo server.js existe
if [ -f "src/server.js" ]; then
    NODE_ENV=${NODE_ENV:-production} \
    BACKEND_PORT=${BACKEND_PORT:-3001} \
    node src/server.js &
    BACKEND_PID=$!
    echo "✅ Backend iniciado com PID: $BACKEND_PID"
else
    echo "❌ ERRO: src/server.js não encontrado!"
    echo "Conteúdo do diretório:"
    ls -la
    exit 1
fi

# Aguarda o backend iniciar
echo "Aguardando backend iniciar..."
for i in {1..30}; do
    if curl -s http://localhost:${BACKEND_PORT:-3001}/api/health > /dev/null 2>&1; then
        echo "✅ Backend respondendo!"
        break
    fi
    echo "Tentativa $i/30..."
    sleep 1
done

# Verifica se o backend está rodando
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo "❌ Backend falhou ao iniciar!"
    exit 1
fi

# Testa configuração do nginx
echo "Verificando configuração do Nginx..."
nginx -t
if [ $? -ne 0 ]; then
    echo "❌ Erro na configuração do nginx!"
    cat /etc/nginx/http.d/default.conf
    exit 1
fi

# Inicia o Nginx em foreground
echo "Iniciando Nginx na porta 3000..."
exec nginx -g "daemon off;"
