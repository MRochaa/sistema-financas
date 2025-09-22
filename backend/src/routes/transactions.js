const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// All routes require authentication
router.use(authenticateToken);

// Input sanitization
const sanitizeInput = (input) => {
  return input ? input.trim().replace(/[<>]/g, '') : null;
};

// Get all transactions for the authenticated user
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
  query('type').optional().isIn(['INCOME', 'EXPENSE']).withMessage('Type must be INCOME or EXPENSE'),
  query('categoryId').optional().isString().withMessage('CategoryId must be a string'),
  query('startDate').optional().isISO8601().withMessage('StartDate must be a valid date'),
  query('endDate').optional().isISO8601().withMessage('EndDate must be a valid date')
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

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    // Build where clause
    const where = {
      userId: req.user.userId
    };

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

// Create new transaction
router.post('/', [
  body('type')
    .isIn(['INCOME', 'EXPENSE'])
    .withMessage('Type must be INCOME or EXPENSE'),
  body('amount')
    .isFloat({ min: 0.01, max: 999999999.99 })
    .withMessage('Amount must be between 0.01 and 999,999,999.99'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must be max 500 characters'),
  body('date')
    .isISO8601()
    .withMessage('Date must be a valid ISO date'),
  body('categoryId')
    .notEmpty()
    .withMessage('CategoryId is required')
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

    const { type, amount, description, date, categoryId } = req.body;
    
    // Sanitize inputs
    const sanitizedDescription = sanitizeInput(description);

    // Verify category exists and belongs to user
    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        userId: req.user.userId
      }
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Verify category type matches transaction type
    if (category.type !== type) {
      return res.status(400).json({ 
        error: `Category type (${category.type}) does not match transaction type (${type})` 
      });
    }

    // Create transaction
    const transaction = await prisma.transaction.create({
      data: {
        type,
        amount: parseFloat(amount),
        description: sanitizedDescription,
        date: new Date(date),
        categoryId,
        userId: req.user.userId
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

    console.log(`Transaction created: ${type} ${amount} by user ${req.user.userId}`);

    res.status(201).json(transaction);

  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update transaction
router.put('/:id', [
  body('type')
    .isIn(['INCOME', 'EXPENSE'])
    .withMessage('Type must be INCOME or EXPENSE'),
  body('amount')
    .isFloat({ min: 0.01, max: 999999999.99 })
    .withMessage('Amount must be between 0.01 and 999,999,999.99'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must be max 500 characters'),
  body('date')
    .isISO8601()
    .withMessage('Date must be a valid ISO date'),
  body('categoryId')
    .notEmpty()
    .withMessage('CategoryId is required')
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

    const { id } = req.params;
    const { type, amount, description, date, categoryId } = req.body;
    
    // Sanitize inputs
    const sanitizedDescription = sanitizeInput(description);

    // Check if transaction exists and belongs to user
    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        id,
        userId: req.user.userId
      }
    });

    if (!existingTransaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Verify category exists and belongs to user
    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        userId: req.user.userId
      }
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Verify category type matches transaction type
    if (category.type !== type) {
      return res.status(400).json({ 
        error: `Category type (${category.type}) does not match transaction type (${type})` 
      });
    }

    // Update transaction
    const transaction = await prisma.transaction.update({
      where: { id },
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

    console.log(`Transaction updated: ${id} by user ${req.user.userId}`);

    res.json(transaction);

  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete transaction
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if transaction exists and belongs to user
    const transaction = await prisma.transaction.findFirst({
      where: {
        id,
        userId: req.user.userId
      }
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Delete transaction
    await prisma.transaction.delete({
      where: { id }
    });

    console.log(`Transaction deleted: ${id} by user ${req.user.userId}`);

    res.json({ message: 'Transaction deleted successfully' });

  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;