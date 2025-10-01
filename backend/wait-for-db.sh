#!/bin/sh
# Script para aguardar o PostgreSQL estar pronto

set -e

host="$1"
shift
cmd="$@"

echo "⏳ Aguardando PostgreSQL em $host estar disponível..."

until PGPASSWORD=$FINANCAS_POSTGRES_PASSWORD psql -h "$host" -U "$FINANCAS_POSTGRES_USER" -d "$FINANCAS_POSTGRES_DB" -c '\q' 2>/dev/null; do
  >&2 echo "PostgreSQL ainda não está pronto - aguardando..."
  sleep 2
done

>&2 echo "✅ PostgreSQL está pronto!"
exec $cmd
