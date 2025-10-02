# Sistema Financeiro do Lar

Sistema completo de controle financeiro familiar totalmente isolado e auto-suficiente.

## Características

- **Totalmente Isolado**: Não depende de serviços externos
- **PostgreSQL Integrado**: Banco de dados rodando no Docker
- **Autenticação JWT**: Sistema seguro de login
- **Backend + Frontend**: Tudo em um único deploy
- **Pronto para Produção**: Segurança, validações e rate limiting

## Tecnologias

### Frontend
- React 18 + TypeScript
- Vite para build otimizado
- TailwindCSS para estilização
- Chart.js para gráficos
- React Router para navegação
- Axios para requisições HTTP

### Backend
- Node.js + Express
- Prisma ORM
- PostgreSQL 16
- JWT para autenticação
- bcryptjs para criptografia
- Helmet para segurança
- Express Validator

## Estrutura do Projeto

```
.
├── src/                    # Frontend React
│   ├── components/        # Componentes React
│   ├── contexts/          # Context API (Auth, Data)
│   ├── pages/             # Páginas
│   ├── services/          # Serviços API
│   └── App.tsx
├── backend/               # Backend Node.js
│   ├── src/
│   │   ├── routes/       # Rotas da API
│   │   ├── middleware/   # Middlewares (auth)
│   │   ├── server.js     # Servidor Express
│   │   └── seed.js       # Dados iniciais
│   ├── prisma/
│   │   ├── schema.prisma # Schema do banco
│   │   └── migrations/   # Migrations
│   ├── entrypoint.sh     # Script de inicialização
│   └── package.json
├── Dockerfile             # Build multi-stage
├── docker-compose.yaml    # Orquestração
└── DEPLOY.md             # Guia de deploy detalhado
```

## Início Rápido

### Desenvolvimento Local

1. Clone o repositório
```bash
git clone <seu-repo>
cd sistema-financas-lar
```

2. Instale dependências do frontend
```bash
npm install
```

3. Instale dependências do backend
```bash
cd backend
npm install
```

4. Configure variáveis de ambiente
```bash
cp .env.example .env
# Edite .env com suas configurações
```

5. Inicie o PostgreSQL via Docker
```bash
docker-compose up -d postgres_financas_lar
```

6. Execute migrations
```bash
cd backend
npx prisma migrate deploy
npx prisma generate
```

7. Inicie o backend
```bash
cd backend
npm run dev
```

8. Em outro terminal, inicie o frontend
```bash
npm run dev
```

### Deploy em Produção (Docker Compose)

```bash
# Build e start
docker-compose up -d

# Ver logs
docker-compose logs -f

# Parar
docker-compose down

# Parar e remover volumes (CUIDADO: apaga dados!)
docker-compose down -v
```

## Deploy no Coolify/Hostinger

Veja o guia completo em [DEPLOY.md](./DEPLOY.md)

Resumo:
1. Faça push para o GitHub
2. Configure as variáveis de ambiente no Coolify
3. Conecte o repositório
4. Deploy automático!

## Funcionalidades

- **Autenticação**: Registro e login com JWT
- **Categorias**: Criação e gestão de categorias personalizadas
- **Transações**: CRUD completo de receitas e despesas
- **Dashboard**: Visão geral com gráficos e estatísticas
- **Relatórios**: Análise financeira por período
- **Responsivo**: Funciona em desktop e mobile

## API Endpoints

### Autenticação
- `POST /api/auth/register` - Criar conta
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Dados do usuário

### Categorias
- `GET /api/categories` - Listar categorias
- `POST /api/categories` - Criar categoria
- `PUT /api/categories/:id` - Atualizar categoria
- `DELETE /api/categories/:id` - Excluir categoria

### Transações
- `GET /api/transactions` - Listar transações
- `POST /api/transactions` - Criar transação
- `PUT /api/transactions/:id` - Atualizar transação
- `DELETE /api/transactions/:id` - Excluir transação

### Dashboard
- `GET /api/dashboard/summary` - Resumo financeiro
- `GET /api/dashboard/stats` - Estatísticas

### Sistema
- `GET /health` - Status do servidor e banco

## Segurança

- ✅ Senhas criptografadas (bcrypt 12 rounds)
- ✅ Autenticação JWT
- ✅ Validação de entrada
- ✅ Rate limiting
- ✅ Headers de segurança (Helmet)
- ✅ Proteção CORS
- ✅ SQL Injection prevention (Prisma)
- ✅ XSS protection

## Variáveis de Ambiente

Veja `.env.example` para todas as variáveis disponíveis.

Principais:
- `DATABASE_URL` - URL do PostgreSQL
- `JWT_SECRET` - Secret para JWT (OBRIGATÓRIO e único!)
- `PORT` - Porta do servidor (padrão: 3000)
- `NODE_ENV` - Ambiente (production/development)

## Backup

```bash
# Criar backup
docker exec postgres_financas_lar pg_dump -U financas_user financas_lar_db > backup.sql

# Restaurar backup
docker exec -i postgres_financas_lar psql -U financas_user financas_lar_db < backup.sql
```

## Licença

MIT

## Suporte

Para problemas ou dúvidas:
1. Verifique `/health` endpoint
2. Veja logs: `docker logs sistema_financas_lar`
3. Consulte [DEPLOY.md](./DEPLOY.md)
