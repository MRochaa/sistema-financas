const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

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
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Mock API routes for demonstration
app.post('/api/auth/register', (req, res) => {
  try {
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
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
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
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/auth/me', (req, res) => {
  try {
    const user = {
      id: '1',
      email: 'demo@example.com',
      name: 'Usuário Demo',
      createdAt: new Date().toISOString()
    };
    
    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/categories', (req, res) => {
  try {
    const categories = [
      { id: '1', name: 'Salário', type: 'INCOME', color: '#10B981' },
      { id: '2', name: 'Freelance', type: 'INCOME', color: '#059669' },
      { id: '3', name: 'Investimentos', type: 'INCOME', color: '#047857' },
      { id: '4', name: 'Outros Rendimentos', type: 'INCOME', color: '#065f46' },
      { id: '5', name: 'Alimentação', type: 'EXPENSE', color: '#EF4444' },
      { id: '6', name: 'Transporte', type: 'EXPENSE', color: '#DC2626' },
      { id: '7', name: 'Moradia', type: 'EXPENSE', color: '#B91C1C' },
      { id: '8', name: 'Saúde', type: 'EXPENSE', color: '#991B1B' },
      { id: '9', name: 'Educação', type: 'EXPENSE', color: '#7F1D1D' },
      { id: '10', name: 'Lazer', type: 'EXPENSE', color: '#F59E0B' },
      { id: '11', name: 'Roupas', type: 'EXPENSE', color: '#D97706' },
      { id: '12', name: 'Tecnologia', type: 'EXPENSE', color: '#B45309' },
      { id: '13', name: 'Contas', type: 'EXPENSE', color: '#92400E' },
      { id: '14', name: 'Outros Gastos', type: 'EXPENSE', color: '#78350F' }
    ];
    
    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/categories', (req, res) => {
  try {
    const { name, type, color } = req.body;
    
    const category = {
      id: Date.now().toString(),
      name,
      type,
      color: color || '#6B7280'
    };
    
    res.status(201).json(category);
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/categories/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, color } = req.body;
    
    const category = {
      id,
      name,
      type,
      color
    };
    
    res.json(category);
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/categories/:id', (req, res) => {
  try {
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/transactions', (req, res) => {
  try {
    res.json({
      transactions: [],
      pagination: {
        page: 1,
        limit: 50,
        total: 0,
        pages: 0
      }
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/transactions', (req, res) => {
  try {
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
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/transactions/:id', (req, res) => {
  try {
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
  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/transactions/:id', (req, res) => {
  try {
    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/dashboard', (req, res) => {
  try {
    res.json({
      currentBalance: 0,
      monthlyIncome: 0,
      monthlyExpenses: 0,
      monthlyBalance: 0,
      monthlyEvolution: [],
      categoryBreakdown: []
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/dashboard/projections', (req, res) => {
  try {
    res.json({
      averages: {
        income: 0,
        expenses: 0,
        balance: 0
      },
      projections: []
    });
  } catch (error) {
    console.error('Projections error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Serve static files from public directory (built frontend)
app.use(express.static(path.join(__dirname, 'public')));

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Catch all handler: send back React's index.html file for client-side routing
app.get('*', (req, res) => {
  try {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  } catch (error) {
    console.error('Static file error:', error);
    res.status(500).send('Error serving application');
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  
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