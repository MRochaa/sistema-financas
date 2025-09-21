const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Health check endpoints
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Mock API endpoints for demo (since we don't have a real backend)
app.post('/api/auth/register', (req, res) => {
  // Simulate user registration
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