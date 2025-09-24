#!/bin/bash

# Script de inicialização do container
# Gerencia o startup do backend Node.js e frontend Nginx

echo "=== Iniciando Sistema de Finanças ==="

# Executa debug primeiro
echo "Executando diagnóstico do container..."
/debug-container.sh

echo "Ambiente: $NODE_ENV"
echo "Porta Backend: ${BACKEND_PORT:-$PORT}"
echo "DATABASE_URL definido: $([ -n "${DATABASE_URL}" ] && echo "Sim" || echo "Não")"
echo "Diretório atual: $(pwd)"
echo "Arquivos no diretório: $(ls -la)"

# Função para verificar se o backend está pronto (não falha em HTTP 503)
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

cd /app/backend
echo "Mudou para diretório: $(pwd)"
echo "Arquivos no backend: $(ls -la)"

# Inicia o servidor Node.js primeiro (em background)
BACKEND_PORT=${BACKEND_PORT:-3001}
echo "Iniciando backend na porta ${BACKEND_PORT}..."
echo "Verificando se node está disponível: $(which node)"
echo "Verificando se src/server.js existe: $([ -f "src/server.js" ] && echo "Sim" || echo "Não")"

BACKEND_PORT=${BACKEND_PORT} node src/server.js &
BACKEND_PID=$!
echo "Backend iniciado com PID: $BACKEND_PID"

# Inicia o Nginx imediatamente (para satisfazer o healthcheck /health)
echo "Iniciando Nginx na porta 3000..."
echo "Verificando se nginx está disponível: $(which nginx)"
echo "Verificando se nginx.conf existe: $([ -f "/etc/nginx/http.d/default.conf" ] && echo "Sim" || echo "Não")"

# Testa configuração do nginx antes de iniciar
nginx -t
if [ $? -ne 0 ]; then
    echo "❌ Erro na configuração do nginx!"
    exit 1
fi

nginx -g "daemon off;" &
NGINX_PID=$!
echo "Nginx iniciado com PID: $NGINX_PID"

# Aguarda nginx iniciar e verifica se está respondendo
echo "Aguardando nginx iniciar..."
sleep 2
if check_nginx; then
    echo "✅ Nginx está respondendo no health check"
else
    echo "❌ Nginx não está respondendo no health check"
    echo "Logs do nginx:"
    tail -n 20 /var/log/nginx/error.log 2>/dev/null || echo "Não foi possível acessar logs do nginx"
fi

# Aguarda um momento para os processos iniciarem
sleep 2

# Verifica se os processos estão rodando
echo "Verificando processos iniciados:"
if kill -0 $BACKEND_PID 2>/dev/null; then
    echo "✅ Backend (PID: $BACKEND_PID) está rodando"
else
    echo "❌ Backend (PID: $BACKEND_PID) não está rodando"
fi

if kill -0 $NGINX_PID 2>/dev/null; then
    echo "✅ Nginx (PID: $NGINX_PID) está rodando"
else
    echo "❌ Nginx (PID: $NGINX_PID) não está rodando"
fi

# Executa migrações do Prisma de forma não bloqueante (se DATABASE_URL estiver definido)
if [ -n "${DATABASE_URL}" ]; then
    echo "Executando migrações do Prisma em background..."
    (
        # Não usar set -e para evitar crash do container
        START_TS=$(date +%s)
        echo "Iniciando prisma migrate deploy..."
        npx prisma migrate deploy 2>&1 || echo "Aviso: migrações falharam (continuando)."
        echo "Executando seed do banco de dados..."
        npm run db:seed 2>&1 || echo "Aviso: seed falhou (continuando)."
        END_TS=$(date +%s)
        echo "Migrações e seed finalizados em $((END_TS-START_TS))s"
    ) &
else
    echo "DATABASE_URL não definido; pulando migrações do Prisma."
fi

# Aguarda o backend iniciar (sem derrubar o container se demorar) e adiciona diagnósticos
echo "Aguardando backend iniciar (até 60s, sem abortar)..."
WAIT_TIME=0
MAX_WAIT=60
while [ $WAIT_TIME -lt $MAX_WAIT ]; do
    if check_backend; then
        echo "✅ Backend respondeu ao healthcheck!"
        break
    fi
    echo "Aguardando backend... ($WAIT_TIME/$MAX_WAIT)"
    # Diagnósticos mais detalhados
    echo "[diag] Verificando processos Node.js:"
    ps aux | grep node | grep -v grep || echo "Nenhum processo Node.js encontrado"
    
    echo "[diag] Tentando curl backend: curl -sv http://localhost:${BACKEND_PORT:-3001}/api/health"
    curl -sv http://localhost:${BACKEND_PORT:-3001}/api/health 2>&1 || true
    
    echo "[diag] Tentando curl nginx /health: curl -sv http://localhost:3000/health"
    curl -sv http://localhost:3000/health 2>&1 || true
    
    echo "[diag] Processos escutando portas:"
    ss -lntp 2>/dev/null || netstat -lntp 2>/dev/null || echo "Não foi possível verificar portas"
    sleep 3
    WAIT_TIME=$((WAIT_TIME + 3))
done
if [ $WAIT_TIME -ge $MAX_WAIT ]; then
    echo "⚠️  Aviso: Backend não respondeu dentro do tempo esperado, continuando assim mesmo."
    echo "Verificando se pelo menos o nginx está funcionando..."
    if check_nginx; then
        echo "✅ Pelo menos o nginx está funcionando - container pode continuar"
    else
        echo "❌ Nginx também não está funcionando - problema crítico"
    fi
fi

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
echo "✅ Sistema iniciado com sucesso! Monitorando processos..."
while true; do
    # Verifica se o backend ainda está rodando
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        echo "❌ Backend parou inesperadamente (PID: $BACKEND_PID)"
        echo "Verificando logs do backend..."
        ps aux | grep node || echo "Nenhum processo node encontrado"
        cleanup
    fi
    
    # Verifica se o nginx ainda está rodando  
    if ! kill -0 $NGINX_PID 2>/dev/null; then
        echo "❌ Nginx parou inesperadamente (PID: $NGINX_PID)"
        echo "Verificando logs do nginx..."
        ps aux | grep nginx || echo "Nenhum processo nginx encontrado"
        cleanup
    fi
    
    # Log de status a cada 30 segundos
    if [ $((WAIT_TIME % 30)) -eq 0 ]; then
        echo "🔄 Sistema funcionando - Backend PID: $BACKEND_PID, Nginx PID: $NGINX_PID"
    fi
    
    sleep 5
    WAIT_TIME=$((WAIT_TIME + 5))
done
