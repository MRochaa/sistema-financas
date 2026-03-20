# Multi-stage build for production optimization
FROM node:18-alpine AS base

# Install security updates
RUN apk update && apk upgrade && apk add --no-cache dumb-init

# Create app directory with proper permissions
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
WORKDIR /app
RUN chown nextjs:nodejs /app

# Frontend build stage
FROM base AS frontend-deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

FROM base AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Backend build stage
FROM base AS backend-deps
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --only=production && npm cache clean --force

FROM base AS backend-builder
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci
COPY backend/ .
RUN npx prisma generate

# Production stage
FROM base AS production
WORKDIR /app

# Copy backend dependencies and code
COPY --from=backend-deps --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=backend-builder --chown=nextjs:nodejs /app .

# Copy frontend build
COPY --from=frontend-builder --chown=nextjs:nodejs /app/dist ./public

# Create logs directory
RUN mkdir -p /app/logs && chown nextjs:nodejs /app/logs

# Switch to non-root user
USER nextjs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Expose port
EXPOSE 3001

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed && npm start"]