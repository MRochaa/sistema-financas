#!/bin/bash
set -e

echo "========================================="
echo "🚀 INICIANDO SISTEMA DE FINANÇAS"
echo "========================================="
echo "📅 Data: $(date)"
echo "🌍 Ambiente: ${NODE_ENV:-production}"
echo "🔌 Porta Backend: 3001 (FIXA)"
echo "🌐 Porta Nginx: 80"
echo "========================================="

# Debug das variáveis
echo "🔍 DEBUG: Variáveis de ambiente:"
echo "DATABASE_URL: ${DATABASE_URL:0:50}..."
echo "JWT_SECRET: ${JWT_SECRET:0:20}..."
echo "FRONTEND_URL: ${FRONTEND_URL}"
echo "========================================="

# Função para verificar se o backend está pronto
check_backend() {
    curl -sf http://127.0.0.1:3001/api/health > /dev/null 2>&1
    return $?
}

# Configuração do backend
cd /app/backend

# Verifica conexão com banco
echo "🔍 Verificando conexão com banco de dados..."
if npx prisma db execute --stdin <<< "SELECT 1" > /dev/null 2>&1; then
    echo "✅ Banco de dados conectado!"
else
    echo "⚠️  Aviso: Não foi possível conectar ao banco - continuando mesmo assim"
fi

# Executa migrações
echo "📦 Executando migrações do banco..."
if npx prisma migrate deploy; then
    echo "✅ Migrações aplicadas com sucesso!"
else
    echo "⚠️  Migrações falharam - continuando mesmo assim"
fi

# Executa seed se necessário
if [ "$RUN_SEED" = "true" ] || [ ! -f "/app/backend/.seeded" ]; then
    echo "🌱 Executando seed do banco..."
    if node src/seed.js; then
        touch /app/backend/.seeded
        echo "✅ Seed executado!"
    else
        echo "⚠️  Seed falhou, mas continuando..."
    fi
fi

# Inicia o backend (SEMPRE na porta 3001)
echo "🎯 Iniciando backend Node.js..."
PORT=3001 NODE_ENV=${NODE_ENV:-production} node src/server.js &
BACKEND_PID=$!
echo "🔍 Backend PID: $BACKEND_PID"

# Aguarda backend iniciar
echo "⏳ Aguardando backend iniciar..."
MAX_WAIT=60
WAIT_COUNT=0

while [ $WAIT_COUNT -lt $MAX_WAIT ]; do
    if check_backend; then
        echo "✅ Backend está rodando!"
        echo "📡 Testando endpoint: $(curl -s http://127.0.0.1:3001/api/health)"
        break
    fi
    
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        echo "❌ Backend morreu!"
        exit 1
    fi
    
    echo "   Tentativa $((WAIT_COUNT + 1))/$MAX_WAIT..."
    sleep 1
    WAIT_COUNT=$((WAIT_COUNT + 1))
done

if [ $WAIT_COUNT -ge $MAX_WAIT ]; then
    echo "❌ Backend não iniciou após ${MAX_WAIT}s"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# Verifica arquivos do frontend
echo "📂 Verificando arquivos do frontend..."
if [ ! -f /usr/share/nginx/html/index.html ]; then
    echo "❌ ERRO: index.html não encontrado!"
    ls -la /usr/share/nginx/html/
    exit 1
fi

echo "✅ Frontend encontrado:"
ls -la /usr/share/nginx/html/ | head -10

# NÃO FAZER SUBSTITUIÇÃO DE PORTA - NGINX JÁ ESTÁ CONFIGURADO PARA 3001!
echo "📌 Nginx configurado para porta fixa 3001"

# Testa configuração do Nginx
echo "🔧 Testando configuração do Nginx..."
if nginx -t; then
    echo "✅ Configuração do Nginx válida!"
else
    echo "❌ Erro na configuração do Nginx!"
    cat /etc/nginx/http.d/default.conf
    exit 1
fi

# Inicia Nginx em foreground
echo "========================================="
echo "✅ SISTEMA PRONTO!"
echo "🌐 Frontend: http://localhost/"
echo "🔌 Backend: http://localhost:3001/api"
echo "❤️  Health: http://localhost/health"
echo "========================================="

# Logs de debug para Coolify
echo "🔍 DEBUG: Verificando se backend está respondendo..."
curl -s http://127.0.0.1:3001/api/health && echo "✅ Backend OK" || echo "❌ Backend não respondeu"

echo "🔍 DEBUG: Verificando se nginx está configurado..."
nginx -t && echo "✅ Nginx config OK" || echo "❌ Nginx config error"

echo "🔍 DEBUG: Verificando processos rodando..."
ps aux | grep -E "(node|nginx)" | head -5

echo "🔍 DEBUG: Verificando portas abertas..."
netstat -tlpn 2>/dev/null | grep -E "(80|3001)" | head -3 || ss -tlpn 2>/dev/null | grep -E "(80|3001)" | head -3

# Mantém Nginx rodando em foreground
exec nginx -g "daemon off;"
