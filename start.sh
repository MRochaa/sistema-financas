#!/bin/bash

# Script de inicialização do container
# Gerencia o startup do backend Node.js e frontend Nginx

# IMPORTANTE: Debug completo
set -e  # Para em qualquer erro
set -x  # Mostra cada comando executado (DEBUG)

# Trap para capturar erros e mostrar onde falhou
trap 'echo "❌ ERRO na linha $LINENO do start.sh"' ERR

echo "=== Iniciando Sistema de Finanças ==="
echo "Ambiente: $NODE_ENV"
echo "Porta Backend: ${PORT:-3001}"

# Log de todas as variáveis de ambiente (para debug)
echo "=== VARIÁVEIS DE AMBIENTE ==="
env | grep -E "(NODE_ENV|PORT|DATABASE_URL|JWT_SECRET)" || true
echo "=========================="

# Função para verificar se o backend está pronto
check_backend() {
    local backend_port=${PORT:-3001}
    curl -s http://localhost:${backend_port}/api/health > /dev/null 2>&1
    return $?
}

# Verificações críticas antes de iniciar
echo "=== VERIFICAÇÕES CRÍTICAS ==="

# Verificar se o diretório backend existe
if [ ! -d "/app/backend" ]; then
    echo "❌ ERRO: Diretório /app/backend não existe!"
    echo "Conteúdo de /app/:"
    ls -la /app/
    exit 1
fi
echo "✅ Diretório /app/backend existe"

# Verificar se o package.json existe
if [ ! -f "/app/backend/package.json" ]; then
    echo "❌ ERRO: package.json não encontrado!"
    echo "Conteúdo de /app/backend/:"
    ls -la /app/backend/
    exit 1
fi
echo "✅ package.json encontrado"

# Verificar se o server.js existe
if [ ! -f "/app/backend/src/server.js" ]; then
    echo "❌ ERRO: server.js não encontrado!"
    echo "Conteúdo de /app/backend/src/:"
    ls -la /app/backend/src/
    exit 1
fi
echo "✅ server.js encontrado"

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

# Configuração do nginx
echo "=== CONFIGURANDO NGINX ==="

# Verificar se o nginx.conf existe
if [ ! -f "/etc/nginx/http.d/default.conf" ]; then
    echo "❌ ERRO: nginx.conf não encontrado!"
    echo "Conteúdo de /etc/nginx/http.d/:"
    ls -la /etc/nginx/http.d/
    exit 1
fi
echo "✅ nginx.conf encontrado"

# Substitui variáveis de ambiente no nginx.conf
echo "Configurando Nginx para porta ${PORT:-3001}..."
ACTUAL_PORT=${PORT:-3001}
echo "Substituindo \${PORT:-3001} por ${ACTUAL_PORT} no nginx.conf..."
sed -i "s/\${PORT:-3001}/${ACTUAL_PORT}/g" /etc/nginx/http.d/default.conf

# Verificar se a substituição funcionou
echo "Verificando substituição:"
grep -n "proxy_pass" /etc/nginx/http.d/default.conf || echo "Nenhum proxy_pass encontrado"

# Testa a configuração do nginx
echo "Testando configuração do nginx..."
nginx -t 2>&1 || {
    echo "❌ ERRO: Configuração do nginx inválida!"
    echo "Conteúdo do nginx.conf:"
    cat /etc/nginx/http.d/default.conf
    exit 1
}
echo "✅ Configuração do nginx válida"

# Inicia o Nginx em foreground
echo "=== INICIANDO NGINX ==="
echo "Iniciando Nginx..."
echo "✅ Sistema de Finanças está rodando!"
echo "✅ Frontend React servido pelo Nginx na porta 80"
echo "✅ Backend Node.js rodando na porta ${PORT:-3001}"
echo "✅ Proxy configurado: /api -> backend, / -> frontend"

# Manter nginx rodando (sem exec para melhor debug)
nginx -g 'daemon off;' &
NGINX_PID=$!

echo "✅ Nginx iniciado com PID: $NGINX_PID"

# Loop para manter container vivo e monitorar processos
echo "=== MONITORANDO PROCESSOS ==="
while true; do
    # Verificar se backend ainda está rodando
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        echo "❌ Backend morreu! PID: $BACKEND_PID"
        ps aux | grep node || true
        exit 1
    fi
    
    # Verificar se nginx ainda está rodando
    if ! kill -0 $NGINX_PID 2>/dev/null; then
        echo "❌ Nginx morreu! PID: $NGINX_PID"
        ps aux | grep nginx || true
        exit 1
    fi
    
    echo "✅ Processos OK - Backend: $BACKEND_PID, Nginx: $NGINX_PID"
    sleep 10
done
