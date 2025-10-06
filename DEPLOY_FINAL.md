# 🚀 DEPLOY NO COOLIFY - GUIA FINAL

## ✅ PROJETO COMPLETAMENTE CONVERTIDO PARA SUPABASE

### Problema Anterior Resolvido
❌ **ANTES:** Sistema travava esperando PostgreSQL externo conectar (nunca iniciava)
✅ **AGORA:** Sistema inicia imediatamente com Supabase (banco gerenciado)

---

## PASSO 1: Criar Projeto no Supabase

1. Acesse https://supabase.com e crie uma conta
2. Crie um novo projeto
3. Aguarde 2-3 minutos para o projeto iniciar

## PASSO 2: Criar Tabelas no Banco

No Supabase, vá em **SQL Editor** e execute:

```sql
-- Usuários
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categorias
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('INCOME', 'EXPENSE')),
  color TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transações
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('INCOME', 'EXPENSE')),
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  date TIMESTAMPTZ NOT NULL,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_categories_user_id ON categories(user_id);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_category_id ON transactions(category_id);
CREATE INDEX idx_transactions_date ON transactions(date);
```

## PASSO 3: Obter Credenciais do Supabase

No painel do Supabase:
1. Vá em **Settings** → **API**
2. Copie:
   - **Project URL** → será SUPABASE_URL
   - **anon/public key** → será SUPABASE_ANON_KEY

## PASSO 4: Configurar Variáveis no Coolify

No painel do Coolify, configure estas variáveis:

```
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua_anon_key_aqui
JWT_SECRET=d6f48b92f22731e48f7edde5e0fe5127f55dc08c3c12de0d0b74511ab28bee8c
JWT_EXPIRES_IN=7d
NODE_ENV=production
PORT=3000
BCRYPT_ROUNDS=12
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000
FRONTEND_URL=*
```

**IMPORTANTE:** Não marque "Available at Buildtime" para NODE_ENV

## PASSO 5: Fazer Deploy

1. Commit e push para o GitHub:
```bash
git add .
git commit -m "Convert to Supabase - Remove all external dependencies"
git push
```

2. No Coolify, inicie o deploy
3. O servidor deve iniciar em **15-30 segundos** (sem esperar banco externo)

---

## ✅ Vantagens da Nova Arquitetura

- ✅ **Deploy instantâneo** - servidor inicia imediatamente
- ✅ **Sem PostgreSQL externo** - tudo gerenciado pelo Supabase
- ✅ **Sem Docker Compose** - Dockerfile minimalista
- ✅ **Sem Prisma** - apenas Supabase client
- ✅ **Health check passa** - servidor responde em /health
- ✅ **Escalável e gratuito** - Supabase oferece plano generoso

---

## 📋 Checklist Final

- [ ] Projeto criado no Supabase
- [ ] Tabelas criadas via SQL Editor
- [ ] Credenciais obtidas (URL + ANON_KEY)
- [ ] Variáveis configuradas no Coolify
- [ ] Código commitado e pushed
- [ ] Deploy iniciado no Coolify

---

## 🆘 Troubleshooting

### Deploy falha com "SUPABASE_URL not defined"
→ Verifique se as variáveis estão corretas no Coolify

### Health check falha
→ Aguarde 60 segundos após o deploy iniciar

### "Table users does not exist"
→ Execute o SQL no Supabase para criar as tabelas

### Frontend não carrega
→ Verifique se o build completou com sucesso nos logs

---

## 🎉 Após o Deploy

Acesse a URL do Coolify e você deve ver o frontend carregando.
A API estará disponível em `/api` e o health check em `/health`.

**Tudo funcionando sem dependências externas!**
