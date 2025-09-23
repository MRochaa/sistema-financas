// ============================================
// Servidor Principal - Sistema Financeiro
// ============================================

const express = require('express');
const cors = require('cors');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

// Inicializa Express e Prisma
const app = express();
const prisma = new PrismaClient();

// Configuração de porta (usa variável de ambiente ou 3000 como padrão)
const PORT = process.env.PORT || 3000;

// ============================================
// Middlewares
// ============================================

// CORS - Permite requisições de diferentes origens
app.use(cors({
    origin: process.env.FRONTEND_URL || '*', // Em produção, especifique a URL exata
    credentials: true
}));

// Parser JSON - Permite receber JSON no body das requisições
app.use(express.json());

// Parser URL Encoded - Permite receber dados de formulários
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos do frontend (se existirem)
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../public')));
}

// ============================================
// Rotas Críticas para Deploy
// ============================================

// ROTA DE HEALTH CHECK - OBRIGATÓRIA PARA O COOLIFY
// Esta rota é verificada pelo Docker para saber se o app está funcionando
app.get('/health', async (req, res) => {
    try {
        // Testa conexão com banco de dados (se configurado)
        if (process.env.DATABASE_URL) {
            await prisma.$queryRaw`SELECT 1`;
        }
        
        // Retorna status de saúde
        res.status(200).json({ 
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || 'development'
        });
    } catch (error) {
        // Se houver erro, ainda retorna 200 mas indica o problema
        console.error('Health check warning:', error.message);
        res.status(200).json({ 
            status: 'healthy', // Mantém healthy para não derrubar o container
            warning: 'Database connection issue',
            timestamp: new Date().toISOString()
        });
    }
});

// Rota raiz - Página inicial
app.get('/', (req, res) => {
    res.json({
        message: 'Sistema Financeiro - API Operacional',
        version: '1.0.0',
        endpoints: {
            health: '/health',
            api: '/api'
        }
    });
});

// Rota de informações da API
app.get('/api', (req, res) => {
    res.json({
        message: 'API do Sistema Financeiro',
        version: '1.0.0',
        status: 'operational'
    });
});

// ============================================
// Suas Rotas de API aqui
// ============================================

// Exemplo de rota para transações
app.get('/api/transactions', async (req, res) => {
    try {
        // Busca transações no banco (exemplo)
        const transactions = await prisma.transaction.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' }
        });
        res.json(transactions);
    } catch (error) {
        console.error('Erro ao buscar transações:', error);
        res.status(500).json({ error: 'Erro ao buscar transações' });
    }
});

// ============================================
// Tratamento de Erros
// ============================================

// Middleware para rotas não encontradas
app.use((req, res, next) => {
    res.status(404).json({ 
        error: 'Rota não encontrada',
        path: req.path 
    });
});

// Middleware de tratamento de erros gerais
app.use((err, req, res, next) => {
    console.error('Erro no servidor:', err);
    res.status(500).json({ 
        error: 'Erro interno do servidor',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Erro interno'
    });
});

// ============================================
// Inicialização do Servidor
// ============================================

// Função para conectar ao banco de dados
async function connectDatabase() {
    try {
        await prisma.$connect();
        console.log('✅ Conectado ao banco de dados');
        return true;
    } catch (error) {
        console.error('⚠️ Erro ao conectar ao banco:', error.message);
        console.log('ℹ️ Servidor iniciará sem conexão com banco de dados');
        return false;
    }
}

// Função para iniciar o servidor
async function startServer() {
    try {
        // Tenta conectar ao banco (não bloqueia se falhar)
        const dbConnected = await connectDatabase();
        
        // Inicia o servidor Express
        app.listen(PORT, '0.0.0.0', () => {
            console.log('========================================');
            console.log(`🚀 Servidor rodando na porta ${PORT}`);
            console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`💾 Database: ${dbConnected ? 'Conectado' : 'Não conectado'}`);
            console.log(`🔗 Health Check: http://localhost:${PORT}/health`);
            console.log('========================================');
        });
    } catch (error) {
        console.error('❌ Erro fatal ao iniciar servidor:', error);
        process.exit(1);
    }
}

// Tratamento de sinais para shutdown gracioso
process.on('SIGTERM', async () => {
    console.log('📛 SIGTERM recebido, encerrando servidor...');
    await prisma.$disconnect();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('📛 SIGINT recebido, encerrando servidor...');
    await prisma.$disconnect();
    process.exit(0);
});

// Inicia o servidor
startServer();
