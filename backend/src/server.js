// Importações usando ES modules
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

// Inicializar Express e Prisma
const app = express();
const prisma = new PrismaClient();

// Configuração de porta
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rota de health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Rota básica
app.get('/api', (req, res) => {
  res.json({ message: 'API do Sistema de Finanças está funcionando!' });
});

// Rotas de autenticação
app.post('/api/auth/register', async (req, res) => {
  try {
    // TODO: Implementar registro
    res.json({ message: 'Endpoint de registro', data: req.body });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    // TODO: Implementar login
    res.json({ message: 'Endpoint de login', data: req.body });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rotas de transações
app.get('/api/transactions', async (req, res) => {
  try {
    // TODO: Buscar transações
    res.json({ message: 'Lista de transações', data: [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/transactions', async (req, res) => {
  try {
    // TODO: Criar transação
    res.json({ message: 'Criar transação', data: req.body });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Tratamento de erros global
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);
  res.status(500).json({ 
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Rota 404
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`========================================`);
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📊 Ambiente: ${process.env.NODE_ENV}`);
  console.log(`🔗 API disponível em http://localhost:${PORT}/api`);
  console.log(`========================================`);
});

// Tratamento de encerramento gracioso
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

// Exportar app para testes
export default app;
