#!/bin/sh
# Entrypoint para inicializar o backend com migrations

set -e

echo "🚀 Iniciando Sistema Financeiro..."
echo "📍 Ambiente: $NODE_ENV"
echo "🔌 Porta: $PORT"

# Aguarda o banco de dados estar pronto
if [ -n "$DATABASE_URL" ]; then
  echo "⏳ Verificando conexão com banco de dados..."
  
  # Extrai informações do DATABASE_URL
  DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
  
  if [ -n "$DB_HOST" ]; then
    echo "📡 Testando conexão com $DB_HOST..."
    
    # Aguarda até 30 segundos pelo banco
    max_attempts=30
    attempt=0
    
    until nc -z "$DB_HOST" 5432 2>/dev/null || [ $attempt -eq $max_attempts ]; do
      attempt=$((attempt + 1))
      echo "⏳ Aguardando PostgreSQL... (tentativa $attempt/$max_attempts)"
      sleep 1
    done
    
    if [ $attempt -eq $max_attempts ]; then
      echo "❌ Não foi possível conectar ao PostgreSQL"
      exit 1
    fi
    
    echo "✅ Conexão com PostgreSQL estabelecida!"
  fi
fi

# Executa migrations do Prisma
echo "🔄 Executando migrations do banco de dados..."
npx prisma migrate deploy || {
  echo "⚠️ Erro ao executar migrations, tentando criar banco..."
  npx prisma db push --accept-data-loss
}

# Gera o Prisma Client
echo "⚙️ Gerando Prisma Client..."
npx prisma generate

# Verifica se precisa fazer seed (apenas se banco estiver vazio)
echo "🌱 Verificando se precisa popular dados iniciais..."
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAndSeed() {
  try {
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      console.log('📦 Banco vazio, executando seed...');
      process.exit(99); // Código especial para indicar que precisa seed
    } else {
      console.log('✅ Banco já possui dados, pulando seed');
    }
  } catch (error) {
    console.log('⚠️ Erro ao verificar banco:', error.message);
  } finally {
    await prisma.\$disconnect();
  }
}

checkAndSeed();
" && NEED_SEED=0 || NEED_SEED=$?

if [ $NEED_SEED -eq 99 ]; then
  if [ -f "src/seed.js" ]; then
    echo "🌱 Populando banco com dados iniciais..."
    node src/seed.js || echo "⚠️ Aviso: Seed falhou, mas continuando..."
  fi
fi

echo "✅ Inicialização completa!"
echo "🎉 Iniciando servidor..."

# Inicia a aplicação
exec node src/server.js
