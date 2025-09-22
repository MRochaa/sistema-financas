const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Input sanitization
const sanitizeInput = (input) => {
  return input ? input.trim().replace(/[<>]/g, '') : '';
};

// Get all transactions for the authenticated user
router.get('/', auth, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('type').optional().isIn(['INCOME', 'EXPENSE']).withMessage('Type must be INCOME or EXPENSE'),
  query('categoryId').optional().isUUID().withMessage('Category ID must be a valid UUID'),
  query('startDate').optional().isISO8601().withMessage('Start date must be a valid ISO date'),
  query('endDate').optional().isISO8601().withMessage('End date must be a valid ISO date')
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

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    // Build where clause
    const where = { userId: req.userId };
    
    if (req.query.type) {
      where.type = req.query.type;
    }
    
    if (req.query.categoryId) {
      where.categoryId = req.query.categoryId;
    }
    
    if (req.query.startDate || req.query.endDate) {
      where.date = {};
      if (req.query.startDate) {
        where.date.gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        where.date.lte = new Date(req.query.endDate);
      }
    }

    // Get transactions with category and user info
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          category: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { date: 'desc' },
        skip: offset,
        take: limit
      }),
      prisma.transaction.count({ where })
    ]);

    res.json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new transaction
router.post('/', auth, [
  body('type')
    .isIn(['INCOME', 'EXPENSE'])
    .withMessage('Type must be INCOME or EXPENSE'),
  body('amount')
    .isFloat({ min: 0.01, max: 999999999.99 })
    .withMessage('Amount must be between 0.01 and 999999999.99'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  body('date')
    .isISO8601()
    .withMessage('Date must be a valid ISO date'),
  body('categoryId')
    .isUUID()
    .withMessage('Category ID must be a valid UUID')
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

    const { type, amount, description, date, categoryId } = req.body;
    const sanitizedDescription = description ? sanitizeInput(description) : null;

    // Verify category exists and belongs to user
    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        userId: req.userId
      }
    });

    if (!category) {
      return res.status(400).json({ error: 'Category not found or does not belong to user' });
    }

    // Verify category type matches transaction type
    if (category.type !== type) {
      return res.status(400).json({ error: 'Transaction type must match category type' });
    }

    const transaction = await prisma.transaction.create({
      data: {
        type,
        amount: parseFloat(amount),
        description: sanitizedDescription,
        date: new Date(date),
        categoryId,
        userId: req.userId
      },
      include: {
        category: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.status(201).json(transaction);

  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a transaction
router.put('/:id', auth, [
  body('type')
    .isIn(['INCOME', 'EXPENSE'])
    .withMessage('Type must be INCOME or EXPENSE'),
  body('amount')
    .isFloat({ min: 0.01, max: 999999999.99 })
    .withMessage('Amount must be between 0.01 and 999999999.99'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  body('date')
    .isISO8601()
    .withMessage('Date must be a valid ISO date'),
  body('categoryId')
    .isUUID()
    .withMessage('Category ID must be a valid UUID')
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

    const { id } = req.params;
    const { type, amount, description, date, categoryId } = req.body;
    const sanitizedDescription = description ? sanitizeInput(description) : null;

    // Check if transaction exists and belongs to user
    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        id: id,
        userId: req.userId
      }
    });

    if (!existingTransaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Verify category exists and belongs to user
    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        userId: req.userId
      }
    });

    if (!category) {
      return res.status(400).json({ error: 'Category not found or does not belong to user' });
    }

    // Verify category type matches transaction type
    if (category.type !== type) {
      return res.status(400).json({ error: 'Transaction type must match category type' });
    }

    const transaction = await prisma.transaction.update({
      where: { id: id },
      data: {
        type,
        amount: parseFloat(amount),
        description: sanitizedDescription,
        date: new Date(date),
        categoryId
      },
      include: {
        category: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.json(transaction);

  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a transaction
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if transaction exists and belongs to user
    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        id: id,
        userId: req.userId
      }
    });

    if (!existingTransaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    await prisma.transaction.delete({
      where: { id: id }
    });

    res.json({ message: 'Transaction deleted successfully' });

  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;