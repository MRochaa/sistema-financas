// Adicione este código no arquivo backend/server.js
// Coloque ANTES das rotas de autenticação ou outras rotas

// ============================================
// HEALTH CHECK ENDPOINT
// ============================================

/**
 * Endpoint de health check para monitoramento
 * Retorna status 200 se o servidor está funcionando
 */
app.get('/health', async (req, res) => {
    try {
        // Verifica conexão com banco de dados (opcional)
        // Se você tem Prisma configurado, pode descomentar:
        /*
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        await prisma.$queryRaw`SELECT 1`;
        await prisma.$disconnect();
        */
        
        // Retorna status de saúde
        res.status(200).json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || 'development',
            version: '1.0.0' // Ajuste conforme sua versão
        });
    } catch (error) {
        // Se houver erro, retorna status 503
        console.error('Health check failed:', error);
        res.status(503).json({
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// ============================================
// Coloque suas outras rotas DEPOIS deste endpoint
// ============================================
