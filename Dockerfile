# ============================================
# Build Frontend
# ============================================
FROM node:20-alpine AS frontend-builder
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# ============================================
# Build Backend
# ============================================
FROM node:20-alpine AS backend-builder
WORKDIR /app

# Copia arquivos do backend
COPY backend/package*.json ./
COPY backend/prisma ./prisma/

# Instala dependências
RUN npm install

# Copia resto do backend
COPY backend/ ./

# Gera Prisma Client se existir
RUN if [ -f prisma/schema.prisma ]; then npx prisma generate; fi

# ============================================
# Imagem Final de Produção
# ============================================
FROM node:20-alpine

# Instala ferramentas necessárias
RUN apk add --no-cache curl postgresql-client

# Cria diretório
WORKDIR /app

# Copia frontend buildado
COPY --from=frontend-builder /app/dist ./public

# Copia backend completo com node_modules
COPY --from=backend-builder /app ./backend

# Copia node_modules do backend para raiz (onde o servidor espera)
RUN cp -r ./backend/node_modules ./node_modules

# Copia arquivos do servidor para raiz
RUN cp -r ./backend/src ./src && \
    cp -r ./backend/prisma ./prisma 2>/dev/null || true && \
    cp ./backend/package.json ./package.json

# Variáveis de ambiente
ENV NODE_ENV=production
ENV PORT=3000

# Porta
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Comando direto - sem scripts
CMD ["node", "src/server.js"]
