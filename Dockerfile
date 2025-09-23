# ============================================
# ESTÁGIO 1: Build do Frontend
# ============================================
FROM node:20-alpine AS frontend-builder
WORKDIR /app

# Instala dependências necessárias para build
RUN apk add --no-cache python3 make g++

# Copia arquivos de dependências do frontend
COPY package*.json ./

# Instala dependências do frontend
RUN npm install

# Copia código fonte do frontend
COPY . .

# Executa o build do frontend
RUN npm run build

# ============================================
# ESTÁGIO 2: Setup do Backend
# ============================================
FROM node:20-alpine AS backend-setup
WORKDIR /app

# Instala dependências necessárias para o Prisma
RUN apk add --no-cache \
    openssl \
    ca-certificates

# Copia todo o backend
COPY backend/ ./

# Se o package.json não existir no backend, cria um básico
RUN if [ ! -f package.json ]; then \
    echo '{ \
        "name": "backend", \
        "version": "1.0.0", \
        "main": "src/server.js", \
        "scripts": { \
            "start": "node src/server.js" \
        }, \
        "dependencies": { \
            "express": "^4.18.2", \
            "cors": "^2.8.5", \
            "@prisma/client": "^5.22.0", \
            "dotenv": "^16.3.1" \
        } \
    }' > package.json; \
    fi

# Instala dependências
RUN npm install

# Se houver Prisma, gera o client
RUN if [ -f prisma/schema.prisma ]; then \
    npx prisma generate; \
    fi

# ============================================
# ESTÁGIO 3: Imagem Final
# ============================================
FROM node:20-alpine

# Instala apenas o essencial para produção
RUN apk add --no-cache \
    curl \
    openssl \
    ca-certificates

# Cria diretórios de trabalho
WORKDIR /app

# Copia frontend buildado (se existir)
COPY --from=frontend-builder /app/dist ./public

# Copia backend com dependências
COPY --from=backend-setup /app ./

# Cria um servidor de fallback caso o principal não exista
RUN echo 'const express = require("express"); \
const path = require("path"); \
const app = express(); \
const PORT = process.env.PORT || 3000; \
\
app.use(express.json()); \
app.use(express.static(path.join(__dirname, "public"))); \
\
app.get("/health", (req, res) => { \
    res.status(200).json({ \
        status: "healthy", \
        timestamp: new Date().toISOString(), \
        port: PORT \
    }); \
}); \
\
app.get("/", (req, res) => { \
    res.json({ \
        message: "Sistema Financeiro - API", \
        status: "running", \
        version: "1.0.0" \
    }); \
}); \
\
app.get("*", (req, res) => { \
    const indexPath = path.join(__dirname, "public", "index.html"); \
    if (require("fs").existsSync(indexPath)) { \
        res.sendFile(indexPath); \
    } else { \
        res.status(404).json({ error: "Not found" }); \
    } \
}); \
\
app.listen(PORT, "0.0.0.0", () => { \
    console.log(`Server running on port ${PORT}`); \
});' > /app/fallback-server.js

# Script de inicialização que verifica qual servidor usar
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'if [ -f "/app/src/server.js" ]; then' >> /app/start.sh && \
    echo '    echo "Starting main server..."' >> /app/start.sh && \
    echo '    node /app/src/server.js' >> /app/start.sh && \
    echo 'elif [ -f "/app/server.js" ]; then' >> /app/start.sh && \
    echo '    echo "Starting server.js..."' >> /app/start.sh && \
    echo '    node /app/server.js' >> /app/start.sh && \
    echo 'else' >> /app/start.sh && \
    echo '    echo "Starting fallback server..."' >> /app/start.sh && \
    echo '    node /app/fallback-server.js' >> /app/start.sh && \
    echo 'fi' >> /app/start.sh && \
    chmod +x /app/start.sh

# Variáveis de ambiente
ENV NODE_ENV=production \
    PORT=3000

# Porta
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Comando de inicialização
CMD ["/app/start.sh"]
