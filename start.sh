#!/bin/bash

# Script de inicialização do container
# Gerencia o startup do backend Node.js e frontend Nginx

# IMPORTANTE: Debug completo
set -e  # Para em qualquer erro
set -x  # Mostra cada comando executado (DEBUG)

# Trap para capturar erros e mostrar onde falhou
trap 'echo "❌ ERRO na linha $LINENO do start.sh"' ERR

echo "=== INICIANDO SISTEMA ==="
echo "Variáveis de ambiente:"
env | grep -E "PORT|DATABASE_URL|NODE_ENV" || true

# Definir PORT explicitamente
export PORT=3001
export NODE_ENV=production

echo "🔌 PORT configurada: $PORT"
echo "📊 NODE_ENV: $NODE_ENV"

# Função para verificar se o backend está pronto
check_backend() {
    local backend_port=${PORT:-3001}
    curl -s http://localhost:${backend_port}/api/health > /dev/null 2>&1
    return $?
}

# VERIFICAÇÃO 1: Estrutura existe?
echo "📁 Verificando estrutura do backend:"
ls -la /app/backend/
ls -la /app/backend/src/

# VERIFICAÇÃO 2: package.json tem script start?
echo "📦 Scripts disponíveis:"
cat /app/backend/package.json | grep -A5 '"scripts"'

# VERIFICAÇÃO 3: Arquivo principal existe?
if [ ! -f "/app/backend/src/server.js" ]; then
    echo "❌ ERRO: src/server.js não encontrado!"
    echo "Procurando arquivo principal..."
    find /app/backend -name "*.js" -type f | head -20
    exit 1
fi
echo "✅ server.js encontrado"

cd /app/backend

# VERIFICAÇÃO 4: Testar conexão com banco ANTES de iniciar
echo "🔄 Testando conexão com banco de dados..."
npx prisma db push --skip-generate || {
    echo "⚠️ Banco de dados não acessível, continuando mesmo assim..."
}

# INICIAR BACKEND com logs detalhados
echo "🚀 Iniciando backend na porta $PORT..."

# IMPORTANTE: Use node direto, não npm start (para ver erros)
node src/server.js 2>&1 | tee /tmp/backend.log &
BACKEND_PID=$!

echo "Backend iniciado com PID: $BACKEND_PID"

# Aguardar backend inicializar
echo "⏳ Aguardando backend..."
for i in {1..30}; do
    # Verificar se processo ainda está vivo
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        echo "❌ Backend morreu! Últimas linhas do log:"
        tail -20 /tmp/backend.log
        exit 1
    fi
    
    # Verificar se está respondendo
    if curl -s http://localhost:$PORT/api/health > /dev/null 2>&1; then
        echo "✅ Backend respondendo!"
        break
    fi
    
    echo "Tentativa $i/30..."
    sleep 2
done

# Se não respondeu após 30 tentativas
if ! curl -s http://localhost:$PORT/api/health > /dev/null 2>&1; then
    echo "❌ Backend não respondeu após 60 segundos!"
    echo "📋 Log do backend:"
    cat /tmp/backend.log
    echo "📊 Processos rodando:"
    ps aux
    echo "🔌 Portas abertas:"
    netstat -tlpn 2>/dev/null || ss -tlpn
    exit 1
fi

# NGINX
echo "🔧 Configurando Nginx..."
nginx -t || exit 1

echo "🌐 Iniciando Nginx..."
nginx -g 'daemon off;' &
NGINX_PID=$!

# Monitor loop
while true; do
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        echo "❌ Backend morreu!"
        tail -20 /tmp/backend.log
        exit 1
    fi
    if ! kill -0 $NGINX_PID 2>/dev/null; then
        echo "❌ Nginx morreu!"
        exit 1
    fi
    
    # A cada 10 segundos, verificar se backend responde
    if ! curl -s http://localhost:$PORT/api/health > /dev/null 2>&1; then
        echo "⚠️ Backend parou de responder!"
        echo "Log recente:"
        tail -10 /tmp/backend.log
    else
        echo "✅ Sistema OK - Backend: $BACKEND_PID, Nginx: $NGINX_PID"
    fi
    
    sleep 10
done
