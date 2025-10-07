#!/bin/bash
set -e

echo "======================================"
echo "🚀 INICIANDO SISTEMA FINANCEIRO"
echo "======================================"
echo "📍 Ambiente: ${NODE_ENV:-production}"
echo "🔌 Porta: ${PORT:-3000}"
echo "🗄️  Banco de Dados: SQLite (Local)"
echo "🔐 JWT_SECRET: ${JWT_SECRET:0:10}... (set: $([ -n "$JWT_SECRET" ] && echo 'YES' || echo 'NO'))"
echo "🌐 FRONTEND_URL: ${FRONTEND_URL:-not set}"
echo "======================================"

# Verifica variáveis críticas
if [ -z "$JWT_SECRET" ]; then
  echo "⚠️  WARNING: JWT_SECRET not set!"
fi

echo "✅ INICIALIZAÇÃO COMPLETA!"
echo "🎉 INICIANDO SERVIDOR..."
echo "======================================"

# Inicia a aplicação
exec node src/server.js
