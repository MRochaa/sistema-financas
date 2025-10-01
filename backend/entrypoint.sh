#!/bin/bash
# Entrypoint para inicializar o backend com migrations

set -e

echo "======================================"
echo "🚀 INICIANDO SISTEMA FINANCEIRO"
echo "======================================"
echo "📍 Ambiente: ${NODE_ENV:-production}"
echo "🔌 Porta: ${PORT:-3000}"
echo "======================================"

# Aguarda o banco de dados estar pronto
if [ -n "$DATABASE_URL" ]; then
  echo "⏳ Verificando conexão com banco de dados..."

  # Extrai informações do DATABASE_URL
  DB_HOST=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
  DB_PORT=$(echo "$DATABASE_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
  DB_PORT=${DB_PORT:-5432}

  if [ -n "$DB_HOST" ]; then
    echo "📡 Conectando em $DB_HOST:$DB_PORT..."

    # Aguarda até 60 segundos pelo banco
    max_attempts=60
    attempt=0

    until nc -z "$DB_HOST" "$DB_PORT" 2>/dev/null || [ $attempt -eq $max_attempts ]; do
      attempt=$((attempt + 1))
      echo "⏳ Aguardando PostgreSQL... ($attempt/$max_attempts)"
      sleep 1
    done

    if [ $attempt -eq $max_attempts ]; then
      echo "❌ ERRO: Não foi possível conectar ao PostgreSQL em $DB_HOST:$DB_PORT"
      echo "💡 Verifique se o DATABASE_URL está correto nas variáveis de ambiente"
      exit 1
    fi

    echo "✅ Conexão com PostgreSQL estabelecida!"
  else
    echo "⚠️ AVISO: Não foi possível extrair o host do DATABASE_URL"
    echo "📌 DATABASE_URL: $DATABASE_URL"
  fi
else
  echo "❌ ERRO: DATABASE_URL não está definida!"
  exit 1
fi

# Gera o Prisma Client primeiro (necessário para migrations)
echo "⚙️ Gerando Prisma Client..."
npx prisma generate || {
  echo "❌ ERRO: Falha ao gerar Prisma Client"
  exit 1
}

# Executa migrations do Prisma
echo "🔄 Executando migrations do banco de dados..."
if npx prisma migrate deploy 2>&1; then
  echo "✅ Migrations aplicadas com sucesso!"
else
  echo "⚠️ Erro ao executar migrations, tentando db push..."
  if npx prisma db push --accept-data-loss --skip-generate 2>&1; then
    echo "✅ Schema sincronizado com db push!"
  else
    echo "❌ ERRO: Falha ao sincronizar banco de dados"
    exit 1
  fi
fi

# Verifica se precisa fazer seed (apenas se banco estiver vazio)
echo "🌱 Verificando necessidade de seed..."
NEED_SEED=0

node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAndSeed() {
  try {
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      console.log('📦 Banco vazio, seed necessário');
      process.exit(99);
    } else {
      console.log('✅ Banco já contém ' + userCount + ' usuário(s)');
      process.exit(0);
    }
  } catch (error) {
    console.log('⚠️ Erro ao verificar banco:', error.message);
    process.exit(1);
  } finally {
    await prisma.\$disconnect();
  }
}

checkAndSeed();
" && NEED_SEED=0 || NEED_SEED=$?

if [ $NEED_SEED -eq 99 ]; then
  if [ -f "src/seed.js" ]; then
    echo "🌱 Populando banco com dados iniciais..."
    node src/seed.js || echo "⚠️ AVISO: Seed falhou, mas continuando..."
  else
    echo "⚠️ AVISO: Arquivo seed.js não encontrado, pulando seed"
  fi
elif [ $NEED_SEED -ne 0 ]; then
  echo "⚠️ AVISO: Erro ao verificar necessidade de seed, continuando mesmo assim..."
fi

echo "======================================"
echo "✅ INICIALIZAÇÃO COMPLETA!"
echo "🎉 INICIANDO SERVIDOR..."
echo "======================================"

# Inicia a aplicação
exec node src/server.js
