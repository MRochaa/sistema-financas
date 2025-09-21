// Importações necessárias
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

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
    // Implementar registro
    res.json({ message: 'Endpoint de registro' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    // Implementar login
    res.json({ message: 'Endpoint de login' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Tratamento de erros
app.use((err, req, res, next) => {
  console.error('Erro:', err);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Ambiente: ${process.env.NODE_ENV}`);
});

// Tratamento de encerramento gracioso
process.on('SIGTERM', async () => {
  console.log('SIGTERM recebido, encerrando...');
  await prisma.$disconnect();
  process.exit(0);
});
