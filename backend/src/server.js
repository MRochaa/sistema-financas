import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import db from './database/sqlite.js';
import authRoutes from './routes/auth.js';
import transactionRoutes from './routes/transactions.js';
import categoryRoutes from './routes/categories.js';
import dashboardRoutes from './routes/dashboard.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// Trust proxy (necessário para Coolify/Nginx)
// ============================================
app.set('trust proxy', 1);

// ============================================
// Security Middleware
// ============================================

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/', limiter);

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================
// Health Check
// ============================================

app.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    port: PORT,
    database: 'checking...'
  };

  try {
    const result = db.prepare('SELECT COUNT(*) as count FROM users').get();
    health.database = 'connected';
    health.dbStatus = 'operational';
    health.dbType = 'SQLite';
  } catch (error) {
    health.database = 'disconnected';
    health.dbStatus = 'error';
    health.dbError = error.message;
  }

  const statusCode = health.database === 'connected' ? 200 : 503;
  res.status(statusCode).json(health);
});

// ============================================
// API Routes
// ============================================

app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.get('/api', (req, res) => {
  res.json({
    message: 'Sistema Financeiro API',
    version: '1.0.0',
    status: 'operational',
    database: 'SQLite',
    endpoints: {
      health: '/health',
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        me: 'GET /api/auth/me'
      },
      transactions: {
        list: 'GET /api/transactions',
        create: 'POST /api/transactions'
      },
      categories: {
        list: 'GET /api/categories',
        create: 'POST /api/categories'
      }
    }
  });
});

// ============================================
// Serve Frontend
// ============================================

const publicPath = path.join(__dirname, '../public');

// Serve static files with NO CACHE (temporary for debugging)
app.use(express.static(publicPath, {
  maxAge: 0,
  etag: false,
  lastModified: false,
  setHeaders: (res, filePath) => {
    // NO CACHE for ALL files during debugging
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
}));

app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }

  const indexPath = path.join(publicPath, 'index.html');

  if (fs.existsSync(indexPath)) {
    // Force no-cache for index.html
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.sendFile(indexPath);
  } else {
    res.status(404).json({
      message: 'Frontend not found',
      api: '/api'
    });
  }
});

// ============================================
// Error Handling
// ============================================

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// ============================================
// Server Startup
// ============================================

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('========================================');
  console.log('✅ SISTEMA FINANCEIRO - SERVIDOR ATIVO');
  console.log('🗄️  Banco de Dados: SQLite (Local)');
  console.log('🔌 Porta:', PORT);
  console.log('🌍 Ambiente:', process.env.NODE_ENV || 'development');
  console.log('🏥 Health: http://localhost:' + PORT + '/health');
  console.log('🚀 API: http://localhost:' + PORT + '/api');
  console.log('========================================');
});

const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received, shutting down gracefully...`);
  server.close(() => {
    db.close();
    console.log('Server closed');
    process.exit(0);
  });

  setTimeout(() => {
    console.error('Forcing shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled Rejection:', error);
  process.exit(1);
});

export default app;
