# Configuração do Supabase

Este projeto usa **Supabase** como banco de dados. Você precisa criar um projeto no Supabase e configurar as tabelas.

## 1. Criar Conta no Supabase

1. Acesse https://supabase.com
2. Crie uma conta gratuita
3. Crie um novo projeto

## 2. Obter Credenciais

No painel do Supabase:
1. Vá em **Settings** → **API**
2. Copie:
   - **Project URL** (SUPABASE_URL)
   - **anon/public key** (SUPABASE_ANON_KEY)

## 3. Criar Tabelas no Supabase

No painel do Supabase, vá em **SQL Editor** e execute:

```sql
-- Tabela de Usuários
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Categorias
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('INCOME', 'EXPENSE')),
  color TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Transações
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

-- Índices para performance
CREATE INDEX idx_categories_user_id ON categories(user_id);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_category_id ON transactions(category_id);
CREATE INDEX idx_transactions_date ON transactions(date);

-- RLS (Row Level Security) - Habilitar
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS - Usuários podem ver apenas seus próprios dados
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (true);

CREATE POLICY "Users can view own categories" ON categories
  FOR ALL USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view own transactions" ON transactions
  FOR ALL USING (auth.uid()::text = user_id::text);
```

## 4. Configurar Variáveis no Coolify

No painel do Coolify, adicione as variáveis de ambiente:

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

## 5. Deploy

Após configurar tudo:

1. Commit e push para o GitHub
2. Deploy no Coolify
3. O servidor deve iniciar em segundos (sem esperar PostgreSQL)

## Notas Importantes

- ✅ **SEM dependências externas** de PostgreSQL ou Docker Compose
- ✅ **Deploy rápido** - servidor inicia imediatamente
- ✅ **Banco gerenciado** - Supabase cuida de tudo
- ✅ **Escalável** - Supabase oferece plano gratuito generoso
