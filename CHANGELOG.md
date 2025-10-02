# Changelog - Sistema Financeiro do Lar

## v2.0.0 - Sistema Totalmente Isolado (2024-10-01)

### 🎉 Grandes Mudanças

#### Removido
- ❌ Dependência do Supabase
- ❌ `@supabase/supabase-js` package
- ❌ Arquivos da pasta `/supabase`
- ❌ Conexão com serviços externos

#### Adicionado
- ✅ PostgreSQL 16 integrado no Docker
- ✅ Backend completo com Express + Prisma
- ✅ Sistema de autenticação JWT próprio
- ✅ Migrations automáticas do Prisma
- ✅ Seed de dados iniciais
- ✅ Docker Compose completo
- ✅ Scripts de inicialização
- ✅ Documentação completa

### 🗄️ Banco de Dados

**Antes:**
- Supabase (PostgreSQL na nuvem)
- Dependência externa
- Configuração manual

**Agora:**
- PostgreSQL local no Docker
- Nome único: `financas_lar_db`
- Container: `postgres_financas_lar`
- Volume persistente: `postgres_financas_lar_data`
- Totalmente isolado

### 🔐 Autenticação

**Antes:**
- Supabase Auth
- Gerenciado externamente

**Agora:**
- JWT próprio
- bcrypt para senhas (12 rounds)
- Tokens com expiração (7 dias)
- Controle total

### 🏗️ Arquitetura

**Backend:**
```
backend/
├── src/
│   ├── routes/
│   │   ├── auth.js         # Autenticação
│   │   ├── categories.js   # Categorias
│   │   ├── transactions.js # Transações
│   │   └── dashboard.js    # Dashboard
│   ├── middleware/
│   │   └── auth.js         # Middleware JWT
│   ├── server.js           # Servidor Express
│   └── seed.js             # Dados iniciais
├── prisma/
│   ├── schema.prisma       # Schema do banco
│   └── migrations/         # Migrations SQL
├── entrypoint.sh           # Inicialização
└── package.json
```

**Frontend:**
```
src/
├── services/
│   └── api.ts              # Cliente HTTP (novo)
├── contexts/
│   ├── AuthContext.tsx     # Auth local (atualizado)
│   └── DataContext.tsx     # Data local (atualizado)
├── components/             # Componentes React
├── pages/                  # Páginas
└── App.tsx
```

### 🐳 Docker

**Serviços:**
1. `postgres_financas_lar` - PostgreSQL 16
2. `sistema_financas_lar` - App (Frontend + Backend)

**Recursos:**
- Multi-stage build otimizado
- Health checks automáticos
- Volumes persistentes
- Rede isolada: `financas_lar_network`
- Restart automático

### 🔒 Segurança

**Implementado:**
- ✅ Helmet headers
- ✅ Rate limiting (100 req/15min)
- ✅ Express Validator
- ✅ Sanitização de input
- ✅ CORS configurável
- ✅ SQL injection prevention (Prisma)
- ✅ XSS protection
- ✅ PostgreSQL não exposto publicamente

### 📝 Rotas da API

**Autenticação:**
- `POST /api/auth/register` - Criar conta
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Dados do usuário

**Categorias:**
- `GET /api/categories` - Listar
- `POST /api/categories` - Criar
- `PUT /api/categories/:id` - Atualizar
- `DELETE /api/categories/:id` - Excluir

**Transações:**
- `GET /api/transactions` - Listar
- `POST /api/transactions` - Criar
- `PUT /api/transactions/:id` - Atualizar
- `DELETE /api/transactions/:id` - Excluir

**Dashboard:**
- `GET /api/dashboard` - Dados do dashboard

**Sistema:**
- `GET /health` - Health check

### 📚 Documentação

**Novos Arquivos:**
- `START_HERE.md` - Guia de início rápido
- `QUICKSTART.md` - Guia rápido de 3 passos
- `DEPLOY.md` - Guia completo de deploy
- `PRE_DEPLOY_CHECK.md` - Checklist pré-deploy
- `IMPLEMENTATION_SUMMARY.md` - Resumo técnico
- `README.md` - Documentação principal atualizada

**Scripts:**
- `generate-jwt-secret.sh` - Gerador de JWT
- `test-local.sh` - Testes locais
- `backend/entrypoint.sh` - Inicialização automática
- `backend/wait-for-db.sh` - Aguarda PostgreSQL

### 🚀 Deploy

**Antes:**
- Deploy do frontend
- Configuração manual do Supabase
- 2 serviços separados

**Agora:**
- Deploy único via Docker Compose
- Tudo configurado automaticamente
- 1 comando: `docker-compose up`

**Coolify:**
- Configuração via `coolify.json`
- Variáveis de ambiente documentadas
- Health check automático
- SSL automático

### ⚡ Performance

**Otimizações:**
- Build multi-stage (imagem menor)
- Prisma Client pré-gerado
- Frontend minificado
- Gzip habilitado
- Cache de dependências

### 🔄 Migrations

**Sistema:**
- Migrations do Prisma em `prisma/migrations/`
- Execução automática no startup
- Schema versionado
- Rollback disponível

**Primeira Migration:**
```sql
- CREATE TABLE users
- CREATE TABLE categories
- CREATE TABLE transactions
- CREATE ENUMs (CategoryType, TransactionType)
- CREATE INDEXes
```

### 🌱 Seed

**Categorias Padrão:**

**Receitas:**
- Salário
- Freelance
- Investimentos
- Outros Rendimentos

**Despesas:**
- Alimentação
- Transporte
- Moradia
- Saúde
- Educação
- Lazer
- Roupas
- Tecnologia
- Contas
- Outros Gastos

### 📦 Dependencies

**Adicionadas no Backend:**
- `@prisma/client` ^5.22.0
- `prisma` ^5.22.0
- `bcryptjs` ^2.4.3
- `jsonwebtoken` ^9.0.2
- `helmet` ^7.1.0
- `express-rate-limit` ^7.1.5
- `express-validator` ^7.0.1

**Removidas do Frontend:**
- `@supabase/supabase-js`

**Mantidas:**
- `axios` (para HTTP)
- `react`, `react-dom`, `react-router-dom`
- `chart.js`, `react-chartjs-2`
- `date-fns`
- `lucide-react`
- `react-hot-toast`

### 🔧 Configuração

**Variáveis de Ambiente:**
```env
# Banco de Dados
FINANCAS_POSTGRES_USER=financas_user
FINANCAS_POSTGRES_PASSWORD=senha_forte
FINANCAS_POSTGRES_DB=financas_lar_db

# JWT
JWT_SECRET=secret_forte_32_chars
JWT_EXPIRES_IN=7d

# Segurança
BCRYPT_ROUNDS=12
NODE_ENV=production

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 🐛 Fixes

- ✅ Problema de persistência de dados
- ✅ Erro de CORS
- ✅ Validação de JWT
- ✅ Build do frontend
- ✅ Migrations automáticas

### 🎯 Breaking Changes

⚠️ **ATENÇÃO: Esta versão não é compatível com v1.x**

**Motivo:**
- Sistema de autenticação completamente diferente
- Banco de dados migrado para local
- API endpoints mudaram

**Migration Path:**
Se você tinha dados no Supabase:
1. Exporte dados do Supabase
2. Faça deploy do v2.0.0
3. Importe dados via API ou SQL

### 📊 Estatísticas

**Linhas de Código:**
- Backend: ~2.000 linhas
- Frontend: ~3.000 linhas
- Migrations: ~100 linhas
- Documentação: ~2.500 linhas

**Arquivos:**
- Backend: 15 arquivos
- Frontend: 40+ arquivos
- Docs: 7 arquivos markdown
- Config: 10 arquivos

### 🎉 Resultado Final

**Sistema:**
- ✅ 100% funcional
- ✅ 100% isolado
- ✅ 0 dependências externas
- ✅ Pronto para produção
- ✅ Totalmente documentado

### 🙏 Agradecimentos

Sistema desenvolvido com foco em:
- Independência
- Segurança
- Facilidade de deploy
- Manutenibilidade
- Documentação completa

---

## v1.0.0 - Sistema com Supabase (Anterior)

- Sistema básico com frontend React
- Integração com Supabase
- Autenticação via Supabase Auth
- Banco de dados na nuvem

---

**Legenda:**
- ✅ Implementado
- ⚠️ Breaking Change
- ❌ Removido
- 🎉 Nova Funcionalidade
