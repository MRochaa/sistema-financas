#!/bin/bash
set -e  # Para no primeiro erro

# ============================================
# Script de inicialização do container Docker
# Sistema de Finanças Familiares
# ============================================

echo "🚀 Iniciando Sistema Financeiro..."

# Define variáveis de ambiente padrão se não estiverem definidas
export NODE_ENV=${NODE_ENV:-production}
export PORT=${PORT:-3001}

# Verifica se os diretórios existem
if [ ! -d "/app/backend" ]; then
    echo "❌ Erro: Diretório backend não encontrado"
    exit 1
fi

if [ ! -d "/usr/share/nginx/html" ]; then
    echo "❌ Erro: Diretório frontend não encontrado"
    exit 1
fi

# Navega para o diretório do backend
cd /app/backend

# Verifica se o arquivo server.js existe
if [ ! -f "src/server.js" ]; then
    echo "❌ Erro: Arquivo server.js não encontrado"
    ls -la src/
    exit 1
fi

# Executa migrações do Prisma (se necessário)
echo "📊 Executando migrações do banco de dados..."
if npx prisma migrate deploy 2>/dev/null; then
    echo "✅ Migrações executadas com sucesso"
else
    echo "⚠️ Erro nas migrações ou banco não disponível"
fi

# Inicia o backend em background
echo "🔧 Iniciando servidor backend na porta $PORT..."
node src/server.js > /var/log/backend.log 2>&1 &
BACKEND_PID=$!

# Aguarda o backend inicializar com timeout maior
echo "⏳ Aguardando backend inicializar..."
MAX_ATTEMPTS=30
ATTEMPT=0
BACKEND_READY=false

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    # Verifica se o processo ainda está rodando
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        echo "❌ Backend parou de funcionar. Logs:"
        tail -n 20 /var/log/backend.log
        exit 1
    fi
    
    # Testa se o backend responde
    if curl -f -s http://localhost:$PORT/health >/dev/null 2>&1; then
        echo "✅ Backend iniciado com sucesso!"
        BACKEND_READY=true
        break
    else
        echo "⚠️ Tentativa $((ATTEMPT+1)) de $MAX_ATTEMPTS - Backend ainda iniciando..."
        sleep 2
    fi
    ATTEMPT=$((ATTEMPT+1))
done

if [ "$BACKEND_READY" = "false" ]; then
    echo "❌ Backend falhou ao iniciar após $MAX_ATTEMPTS tentativas"
    echo "📋 Logs do backend:"
    tail -n 50 /var/log/backend.log
    echo "📋 Tentando matar processo e sair..."
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
fi

# Cria um PID file para o backend
echo $BACKEND_PID > /var/run/backend.pid

# Função para cleanup no exit
cleanup() {
    echo "🛑 Encerrando aplicação..."
    if [ -f /var/run/backend.pid ]; then
        BACKEND_PID=$(cat /var/run/backend.pid)
        if kill -0 $BACKEND_PID 2>/dev/null; then
            echo "🔄 Parando backend (PID: $BACKEND_PID)..."
            kill $BACKEND_PID
            wait $BACKEND_PID 2>/dev/null || true
        fi
        rm -f /var/run/backend.pid
    fi
}

trap cleanup EXIT INT TERM

# Inicia o Nginx em foreground
echo "🌐 Iniciando servidor Nginx..."
exec nginx -g 'daemon off;'
