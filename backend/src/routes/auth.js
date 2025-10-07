import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import db, { dbHelpers } from '../database/sqlite.js';
import auth from '../middleware/auth.js';

const router = express.Router();
const sanitizeInput = (input) => input.trim().replace(/[<>]/g, '');

router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8, max: 128 }),
  body('name').isLength({ min: 2, max: 100 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { email, password, name } = req.body;
    const sanitizedEmail = sanitizeInput(email);
    const sanitizedName = sanitizeInput(name);

    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(sanitizedEmail);

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const userId = dbHelpers.generateId();
    const now = dbHelpers.now();

    db.prepare(`
      INSERT INTO users (id, email, name, password, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(userId, sanitizedEmail, sanitizedName, hashedPassword, now, now);

    // Create default categories
    const defaultCategories = [
      { name: 'Alimentação', type: 'expense', color: '#EF4444', icon: '🍽️' },
      { name: 'Transporte', type: 'expense', color: '#F97316', icon: '🚗' },
      { name: 'Moradia', type: 'expense', color: '#F59E0B', icon: '🏠' },
      { name: 'Saúde', type: 'expense', color: '#10B981', icon: '⚕️' },
      { name: 'Educação', type: 'expense', color: '#3B82F6', icon: '📚' },
      { name: 'Lazer', type: 'expense', color: '#8B5CF6', icon: '🎮' },
      { name: 'Outros', type: 'expense', color: '#6B7280', icon: '📁' },
      { name: 'Salário', type: 'income', color: '#10B981', icon: '💰' },
      { name: 'Freelance', type: 'income', color: '#3B82F6', icon: '💼' },
      { name: 'Investimentos', type: 'income', color: '#8B5CF6', icon: '📈' },
      { name: 'Outros', type: 'income', color: '#6B7280', icon: '📁' }
    ];

    const insertCategory = db.prepare(`
      INSERT INTO categories (id, user_id, name, type, color, icon, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    defaultCategories.forEach(cat => {
      const catId = dbHelpers.generateId();
      insertCategory.run(catId, userId, cat.name, cat.type, cat.color, cat.icon, now, now);
    });

    const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: { id: userId, email: sanitizedEmail, name: sanitizedName }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Error registering user' });
  }
});

router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed' });
    }

    const { email, password } = req.body;
    const sanitizedEmail = sanitizeInput(email);

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(sanitizedEmail);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Error logging in' });
  }
});

router.get('/me', auth, async (req, res) => {
  try {
    const user = db.prepare('SELECT id, email, name, created_at FROM users WHERE id = ?').get(req.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Error fetching user' });
  }
});

export default router;
