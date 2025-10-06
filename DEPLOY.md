# Sistema Financeiro - Guia de Deploy no Coolify

Este sistema é totalmente isolado e auto-suficiente. Após o deploy, não depende de serviços externos.

## Arquitetura

- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express + Prisma
- **Banco de Dados**: PostgreSQL (rodando no Docker)
- **Deployment**: Docker Compose

## Deploy no Coolify via GitHub

### 1. Preparar Repositório no GitHub

```bash
git init
git add .
git commit -m "Initial commit - Sistema Financeiro"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
git push -u origin main
```

### 2. Configurar no Coolify

1. Acesse seu painel do Coolify
2. Crie uma nova aplicação
3. Selecione "GitHub" como fonte
4. Escolha seu repositório
5. Configure o tipo como "Docker Compose"

### 3. Variáveis de Ambiente no Coolify

Configure as seguintes variáveis de ambiente no painel do Coolify:

```env
# BANCO DE DADOS
FINANCAS_POSTGRES_USER=financas_user
FINANCAS_POSTGRES_PASSWORD=SENHA_FORTE_AQUI
FINANCAS_POSTGRES_DB=financas_lar_db

# JWT (IMPORTANTE: Gere um secret forte!)
JWT_SECRET=USE_openssl_rand_base64_32_PARA_GERAR
JWT_EXPIRES_IN=7d

# SEGURANÇA
BCRYPT_ROUNDS=12
NODE_ENV=production
PORT=3000

# RATE LIMITING
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# FRONTEND URL (coloque seu domínio ou use *)
FRONTEND_URL=*
```

### 4. Gerar JWT Secret Forte

No seu terminal local:
```bash
openssl rand -base64 32
```
Use o resultado como `JWT_SECRET`

### 5. Deploy

O Coolify irá automaticamente:
1. Clonar o repositório
2. Construir as imagens Docker
3. Iniciar o PostgreSQL
4. Executar migrations do Prisma
5. Iniciar a aplicação

## Verificação Pós-Deploy

Após o deploy, verifique:

1. **Health Check**: `https://seu-dominio.com/health`
   - Deve retornar `{"status":"healthy","database":"connected"}`

2. **API**: `https://seu-dominio.com/api`
   - Deve mostrar informações da API

3. **Frontend**: `https://seu-dominio.com/`
   - Deve carregar a página de login

## Estrutura dos Containers

```
┌─────────────────────────────────┐
│  Container: sistema_financas_lar│
│  - Frontend (React)             │
│  - Backend (Express + Prisma)   │
│  - Porta: 3000                  │
└────────────┬────────────────────┘
             │
             │ Network: financas_lar_network
             │
┌────────────┴────────────────────┐
│  Container: postgres_financas_lar│
│  - PostgreSQL 16                │
│  - Volume: postgres_financas_lar_data
│  - Porta: 5432 (interna)        │
└─────────────────────────────────┘
```

## Backup do Banco de Dados

### Fazer Backup

```bash
docker exec postgres_financas_lar pg_dump -U financas_user financas_lar_db > backup.sql
```

### Restaurar Backup

```bash
docker exec -i postgres_financas_lar psql -U financas_user financas_lar_db < backup.sql
```

## Logs e Debug

### Ver logs da aplicação
```bash
docker logs -f sistema_financas_lar
```

### Ver logs do PostgreSQL
```bash
docker logs -f postgres_financas_lar
```

### Acessar banco de dados
```bash
docker exec -it postgres_financas_lar psql -U financas_user -d financas_lar_db
```

## Troubleshooting

### Erro: "Database connection failed"

1. Verifique se o PostgreSQL está rodando:
   ```bash
   docker ps | grep postgres_financas_lar
   ```

2. Verifique os logs do PostgreSQL:
   ```bash
   docker logs postgres_financas_lar
   ```

3. Verifique se a DATABASE_URL está correta

### Erro: "Token expired"

- O JWT expira após 7 dias por padrão
- O usuário precisa fazer login novamente

### Erro: "Too many requests"

- Rate limiting ativado
- Aguarde 15 minutos ou ajuste RATE_LIMIT_WINDOW_MS

## Primeiro Acesso

1. Acesse `https://seu-dominio.com/register`
2. Crie sua conta (primeiro usuário)
3. Categorias padrão serão criadas automaticamente
4. Comece a usar!

## Segurança em Produção

- ✅ Senhas criptografadas com bcrypt (12 rounds)
- ✅ JWT para autenticação
- ✅ Rate limiting habilitado
- ✅ Headers de segurança com Helmet
- ✅ Validação de entrada com express-validator
- ✅ PostgreSQL isolado (não exposto externamente)

## Manutenção

### Atualizar o Sistema

1. Faça commit das mudanças no GitHub:
   ```bash
   git add .
   git commit -m "Update"
   git push
   ```

2. O Coolify fará o redeploy automático

### Limpar Volumes (CUIDADO: apaga dados!)

```bash
docker-compose down -v
docker volume rm postgres_financas_lar_data
```

## Suporte

- Verifique sempre os logs primeiro: `/health` e `docker logs`
- O sistema é totalmente offline após deploy
- Não depende de APIs externas
