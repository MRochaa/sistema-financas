const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Input sanitization
const sanitizeInput = (input) => {
  return input.trim().replace(/[<>]/g, '');
};

// Register endpoint
router.post('/register', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .isLength({ max: 254 })
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8, max: 128 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must be 8-128 characters with uppercase, lowercase and number'),
  body('name')
    .isLength({ min: 2, max: 100 })
    .matches(/^[a-zA-ZÀ-ÿ\s]+$/)
    .withMessage('Name must be 2-100 characters, letters only')
], async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { email, password, name } = req.body;
    
    // Sanitize inputs
    const sanitizedEmail = sanitizeInput(email.toLowerCase());
    const sanitizedName = sanitizeInput(name);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: sanitizedEmail }
    });

    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Hash password with high cost factor
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: sanitizedEmail,
        name: sanitizedName,
        password: hashedPassword
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true
      }
    });

    // Create default categories for the user
    const defaultCategories = [
      // Income categories
      { name: 'Salário', type: 'INCOME', color: '#10B981', userId: user.id },
      { name: 'Freelance', type: 'INCOME', color: '#059669', userId: user.id },
      { name: 'Investimentos', type: 'INCOME', color: '#047857', userId: user.id },
      { name: 'Outros Rendimentos', type: 'INCOME', color: '#065f46', userId: user.id },
      
      // Expense categories
      { name: 'Alimentação', type: 'EXPENSE', color: '#EF4444', userId: user.id },
      { name: 'Transporte', type: 'EXPENSE', color: '#DC2626', userId: user.id },
      { name: 'Moradia', type: 'EXPENSE', color: '#B91C1C', userId: user.id },
      { name: 'Saúde', type: 'EXPENSE', color: '#991B1B', userId: user.id },
      { name: 'Educação', type: 'EXPENSE', color: '#7F1D1D', userId: user.id },
      { name: 'Lazer', type: 'EXPENSE', color: '#F59E0B', userId: user.id },
      { name: 'Roupas', type: 'EXPENSE', color: '#D97706', userId: user.id },
      { name: 'Tecnologia', type: 'EXPENSE', color: '#B45309', userId: user.id },
      { name: 'Contas', type: 'EXPENSE', color: '#92400E', userId: user.id },
      { name: 'Outros Gastos', type: 'EXPENSE', color: '#78350F', userId: user.id }
    ];

    await prisma.category.createMany({
      data: defaultCategories
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { 
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
        issuer: 'financas-app',
        audience: 'financas-users'
      }
    );

    // Log successful registration (without sensitive data)
    console.log(`User registered successfully: ${user.email}`);

    res.status(201).json({
      message: 'User created successfully',
      user,
      token
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error during registration' });
  }
});

// Login endpoint
router.post('/login', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
], async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { email, password } = req.body;
    
    // Sanitize email
    const sanitizedEmail = sanitizeInput(email.toLowerCase());

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: sanitizedEmail }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { 
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
        issuer: 'financas-app',
        audience: 'financas-users'
      }
    );

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = user;

    // Log successful login (without sensitive data)
    console.log(`User logged in successfully: ${user.email}`);

    res.json({
      message: 'Login successful',
      user: userWithoutPassword,
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

// Get current user endpoint
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
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