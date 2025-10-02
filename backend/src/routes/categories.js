import express from 'express';
import db, { dbHelpers } from '../database/sqlite.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const categories = db.prepare('SELECT * FROM categories WHERE user_id = ? ORDER BY name').all(req.userId);
    res.json(categories || []);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Error fetching categories' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { name, type, color, icon } = req.body;

    const categoryId = dbHelpers.generateId();
    const now = dbHelpers.now();

    db.prepare(`
      INSERT INTO categories (id, user_id, name, type, color, icon, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(categoryId, req.userId, name, type, color, icon || '📁', now, now);

    const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(categoryId);
    res.status(201).json(category);
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Error creating category' });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { name, type, color, icon } = req.body;
    const now = dbHelpers.now();

    const result = db.prepare(`
      UPDATE categories
      SET name = ?, type = ?, color = ?, icon = ?, updated_at = ?
      WHERE id = ? AND user_id = ?
    `).run(name, type, color, icon, now, req.params.id, req.userId);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id);
    res.json(category);
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ error: 'Error updating category' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = db.prepare('DELETE FROM categories WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Error deleting category' });
  }
});

export default router;
