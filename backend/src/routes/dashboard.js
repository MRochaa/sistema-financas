import express from 'express';
import db from '../database/sqlite.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const transactions = db.prepare('SELECT * FROM transactions WHERE user_id = ?').all(req.userId);

    // Normalize transactions type to uppercase for frontend
    const normalizedTransactions = transactions.map(t => ({
      ...t,
      type: t.type.toUpperCase()
    }));

    const totalIncome = normalizedTransactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const totalExpense = normalizedTransactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const balance = totalIncome - totalExpense;

    res.json({
      totalIncome,
      totalExpense,
      balance,
      transactions: normalizedTransactions.length
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Error fetching dashboard data' });
  }
});

export default router;
