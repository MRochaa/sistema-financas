import express from 'express';
import db, { dbHelpers } from '../database/sqlite.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const wishlists = db.prepare(`
      SELECT * FROM wishlists
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).all(req.userId);

    const wishlistsWithItems = wishlists.map(wishlist => {
      const items = db.prepare(`
        SELECT * FROM wishlist_items
        WHERE wishlist_id = ?
        ORDER BY item_order ASC
      `).all(wishlist.id);

      return {
        ...wishlist,
        items: items.map(item => ({
          ...item,
          approved: Boolean(item.approved),
          order: item.item_order,
          createdBy: item.created_by,
          approvedBy: item.approved_by
        }))
      };
    });

    res.json(wishlistsWithItems);
  } catch (error) {
    console.error('Get wishlists error:', error);
    res.status(500).json({ error: 'Error fetching wishlists' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const wishlistId = dbHelpers.generateId();
    const now = dbHelpers.now();

    db.prepare(`
      INSERT INTO wishlists (id, user_id, name, description, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(wishlistId, req.userId, name, description, now, now);

    const wishlist = db.prepare('SELECT * FROM wishlists WHERE id = ?').get(wishlistId);

    res.status(201).json({ ...wishlist, items: [] });
  } catch (error) {
    console.error('Create wishlist error:', error);
    res.status(500).json({ error: 'Error creating wishlist' });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { name, description } = req.body;
    const now = dbHelpers.now();

    const result = db.prepare(`
      UPDATE wishlists
      SET name = ?, description = ?, updated_at = ?
      WHERE id = ? AND user_id = ?
    `).run(name, description, now, req.params.id, req.userId);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Wishlist not found' });
    }

    const wishlist = db.prepare('SELECT * FROM wishlists WHERE id = ?').get(req.params.id);
    const items = db.prepare('SELECT * FROM wishlist_items WHERE wishlist_id = ?').all(req.params.id);

    res.json({
      ...wishlist,
      items: items.map(item => ({
        ...item,
        approved: Boolean(item.approved),
        order: item.item_order,
        createdBy: item.created_by,
        approvedBy: item.approved_by
      }))
    });
  } catch (error) {
    console.error('Update wishlist error:', error);
    res.status(500).json({ error: 'Error updating wishlist' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = db.prepare('DELETE FROM wishlists WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Wishlist not found' });
    }

    res.json({ message: 'Wishlist deleted successfully' });
  } catch (error) {
    console.error('Delete wishlist error:', error);
    res.status(500).json({ error: 'Error deleting wishlist' });
  }
});

router.post('/:id/items', auth, async (req, res) => {
  try {
    const { name, price, image, link } = req.body;
    const wishlistId = req.params.id;

    const wishlist = db.prepare('SELECT * FROM wishlists WHERE id = ? AND user_id = ?').get(wishlistId, req.userId);

    if (!wishlist) {
      return res.status(404).json({ error: 'Wishlist not found' });
    }

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const user = db.prepare('SELECT name FROM users WHERE id = ?').get(req.userId);
    const itemId = dbHelpers.generateId();
    const now = dbHelpers.now();

    const maxOrder = db.prepare('SELECT MAX(item_order) as max FROM wishlist_items WHERE wishlist_id = ?').get(wishlistId);
    const order = (maxOrder?.max ?? -1) + 1;

    db.prepare(`
      INSERT INTO wishlist_items (id, wishlist_id, name, price, image, link, approved, created_by, item_order, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(itemId, wishlistId, name, price, image, link, 0, user.name, order, now, now);

    const item = db.prepare('SELECT * FROM wishlist_items WHERE id = ?').get(itemId);

    res.status(201).json({
      ...item,
      approved: Boolean(item.approved),
      order: item.item_order,
      createdBy: item.created_by,
      approvedBy: item.approved_by
    });
  } catch (error) {
    console.error('Create item error:', error);
    res.status(500).json({ error: 'Error creating item' });
  }
});

router.put('/:wishlistId/items/:itemId', auth, async (req, res) => {
  try {
    const { name, price, image, link } = req.body;
    const { wishlistId, itemId } = req.params;
    const now = dbHelpers.now();

    const wishlist = db.prepare('SELECT * FROM wishlists WHERE id = ? AND user_id = ?').get(wishlistId, req.userId);

    if (!wishlist) {
      return res.status(404).json({ error: 'Wishlist not found' });
    }

    const result = db.prepare(`
      UPDATE wishlist_items
      SET name = ?, price = ?, image = ?, link = ?, updated_at = ?
      WHERE id = ? AND wishlist_id = ?
    `).run(name, price, image, link, now, itemId, wishlistId);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const item = db.prepare('SELECT * FROM wishlist_items WHERE id = ?').get(itemId);

    res.json({
      ...item,
      approved: Boolean(item.approved),
      order: item.item_order,
      createdBy: item.created_by,
      approvedBy: item.approved_by
    });
  } catch (error) {
    console.error('Update item error:', error);
    res.status(500).json({ error: 'Error updating item' });
  }
});

router.delete('/:wishlistId/items/:itemId', auth, async (req, res) => {
  try {
    const { wishlistId, itemId } = req.params;

    const wishlist = db.prepare('SELECT * FROM wishlists WHERE id = ? AND user_id = ?').get(wishlistId, req.userId);

    if (!wishlist) {
      return res.status(404).json({ error: 'Wishlist not found' });
    }

    const result = db.prepare('DELETE FROM wishlist_items WHERE id = ? AND wishlist_id = ?').run(itemId, wishlistId);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Delete item error:', error);
    res.status(500).json({ error: 'Error deleting item' });
  }
});

router.patch('/:wishlistId/items/:itemId/approve', auth, async (req, res) => {
  try {
    const { wishlistId, itemId } = req.params;
    const now = dbHelpers.now();

    const wishlist = db.prepare('SELECT * FROM wishlists WHERE id = ? AND user_id = ?').get(wishlistId, req.userId);

    if (!wishlist) {
      return res.status(404).json({ error: 'Wishlist not found' });
    }

    const user = db.prepare('SELECT name FROM users WHERE id = ?').get(req.userId);
    const item = db.prepare('SELECT * FROM wishlist_items WHERE id = ? AND wishlist_id = ?').get(itemId, wishlistId);

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const newApprovedState = item.approved ? 0 : 1;
    const approvedBy = newApprovedState ? user.name : null;

    db.prepare(`
      UPDATE wishlist_items
      SET approved = ?, approved_by = ?, updated_at = ?
      WHERE id = ? AND wishlist_id = ?
    `).run(newApprovedState, approvedBy, now, itemId, wishlistId);

    const updatedItem = db.prepare('SELECT * FROM wishlist_items WHERE id = ?').get(itemId);

    res.json({
      ...updatedItem,
      approved: Boolean(updatedItem.approved),
      order: updatedItem.item_order,
      createdBy: updatedItem.created_by,
      approvedBy: updatedItem.approved_by
    });
  } catch (error) {
    console.error('Approve item error:', error);
    res.status(500).json({ error: 'Error approving item' });
  }
});

router.patch('/:wishlistId/items/reorder', auth, async (req, res) => {
  try {
    const { items } = req.body;
    const wishlistId = req.params.wishlistId;
    const now = dbHelpers.now();

    const wishlist = db.prepare('SELECT * FROM wishlists WHERE id = ? AND user_id = ?').get(wishlistId, req.userId);

    if (!wishlist) {
      return res.status(404).json({ error: 'Wishlist not found' });
    }

    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'Items must be an array' });
    }

    const updateStmt = db.prepare(`
      UPDATE wishlist_items
      SET item_order = ?, updated_at = ?
      WHERE id = ? AND wishlist_id = ?
    `);

    const updateMany = db.transaction((itemsToUpdate) => {
      for (const { id, order } of itemsToUpdate) {
        updateStmt.run(order, now, id, wishlistId);
      }
    });

    updateMany(items);

    res.json({ message: 'Items reordered successfully' });
  } catch (error) {
    console.error('Reorder items error:', error);
    res.status(500).json({ error: 'Error reordering items' });
  }
});

export default router;
