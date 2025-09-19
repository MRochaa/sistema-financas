/**
 * Rota de health check para monitoramento do container
 * Verifica se a API está respondendo e se o banco está acessível
 */

const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// GET /health - Verifica saúde da aplicação
router.get('/health', async (req, res) => {
  try {
    // Testa conexão com banco de dados
    await prisma.$queryRaw`SELECT 1`;
    
    // Retorna status de saúde
    res.status(200).json({
      status: 'healthy',
      service: 'sistema-financas-backend',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      database: 'connected'
    });
    
  } catch (error) {
    console.error('Health check - Database error:', error);
    
    // Mesmo com erro no banco, retorna 200 para manter container rodando
    res.status(200).json({
      status: 'degraded',
      service: 'sistema-financas-backend',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      database: 'disconnected',
      error: error.message
    });
  }
});

module.exports = router;
