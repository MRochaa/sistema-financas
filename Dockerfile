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

# Cria diretório da aplicação
WORKDIR /app

# Copia frontend compilado
COPY --from=frontend-builder /app/dist ./dist

# Copia servidor Node.js
COPY server.js ./

# Cria package.json para o servidor
RUN echo '{"name":"financas-server","version":"1.0.0","main":"server.js","dependencies":{"express":"^4.18.2"}}' > package.json

# Instala apenas o express
RUN npm install --production

# Variáveis de ambiente padrão
ENV NODE_ENV=production \
    PORT=3001

# Expõe porta 3001
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

# Comando de inicialização
CMD ["node", "server.js"]