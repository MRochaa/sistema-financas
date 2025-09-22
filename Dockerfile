# ============================================
# ESTÁGIO 1: Build do Frontend
# ============================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# Copia arquivos de dependências do frontend
COPY package*.json ./

# Instala TODAS as dependências (incluindo dev) para o build
RUN npm install

# Copia código fonte do frontend
COPY . .

# Executa o build do frontend
RUN npm run build

# ============================================
# ESTÁGIO 2: Imagem Final de Produção
# ============================================
FROM node:20-alpine

# Instala curl para health check
RUN apk add --no-cache curl

# Cria usuário não-root para segurança
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Cria diretórios necessários
WORKDIR /app

# Copia frontend compilado
COPY --from=frontend-builder /app/dist ./public

# Copia servidor simplificado
COPY server.js ./
COPY package.json ./

# Instala apenas dependências de produção
RUN npm install --only=production

# Define permissões
RUN chown -R nextjs:nodejs /app

# Muda para usuário não-root
USER nextjs

# Variáveis de ambiente padrão
ENV NODE_ENV=production \
    PORT=3000

# Expõe porta 3000
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Comando de inicialização
CMD ["node", "server.js"]