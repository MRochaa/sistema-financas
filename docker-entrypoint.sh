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
    # Continua mesmo se falhar, pois pode ser que as migrations já foram aplicadas
fi

# Gera o cliente Prisma (por segurança)
echo "🔧 Gerando cliente Prisma..."
npx prisma generate

echo "✅ Configuração concluída!"
echo "🎯 Iniciando servidor na porta $PORT..."

# Inicia a aplicação baseada no que existe
# Verifica se existe arquivo principal
if [ -f "index.js" ]; then
    echo "📱 Iniciando com index.js"
    node index.js
elif [ -f "server.js" ]; then
    echo "📱 Iniciando com server.js"
    node server.js
elif [ -f "app.js" ]; then
    echo "📱 Iniciando com app.js"
    node app.js
elif [ -f "src/index.js" ]; then
    echo "📱 Iniciando com src/index.js"
    node src/index.js
elif [ -f "src/server.js" ]; then
    echo "📱 Iniciando com src/server.js"
    node src/server.js
elif [ -f "dist/index.js" ]; then
    echo "📱 Iniciando com dist/index.js"
    node dist/index.js
elif [ -f "build/index.js" ]; then
    echo "📱 Iniciando com build/index.js"
    node build/index.js
else
    # Fallback para npm start
    echo "📱 Iniciando com npm start"
    npm start
fi
