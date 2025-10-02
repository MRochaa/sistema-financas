# Guia Rápido - Sistema Financeiro do Lar

## Deploy Rápido no Coolify (3 passos)

### 1. Enviar para o GitHub

```bash
git init
git add .
git commit -m "Sistema Financeiro - Deploy Inicial"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/financas-lar.git
git push -u origin main
```

### 2. Gerar JWT Secret

```bash
./generate-jwt-secret.sh
```

Copie o valor gerado!

### 3. Configurar no Coolify

No painel do Coolify:

1. **Nova Aplicação** > **GitHub**
2. Selecione seu repositório
3. Tipo: **Docker Compose**
4. **Variáveis de Ambiente**:

```env
FINANCAS_POSTGRES_USER=financas_user
FINANCAS_POSTGRES_PASSWORD=suaSenhaForte123!
FINANCAS_POSTGRES_DB=financas_lar_db
JWT_SECRET=cole_o_jwt_secret_gerado_aqui
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=12
NODE_ENV=production
PORT=3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
FRONTEND_URL=*
```

5. **Deploy!**

Pronto! Seu sistema estará online em alguns minutos.

## Teste Local Antes do Deploy

### Opção 1: Docker Compose (Recomendado)

```bash
# 1. Configure o .env
cp .env.example .env
# Edite .env com suas configurações

# 2. Inicie tudo
docker-compose up -d

# 3. Aguarde ~30 segundos e teste
./test-local.sh

# 4. Acesse
open http://localhost:3000
```

### Opção 2: Desenvolvimento Manual

```bash
# 1. Inicie PostgreSQL
docker-compose up -d postgres_financas_lar

# 2. Backend
cd backend
npm install
cp .env.example .env
# Edite .env com DATABASE_URL local
npx prisma migrate deploy
npx prisma generate
npm run dev

# 3. Frontend (outro terminal)
npm install
npm run dev
```

## Verificação Pós-Deploy

```bash
# Health Check
curl https://seu-dominio.com/health

# Deve retornar:
# {"status":"healthy","database":"connected"}
```

## Primeiro Acesso

1. Acesse seu domínio
2. Clique em **Registrar**
3. Crie sua conta
4. Categorias padrão serão criadas automaticamente
5. Comece a usar!

## Problemas?

### Erro de Database

```bash
# Veja logs
docker logs postgres_financas_lar
docker logs sistema_financas_lar

# Verifique health
curl http://localhost:3000/health
```

### Erro de JWT

- Certifique-se de que JWT_SECRET está configurado
- Use `./generate-jwt-secret.sh` para gerar um novo

### Erro de Port

- Verifique se porta 3000 está livre
- Ou mude PORT no .env

## Comandos Úteis

```bash
# Ver logs
docker-compose logs -f

# Reiniciar
docker-compose restart

# Parar
docker-compose down

# Backup do banco
docker exec postgres_financas_lar pg_dump -U financas_user financas_lar_db > backup.sql

# Restaurar banco
docker exec -i postgres_financas_lar psql -U financas_user financas_lar_db < backup.sql
```

## Estrutura de URLs

- **Frontend**: `/`
- **Login**: `/login`
- **Registro**: `/register`
- **Dashboard**: `/` (após login)
- **API**: `/api`
- **Health**: `/health`

## Segurança

- Senhas são criptografadas (bcrypt)
- JWT expira em 7 dias
- Rate limiting ativo (100 req/15min)
- Validação de entrada em todos endpoints
- Headers de segurança habilitados

## Próximos Passos

1. Configure backup automático
2. Configure domínio personalizado
3. Configure SSL (Coolify faz automático)
4. Convide mais usuários (máx 2 por padrão)

## Suporte

- Documentação completa: [README.md](./README.md)
- Deploy detalhado: [DEPLOY.md](./DEPLOY.md)
- Logs: `docker-compose logs -f`
- Health: `/health`
