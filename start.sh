#!/bin/sh
# Script de inicialização robusto para o container

echo "========================================"
echo "🚀 Sistema Financeiro - Inicialização"
echo "========================================"

# Configurações de ambiente
export NODE_ENV=${NODE_ENV:-production}
export PORT=${PORT:-3001}

# Função para verificar se o backend está pronto
check_backend() {
    curl -f http://localhost:${PORT}/health >/dev/null 2>&1
    return $?
}

# Navega para o diretório do backend
cd /app/backend || exit 1

# Verifica se o Prisma client existe
if [ ! -d "node_modules/@prisma/client" ]; then
    echo "⚠️  Gerando Prisma client..."
    npx prisma generate
fi

# Executa migrações do banco (se necessário)
echo "📊 Verificando migrações do banco..."
npx prisma migrate deploy 2>&1 | grep -v "already in sync" || true

# Inicia o backend Node.js em background
echo "🔧 Iniciando backend na porta ${PORT}..."
node src/server.js 2>&1 | tee /var/log/backend.log &
BACKEND_PID=$!

# Aguarda o backend inicializar
echo "⏳ Aguardando backend inicializar..."
COUNTER=0
MAX_TRIES=30

while [ $COUNTER -lt $MAX_TRIES ]; do
    sleep 2
    if check_backend; then
        echo "✅ Backend está rodando!"
        break
    fi
    COUNTER=$((COUNTER + 1))
    echo "   Tentativa $COUNTER de $MAX_TRIES..."
done

# Verifica se o backend iniciou com sucesso
if [ $COUNTER -eq $MAX_TRIES ]; then
    echo "❌ ERRO: Backend não iniciou após $MAX_TRIES tentativas"
    echo "📋 Últimas linhas do log:"
    tail -20 /var/log/backend.log
    exit 1
fi

# Configura trap para encerrar processos corretamente
trap 'kill $BACKEND_PID; nginx -s quit' TERM INT

# Inicia o Nginx em foreground
echo "🌐 Iniciando Nginx..."
nginx -g 'daemon off;' &
NGINX_PID=$!

# Monitora os processos
echo "✅ Sistema iniciado com sucesso!"
echo "   Backend PID: $BACKEND_PID"
echo "   Nginx PID: $NGINX_PID"

# Aguarda por qualquer processo terminar
wait $NGINX_PID $BACKEND_PID
