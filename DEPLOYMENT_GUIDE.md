# Guia de Deploy - Sistema de Finanças

## Problemas Corrigidos

### 1. **Health Check Issues**
- ✅ Corrigido o health check no docker-compose.yaml para usar a porta correta (3000)
- ✅ Melhorado o health check no Dockerfile com mais tempo de start-period (120s)
- ✅ Implementado timeout no health check do backend para evitar travamentos

### 2. **Schema do Prisma**
- ✅ Simplificado o schema removendo modelos desnecessários (Account)
- ✅ Corrigido relacionamentos entre User, Category e Transaction
- ✅ Ajustado tipos de dados para corresponder às rotas da API

### 3. **Configuração do Backend**
- ✅ Melhorado tratamento de erros de conexão com banco de dados
- ✅ Implementado reconexão automática em produção
- ✅ Adicionado timeout no health check para evitar travamentos

### 4. **Script de Inicialização**
- ✅ Melhorado o script start.sh para ser mais robusto
- ✅ Adicionado execução automática do seed após migrações
- ✅ Implementado verificação de saúde mais inteligente

## Configuração para Deploy

### 1. Variáveis de Ambiente Necessárias

```bash
# Banco de Dados
DATABASE_URL="postgresql://usuario:senha@host:5432/database?schema=public"

# Autenticação
JWT_SECRET="seu_jwt_secret_muito_seguro_aqui"
JWT_EXPIRES_IN="7d"

# Servidor
NODE_ENV="production"
BACKEND_PORT=3001
FRONTEND_URL="https://seu-dominio.com"

# Frontend
VITE_API_URL="/api"
```

### 2. Deploy com Docker

```bash
# Build da imagem
docker build -t sistema-financas .

# Executar com docker-compose
docker-compose up -d
```

### 3. Verificação do Deploy

```bash
# Verificar logs
docker-compose logs -f

# Verificar health check
curl http://localhost:3000/health

# Verificar API
curl http://localhost:3000/api/health
```

## Estrutura do Projeto

```
sistema-financas/
├── backend/                 # API Node.js + Express
│   ├── src/
│   │   ├── routes/         # Rotas da API
│   │   ├── middleware/     # Middlewares (auth, validation)
│   │   └── server.js       # Servidor principal
│   ├── prisma/
│   │   └── schema.prisma   # Schema do banco
│   └── package.json
├── frontend/               # React + Vite
│   ├── src/
│   │   ├── pages/         # Páginas da aplicação
│   │   ├── components/    # Componentes React
│   │   └── contexts/      # Contextos (Auth)
│   └── package.json
├── docker-compose.yaml     # Configuração Docker
├── Dockerfile             # Build multi-stage
├── nginx.conf             # Configuração Nginx
└── start.sh               # Script de inicialização
```

## Fluxo de Inicialização

1. **Build do Frontend**: Vite compila React para arquivos estáticos
2. **Build do Backend**: Node.js + Prisma Client gerado
3. **Container Final**: Nginx serve frontend + proxy para backend
4. **Inicialização**: 
   - Nginx inicia na porta 3000
   - Backend inicia na porta 3001
   - Migrações executam em background
   - Seed popula categorias padrão
   - Health check verifica saúde da aplicação

## Troubleshooting

### Container não inicia
- Verificar logs: `docker-compose logs`
- Verificar variáveis de ambiente
- Verificar conectividade com banco de dados

### Health check falha
- Verificar se Nginx está rodando na porta 3000
- Verificar se backend está rodando na porta 3001
- Verificar conectividade com banco de dados

### API não responde
- Verificar se backend está rodando
- Verificar configuração do proxy no Nginx
- Verificar logs do backend

## Melhorias Implementadas

1. **Robustez**: Sistema não falha se banco não estiver disponível imediatamente
2. **Monitoramento**: Health checks mais inteligentes com timeouts
3. **Escalabilidade**: Estrutura preparada para múltiplas instâncias
4. **Manutenibilidade**: Código bem documentado e organizado
5. **Segurança**: Validação de entrada e rate limiting implementados
