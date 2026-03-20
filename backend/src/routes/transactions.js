import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';
import { validateRequest, transactionSchema } from '../middleware/validation.js';

const router = express.Router();
const prisma = new PrismaClient();


// Get transactions with pagination and filters
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      type, 
      categoryId, 
      startDate, 
      endDate 
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const where = {
      userId: req.user.id,
      ...(type && { type }),
      ...(categoryId && { categoryId }),
      ...(startDate && endDate && {
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      })
    };

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          category: true,
          user: {
            select: { name: true, email: true }
          }
        },
        orderBy: { date: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.transaction.count({ where })
    ]);

    res.json({
      transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get single transaction
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const transaction = await prisma.transaction.findFirst({
      where: { id, userId: req.user.id },
      include: { category: true }
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json(transaction);
  } catch (error) {
    next(error);
  }
});

// Create transaction
router.post('/', authenticateToken, validateRequest(transactionSchema), async (req, res, next) => {
  try {
    const data = { ...req.body, date: new Date(req.body.date) };
    
    // Verify category belongs to user or is public
    const category = await prisma.category.findUnique({
      where: { id: data.categoryId }
    });
    
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    const transaction = await prisma.transaction.create({
      data: {
        ...data,
        userId: req.user.id
      },
      include: { category: true }
    });
    
    res.status(201).json(transaction);
  } catch (error) {
    next(error);
  }
});

// Update transaction
router.put('/:id', authenticateToken, validateRequest(transactionSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = { ...req.body, date: new Date(req.body.date) };
    
    // Verify category exists
    const category = await prisma.category.findUnique({
      where: { id: data.categoryId }
    });
    
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    const transaction = await prisma.transaction.updateMany({
      where: { id, userId: req.user.id },
      data
    });

    if (transaction.count === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const updatedTransaction = await prisma.transaction.findFirst({
      where: { id },
      include: { category: true }
    });
    
    res.json(updatedTransaction);
  } catch (error) {
    next(error);
  }
});

// Delete transaction
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const deleted = await prisma.transaction.deleteMany({
      where: { id, userId: req.user.id }
    });

    if (deleted.count === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;