import express from 'express';
import db, { dbHelpers } from '../database/sqlite.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const lists = db.prepare(`
      SELECT * FROM shopping_lists
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).all(req.userId);

    const listsWithItems = lists.map(list => {
      const items = db.prepare(`
        SELECT * FROM shopping_items
        WHERE list_id = ?
        ORDER BY category, name
      `).all(list.id);

      return {
        ...list,
        items: items.map(item => ({
          ...item,
          checked: Boolean(item.checked),
          isCustom: Boolean(item.is_custom)
        }))
      };
    });

    res.json(listsWithItems);
  } catch (error) {
    console.error('Get shopping lists error:', error);
    res.status(500).json({ error: 'Error fetching shopping lists' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const listId = dbHelpers.generateId();
    const now = dbHelpers.now();

    db.prepare(`
      INSERT INTO shopping_lists (id, user_id, name, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(listId, req.userId, name, now, now);

    const list = db.prepare('SELECT * FROM shopping_lists WHERE id = ?').get(listId);

    res.status(201).json({ ...list, items: [] });
  } catch (error) {
    console.error('Create shopping list error:', error);
    res.status(500).json({ error: 'Error creating shopping list' });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { name } = req.body;
    const now = dbHelpers.now();

    const result = db.prepare(`
      UPDATE shopping_lists
      SET name = ?, updated_at = ?
      WHERE id = ? AND user_id = ?
    `).run(name, now, req.params.id, req.userId);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Shopping list not found' });
    }

    const list = db.prepare('SELECT * FROM shopping_lists WHERE id = ?').get(req.params.id);
    const items = db.prepare('SELECT * FROM shopping_items WHERE list_id = ?').all(req.params.id);

    res.json({
      ...list,
      items: items.map(item => ({
        ...item,
        checked: Boolean(item.checked),
        isCustom: Boolean(item.is_custom)
      }))
    });
  } catch (error) {
    console.error('Update shopping list error:', error);
    res.status(500).json({ error: 'Error updating shopping list' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = db.prepare('DELETE FROM shopping_lists WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Shopping list not found' });
    }

    res.json({ message: 'Shopping list deleted successfully' });
  } catch (error) {
    console.error('Delete shopping list error:', error);
    res.status(500).json({ error: 'Error deleting shopping list' });
  }
});

router.post('/:id/items', auth, async (req, res) => {
  try {
    const { name, quantity, unit, category, isCustom } = req.body;
    const listId = req.params.id;

    const list = db.prepare('SELECT * FROM shopping_lists WHERE id = ? AND user_id = ?').get(listId, req.userId);

    if (!list) {
      return res.status(404).json({ error: 'Shopping list not found' });
    }

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const itemId = dbHelpers.generateId();
    const now = dbHelpers.now();

    db.prepare(`
      INSERT INTO shopping_items (id, list_id, name, quantity, unit, category, checked, is_custom, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(itemId, listId, name, quantity || 1, unit, category, 0, isCustom ? 1 : 0, now, now);

    const item = db.prepare('SELECT * FROM shopping_items WHERE id = ?').get(itemId);

    res.status(201).json({
      ...item,
      checked: Boolean(item.checked),
      isCustom: Boolean(item.is_custom)
    });
  } catch (error) {
    console.error('Create item error:', error);
    res.status(500).json({ error: 'Error creating item' });
  }
});

router.put('/:listId/items/:itemId', auth, async (req, res) => {
  try {
    const { name, quantity, unit, category, checked } = req.body;
    const { listId, itemId } = req.params;
    const now = dbHelpers.now();

    const list = db.prepare('SELECT * FROM shopping_lists WHERE id = ? AND user_id = ?').get(listId, req.userId);

    if (!list) {
      return res.status(404).json({ error: 'Shopping list not found' });
    }

    const result = db.prepare(`
      UPDATE shopping_items
      SET name = ?, quantity = ?, unit = ?, category = ?, checked = ?, updated_at = ?
      WHERE id = ? AND list_id = ?
    `).run(name, quantity, unit, category, checked ? 1 : 0, now, itemId, listId);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const item = db.prepare('SELECT * FROM shopping_items WHERE id = ?').get(itemId);

    res.json({
      ...item,
      checked: Boolean(item.checked),
      isCustom: Boolean(item.is_custom)
    });
  } catch (error) {
    console.error('Update item error:', error);
    res.status(500).json({ error: 'Error updating item' });
  }
});

router.delete('/:listId/items/:itemId', auth, async (req, res) => {
  try {
    const { listId, itemId } = req.params;

    const list = db.prepare('SELECT * FROM shopping_lists WHERE id = ? AND user_id = ?').get(listId, req.userId);

    if (!list) {
      return res.status(404).json({ error: 'Shopping list not found' });
    }

    const result = db.prepare('DELETE FROM shopping_items WHERE id = ? AND list_id = ?').run(itemId, listId);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Delete item error:', error);
    res.status(500).json({ error: 'Error deleting item' });
  }
});

router.get('/custom-items', auth, async (req, res) => {
  try {
    const items = db.prepare(`
      SELECT DISTINCT si.name, si.category, si.unit
      FROM shopping_items si
      JOIN shopping_lists sl ON si.list_id = sl.id
      WHERE sl.user_id = ? AND si.is_custom = 1
      ORDER BY si.name
    `).all(req.userId);

    res.json(items.map(item => ({
      name: item.name,
      category: item.category,
      unit: item.unit,
      isCustom: true
    })));
  } catch (error) {
    console.error('Get custom items error:', error);
    res.status(500).json({ error: 'Error fetching custom items' });
  }
});

export default router;
