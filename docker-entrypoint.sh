#!/bin/sh
# Script de inicialização do container Docker para sistema-financas

echo "🚀 Iniciando Sistema Finanças Backend..."

# Verifica se a variável DATABASE_URL está definida
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Erro: DATABASE_URL não está definida"
    exit 1
fi

echo "📦 Executando migrations do Prisma..."

# Executa as migrations do banco de dados
npx prisma migrate deploy

# Verifica se as migrations foram executadas com sucesso
if [ $? -ne 0 ]; then
    echo "⚠️  Aviso: Migrations falharam ou já estão atualizadas"
    echo "🔄 Tentando gerar cliente Prisma mesmo assim..."
fi

# Gera o cliente Prisma (por segurança)
echo "🔧 Gerando cliente Prisma..."
npx prisma generate

# Executa seed se for primeira vez (opcional)
if [ "$RUN_SEED" = "true" ]; then
    echo "🌱 Executando seed do banco de dados..."
    node src/seed.js
fi

echo "✅ Configuração concluída!"
echo "🎯 Iniciando servidor na porta $PORT..."

# Inicia a aplicação com o arquivo correto
# O projeto usa type: module e src/server.js como arquivo principal
node src/server.js
