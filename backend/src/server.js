// ============================================
// Servidor Principal - Sistema Financeiro
// Versão Definitiva Corrigida
// ============================================

const express = require('express');
const cors = require('cors');
const path = require('path');

// Tenta carregar Prisma se disponível
let prisma = null;
try {
    const { PrismaClient } = require('@prisma/client');
    prisma = new PrismaClient();
    console.log('✅ Prisma Client carregado');
} catch (error) {
    console.log('⚠️ Prisma não disponível, rodando sem banco de dados');
}

// Inicializa Express
const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// Middlewares
// ============================================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir frontend estático
const publicPath = path.join(__dirname, '../public');
app.use(express.static(publicPath));

// ============================================
// Rotas Essenciais
// ============================================

// HEALTH CHECK - CRÍTICO PARA COOLIFY
app.get('/health', async (req, res) => {
    const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
        port: PORT
    };

    // Testa banco se disponível
    if (prisma && process.env.DATABASE_URL) {
        try {
            await prisma.$queryRaw`SELECT 1`;
            health.database = 'connected';
        } catch (error) {
            health.database = 'disconnected';
        }
    } else {
        health.database = 'not configured';
    }

    res.status(200).json(health);
});

// API Root
app.get('/api', (req, res) => {
    res.json({
        message: 'API Sistema Financeiro',
        version: '1.0.0',
        status: 'operational',
        database: prisma ? 'configured' : 'not configured',
        endpoints: {
            health: '/health',
            api: '/api',
            transactions: '/api/transactions',
            accounts: '/api/accounts',
            categories: '/api/categories'
        }
    });
});

// ============================================
// Dados em Memória (Fallback)
// ============================================
let inMemoryData = {
    transactions: [],
    accounts: [],
    categories: []
};

// ============================================
// Rotas de Transações
// ============================================

// GET Transações
app.get('/api/transactions', async (req, res) => {
    try {
        if (prisma && process.env.DATABASE_URL) {
            try {
                const transactions = await prisma.transaction.findMany({
                    orderBy: { createdAt: 'desc' },
                    take: 100
                });
                res.json({ success: true, data: transactions });
            } catch (dbError) {
                console.error('Erro no banco:', dbError.message);
                res.json({ success: true, data: inMemoryData.transactions });
            }
        } else {
            res.json({ success: true, data: inMemoryData.transactions });
        }
    } catch (error) {
        console.error('Erro geral:', error);
        res.status(500).json({ success: false, error: 'Erro ao buscar transações' });
    }
});

// POST Nova Transação
app.post('/api/transactions', async (req, res) => {
    try {
        const transactionData = req.body;
        
        if (prisma && process.env.DATABASE_URL) {
            try {
                const transaction = await prisma.transaction.create({
                    data: transactionData
                });
                res.status(201).json({ success: true, data: transaction });
            } catch (dbError) {
                // Fallback para memória se DB falhar
                const transaction = {
                    id: Date.now(),
                    ...transactionData,
                    createdAt: new Date().toISOString()
                };
                inMemoryData.transactions.push(transaction);
                res.status(201).json({ success: true, data: transaction });
            }
        } else {
            const transaction = {
                id: Date.now(),
                ...transactionData,
                createdAt: new Date().toISOString()
            };
            inMemoryData.transactions.push(transaction);
            res.status(201).json({ success: true, data: transaction });
        }
    } catch (error) {
        console.error('Erro ao criar transação:', error);
        res.status(500).json({ success: false, error: 'Erro ao criar transação' });
    }
});

// ============================================
// Rotas de Contas
// ============================================

// GET Contas
app.get('/api/accounts', async (req, res) => {
    try {
        if (prisma && process.env.DATABASE_URL) {
            try {
                const accounts = await prisma.account.findMany();
                res.json({ success: true, data: accounts });
            } catch (dbError) {
                res.json({ success: true, data: inMemoryData.accounts });
            }
        } else {
            res.json({ success: true, data: inMemoryData.accounts });
        }
    } catch (error) {
        console.error('Erro ao buscar contas:', error);
        res.status(500).json({ success: false, error: 'Erro ao buscar contas' });
    }
});

// POST Nova Conta
app.post('/api/accounts', async (req, res) => {
    try {
        const accountData = req.body;
        
        if (prisma && process.env.DATABASE_URL) {
            try {
                const account = await prisma.account.create({
                    data: accountData
                });
                res.status(201).json({ success: true, data: account });
            } catch (dbError) {
                const account = {
                    id: Date.now(),
                    ...accountData,
                    createdAt: new Date().toISOString()
                };
                inMemoryData.accounts.push(account);
                res.status(201).json({ success: true, data: account });
            }
        } else {
            const account = {
                id: Date.now(),
                ...accountData,
                createdAt: new Date().toISOString()
            };
            inMemoryData.accounts.push(account);
            res.status(201).json({ success: true, data: account });
        }
    } catch (error) {
        console.error('Erro ao criar conta:', error);
        res.status(500).json({ success: false, error: 'Erro ao criar conta' });
    }
});

// ============================================
// Fallback para SPA - DEVE SER A ÚLTIMA ROTA
// ============================================
app.get('*', (req, res) => {
    // Não servir index.html para rotas de API
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'Endpoint não encontrado' });
    }
    
    const indexPath = path.join(__dirname, '../public', 'index.html');
    const fs = require('fs');
    
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        // Se não houver frontend, retorna informação da API
        res.json({
            message: 'Frontend não encontrado',
            info: 'API está funcionando normalmente',
            api: '/api',
            health: '/health'
        });
    }
});

// ============================================
// Tratamento de Erros
// ============================================
app.use((err, req, res, next) => {
    console.error('Erro no servidor:', err);
    res.status(500).json({
        error: 'Erro interno do servidor',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// ============================================
// Inicialização
// ============================================
async function startServer() {
    // Conecta ao banco se disponível
    if (prisma && process.env.DATABASE_URL) {
        try {
            await prisma.$connect();
            console.log('✅ Conectado ao PostgreSQL');
        } catch (error) {
            console.log('⚠️ Banco não disponível:', error.message);
            console.log('ℹ️ Continuando com armazenamento em memória');
        }
    }

    // Inicia servidor
    app.listen(PORT, '0.0.0.0', () => {
        console.log('========================================');
        console.log('🚀 SERVIDOR INICIADO COM SUCESSO');
        console.log(`📍 Porta: ${PORT}`);
        console.log(`🌍 Ambiente: ${process.env.NODE_ENV}`);
        console.log(`💾 Banco: ${prisma && process.env.DATABASE_URL ? 'PostgreSQL' : 'Memória'}`);
        console.log(`❤️ Health: http://localhost:${PORT}/health`);
        console.log(`🔗 API: http://localhost:${PORT}/api`);
        console.log('========================================');
    });
}

// Shutdown gracioso
process.on('SIGTERM', async () => {
    console.log('📛 Encerrando servidor...');
    if (prisma) {
        await prisma.$disconnect();
    }
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('📛 Encerrando servidor...');
    if (prisma) {
        await prisma.$disconnect();
    }
    process.exit(0);
});

// Tratamento de erros não capturados
process.on('uncaughtException', (error) => {
    console.error('❌ Erro não capturado:', error);
    // Não encerra o processo para manter o container vivo
});

process.on('unhandledRejection', (error) => {
    console.error('❌ Promise rejeitada:', error);
    // Não encerra o processo para manter o container vivo
});

// Inicia o servidor
startServer().catch(error => {
    console.error('❌ Erro fatal ao iniciar:', error);
    process.exit(1);
});
