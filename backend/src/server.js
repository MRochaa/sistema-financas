// Servidor principal - Sistema de Finanças
// Compatível com todas as funcionalidades do frontend

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Carrega variáveis de ambiente
dotenv.config();

// Inicializa Express e Prisma
const app = express();
const prisma = new PrismaClient();

// Porta do backend (diferente do Nginx que roda na 3000)
const PORT = process.env.BACKEND_PORT || 3001;

// Middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware de logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ============================================
// Rotas de Health Check
// ============================================
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: '1.0.0'
  });
});

// ============================================
// Importa as rotas existentes
// ============================================
import authRoutes from './routes/auth.js';
import transactionsRoutes from './routes/transactions.js';
import categoriesRoutes from './routes/categories.js';
import dashboardRoutes from './routes/dashboard.js';

// Registra as rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/dashboard', dashboardRoutes);

// ============================================
// Rotas para funcionalidades extras do frontend
// (Estas salvam no localStorage do frontend)
// ============================================

// Rota genérica para dados salvos localmente
app.get('/api/local-storage/:key', (req, res) => {
  // Retorna vazio - dados gerenciados pelo frontend
  res.json({ message: 'Dados gerenciados localmente no navegador' });
});

// ============================================
// Middleware de tratamento de erros
// ============================================
app.use((err, req, res, next) => {
  console.error('Erro:', err);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Erro interno do servidor' 
      : err.message
  });
});

// ============================================
// Rota 404 para rotas não encontradas
// ============================================
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// ============================================
// Inicialização do servidor
// ============================================
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('========================================');
  console.log('🚀 SERVIDOR BACKEND INICIADO!');
  console.log(`📍 Porta: ${PORT}`);
  console.log(`🌍 Ambiente: ${process.env.NODE_ENV}`);
  console.log(`❤️ Health: http://localhost:${PORT}/api/health`);
  console.log('========================================');
});

// Shutdown gracioso
process.on('SIGTERM', () => {
  console.log('SIGTERM recebido, encerrando...');
  server.close(() => {
    prisma.$disconnect();
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT recebido, encerrando...');
  server.close(() => {
    prisma.$disconnect();
    process.exit(0);
  });
});
