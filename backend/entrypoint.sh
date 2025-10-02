#!/bin/bash
set -e

echo "======================================"
echo "🚀 INICIANDO SISTEMA FINANCEIRO"
echo "======================================"
echo "📍 Ambiente: ${NODE_ENV:-production}"
echo "🔌 Porta: ${PORT:-3000}"
echo "🗄️  Banco de Dados: SQLite (Local)"
echo "======================================"

echo "✅ INICIALIZAÇÃO COMPLETA!"
echo "🎉 INICIANDO SERVIDOR..."
echo "======================================"

# Inicia a aplicação
exec node src/server.js
