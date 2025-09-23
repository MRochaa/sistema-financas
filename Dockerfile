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
# Imagem Final - SUPER SIMPLIFICADA
# ============================================
FROM node:20-alpine

# Instala curl para healthcheck
RUN apk add --no-cache curl

# Diretório de trabalho
WORKDIR /app

# Copia frontend buildado
COPY --from=frontend-builder /app/dist ./public

# Cria package.json mínimo diretamente
RUN echo '{"name":"app","version":"1.0.0","dependencies":{"express":"^4.18.2","cors":"^2.8.5"}}' > package.json

# Instala dependências mínimas
RUN npm install --production

# Cria servidor inline DIRETO no Dockerfile
RUN cat > server.js << 'EOF'
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware básico
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ROTA HEALTH - ESSENCIAL
app.get('/health', (req, res) => {
    console.log('Health check called');
    res.status(200).json({ 
        status: 'healthy',
        time: new Date().toISOString()
    });
});

// Rota principal
app.get('/api', (req, res) => {
    res.json({ message: 'API Running', version: '1.0.0' });
});

// Fallback para SPA
app.get('*', (req, res) => {
    const indexFile = path.join(__dirname, 'public', 'index.html');
    if (require('fs').existsSync(indexFile)) {
        res.sendFile(indexFile);
    } else {
        res.json({ message: 'Sistema Financeiro API', status: 'running' });
    }
});

// Inicia servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
});

// Mantém processo vivo
process.on('SIGTERM', () => {
    console.log('SIGTERM received');
    process.exit(0);
});
EOF

# Variáveis de ambiente
ENV NODE_ENV=production
ENV PORT=3000

# Expõe porta
EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Comando DIRETO - sem scripts intermediários
CMD ["node", "server.js"]
