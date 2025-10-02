# Checklist Pré-Deploy - Sistema Financeiro

Use esta checklist antes de fazer deploy no Coolify.

## 1. Arquivos Essenciais

- [x] `Dockerfile` - Build multi-stage
- [x] `docker-compose.yaml` - Orquestração
- [x] `backend/entrypoint.sh` - Script de inicialização
- [x] `backend/prisma/schema.prisma` - Schema do banco
- [x] `backend/prisma/migrations/` - Migrations
- [x] `.env.example` - Template de configuração
- [x] `coolify.json` - Configuração Coolify

## 2. Dependências

### Frontend
```bash
cd /
npm install
# Deve instalar sem erros
```

### Backend
```bash
cd backend
npm install
# Deve instalar sem erros
```

## 3. Build Local

```bash
npm run build
# Deve criar pasta dist/ sem erros
```

## 4. Variáveis de Ambiente

Gere o JWT Secret:
```bash
./generate-jwt-secret.sh
```

Copie e guarde em local seguro:
- [ ] JWT_SECRET gerado
- [ ] Senha do PostgreSQL definida
- [ ] Todas as variáveis anotadas

## 5. Git e GitHub

```bash
# Verifique status
git status

# Adicione tudo
git add .

# Commit
git commit -m "Deploy: Sistema Financeiro Completo"

# Push
git push origin main
```

Verifique:
- [ ] Repositório no GitHub criado
- [ ] Push bem-sucedido
- [ ] Todos os arquivos presentes

## 6. Configuração no Coolify

Na interface do Coolify:

1. **Nova Aplicação**
   - [ ] Tipo: Docker Compose
   - [ ] Repositório GitHub conectado
   - [ ] Branch: main

2. **Variáveis de Ambiente** (cole cada uma):
   ```
   FINANCAS_POSTGRES_USER=financas_user
   FINANCAS_POSTGRES_PASSWORD=sua_senha_forte_aqui
   FINANCAS_POSTGRES_DB=financas_lar_db
   JWT_SECRET=seu_jwt_secret_aqui
   JWT_EXPIRES_IN=7d
   BCRYPT_ROUNDS=12
   NODE_ENV=production
   PORT=3000
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   FRONTEND_URL=*
   ```

3. **Deploy Settings**
   - [ ] Auto-deploy: Habilitado
   - [ ] Docker Compose File: docker-compose.yaml
   - [ ] Port: 3000
   - [ ] Health Check: /health

## 7. Deploy

- [ ] Clique em "Deploy"
- [ ] Aguarde ~3-5 minutos
- [ ] Verifique logs para erros

## 8. Verificação Pós-Deploy

### Health Check
```bash
curl https://seu-dominio.com/health
```

Deve retornar:
```json
{
  "status": "healthy",
  "database": "connected"
}
```

### API Info
```bash
curl https://seu-dominio.com/api
```

Deve retornar informações da API.

### Frontend
```bash
curl https://seu-dominio.com/
```

Deve retornar HTML da aplicação.

## 9. Teste Funcional

1. **Acesse o site**
   - [ ] Página de login carrega
   - [ ] Botões funcionam
   - [ ] CSS está aplicado

2. **Registre um usuário**
   - [ ] Formulário de registro funciona
   - [ ] Usuário é criado
   - [ ] Login automático após registro

3. **Verifique categorias**
   - [ ] Categorias padrão foram criadas
   - [ ] Lista de categorias carrega

4. **Crie uma transação**
   - [ ] Formulário funciona
   - [ ] Transação é salva
   - [ ] Aparece na lista

5. **Teste persistência**
   - [ ] Faça logout
   - [ ] Faça login novamente
   - [ ] Dados continuam lá

6. **Restart test**
   ```bash
   # No Coolify, restart a aplicação
   # Verifique se dados persistem
   ```

## 10. Backup Inicial

Após confirmar que tudo funciona:

```bash
docker exec postgres_financas_lar pg_dump -U financas_user financas_lar_db > backup_inicial.sql
```

Guarde este backup em local seguro!

## Troubleshooting

### ❌ Database connection failed

**Verificar:**
```bash
docker logs postgres_financas_lar
docker logs sistema_financas_lar
```

**Solução:**
- Verifique variáveis de ambiente
- Aguarde mais tempo (primeiro deploy pode demorar)
- Verifique se PostgreSQL iniciou

### ❌ JWT errors

**Verificar:**
- JWT_SECRET está configurado?
- JWT_SECRET tem pelo menos 32 caracteres?

**Solução:**
```bash
./generate-jwt-secret.sh
# Copie o novo secret e atualize no Coolify
```

### ❌ Build failed

**Verificar:**
```bash
# Teste localmente
docker-compose build
```

**Solução:**
- Verifique Dockerfile
- Verifique dependências no package.json

### ❌ Frontend 404

**Verificar:**
- Build do frontend foi feito?
- Arquivos estão em dist/?

**Solução:**
```bash
npm run build
# Verifique se dist/ foi criado
```

## Sucesso! ✅

Se todos os checks passaram:

- ✅ Sistema online e funcional
- ✅ Banco de dados persistente
- ✅ Backup inicial feito
- ✅ Pronto para uso!

**Próximos Passos:**

1. Configure backup automático (cronjob)
2. Configure domínio personalizado
3. Habilite SSL (automático no Coolify)
4. Monitore logs regularmente

## Comandos Úteis

```bash
# Ver logs em tempo real
docker logs -f sistema_financas_lar

# Acessar banco
docker exec -it postgres_financas_lar psql -U financas_user -d financas_lar_db

# Verificar containers
docker ps

# Reiniciar apenas app
docker restart sistema_financas_lar

# Reiniciar tudo
docker-compose restart
```

## Suporte

- Docs: [README.md](./README.md)
- Deploy: [DEPLOY.md](./DEPLOY.md)
- Quick: [QUICKSTART.md](./QUICKSTART.md)
- Summary: [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)
