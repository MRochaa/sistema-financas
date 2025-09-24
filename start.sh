#!/bin/bash

# Script de inicialização do container
# Gerencia o startup do backend Node.js e frontend Nginx

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

# Inicia o Nginx em foreground
echo "Iniciando Nginx..."
nginx -g "daemon off;" &
NGINX_PID=$!

# Aguarda um pouco para o nginx inicializar
sleep 2

# Verifica se o nginx está rodando
if ! kill -0 $NGINX_PID 2>/dev/null; then
    echo "❌ ERRO: Nginx não iniciou"
    exit 1
fi

echo "✅ Nginx iniciado com sucesso!"
echo "✅ Sistema de Finanças está rodando!"

# Função para tratar sinais de término
cleanup() {
    echo "Encerrando serviços..."
    kill $BACKEND_PID 2>/dev/null
    kill $NGINX_PID 2>/dev/null
    exit 0
}

# Configura tratamento de sinais
trap cleanup SIGTERM SIGINT

# Mantém o script rodando e monitora os processos
while true; do
    # Verifica se o backend ainda está rodando
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        echo "❌ Backend parou inesperadamente"
        cleanup
    fi
    
    # Verifica se o nginx ainda está rodando  
    if ! kill -0 $NGINX_PID 2>/dev/null; then
        echo "❌ Nginx parou inesperadamente"
        cleanup
    fi
    
    sleep 10
done
