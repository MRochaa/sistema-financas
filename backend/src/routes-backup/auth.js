const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

// Input sanitization
const sanitizeInput = (input) => {
  return input.trim().replace(/[<>]/g, '');
};

// Register endpoint
router.post('/register', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters'),
  body('name')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
], async (req, res) => {
  try {
    console.log('Register attempt:', { email: req.body.email, name: req.body.name });
    
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { email, password, name } = req.body;

    // Sanitize inputs
    const sanitizedEmail = sanitizeInput(email);
    const sanitizedName = sanitizeInput(name);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: sanitizedEmail }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: sanitizedEmail,
        name: sanitizedName,
        password: hashedPassword
      }
    });

    // Create default categories for new user
    const defaultCategories = [
      // Income categories
      { name: 'Salário', type: 'INCOME', color: '#10B981' },
      { name: 'Freelance', type: 'INCOME', color: '#059669' },
      { name: 'Investimentos', type: 'INCOME', color: '#047857' },
      { name: 'Outros Rendimentos', type: 'INCOME', color: '#065f46' },
      
      // Expense categories
      { name: 'Alimentação', type: 'EXPENSE', color: '#EF4444' },
      { name: 'Transporte', type: 'EXPENSE', color: '#DC2626' },
      { name: 'Moradia', type: 'EXPENSE', color: '#B91C1C' },
      { name: 'Saúde', type: 'EXPENSE', color: '#991B1B' },
      { name: 'Educação', type: 'EXPENSE', color: '#7F1D1D' },
      { name: 'Lazer', type: 'EXPENSE', color: '#F59E0B' },
      { name: 'Roupas', type: 'EXPENSE', color: '#D97706' },
      { name: 'Tecnologia', type: 'EXPENSE', color: '#B45309' },
      { name: 'Contas', type: 'EXPENSE', color: '#92400E' },
      { name: 'Outros Gastos', type: 'EXPENSE', color: '#78350F' }
    ];

    // Create categories for the new user
    await Promise.all(
      defaultCategories.map(category =>
        prisma.category.create({
          data: {
            ...category,
            userId: user.id
          }
        })
      )
    );

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = user;

    res.status(201).json({
      message: 'User created successfully',
      user: userWithoutPassword,
      token
    });

  } catch (error) {
    console.error('Register error:', error);
    
    // Handle specific Prisma errors
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'User with this email already exists' });
    }
    
    if (error.name === 'PrismaClientKnownRequestError') {
      return res.status(400).json({ error: 'Database error: ' + error.message });
    }
    
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Login endpoint
router.post('/login', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { email, password } = req.body;
    const sanitizedEmail = sanitizeInput(email);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: sanitizedEmail }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      message: 'Login successful',
      user: userWithoutPassword,
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;