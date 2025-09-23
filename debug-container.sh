#!/bin/bash

# Script de debug para container
echo "=== Debug do Container ==="

# Verifica se estamos em um container
if [ -f /.dockerenv ]; then
    echo "✅ Executando dentro de container Docker"
else
    echo "⚠️  Não está em container Docker"
fi

# Verifica variáveis de ambiente
echo "Variáveis de ambiente importantes:"
echo "NODE_ENV: ${NODE_ENV:-'não definido'}"
echo "BACKEND_PORT: ${BACKEND_PORT:-'não definido'}"
echo "DATABASE_URL: ${DATABASE_URL:-'não definido'}"
echo "PORT: ${PORT:-'não definido'}"

# Verifica diretórios
echo "Estrutura de diretórios:"
echo "Diretório atual: $(pwd)"
echo "Conteúdo do diretório atual:"
ls -la

echo "Conteúdo de /app:"
ls -la /app 2>/dev/null || echo "Diretório /app não existe"

echo "Conteúdo de /app/backend:"
ls -la /app/backend 2>/dev/null || echo "Diretório /app/backend não existe"

# Verifica se os executáveis estão disponíveis
echo "Executáveis disponíveis:"
which node || echo "Node.js não encontrado"
which nginx || echo "Nginx não encontrado"
which curl || echo "Curl não encontrado"

# Verifica se os arquivos de configuração existem
echo "Arquivos de configuração:"
[ -f "/etc/nginx/http.d/default.conf" ] && echo "✅ nginx.conf" || echo "❌ nginx.conf"
[ -f "/app/backend/package.json" ] && echo "✅ package.json" || echo "❌ package.json"
[ -f "/app/backend/src/server.js" ] && echo "✅ server.js" || echo "❌ server.js"

# Verifica portas em uso
echo "Portas em uso:"
netstat -tlnp 2>/dev/null || ss -tlnp 2>/dev/null || echo "Não foi possível verificar portas"

echo "=== Debug concluído ==="
