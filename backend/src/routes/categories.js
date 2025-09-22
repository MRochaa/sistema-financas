const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// All routes require authentication
router.use(authenticateToken);

// Input sanitization
const sanitizeInput = (input) => {
  return input.trim().replace(/[<>]/g, '');
};

// Get all categories for the authenticated user
router.get('/', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      where: { userId: req.user.userId },
      orderBy: [
        { type: 'asc' },
        { name: 'asc' }
      ]
    });

    res.json(categories);

  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new category
router.post('/', [
  body('name')
    .isLength({ min: 1, max: 100 })
    .matches(/^[a-zA-ZÀ-ÿ0-9\s\-_:]+$/)
    .withMessage('Name must be 1-100 characters, alphanumeric only'),
  body('type')
    .isIn(['INCOME', 'EXPENSE'])
    .withMessage('Type must be INCOME or EXPENSE'),
  body('color')
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('Color must be a valid hex color')
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

    const { name, type, color } = req.body;
    
    // Sanitize inputs
    const sanitizedName = sanitizeInput(name);

    // Check if category already exists for this user
    const existingCategory = await prisma.category.findFirst({
      where: {
        userId: req.user.userId,
        name: {
          equals: sanitizedName,
          mode: 'insensitive'
        }
      }
    });

    if (existingCategory) {
      return res.status(409).json({ error: 'Category already exists' });
    }

    // Create category
    const category = await prisma.category.create({
      data: {
        name: sanitizedName,
        type,
        color,
        userId: req.user.userId
      }
    });

    console.log(`Category created: ${category.name} by user ${req.user.userId}`);

    res.status(201).json(category);

  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update category
router.put('/:id', [
  body('name')
    .isLength({ min: 1, max: 100 })
    .matches(/^[a-zA-ZÀ-ÿ0-9\s\-_:]+$/)
    .withMessage('Name must be 1-100 characters, alphanumeric only'),
  body('type')
    .isIn(['INCOME', 'EXPENSE'])
    .withMessage('Type must be INCOME or EXPENSE'),
  body('color')
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('Color must be a valid hex color')
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
    const { name, type, color } = req.body;
    
    // Sanitize inputs
    const sanitizedName = sanitizeInput(name);

    // Check if category exists and belongs to user
    const existingCategory = await prisma.category.findFirst({
      where: {
        id,
        userId: req.user.userId
      }
    });

    if (!existingCategory) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Check if name conflicts with another category
    const nameConflict = await prisma.category.findFirst({
      where: {
        userId: req.user.userId,
        name: {
          equals: sanitizedName,
          mode: 'insensitive'
        },
        id: {
          not: id
        }
      }
    });

    if (nameConflict) {
      return res.status(409).json({ error: 'Category name already exists' });
    }

    // Update category
    const category = await prisma.category.update({
      where: { id },
      data: {
        name: sanitizedName,
        type,
        color
      }
    });

    console.log(`Category updated: ${category.name} by user ${req.user.userId}`);

    res.json(category);

  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete category
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if category exists and belongs to user
    const category = await prisma.category.findFirst({
      where: {
        id,
        userId: req.user.userId
      },
      include: {
        _count: {
          select: { transactions: true }
        }
      }
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Check if category has transactions
    if (category._count.transactions > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete category with existing transactions' 
      });
    }

    // Delete category
    await prisma.category.delete({
      where: { id }
    });

    console.log(`Category deleted: ${category.name} by user ${req.user.userId}`);

    res.json({ message: 'Category deleted successfully' });

  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;