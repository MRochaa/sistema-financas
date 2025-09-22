const express = require('express');
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

// Get all categories for the authenticated user
router.get('/', auth, async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      where: { userId: req.userId },
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

// Create a new category
router.post('/', auth, [
  body('name')
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters'),
  body('type')
    .isIn(['INCOME', 'EXPENSE'])
    .withMessage('Type must be INCOME or EXPENSE'),
  body('color')
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage('Color must be a valid hex color')
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

    const { name, type, color } = req.body;
    const sanitizedName = sanitizeInput(name);

    // Check if category with same name and type already exists for this user
    const existingCategory = await prisma.category.findFirst({
      where: {
        userId: req.userId,
        name: sanitizedName,
        type: type
      }
    });

    if (existingCategory) {
      return res.status(400).json({ error: 'Category with this name and type already exists' });
    }

    const category = await prisma.category.create({
      data: {
        name: sanitizedName,
        type,
        color,
        userId: req.userId
      }
    });

    res.status(201).json(category);

  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a category
router.put('/:id', auth, [
  body('name')
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters'),
  body('type')
    .isIn(['INCOME', 'EXPENSE'])
    .withMessage('Type must be INCOME or EXPENSE'),
  body('color')
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage('Color must be a valid hex color')
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
    const { name, type, color } = req.body;
    const sanitizedName = sanitizeInput(name);

    // Check if category exists and belongs to user
    const existingCategory = await prisma.category.findFirst({
      where: {
        id: id,
        userId: req.userId
      }
    });

    if (!existingCategory) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Check if another category with same name and type already exists for this user
    const duplicateCategory = await prisma.category.findFirst({
      where: {
        userId: req.userId,
        name: sanitizedName,
        type: type,
        id: { not: id }
      }
    });

    if (duplicateCategory) {
      return res.status(400).json({ error: 'Category with this name and type already exists' });
    }

    const category = await prisma.category.update({
      where: { id: id },
      data: {
        name: sanitizedName,
        type,
        color
      }
    });

    res.json(category);

  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a category
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if category exists and belongs to user
    const existingCategory = await prisma.category.findFirst({
      where: {
        id: id,
        userId: req.userId
      }
    });

    if (!existingCategory) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Check if category has transactions
    const transactionCount = await prisma.transaction.count({
      where: { categoryId: id }
    });

    if (transactionCount > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete category with existing transactions',
        transactionCount 
      });
    }

    await prisma.category.delete({
      where: { id: id }
    });

    res.json({ message: 'Category deleted successfully' });

  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;