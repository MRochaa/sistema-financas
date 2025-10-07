const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

const sanitizeInput = (input) => {
  return input.trim().replace(/[<>]/g, '');
};

// Get all categories
router.get('/', auth, async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      where: { userId: req.userId },
      orderBy: [
        { type: 'asc' },
        { name: 'asc' }
      ]
    });

    res.json({ categories });

  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create category
router.post('/', auth, [
  body('name').isLength({ min: 1, max: 100 }),
  body('type').isIn(['INCOME', 'EXPENSE']),
  body('color').matches(/^#[0-9A-F]{6}$/i)
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { name, type, color } = req.body;
    const sanitizedName = sanitizeInput(name);

    const existingCategory = await prisma.category.findFirst({
      where: {
        userId: req.userId,
        name: sanitizedName,
        type: type
      }
    });

    if (existingCategory) {
      return res.status(400).json({ error: 'Category already exists' });
    }

    const category = await prisma.category.create({
      data: {
        name: sanitizedName,
        type,
        color,
        userId: req.userId
      }
    });

    res.status(201).json({ category });

  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update category
router.put('/:id', auth, [
  body('name').optional().isLength({ min: 1, max: 100 }),
  body('color').optional().matches(/^#[0-9A-F]{6}$/i)
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { id } = req.params;
    const updates = {};

    if (req.body.name) {
      updates.name = sanitizeInput(req.body.name);
    }
    if (req.body.color) {
      updates.color = req.body.color;
    }

    const category = await prisma.category.updateMany({
      where: {
        id: id,
        userId: req.userId
      },
      data: updates
    });

    if (category.count === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const updatedCategory = await prisma.category.findUnique({
      where: { id }
    });

    res.json({ category: updatedCategory });

  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete category
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await prisma.category.deleteMany({
      where: {
        id: id,
        userId: req.userId
      }
    });

    if (deleted.count === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ message: 'Category deleted successfully' });

  } catch (error) {
    console.error('Delete category error:', error);
    
    if (error.code === 'P2003') {
      return res.status(400).json({ 
        error: 'Cannot delete category with associated transactions' 
      });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
