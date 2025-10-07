import express from 'express';
import db, { dbHelpers } from '../database/sqlite.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.get('/accounts', auth, async (req, res) => {
  try {
    const accounts = db.prepare(`
      SELECT * FROM savings_accounts
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).all(req.userId);

    const accountsWithContributions = accounts.map(account => {
      const contributions = db.prepare(`
        SELECT * FROM contributions
        WHERE savings_id = ?
        ORDER BY date DESC
      `).all(account.id);

      return {
        ...account,
        targetAmount: account.target_amount,
        interestRate: account.interest_rate,
        interestType: account.interest_type,
        categoryId: account.category_id,
        createdBy: account.created_by,
        createdAt: account.created_at,
        contributions: contributions.map(c => ({
          ...c,
          savingsId: c.savings_id,
          contributedBy: c.contributed_by,
          transactionId: c.transaction_id
        }))
      };
    });

    res.json(accountsWithContributions);
  } catch (error) {
    console.error('Get savings accounts error:', error);
    res.status(500).json({ error: 'Error fetching savings accounts' });
  }
});

router.post('/accounts', auth, async (req, res) => {
  try {
    const { name, description, targetAmount, interestRate, interestType } = req.body;

    if (!name || interestRate === undefined || !interestType) {
      return res.status(400).json({ error: 'Name, interestRate and interestType are required' });
    }

    const user = db.prepare('SELECT name FROM users WHERE id = ?').get(req.userId);
    const accountId = dbHelpers.generateId();
    const now = dbHelpers.now();

    db.prepare(`
      INSERT INTO savings_accounts (id, user_id, name, description, target_amount, interest_rate, interest_type, created_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(accountId, req.userId, name, description, targetAmount, interestRate, interestType, user.name, now, now);

    const account = db.prepare('SELECT * FROM savings_accounts WHERE id = ?').get(accountId);

    res.status(201).json({
      ...account,
      targetAmount: account.target_amount,
      interestRate: account.interest_rate,
      interestType: account.interest_type,
      categoryId: account.category_id,
      createdBy: account.created_by,
      createdAt: account.created_at,
      contributions: []
    });
  } catch (error) {
    console.error('Create savings account error:', error);
    res.status(500).json({ error: 'Error creating savings account' });
  }
});

router.put('/accounts/:id', auth, async (req, res) => {
  try {
    const { name, description, targetAmount, interestRate, interestType, categoryId } = req.body;
    const now = dbHelpers.now();

    const result = db.prepare(`
      UPDATE savings_accounts
      SET name = ?, description = ?, target_amount = ?, interest_rate = ?, interest_type = ?, category_id = ?, updated_at = ?
      WHERE id = ? AND user_id = ?
    `).run(name, description, targetAmount, interestRate, interestType, categoryId, now, req.params.id, req.userId);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Savings account not found' });
    }

    const account = db.prepare('SELECT * FROM savings_accounts WHERE id = ?').get(req.params.id);
    const contributions = db.prepare('SELECT * FROM contributions WHERE savings_id = ?').all(req.params.id);

    res.json({
      ...account,
      targetAmount: account.target_amount,
      interestRate: account.interest_rate,
      interestType: account.interest_type,
      categoryId: account.category_id,
      createdBy: account.created_by,
      createdAt: account.created_at,
      contributions: contributions.map(c => ({
        ...c,
        savingsId: c.savings_id,
        contributedBy: c.contributed_by,
        transactionId: c.transaction_id
      }))
    });
  } catch (error) {
    console.error('Update savings account error:', error);
    res.status(500).json({ error: 'Error updating savings account' });
  }
});

router.delete('/accounts/:id', auth, async (req, res) => {
  try {
    const result = db.prepare('DELETE FROM savings_accounts WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Savings account not found' });
    }

    res.json({ message: 'Savings account deleted successfully' });
  } catch (error) {
    console.error('Delete savings account error:', error);
    res.status(500).json({ error: 'Error deleting savings account' });
  }
});

router.post('/accounts/:id/contributions', auth, async (req, res) => {
  try {
    const { amount, date, contributedBy, transactionId } = req.body;
    const savingsId = req.params.id;

    const account = db.prepare('SELECT * FROM savings_accounts WHERE id = ? AND user_id = ?').get(savingsId, req.userId);

    if (!account) {
      return res.status(404).json({ error: 'Savings account not found' });
    }

    if (!amount || !date || !contributedBy) {
      return res.status(400).json({ error: 'Amount, date and contributedBy are required' });
    }

    const contributionId = dbHelpers.generateId();
    const now = dbHelpers.now();

    db.prepare(`
      INSERT INTO contributions (id, savings_id, amount, contributed_by, date, transaction_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(contributionId, savingsId, amount, contributedBy, date, transactionId, now, now);

    const contribution = db.prepare('SELECT * FROM contributions WHERE id = ?').get(contributionId);

    res.status(201).json({
      ...contribution,
      savingsId: contribution.savings_id,
      contributedBy: contribution.contributed_by,
      transactionId: contribution.transaction_id
    });
  } catch (error) {
    console.error('Create contribution error:', error);
    res.status(500).json({ error: 'Error creating contribution' });
  }
});

router.delete('/accounts/:savingsId/contributions/:contributionId', auth, async (req, res) => {
  try {
    const { savingsId, contributionId } = req.params;

    const account = db.prepare('SELECT * FROM savings_accounts WHERE id = ? AND user_id = ?').get(savingsId, req.userId);

    if (!account) {
      return res.status(404).json({ error: 'Savings account not found' });
    }

    const result = db.prepare('DELETE FROM contributions WHERE id = ? AND savings_id = ?').run(contributionId, savingsId);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Contribution not found' });
    }

    res.json({ message: 'Contribution deleted successfully' });
  } catch (error) {
    console.error('Delete contribution error:', error);
    res.status(500).json({ error: 'Error deleting contribution' });
  }
});

export default router;
