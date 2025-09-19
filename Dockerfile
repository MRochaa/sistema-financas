# Estágio de build - onde compilamos a aplicação
FROM node:18-alpine AS builder

# Instala as dependências necessárias para o Prisma
RUN apk add --no-cache openssl openssl-dev libc6-compat

WORKDIR /app

# Copia os arquivos de dependências
COPY package*.json ./
COPY prisma ./prisma/

# Instala as dependências
RUN npm ci

# Copia o resto do código
COPY . .

# Gera o cliente do Prisma
RUN npx prisma generate

# Compila a aplicação (se for Next.js ou similar)
RUN npm run build

# Estágio de produção - imagem final otimizada
FROM node:18-alpine AS runner

# Instala OpenSSL e curl para healthcheck
RUN apk add --no-cache openssl curl

WORKDIR /app

# Cria usuário não-root para segurança
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Copia os arquivos necessários do estágio de build
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
# Se não for Next.js, ajuste as pastas acima conforme seu projeto

# Define o usuário para executar a aplicação
USER nextjs

# Porta que a aplicação vai usar
EXPOSE 3000

# Comando para iniciar a aplicação
CMD ["npm", "start"]
