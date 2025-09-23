// ============================================
// Servidor Principal Simplificado
// Sistema Financeiro - Versão Robusta
// ============================================

const express = require('express');
const cors = require('cors');
const path = require('path');

// Inicializa o Express
const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// Configurações Básicas
// ============================================

// Middlewares essenciais
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos do frontend
app.use(express.static(path.join(__dirname, 'public')));

// ============================================
// Rotas Principais
// ============================================

// ROTA HEALTH CHECK - CRÍTICA PARA O DEPLOY
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        port: PORT,
        env: process.env.NODE_ENV || 'development'
    });
});

// Rota API principal
app.get('/api', (req, res) => {
    res.json({
        message: 'API do Sistema Financeiro',
        version: '1.0.0',
        status: 'operational',
        endpoints: [
            'GET /health - Status do servidor',
            'GET /api - Informações da API',
            'GET /api/transactions - Listar transações',
            'POST /api/transactions - Criar transação'
        ]
    });
});

// ============================================
// Rotas de Transações (Exemplo)
// ============================================

// Armazenamento temporário em memória (substitua por banco de dados)
let transactions = [];

// Listar transações
app.get('/api/transactions', (req, res) => {
    res.json({
        success: true,
        data: transactions,
        count: transactions.length
    });
});

// Criar transação
app.post('/api/transactions', (req, res) => {
    const transaction = {
        id: Date.now(),
        ...req.body,
        createdAt: new Date().toISOString()
    };
    transactions.push(transaction);
    
    res.status(201).json({
        success: true,
        data: transaction
    });
});

// ============================================
// Rota para servir o Frontend (SPA)
// ============================================

// Qualquer rota não capturada retorna o index.html
app.get('*', (req, res) => {
    const indexPath = path.join(__dirname, 'public', 'index.html');
    
    // Verifica se o arquivo existe
    const fs = require('fs');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        // Se não houver frontend, retorna mensagem da API
        res.json({
            message: 'Sistema Financeiro - Backend',
            info: 'Frontend não encontrado',
            api: '/api'
        });
    }
});

// ============================================
// Tratamento de Erros Global
// ============================================

// Captura erros não tratados
process.on('uncaughtException', (error) => {
    console.error('Erro não capturado:', error);
    // Não encerra o processo para manter o container rodando
});

process.on('unhandledRejection', (error) => {
    console.error('Promise rejeitada:', error);
    // Não encerra o processo para manter o container rodando
});

// ============================================
// Inicialização do Servidor
// ============================================

// Inicia o servidor
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log('========================================');
    console.log('🚀 SERVIDOR INICIADO COM SUCESSO!');
    console.log(`📍 Porta: ${PORT}`);
    console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
    console.log(`❤️ Health Check: http://localhost:${PORT}/health`);
    console.log(`🔗 API: http://localhost:${PORT}/api`);
    console.log('========================================');
});

// Tratamento de shutdown gracioso
const gracefulShutdown = () => {
    console.log('\n📛 Sinal de encerramento recebido...');
    server.close(() => {
        console.log('✅ Servidor encerrado com sucesso');
        process.exit(0);
    });
    
    // Força encerramento após 10 segundos
    setTimeout(() => {
        console.error('⚠️ Forçando encerramento...');
        process.exit(1);
    }, 10000);
};

// Escuta sinais de encerramento
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Mantém o processo vivo
process.stdin.resume();
