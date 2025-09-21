#!/bin/bash

# Script de inicialização do container
# Gerencia o startup do backend Node.js e frontend Nginx

echo "=== Iniciando Sistema de Finanças ==="
echo "Ambiente: $NODE_ENV"
echo "Porta Backend: $PORT"

# Função para verificar se o backend está pronto
check_backend() {
    curl -s http://localhost:${PORT}/health > /dev/null 2>&1
    return $?
}

# Inicia o backend em background
echo "Iniciando backend na porta ${PORT}..."
cd /app/backend

# Executa migrações do Prisma se necessário
echo "Verificando migrações do banco de dados..."
npx prisma migrate deploy || {
    echo "Aviso: Não foi possível executar migrações. Continuando..."
}

# Gera o cliente Prisma
echo "Gerando cliente Prisma..."
npx prisma generate || {
    echo "Aviso: Não foi possível gerar cliente Prisma. Continuando..."
}

# Inicia o servidor Node.js
node src/server.js &
BACKEND_PID=$!

# Aguarda o backend iniciar (máximo 60 segundos para dar mais tempo)
echo "Aguardando backend iniciar..."
WAIT_TIME=0
MAX_WAIT=60

while [ $WAIT_TIME -lt $MAX_WAIT ]; do
    if check_backend; then
        echo "✅ Backend iniciado com sucesso!"
        break
    fi
    echo "Aguardando... ($WAIT_TIME/$MAX_WAIT)"
    sleep 2
    WAIT_TIME=$((WAIT_TIME + 2))
done

if [ $WAIT_TIME -ge $MAX_WAIT ]; then
    echo "❌ ERRO: Backend não iniciou no tempo esperado"
    echo "Logs do backend:"
    tail -n 20 /var/log/backend.log 2>/dev/null || echo "Nenhum log encontrado"
    exit 1
fi

# Inicia o Nginx em foreground
echo "Iniciando Nginx..."
nginx -g "daemon off;" &
NGINX_PID=$!

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
    
    sleep 5
done