import express from 'express';
import db, { dbHelpers } from '../database/sqlite.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const transactions = db.prepare(`
      SELECT
        st.*,
        json_object(
          'id', c.id,
          'name', c.name,
          'type', c.type,
          'color', c.color,
          'icon', c.icon
        ) as categories
      FROM simulated_transactions st
      LEFT JOIN categories c ON st.category_id = c.id
      WHERE st.user_id = ?
      ORDER BY st.date DESC
    `).all(req.userId);

    const parsedTransactions = transactions.map(t => {
      const categoryData = JSON.parse(t.categories);
      const { categories, ...transaction } = t;
      return {
        ...transaction,
        type: t.type.toUpperCase(),
        category: categoryData && categoryData.id ? { ...categoryData, type: categoryData.type.toUpperCase() } : null
      };
    });

    res.json(parsedTransactions);
  } catch (error) {
    console.error('Get simulated transactions error:', error);
    res.status(500).json({ error: 'Error fetching simulated transactions' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { type, amount, description, date, category_id } = req.body;

    const normalizedType = type?.toLowerCase();

    if (!normalizedType || !['income', 'expense'].includes(normalizedType)) {
      return res.status(400).json({ error: 'Invalid transaction type. Must be "income" or "expense"' });
    }

    const transactionId = dbHelpers.generateId();
    const now = dbHelpers.now();

    db.prepare(`
      INSERT INTO simulated_transactions (id, user_id, category_id, description, amount, type, date, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(transactionId, req.userId, category_id, description, amount, normalizedType, date, now, now);

    const transaction = db.prepare(`
      SELECT
        st.*,
        json_object(
          'id', c.id,
          'name', c.name,
          'type', c.type,
          'color', c.color,
          'icon', c.icon
        ) as categories
      FROM simulated_transactions st
      LEFT JOIN categories c ON st.category_id = c.id
      WHERE st.id = ?
    `).get(transactionId);

    const categoryData = JSON.parse(transaction.categories);
    const { categories, ...transactionData } = transaction;
    const parsedTransaction = {
      ...transactionData,
      type: transaction.type.toUpperCase(),
      category: categoryData && categoryData.id ? { ...categoryData, type: categoryData.type.toUpperCase() } : null
    };

    res.status(201).json(parsedTransaction);
  } catch (error) {
    console.error('Create simulated transaction error:', error);
    res.status(500).json({ error: 'Error creating simulated transaction' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = db.prepare('DELETE FROM simulated_transactions WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Simulated transaction not found' });
    }

    res.json({ message: 'Simulated transaction deleted successfully' });
  } catch (error) {
    console.error('Delete simulated transaction error:', error);
    res.status(500).json({ error: 'Error deleting simulated transaction' });
  }
});

router.delete('/', auth, async (req, res) => {
  try {
    db.prepare('DELETE FROM simulated_transactions WHERE user_id = ?').run(req.userId);

    res.json({ message: 'All simulated transactions deleted successfully' });
  } catch (error) {
    console.error('Delete all simulated transactions error:', error);
    res.status(500).json({ error: 'Error deleting simulated transactions' });
  }
});

export default router;
