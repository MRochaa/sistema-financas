#!/bin/bash

# Script de teste para verificar inicialização
echo "=== Teste de Inicialização ==="

# Simula o ambiente de produção
export NODE_ENV=production
export BACKEND_PORT=3001
export DATABASE_URL="postgresql://test:test@localhost:5432/test"

echo "Variáveis de ambiente:"
echo "NODE_ENV: $NODE_ENV"
echo "BACKEND_PORT: $BACKEND_PORT"
echo "DATABASE_URL: $DATABASE_URL"

# Testa se o script start.sh existe e é executável
if [ -f "./start.sh" ]; then
    echo "✅ Script start.sh encontrado"
    if [ -x "./start.sh" ]; then
        echo "✅ Script start.sh é executável"
    else
        echo "❌ Script start.sh não é executável"
        chmod +x ./start.sh
        echo "✅ Permissões corrigidas"
    fi
else
    echo "❌ Script start.sh não encontrado"
fi

# Testa se os arquivos necessários existem
echo "Verificando arquivos necessários:"
[ -f "./nginx.conf" ] && echo "✅ nginx.conf" || echo "❌ nginx.conf"
[ -f "./backend/package.json" ] && echo "✅ backend/package.json" || echo "❌ backend/package.json"
[ -f "./backend/src/server.js" ] && echo "✅ backend/src/server.js" || echo "❌ backend/src/server.js"
[ -f "./backend/src/seed.js" ] && echo "✅ backend/src/seed.js" || echo "❌ backend/src/seed.js"

echo "=== Teste concluído ==="
