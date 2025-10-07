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
        ) as categories,
        json_object(
          'id', u.id,
          'name', u.name,
          'email', u.email
        ) as user_data
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN users u ON t.user_id = u.id
      WHERE t.user_id = ?
      ORDER BY t.date DESC
    `).all(req.userId);

    const parsedTransactions = transactions.map(t => {
      const categoryData = JSON.parse(t.categories);
      const userData = JSON.parse(t.user_data);
      const { categories, user_data, ...transaction } = t;
      return {
        ...transaction,
        type: t.type.toUpperCase(),
        category: categoryData && categoryData.id ? { ...categoryData, type: categoryData.type.toUpperCase() } : null,
        user: userData
      };
    });

    console.log(`Returning ${parsedTransactions.length} transactions`);
    if (parsedTransactions.length > 0) {
      console.log('Sample transaction:', parsedTransactions[0]);
    }

    res.json(parsedTransactions || []);
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Error fetching transactions' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { type, amount, description, date, category_id } = req.body;

    console.log('Creating transaction with data:', { type, amount, description, date, category_id });

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
        ) as categories,
        json_object(
          'id', u.id,
          'name', u.name,
          'email', u.email
        ) as user_data
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN users u ON t.user_id = u.id
      WHERE t.id = ?
    `).get(transactionId);

    const categoryData = JSON.parse(transaction.categories);
    const userData = JSON.parse(transaction.user_data);
    const { categories, user_data, ...transactionData } = transaction;
    const parsedTransaction = {
      ...transactionData,
      type: transaction.type.toUpperCase(),
      category: categoryData && categoryData.id ? { ...categoryData, type: categoryData.type.toUpperCase() } : null,
      user: userData
    };

    console.log('Transaction created:', parsedTransaction);
    console.log('Category data:', categoryData);

    // Auto-create contribution if this is a savings transaction
    if (normalizedType === 'expense' && categoryData && categoryData.name && categoryData.name.startsWith('Poupança:')) {
      try {
        // Find the savings account by category_id
        const savingsAccount = db.prepare('SELECT id FROM savings_accounts WHERE category_id = ?').get(category_id);

        if (savingsAccount) {
          const contributionId = dbHelpers.generateId();
          db.prepare(`
            INSERT INTO contributions (id, savings_id, amount, contributed_by, date, transaction_id, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `).run(contributionId, savingsAccount.id, amount, userData.name, date, transactionId, now, now);

          console.log('Auto-created contribution for savings transaction');
        }
      } catch (contribError) {
        console.error('Error auto-creating contribution:', contribError);
        // Don't fail the transaction creation if contribution fails
      }
    }

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

    const categoryData = JSON.parse(transaction.categories);
    const { categories, ...transactionData } = transaction;
    const parsedTransaction = {
      ...transactionData,
      type: transaction.type.toUpperCase(),
      category: categoryData && categoryData.id ? { ...categoryData, type: categoryData.type.toUpperCase() } : null
    };

    res.json(parsedTransaction);
  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({ error: 'Error updating transaction' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    // Delete any associated contribution first (if this was a savings transaction)
    db.prepare('DELETE FROM contributions WHERE transaction_id = ?').run(req.params.id);

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
