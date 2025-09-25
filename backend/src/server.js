// Servidor principal da aplicação
// Gerencia a inicialização do Express e conexão com banco de dados

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

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

// Função para carregar rotas
async function loadRoutes() {
  try {
    const authRoutes = (await import('./routes/auth.js')).default;
    const transactionRoutes = (await import('./routes/transactions.js')).default;
    const categoryRoutes = (await import('./routes/categories.js')).default;
    const dashboardRoutes = (await import('./routes/dashboard.js')).default;
    
    // Registra as rotas
    app.use('/api/auth', authRoutes);
    app.use('/api/transactions', transactionRoutes);
    app.use('/api/categories', categoryRoutes);
    app.use('/api/dashboard', dashboardRoutes);
    
    console.log('✅ Rotas carregadas com sucesso');
  } catch (error) {
    console.error('❌ Erro ao carregar rotas:', error);
    // Continua mesmo se algumas rotas falharem
  }
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
  
  // Carrega as rotas
  await loadRoutes();
  
  // Rota 404 para requisições não encontradas (DEVE vir depois das rotas da API)
  app.use('*', (req, res) => {
    console.log(`❌ Rota não encontrada: ${req.method} ${req.path}`);
    res.status(404).json({ error: 'Rota não encontrada' });
  });
  
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
export { app, prisma };
