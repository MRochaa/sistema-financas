# ============================================
# ESTÁGIO 1: Build do Frontend React
# ============================================
FROM node:18-alpine AS frontend-builder

WORKDIR /app

# Copia e instala dependências do frontend
COPY package*.json ./
COPY frontend/package*.json ./frontend/
RUN npm ci && cd frontend && npm ci

# Copia código do frontend e builda
COPY . ./
WORKDIR /app/frontend
RUN npm run build

# ============================================
# ESTÁGIO 2: Build do Backend
# ============================================
FROM node:18-alpine AS backend-builder

# Instala dependências necessárias para o Prisma
RUN apk add --no-cache openssl openssl-dev libc6-compat python3 make g++

WORKDIR /app

# Copia e instala dependências do backend
COPY backend/package*.json ./
RUN npm ci

# Copia código do backend
COPY backend/ ./

# Gera cliente Prisma e remove devDependencies
RUN npx prisma generate && npm prune --production

# ============================================
# ESTÁGIO 3: Imagem Final com Nginx
# ============================================
FROM nginx:alpine

# Instala Node.js, OpenSSL e outras dependências
RUN apk add --no-cache nodejs npm openssl curl bash

# Cria diretório de trabalho
WORKDIR /app

# Copia o backend buildado
COPY --from=backend-builder /app /app/backend

# Copia o frontend buildado para o Nginx
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html

# Copia script de inicialização do backend
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

# Cria configuração do Nginx que serve frontend e proxy para backend
RUN cat > /etc/nginx/conf.d/default.conf << 'EOF'
server {
    listen 80;
    server_name _;
    
    # Serve o frontend React
    root /usr/share/nginx/html;
    index index.html;
    
    # Configurações de segurança
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Proxy para API backend
    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Health check endpoint do backend
    location /health {
        proxy_pass http://localhost:3001/health;
        access_log off;
    }
    
    # Roteamento do React (SPA)
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Cache de assets estáticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Script de inicialização que roda backend e nginx
RUN cat > /start.sh << 'EOF'
#!/bin/bash

echo "🚀 Iniciando Sistema Finanças..."

# Inicia o backend em background
cd /app/backend

# Executa migrations
echo "📦 Executando migrations..."
npx prisma migrate deploy || echo "⚠️  Migrations já aplicadas ou erro"

# Gera cliente Prisma
echo "🔧 Gerando cliente Prisma..."
npx prisma generate

# Inicia o backend
echo "🎯 Iniciando backend na porta 3001..."
node src/server.js &

# Aguarda o backend iniciar
echo "⏳ Aguardando backend inicializar..."
sleep 5

# Verifica se backend está rodando
until curl -f http://localhost:3001/health > /dev/null 2>&1; do
    echo "⏳ Backend ainda iniciando..."
    sleep 2
done

echo "✅ Backend rodando!"

# Inicia o Nginx em foreground
echo "🌐 Iniciando Nginx..."
nginx -g 'daemon off;'
EOF

RUN chmod +x /start.sh

# Expõe porta 80 (Nginx serve tudo)
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost/health || exit 1

# Comando de inicialização
CMD ["/start.sh"]
