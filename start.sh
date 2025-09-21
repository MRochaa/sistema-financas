#!/bin/sh

# Script de inicialização para o container
# Este script inicia o backend Node.js e o Nginx

echo "====================================="
echo "Iniciando Sistema de Finanças..."
echo "====================================="

# Configurar variáveis de ambiente
export NODE_ENV=${NODE_ENV:-production}
export PORT=${PORT:-3001}

# Mostrar configurações
echo "Ambiente: $NODE_ENV"
echo "Backend Port: $PORT"
echo "Database URL configurada: ${DATABASE_URL:0:30}..."

# Verificar se o diretório do backend existe
if [ ! -d "/app/backend" ]; then
    echo "ERRO: Diretório do backend não encontrado!"
    exit 1
fi

# Iniciar o backend Node.js
echo "-------------------------------------"
echo "Iniciando backend na porta $PORT..."
echo "-------------------------------------"

cd /app/backend

# Executar migrações do Prisma se necessário
if [ -f "prisma/schema.prisma" ]; then
    echo "Executando migrações do banco de dados..."
    npx prisma migrate deploy 2>&1 || echo "Aviso: Migração falhou ou já está atualizada"
fi

# Iniciar o servidor backend em background
node src/server.js &
BACKEND_PID=$!

# Aguardar o backend iniciar
echo "Aguardando backend iniciar..."
sleep 5

# Verificar se o backend está rodando
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo "ERRO: Backend falhou ao iniciar!"
    exit 1
fi

echo "Backend iniciado com sucesso! PID: $BACKEND_PID"

# Verificar se o frontend foi buildado
if [ ! -d "/usr/share/nginx/html" ]; then
    echo "ERRO: Diretório do frontend não encontrado!"
    exit 1
fi

# Iniciar o Nginx
echo "-------------------------------------"
echo "Iniciando Nginx..."
echo "-------------------------------------"

# Testar configuração do Nginx
nginx -t

# Iniciar Nginx em foreground (importante para Docker)
echo "Nginx rodando na porta 80..."
nginx -g "daemon off;"
