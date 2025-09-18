import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';
import { validateRequest, categorySchema } from '../middleware/validation.js';

const router = express.Router();
const prisma = new PrismaClient();


// Get all categories
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(categories);
  } catch (error) {
    next(error);
  }
});

// Create category
router.post('/', authenticateToken, validateRequest(categorySchema), async (req, res, next) => {
  try {
    const data = req.body;
    
    // Check if category name already exists
    const existingCategory = await prisma.category.findFirst({
      where: { 
        name: {
          equals: data.name,
          mode: 'insensitive'
        }
      }
    });
    
    if (existingCategory) {
      return res.status(409).json({ error: 'Category already exists' });
    }
    
    const category = await prisma.category.create({ data });
    res.status(201).json(category);
  } catch (error) {
    next(error);
  }
});

// Update category
router.put('/:id', authenticateToken, validateRequest(categorySchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = req.body;
    
    // Check if category name already exists (excluding current category)
    const existingCategory = await prisma.category.findFirst({
      where: { 
        name: {
          equals: data.name,
          mode: 'insensitive'
        },
        id: {
          not: id
        }
      }
    });
    
    if (existingCategory) {
      return res.status(409).json({ error: 'Category name already exists' });
    }
    
    const category = await prisma.category.update({
      where: { id },
      data
    });
    
    res.json(category);
  } catch (error) {
    next(error);
  }
});

// Delete category
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if category has associated transactions
    const transactionCount = await prisma.transaction.count({
      where: { categoryId: id }
    });
    
    if (transactionCount > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete category with associated transactions',
        transactionCount 
      });
    }
    
    await prisma.category.delete({
      where: { id }
    });
    
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;