# Deploy no Coolify - Guia Rápido

## Variáveis de Ambiente Necessárias

Configure as seguintes variáveis no painel do Coolify:

```env
BCRYPT_ROUNDS=12
DATABASE_URL=postgresql://financas_user:financas_senha_123@q8oo8gc4c8c4c0ccs4g800ws:5432/financas_lar_db?schema=public
FINANCAS_POSTGRES_DB=financas_lar_db
FINANCAS_POSTGRES_PASSWORD=financas_senha_123
FINANCAS_POSTGRES_USER=financas_user
FRONTEND_URL=https://es4ckok8g0k0sgo0w0o044kk.82.25.65.212.sslip.io
JWT_EXPIRES_IN=7d
JWT_SECRET=d6f48b92f22731e48f7edde5e0fe5127f55dc08c3c12de0d0b74511ab28bee8c
NODE_ENV=production
PORT=3000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000
```

## Configurações do Coolify

- **Build Method:** Dockerfile
- **Port:** 3000
- **Health Check Path:** `/health`
- **Health Check Interval:** 30s

## Arquivos Importantes

- `Dockerfile` - Configuração de build simplificada
- `backend/entrypoint.sh` - Script de inicialização
- `backend/prisma/schema.prisma` - Schema do banco de dados

## Processo de Deploy

1. Push para o GitHub
2. Coolify detecta automaticamente o Dockerfile
3. Build da aplicação (frontend + backend)
4. Container inicia e executa:
   - Aguarda conexão com PostgreSQL
   - Gera Prisma Client
   - Aplica migrations do banco
   - Popula dados iniciais (se banco vazio)
   - Inicia servidor na porta 3000

## Endpoints

- `/health` - Health check
- `/api` - Documentação da API
- `/api/auth/*` - Autenticação
- `/api/transactions/*` - Transações
- `/api/categories/*` - Categorias
- `/api/dashboard/*` - Dashboard
- `/*` - Frontend React

## Problemas Comuns

### Build falha com erro de npm registry
**Solução:** Certifique-se de que não há arquivo `.npmrc` no repositório

### Erro de conexão com banco
**Solução:** Verifique se DATABASE_URL está correta e o banco está acessível

### Prisma Client não encontrado
**Solução:** O entrypoint.sh gera automaticamente, mas verifique se prisma/schema.prisma existe

### Health check falha
**Solução:** Aguarde até 2 minutos após o deploy para o banco de dados ser inicializado
