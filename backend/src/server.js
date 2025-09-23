// ============================================
// Servidor Principal - Sistema Financeiro
// Versão Definitiva para Deploy
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
console.log('📁 Servindo arquivos estáticos de:', publicPath);

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
    if (prisma) {
        try {
            await prisma.$queryRaw`SELECT 1`;
            health.database = 'connected';
        } catch (error) {
            health.database = 'disconnected';
            health.dbError = error.message;
        }
    } else {
        health.database = 'not configured';
    }

    res.status(200).json(health);
});

// Informações da API
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
// Rotas de Negócio
// ============================================

// Armazenamento em memória (fallback se não houver DB)
let inMemoryData = {
    transactions: [],
    accounts: [],
    categories: []
};

// GET Transações
app.get('/api/transactions', async (req, res) => {
    try {
        if (prisma) {
            const transactions = await prisma.transaction.findMany({
                orderBy: { createdAt: 'desc' },
                take: 100
            });
            res.json({ success: true, data: transactions });
        } else {
            res.json({ success: true, data: inMemoryData.transactions });
        }
    } catch (error) {
        console.error('Erro ao buscar transações:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Erro ao buscar transações',
            details: error.message 
        });
    }
});

// POST Nova Transação
app.post('/api/transactions', async (req, res) => {
    try {
        const transactionData = req.body;
        
        if (prisma) {
            const transaction = await prisma.transaction.create({
                data: transactionData
            });
            res.status(201).json({ success: true, data: transaction });
        } else {
            // Fallback para memória
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
        res.status(500).json({ 
            success: false, 
            error: 'Erro ao criar transação',
            details: error.message 
        });
    }
});

// GET Contas
app.get('/
