const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Initialize Prisma with better error handling
const { PrismaClient } = require('@prisma/client');

console.log('🚀 Starting Finanças do Lar System...');
console.log('📊 Environment:', process.env.NODE_ENV);
console.log('🔗 Port:', process.env.PORT);
console.log('🗄️ Database URL configured:', !!process.env.DATABASE_URL);

let prisma;

function initializePrisma() {
  try {
    console.log('🔧 Initializing Prisma...');
    prisma = new PrismaClient({
      log: ['error', 'warn'],
      errorFormat: 'minimal',
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    });
    console.log('✅ Prisma initialized successfully');
    return prisma;
  } catch (error) {
    console.error('❌ Failed to initialize Prisma:', error);
    return null;
  }
}

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://es4ckok8g0k0sgo0w0o044kk.82.25.65.212.sslip.io',
  'https://esgcwcsso0go4ck4ogs8ko8o.82.25.65.212.sslip.io',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000'
];

console.log('🌐 Allowed CORS origins:', allowedOrigins);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.some(allowed => 
      origin === allowed || 
      origin.endsWith('.sslip.io') ||
      origin.includes('localhost')
    )) {
      return callback(null, true);
    }
    
    console.log('❌ CORS blocked origin:', origin);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  if (req.url !== '/health') {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url} - ${req.ip}`);
  }
  next();
});

// Health check
app.get('/health', async (req, res) => {
  try {
    // Initialize Prisma if not already done
    if (!prisma) {
      prisma = initializePrisma();
    }
    
    let dbStatus = 'disconnected';
    if (prisma) {
      try {
        await prisma.$executeRaw`SELECT 1`;
        dbStatus = 'connected';
      } catch (dbError) {
        console.error('Database health check failed:', dbError.message);
        dbStatus = 'error';
      }
    }
    
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      database: dbStatus,
      version: '1.0.0'
    };
    
    console.log('🏥 Health check:', healthData);
    res.json(healthData);
  } catch (error) {
    console.error('❌ Health check failed:', error);
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Application error',
      details: error.message
    });
  }
});

// Import routes
const authRoutes = require('./routes/auth');
const categoryRoutes = require('./routes/categories');
const transactionRoutes = require('./routes/transactions');
const dashboardRoutes = require('./routes/dashboard');

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Serve static files from public directory (built frontend)
app.use(express.static(path.join(__dirname, '../public')));

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  console.log('❌ API endpoint not found:', req.url);
  res.status(404).json({ error: 'API endpoint not found' });
});

// Catch all handler: send back React's index.html file for client-side routing
app.get('*', (req, res) => {
  try {
    const indexPath = path.join(__dirname, '../public', 'index.html');
    console.log('📄 Serving index.html for:', req.url);
    res.sendFile(indexPath);
  } catch (error) {
    console.error('❌ Static file error:', error);
    res.status(500).send('Error serving application');
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err);
  
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(err.status || 500).json({
    error: isDevelopment ? err.message : 'Internal server error',
    ...(isDevelopment && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 3000;

// Database initialization and migration
async function initializeDatabase() {
  console.log('🗄️ Initializing database...');
  
  if (!prisma) {
    prisma = initializePrisma();
  }
  
  if (!prisma) {
    console.error('❌ Failed to initialize Prisma client');
    return false;
  }
  
  try {
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Run migrations
    console.log('🔄 Running database migrations...');
    const { spawn } = require('child_process');
    
    return new Promise((resolve) => {
      const migrate = spawn('npx', ['prisma', 'migrate', 'deploy'], {
        stdio: 'inherit',
        timeout: 30000
      });
      
      migrate.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Migrations completed successfully');
          
          // Run seed
          console.log('🌱 Seeding database...');
          const seed = spawn('node', ['src/seed.js'], {
            stdio: 'inherit',
            timeout: 20000
          });
          
          seed.on('close', (seedCode) => {
            if (seedCode === 0) {
              console.log('✅ Database seeded successfully');
            } else {
              console.log('⚠️ Seeding failed or already completed');
            }
            resolve(true);
          });
          
          seed.on('error', (err) => {
            console.log('⚠️ Seeding error:', err.message);
            resolve(true); // Continue even if seeding fails
          });
        } else {
          console.log('⚠️ Migrations failed or already completed');
          resolve(true); // Continue even if migrations fail
        }
      });
      
      migrate.on('error', (err) => {
        console.log('⚠️ Migration error:', err.message);
        resolve(true); // Continue even if migrations fail
      });
    });
    
  } catch (error) {
    console.error('⚠️ Database initialization failed:', error.message);
    return true; // Continue without database
  }
}

// Start server
async function startServer() {
  try {
    console.log('🚀 Initializing server...');
    
    // Initialize database
    await initializeDatabase();
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Sistema Finanças do Lar running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log(`🗄️ Database: ${process.env.FINANCAS_POSTGRES_DB || 'Not configured'}`);
      console.log('✅ Server started successfully');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

startServer();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  if (prisma) {
    await prisma.$disconnect();
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  if (prisma) {
    await prisma.$disconnect();
  }
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

module.exports = app;