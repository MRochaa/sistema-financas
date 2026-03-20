// Endpoint para o Coolify verificar se a aplicação está saudável

import { PrismaClient } from '@prisma/client';

// Cria uma única instância do Prisma
const globalForPrisma = global;
const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default async function handler(req, res) {
  // Apenas GET é permitido
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Testa conexão com o banco
    await prisma.$queryRaw`SELECT 1`;
    
    // Retorna sucesso
    return res.status(200).json({
      status: 'healthy',
      service: 'sistema-financas',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      database: 'connected'
    });
  } catch (error) {
    // Log do erro para debug
    console.error('Health check failed:', error.message);
    
    // Retorna erro
    return res.status(503).json({
      status: 'unhealthy',
      service: 'sistema-financas',
      timestamp: new Date().toISOString(),
      error: 'Database connection failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// Para Next.js 13+ com App Router:
/*
export async function GET(request) {
  try {
    await prisma.$queryRaw`SELECT 1`;
    
    return Response.json({
      status: 'healthy',
      service: 'sistema-financas',
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    return Response.json({
      status: 'unhealthy',
      error: 'Database connection failed'
    }, { status: 503 });
  }
}
*/
