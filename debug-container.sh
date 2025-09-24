#!/bin/bash

# Script de debug para diagnosticar problemas no container
echo "========================================="
echo "=== Debug do Container - Sistema Finanças ==="
echo "========================================="
echo "Timestamp: $(date)"
echo ""

# Verifica se está em container Docker
if [ -f /.dockerenv ]; then
    echo "✅ Executando dentro de container Docker"
else
    echo "⚠️  NÃO está em container Docker"
fi

echo ""
echo "=== Variáveis de Ambiente ==="
echo "NODE_ENV: ${NODE_ENV:-'não definido'}"
echo "BACKEND_PORT: ${BACKEND_PORT:-'não definido'}"
echo "PORT: ${PORT:-'não definido'}"
echo "DATABASE_URL: $([ -n "${DATABASE_URL}" ] && echo "definido (ocultado)" || echo "não definido")"
echo "JWT_SECRET: $([ -n "${JWT_SECRET}" ] && echo "definido (ocultado)" || echo "não definido")"
echo "FRONTEND_URL: ${FRONTEND_URL:-'não definido'}"

echo ""
echo "=== Estrutura de Diretórios ==="
echo "Diretório atual: $(pwd)"

# Verifica diretórios importantes
for dir in "/app" "/app/backend" "/app/backend/src" "/usr/share/nginx/html"; do
    if [ -d "$dir" ]; then
        echo "✅ $dir existe"
        # Mostra primeiros 3 arquivos
        echo "   Conteúdo: $(ls -1 $dir 2>/dev/null | head -3 | tr '\n' ' ')"
    else
        echo "❌ $dir NÃO existe"
    fi
done

echo ""
echo "=== Arquivos Críticos ==="
# Lista de arquivos críticos para verificar
critical_files=(
    "/etc/nginx/http.d/default.conf"
    "/app/backend/package.json"
    "/app/backend/src/server.js"
    "/app/backend/prisma/schema.prisma"
    "/usr/share/nginx/html/index.html"
    "/start.sh"
)

for file in "${critical_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file ($(stat -c%s "$file") bytes)"
    else
        echo "❌ $file NÃO encontrado"
    fi
done

echo ""
echo "=== Executáveis Disponíveis ==="
for cmd in node npm npx nginx curl bash sh; do
    if command -v $cmd > /dev/null 2>&1; then
        echo "✅ $cmd: $(command -v $cmd)"
    else
        echo "❌ $cmd não encontrado"
    fi
done

echo ""
echo "=== Versões ==="
node --version 2>/dev/null || echo "Node.js não disponível"
npm --version 2>/dev/null || echo "NPM não disponível"
nginx -v 2>&1 | head -1 || echo "Nginx não disponível"

echo ""
echo "=== Processos em Execução ==="
ps aux | grep -E "(node|nginx)" | grep -v grep || echo "Nenhum processo relevante encontrado"

echo ""
echo "=== Portas em Uso ==="
# Tenta diferentes comandos para verificar portas
if command -v ss > /dev/null 2>&1; then
    ss -tlnp 2>/dev/null | grep LISTEN || echo "Nenhuma porta em escuta"
elif command -v netstat > /dev/null 2>&1; then
    netstat -tlnp 2>/dev/null | grep LISTEN || echo "Nenhuma porta em escuta"
else
    echo "Comandos ss/netstat não disponíveis"
fi

echo ""
echo "=== Memória Disponível ==="
free -h 2>/dev/null || echo "Comando free não disponível"

echo ""
echo "=== Espaço em Disco ==="
df -h / 2>/dev/null | tail -1 || echo "Comando df não disponível"

echo ""
echo "========================================="
echo "=== Fim do Debug ==="
echo "========================================="
