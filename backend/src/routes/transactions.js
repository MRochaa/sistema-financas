import express from 'express';
import db, { dbHelpers } from '../database/sqlite.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const transactions = db.prepare(`
      SELECT
        t.*,
        json_object(
          'id', c.id,
          'name', c.name,
          'type', c.type,
          'color', c.color,
          'icon', c.icon
        ) as categories
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = ?
      ORDER BY t.date DESC
    `).all(req.userId);

    const parsedTransactions = transactions.map(t => ({
      ...t,
      categories: JSON.parse(t.categories)
    }));

    res.json(parsedTransactions || []);
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Error fetching transactions' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { type, amount, description, date, category_id } = req.body;

    // Normalize type to lowercase for database
    const normalizedType = type?.toLowerCase();

    // Validate type
    if (!normalizedType || !['income', 'expense'].includes(normalizedType)) {
      return res.status(400).json({ error: 'Invalid transaction type. Must be "income" or "expense"' });
    }

    const transactionId = dbHelpers.generateId();
    const now = dbHelpers.now();

    db.prepare(`
      INSERT INTO transactions (id, user_id, category_id, description, amount, type, date, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(transactionId, req.userId, category_id, description, amount, normalizedType, date, now, now);

    const transaction = db.prepare(`
      SELECT
        t.*,
        json_object(
          'id', c.id,
          'name', c.name,
          'type', c.type,
          'color', c.color,
          'icon', c.icon
        ) as categories
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.id = ?
    `).get(transactionId);

    const parsedTransaction = {
      ...transaction,
      categories: JSON.parse(transaction.categories)
    };

    res.status(201).json(parsedTransaction);
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({ error: 'Error creating transaction' });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { type, amount, description, date, category_id } = req.body;

    // Normalize type to lowercase for database
    const normalizedType = type?.toLowerCase();

    // Validate type
    if (!normalizedType || !['income', 'expense'].includes(normalizedType)) {
      return res.status(400).json({ error: 'Invalid transaction type. Must be "income" or "expense"' });
    }

    const now = dbHelpers.now();

    const result = db.prepare(`
      UPDATE transactions
      SET type = ?, amount = ?, description = ?, date = ?, category_id = ?, updated_at = ?
      WHERE id = ? AND user_id = ?
    `).run(normalizedType, amount, description, date, category_id, now, req.params.id, req.userId);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const transaction = db.prepare(`
      SELECT
        t.*,
        json_object(
          'id', c.id,
          'name', c.name,
          'type', c.type,
          'color', c.color,
          'icon', c.icon
        ) as categories
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.id = ?
    `).get(req.params.id);

    const parsedTransaction = {
      ...transaction,
      categories: JSON.parse(transaction.categories)
    };

    res.json(parsedTransaction);
  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({ error: 'Error updating transaction' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = db.prepare('DELETE FROM transactions WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({ error: 'Error deleting transaction' });
  }
});

export default router;
