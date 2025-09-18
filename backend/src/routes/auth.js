import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';
import { 
  validateRequest, 
  userRegistrationSchema, 
  userLoginSchema,
  createUserRateLimit 
} from '../middleware/validation.js';

const router = express.Router();
const prisma = new PrismaClient();

// Rate limiting for auth endpoints
const authRateLimit = createUserRateLimit(15 * 60 * 1000, 5); // 5 attempts per 15 minutes

// Register
router.post('/register', authRateLimit, validateRequest(userRegistrationSchema), async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 12);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name
      },
      select: { id: true, email: true, name: true }
    });

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { 
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
        issuer: 'financas-lar',
        audience: 'financas-lar-users'
      }
    );

    res.status(201).json({ user, token });
  } catch (error) {
    next(error);
  }
});

// Login
router.post('/login', authRateLimit, validateRequest(userLoginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { 
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
        issuer: 'financas-lar',
        audience: 'financas-lar-users'
      }
    );

    res.json({ 
      user: { id: user.id, email: user.email, name: user.name }, 
      token 
    });
  } catch (error) {
    next(error);
  }
});

// Get current user
router.get('/me', authenticateToken, async (req, res, next) => {
  try {
    // Fetch fresh user data from database
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, name: true, createdAt: true, updatedAt: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    next(error);
  }
});

export default router;