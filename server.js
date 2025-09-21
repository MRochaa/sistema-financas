const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Add JSON parsing middleware BEFORE routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Health check endpoints
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Mock API endpoints for demo
app.post('/api/auth/register', (req, res) => {
  try {
    console.log('Register request:', req.body);
    const { email, password, name } = req.body;
    
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    // Mock user data
    const user = {
      id: Date.now().toString(),
      email,
      name
    };
    
    const token = 'mock-jwt-token-' + Date.now();
    
    console.log('Register success:', { user, token });
    res.status(201).json({ user, token });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    console.log('Login request:', req.body);
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Mock user data
    const user = {
      id: '1',
      email,
      name: 'Usuário Demo'
    };
    
    const token = 'mock-jwt-token-' + Date.now();
    
    console.log('Login success:', { user, token });
    res.json({ user, token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/auth/me', (req, res) => {
  try {
    // Mock current user endpoint
    const user = {
      id: '1',
      email: 'demo@email.com',
      name: 'Usuário Demo'
    };
    
    res.json({ user });
  } catch (error) {
    console.error('Me endpoint error:', error);
    res.status(500).json({ error: 'Failed to get user data' });
  }
});

// Mock categories endpoint
app.get('/api/categories', (req, res) => {
  try {
    const categories = [
      { id: '1', name: 'Alimentação', type: 'EXPENSE', color: '#EF4444' },
      { id: '2', name: 'Salário', type: 'INCOME', color: '#10B981' },
      { id: '3', name: 'Transporte', type: 'EXPENSE', color: '#DC2626' },
      { id: '4', name: 'Lazer', type: 'EXPENSE', color: '#F59E0B' },
      { id: '5', name: 'Freelance', type: 'INCOME', color: '#059669' },
    ];
    res.json(categories);
  } catch (error) {
    console.error('Categories error:', error);
    res.status(500).json({ error: 'Failed to get categories' });
  }
});

// Mock transactions endpoint
app.get('/api/transactions', (req, res) => {
  try {
    const transactions = {
      transactions: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        pages: 0
      }
    };
    res.json(transactions);
  } catch (error) {
    console.error('Transactions error:', error);
    res.status(500).json({ error: 'Failed to get transactions' });
  }
});

// Mock dashboard endpoint
app.get('/api/dashboard', (req, res) => {
  try {
    const dashboardData = {
      currentBalance: 0,
      monthlyIncome: 0,
      monthlyExpenses: 0,
      monthlyBalance: 0,
      monthlyEvolution: [],
      categoryBreakdown: []
    };
    res.json(dashboardData);
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to get dashboard data' });
  }
});

// Mock dashboard projections endpoint
app.get('/api/dashboard/projections', (req, res) => {
  try {
    const projectionData = {
      averages: {
        income: 0,
        expenses: 0,
        balance: 0
      },
      projections: []
    };
    res.json(projectionData);
  } catch (error) {
    console.error('Projections error:', error);
    res.status(500).json({ error: 'Failed to get projections' });
  }
});

// Add logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  console.log('API 404:', req.url);
  res.status(404).json({ error: 'API endpoint not found' });
});

// Catch all handler: send back React's index.html file for client-side routing
app.get('*', (req, res) => {
  try {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  } catch (error) {
    console.error('Static file error:', error);
    res.status(500).send('Error serving application');
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});
  
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  
  // Mock user data
  const user = {
    id: Date.now().toString(),
    email,
    name
  };
  
  const token = 'mock-jwt-token-' + Date.now();
  
  res.status(201).json({ user, token });
});

app.post('/api/auth/login', (req, res) => {
  // Simulate user login
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  
  // Mock user data
  const user = {
    id: '1',
    email,
    name: 'Usuário Demo'
  };
  
  const token = 'mock-jwt-token-' + Date.now();
  
  res.json({ user, token });
});

app.get('/api/auth/me', (req, res) => {
  // Mock current user endpoint
  const user = {
    id: '1',
    email: 'demo@email.com',
    name: 'Usuário Demo'
  };
  
  res.json({ user });
});

// Add JSON parsing middleware
app.use(express.json());
// Catch all handler: send back React's index.html file for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});