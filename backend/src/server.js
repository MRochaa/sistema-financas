// Servidor principal da aplicação
// Gerencia a inicialização do Express e conexão com banco de dados

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');

// Carrega variáveis de ambiente
dotenv.config();

// Inicializa Express e Prisma
const app = express();
const prisma = new PrismaClient({
  // Configurações para melhor logging em produção
  log: process.env.NODE_ENV === 'production' 
    ? ['error', 'warn'] 
    : ['query', 'info', 'warn', 'error'],
});

// Porta do servidor
const PORT = process.env.PORT || 3001;

// Middlewares globais
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware de logging simples
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Rota de health check IMPORTANTE para o Docker
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Rota de teste da API
app.get('/api', (req, res) => {
  res.json({ 
    message: 'API do Sistema de Finanças funcionando!',
    version: '1.0.0'
  });
});

// Importa e usa as rotas da aplicação
try {
  const authRoutes = require('../routes/auth');
  const accountRoutes = require('../routes/accounts');
  const transactionRoutes = require('../routes/transactions');
  const categoryRoutes = require('../routes/categories');
  const budgetRoutes = require('../routes/budgets');
  const dashboardRoutes = require('../routes/dashboard');
  
  // Registra as rotas
  app.use('/api/auth', authRoutes);
  app.use('/api/accounts', accountRoutes);
  app.use('/api/transactions', transactionRoutes);
  app.use('/api/categories', categoryRoutes);
  app.use('/api/budgets', budgetRoutes);
  app.use('/api/dashboard', dashboardRoutes);
} catch (error) {
  console.error('Erro ao carregar rotas:', error);
  // Continua mesmo se algumas rotas falharem
}

// Middleware de tratamento de erros global
app.use((err, req, res, next) => {
  console.error('Erro:', err);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Erro interno do servidor' 
      : err.message
  });
});

// Rota 404 para requisições não encontradas
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// Função para conectar ao banco de dados
async function connectDatabase() {
  try {
    await prisma.$connect();
    console.log('✅ Conectado ao banco de dados PostgreSQL');
    return true;
  } catch (error) {
    console.error('❌ Erro ao conectar ao banco de dados:', error);
    // Em produção, tenta reconectar após 5 segundos
    if (process.env.NODE_ENV === 'production') {
      console.log('Tentando reconectar em 5 segundos...');
      setTimeout(connectDatabase, 5000);
    }
    return false;
  }
}

// Inicializa o servidor
async function startServer() {
  // Conecta ao banco de dados
  await connectDatabase();
  
  // Inicia o servidor Express
  app.listen(PORT, '0.0.0.0', () => {
    console.log('========================================');
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📊 Ambiente: ${process.env.NODE_ENV}`);
    console.log(`🔗 API disponível em http://localhost:${PORT}/api`);
    console.log('========================================');
  });
}

// Tratamento de sinais para shutdown gracioso
process.on('SIGTERM', async () => {
  console.log('SIGTERM recebido, encerrando servidor...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT recebido, encerrando servidor...');
  await prisma.$disconnect();
  process.exit(0);
});

// Inicia o servidor
startServer().catch(error => {
  console.error('Erro fatal ao iniciar servidor:', error);
  process.exit(1);
});

// Exporta app e prisma para uso em outros módulos
module.exports = { app, prisma };
