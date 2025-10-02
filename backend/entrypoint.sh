#!/bin/bash
set -e

echo "======================================"
echo "🚀 INICIANDO SISTEMA FINANCEIRO"
echo "======================================"
echo "📍 Ambiente: ${NODE_ENV:-production}"
echo "🔌 Porta: ${PORT:-3000}"
echo "======================================"

# Verifica variáveis críticas do Supabase
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
  echo "❌ ERRO: SUPABASE_URL e SUPABASE_ANON_KEY devem estar definidas!"
  exit 1
fi

echo "✅ Variáveis do Supabase configuradas"
echo "======================================"
echo "✅ INICIALIZAÇÃO COMPLETA!"
echo "🎉 INICIANDO SERVIDOR..."
echo "======================================"

# Inicia a aplicação
exec node src/server.js
