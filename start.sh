#!/bin/bash

# Script de inicialização do container - Sistema de Finanças
# Gerencia o startup do backend Node.js e frontend Nginx

echo "=== Iniciando Sistema de Finanças ==="
echo "Timestamp: $(date)"

# Executa script de debug se existir
if [ -f /debug-container.sh ]; then
    echo "Executando diagnóstico do container..."
    /debug-container.sh
fi

# Exibe configuração do ambiente
echo "Configuração do ambiente:"
echo "NODE_ENV: ${NODE_ENV:-production}"
echo "BACKEND_PORT: ${BACKEND_PORT:-3001}"
echo "DATABASE_URL definido: $([ -n "${DATABASE_URL}" ] && echo "Sim" || echo "Não")"
echo "Diretório atual: $(pwd)"

# Função para verificar se o backend está pronto
check_backend() {
    local response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:${BACKEND_PORT:-3001}/api/health 2>/dev/null)
    # Aceita 200 (OK) ou 503 (Service Unavailable - banco não conectado ainda)
    [ "$response" = "200" ] || [ "$response" = "503" ]
    return $?
}

# Função para verificar se o nginx está respondendo
check_nginx() {
    local response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health 2>/dev/null)
    [ "$response" = "200" ]
    return $?
}

# Navega para o diretório do backend
cd /app/backend
echo "Diretório backend: $(pwd)"
echo "Conteúdo do diretório: $(ls -la | head -5)"

# Define a porta do backend (usa BACKEND_PORT ou PORT ou padrão 3001)
BACKEND_PORT=${BACKEND_PORT:-${PORT:-3001}}
export BACKEND_PORT

# Inicia o servidor Node.js em background
echo "Iniciando backend na porta ${BACKEND_PORT}..."
if [ -f "src/server.js" ]; then
    NODE_ENV=${NODE_ENV:-production} BACKEND_PORT=${BACKEND_PORT} node src/server.js &
    BACKEND_PID=$!
    echo "✅ Backend iniciado com PID: $BACKEND_PID"
else
    echo "❌ ERRO: src/server.js não encontrado!"
    exit 1
fi

# Testa configuração do nginx antes de iniciar
echo "Verificando configuração do Nginx..."
nginx -t
if [ $? -ne 0 ]; then
    echo "❌ Erro na configuração do nginx!"
    exit 1
fi

# Inicia o Nginx (IMPORTANTE: deve estar na porta 3000 para o Coolify)
echo "Iniciando Nginx na porta 3000..."
nginx -g "daemon off;" &
NGINX_PID=$!
echo "✅ Nginx iniciado com PID: $NGINX_PID"

# Aguarda nginx iniciar
sleep 3

# Verifica se o nginx está respondendo
if check_nginx; then
    echo "✅ Nginx está respondendo no health check"
else
    echo "⚠️ Nginx ainda não está respondendo no health check"
fi

# Verifica se os processos estão rodando
echo "Verificando processos:"
if kill -0 $BACKEND_PID 2>/dev/null; then
    echo "✅ Backend rodando (PID: $BACKEND_PID)"
else
    echo "❌ Backend não está rodando!"
    exit 1
fi

if kill -0 $NGINX_PID 2>/dev/null; then
    echo "✅ Nginx rodando (PID: $NGINX_PID)"
else
    echo "❌ Nginx não está rodando!"
    exit 1
fi

# Executa migrações do Prisma em background (se DATABASE_URL estiver definido)
if [ -n "${DATABASE_URL}" ]; then
    echo "Executando migrações do Prisma em background..."
    (
        cd /app/backend
        echo "Aguardando 5 segundos antes de executar migrações..."
        sleep 5
        echo "Executando prisma migrate deploy..."
        npx prisma migrate deploy 2>&1 || echo "⚠️ Migrações falharam (continuando)."
        echo "Executando seed do banco..."
        npm run db:seed 2>&1 || echo "⚠️ Seed falhou (continuando)."
        echo "✅ Migrações e seed finalizados"
    ) &
else
    echo "⚠️ DATABASE_URL não definido - pulando migrações"
fi

# Aguarda o backend estar pronto (máximo 30 segundos)
echo "Aguardando backend ficar pronto..."
WAIT_TIME=0
MAX_WAIT=30
while [ $WAIT_TIME -lt $MAX_WAIT ]; do
    if check_backend; then
        echo "✅ Backend está pronto!"
        break
    fi
    echo "  Aguardando... ($WAIT_TIME/$MAX_WAIT segundos)"
    sleep 2
    WAIT_TIME=$((WAIT_TIME + 2))
done

if [ $WAIT_TIME -ge $MAX_WAIT ]; then
    echo "⚠️ Backend demorou para iniciar, mas continuando..."
fi

# Função para encerrar processos graciosamente
cleanup() {
    echo "Encerrando serviços..."
    if [ -n "$BACKEND_PID" ]; then
        kill -TERM $BACKEND_PID 2>/dev/null
    fi
    if [ -n "$NGINX_PID" ]; then
        kill -TERM $NGINX_PID 2>/dev/null
    fi
    exit 0
}

# Configura tratamento de sinais
trap cleanup SIGTERM SIGINT SIGQUIT

# Monitora os processos principais
echo "✅ Sistema iniciado com sucesso! Monitorando processos..."
echo "================================================"

# Loop de monitoramento
while true; do
    # Verifica se o backend ainda está rodando
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        echo "❌ Backend parou inesperadamente!"
        # Tenta reiniciar o backend uma vez
        echo "Tentando reiniciar backend..."
        cd /app/backend
        BACKEND_PORT=${BACKEND_PORT} node src/server.js &
        BACKEND_PID=$!
        echo "Backend reiniciado com novo PID: $BACKEND_PID"
        sleep 5
        if ! kill -0 $BACKEND_PID 2>/dev/null; then
            echo "❌ Falha ao reiniciar backend - encerrando container"
            cleanup
        fi
    fi
    
    # Verifica se o nginx ainda está rodando
    if ! kill -0 $NGINX_PID 2>/dev/null; then
        echo "❌ Nginx parou inesperadamente!"
        cleanup
    fi
    
    # A cada 30 segundos, mostra status
    if [ $((WAIT_TIME % 30)) -eq 0 ] && [ $WAIT_TIME -gt 0 ]; then
        echo "[$(date '+%H:%M:%S')] Sistema operacional - Backend: $BACKEND_PID, Nginx: $NGINX_PID"
    fi
    
    sleep 5
    WAIT_TIME=$((WAIT_TIME + 5))
done
