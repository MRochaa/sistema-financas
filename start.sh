#!/bin/bash

# Script de inicialização do container
# Gerencia o startup do backend Node.js e frontend Nginx

# Para o script em caso de erro
set -e

echo "=== Iniciando Sistema de Finanças ==="
echo "Ambiente: $NODE_ENV"
echo "Porta Backend: ${PORT:-3001}"

# Função para verificar se o backend está pronto
check_backend() {
    local backend_port=${PORT:-3001}
    curl -s http://localhost:${backend_port}/api/health > /dev/null 2>&1
    return $?
}

# Inicia o backend em background
echo "Iniciando backend na porta ${PORT:-3001}..."
cd /app/backend

# Executa migrações do Prisma se necessário
echo "Verificando migrações do banco de dados..."
npx prisma migrate deploy || {
    echo "Aviso: Não foi possível executar migrações. Continuando..."
}

# Inicia o servidor Node.js
echo "Iniciando servidor Node.js..."
node src/server.js &
BACKEND_PID=$!

# Aguarda o backend iniciar (máximo 60 segundos)
echo "Aguardando backend iniciar..."
WAIT_TIME=0
MAX_WAIT=60

while [ $WAIT_TIME -lt $MAX_WAIT ]; do
    if check_backend; then
        echo "✅ Backend iniciado com sucesso!"
        break
    fi
    echo "Aguardando... ($WAIT_TIME/$MAX_WAIT)"
    sleep 3
    WAIT_TIME=$((WAIT_TIME + 3))
done

if [ $WAIT_TIME -ge $MAX_WAIT ]; then
    echo "❌ ERRO: Backend não iniciou no tempo esperado"
    echo "Verificando logs do backend..."
    ps aux | grep node
    exit 1
fi

# Substitui variáveis de ambiente no nginx.conf
echo "Configurando Nginx para porta ${PORT:-3001}..."
ACTUAL_PORT=${PORT:-3001}
echo "Substituindo \${PORT:-3001} por ${ACTUAL_PORT} no nginx.conf..."
sed -i "s/\${PORT:-3001}/${ACTUAL_PORT}/g" /etc/nginx/http.d/default.conf
echo "Verificando configuração do nginx após substituição:"
grep -n "proxy_pass" /etc/nginx/http.d/default.conf || echo "Nenhum proxy_pass encontrado"

# Testa a configuração do nginx
echo "Testando configuração do nginx..."
nginx -t || {
    echo "❌ ERRO: Configuração do nginx inválida"
    exit 1
}
echo "✅ Configuração do nginx válida"

# Inicia o Nginx em foreground
echo "Iniciando Nginx..."
echo "✅ Sistema de Finanças está rodando!"
echo "✅ Frontend React servido pelo Nginx na porta 80"
echo "✅ Backend Node.js rodando na porta ${PORT:-3001}"
echo "✅ Proxy configurado: /api -> backend, / -> frontend"

# Executa nginx em foreground (não retorna)
exec nginx -g "daemon off;"
