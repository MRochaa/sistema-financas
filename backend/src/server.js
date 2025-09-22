const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 auth requests per windowMs
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Health check
app.get('/health', async (req, res) => {
  try {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'mock',
      uptime: process.uptime()
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'mock',
      error: error.message
    });
  }
});

// Mock API routes for demonstration
app.post('/api/auth/register', (req, res) => {
  const { email, password, name } = req.body;
  
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  const user = {
    id: Date.now().toString(),
    email,
    name,
    createdAt: new Date().toISOString()
  };
  
  const token = 'mock-jwt-token-' + Date.now();
  
  res.status(201).json({
    message: 'User created successfully',
    user,
    token
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Missing credentials' });
  }
  
  const user = {
    id: '1',
    email,
    name: 'Usuário Demo',
    createdAt: new Date().toISOString()
  };
  
  const token = 'mock-jwt-token-' + Date.now();
  
  res.json({
    message: 'Login successful',
    user,
    token
  });
});

app.get('/api/auth/me', (req, res) => {
  const user = {
    id: '1',
    email: 'demo@example.com',
    name: 'Usuário Demo',
    createdAt: new Date().toISOString()
  };
  
  res.json({ user });
});

app.get('/api/categories', (req, res) => {
  const categories = [
    { id: '1', name: 'Salário', type: 'INCOME', color: '#10B981' },
    { id: '2', name: 'Freelance', type: 'INCOME', color: '#059669' },
    { id: '3', name: 'Alimentação', type: 'EXPENSE', color: '#EF4444' },
    { id: '4', name: 'Transporte', type: 'EXPENSE', color: '#DC2626' },
    { id: '5', name: 'Moradia', type: 'EXPENSE', color: '#B91C1C' }
  ];
  
  res.json(categories);
});

app.post('/api/categories', (req, res) => {
  const { name, type, color } = req.body;
  
  const category = {
    id: Date.now().toString(),
    name,
    type,
    color: color || '#6B7280'
  };
  
  res.status(201).json(category);
});

app.put('/api/categories/:id', (req, res) => {
  const { id } = req.params;
  const { name, type, color } = req.body;
  
  const category = {
    id,
    name,
    type,
    color
  };
  
  res.json(category);
});

app.delete('/api/categories/:id', (req, res) => {
  res.json({ message: 'Category deleted successfully' });
});

app.get('/api/transactions', (req, res) => {
  res.json({
    transactions: [],
    pagination: {
      page: 1,
      limit: 50,
      total: 0,
      pages: 0
    }
  });
});

app.post('/api/transactions', (req, res) => {
  const { type, amount, description, date, categoryId } = req.body;
  
  const transaction = {
    id: Date.now().toString(),
    type,
    amount: parseFloat(amount),
    description,
    date,
    category: { id: categoryId, name: 'Demo Category', type, color: '#6B7280' },
    user: { name: 'Usuário Demo', email: 'demo@example.com' }
  };
  
  res.status(201).json(transaction);
});

app.put('/api/transactions/:id', (req, res) => {
  const { id } = req.params;
  const { type, amount, description, date, categoryId } = req.body;
  
  const transaction = {
    id,
    type,
    amount: parseFloat(amount),
    description,
    date,
    category: { id: categoryId, name: 'Demo Category', type, color: '#6B7280' },
    user: { name: 'Usuário Demo', email: 'demo@example.com' }
  };
  
  res.json(transaction);
});

app.delete('/api/transactions/:id', (req, res) => {
  res.json({ message: 'Transaction deleted successfully' });
});

app.get('/api/dashboard', (req, res) => {
  res.json({
    currentBalance: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    monthlyBalance: 0,
    monthlyEvolution: [],
    categoryBreakdown: []
  });
});

app.get('/api/dashboard/projections', (req, res) => {
  res.json({
    averages: {
      income: 0,
      expenses: 0,
      balance: 0
    },
    projections: []
  });
});

// Serve static files from public directory (built frontend)
app.use(express.static(path.join(__dirname, '../public')));

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Catch all handler: send back React's index.html file for client-side routing
app.get('*', (req, res) => {
  try {
    res.sendFile(path.join(__dirname, '../public', 'index.html'));
  } catch (error) {
    console.error('Static file error:', error);
    res.status(500).send('Error serving application');
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  
  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(err.status || 500).json({
    error: isDevelopment ? err.message : 'Internal server error',
    ...(isDevelopment && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Sistema Finanças do Lar running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;