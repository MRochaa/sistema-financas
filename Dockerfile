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

# Instala nginx, openssl e ferramentas necessárias
RUN apk add --no-cache \
    nginx \
    bash \
    curl \
    openssl \
    libc6-compat \
    && rm -rf /var/cache/apk/*

# Cria diretórios necessários com permissões corretas
RUN mkdir -p /var/log/nginx /var/cache/nginx /var/run/nginx /usr/share/nginx/html \
    && chown -R nginx:nginx /var/log/nginx /var/cache/nginx /var/run/nginx

# Copia frontend compilado (apenas os arquivos estáticos gerados)
COPY --from=frontend-builder /app/dist /usr/share/nginx/html

# Copia arquivos de configuração
COPY nginx.conf /etc/nginx/http.d/default.conf

# Cria um servidor Node.js simples para servir a aplicação
WORKDIR /app

# Cria um servidor básico que serve os arquivos estáticos e health check
RUN echo 'const express = require("express"); \
const path = require("path"); \
const app = express(); \
const PORT = process.env.PORT || 3001; \
app.use(express.static("/usr/share/nginx/html")); \
app.get("/health", (req, res) => res.json({ status: "healthy" })); \
app.get("/api/health", (req, res) => res.json({ status: "healthy" })); \
app.get("*", (req, res) => res.sendFile("/usr/share/nginx/html/index.html")); \
app.listen(PORT, "0.0.0.0", () => console.log(`Server running on port ${PORT}`));' > server.js

# Instala apenas o express para o servidor simples
RUN npm init -y && npm install express

# Variáveis de ambiente padrão
ENV NODE_ENV=production \
    PORT=3001

# Expõe porta 3001 (não 80, pois o Coolify vai mapear)
EXPOSE 3001

# Health check que verifica se o servidor está respondendo
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

# Comando de inicialização simples
CMD ["node", "server.js"]