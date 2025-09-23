/**
 * Rota de health check para monitoramento do container
 * Verifica se a API está respondendo e se o banco está acessível
 * Compatível com ESM (módulos ES6)
 */

import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// GET /health - Verifica saúde da aplicação
router.get('/', async (req, res) => {
  try {
    // Testa conexão com banco de dados com timeout
    const dbPromise = prisma.$queryRaw`SELECT 1`;
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database timeout')), 5000)
    );
    
    await Promise.race([dbPromise, timeoutPromise]);
    
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
    console.error('Health check - Database error:', error.message);
    
    // Retorna 503 quando o banco não está disponível
    res.status(503).json({
      status: 'unhealthy',
      service: 'sistema-financas-backend',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      database: 'disconnected',
      error: error.message
    });
  }
});

export default router;
