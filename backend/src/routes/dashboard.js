const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// All routes require authentication
router.use(authenticateToken);

// Get dashboard data
router.get('/', async (req, res) => {
  try {
    const userId = req.user.userId;
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // Get current month transactions
    const currentMonthTransactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: {
          gte: currentMonth,
          lt: nextMonth
        }
      },
      include: {
        category: true
      }
    });

    // Calculate totals
    const monthlyIncome = currentMonthTransactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0);

    const monthlyExpenses = currentMonthTransactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0);

    const monthlyBalance = monthlyIncome - monthlyExpenses;

    // Get all transactions for current balance
    const allTransactions = await prisma.transaction.findMany({
      where: { userId }
    });

    const totalIncome = allTransactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = allTransactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0);

    const currentBalance = totalIncome - totalExpenses;

    // Get last 6 months evolution
    const monthlyEvolution = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      
      const monthTransactions = await prisma.transaction.findMany({
        where: {
          userId,
          date: {
            gte: monthStart,
            lt: monthEnd
          }
        }
      });

      const income = monthTransactions
        .filter(t => t.type === 'INCOME')
        .reduce((sum, t) => sum + t.amount, 0);

      const expenses = monthTransactions
        .filter(t => t.type === 'EXPENSE')
        .reduce((sum, t) => sum + t.amount, 0);

      monthlyEvolution.push({
        month: monthStart.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
        income,
        expenses,
        balance: income - expenses
      });
    }

    // Get category breakdown for current month
    const categoryBreakdown = await prisma.transaction.groupBy({
      by: ['categoryId'],
      where: {
        userId,
        date: {
          gte: currentMonth,
          lt: nextMonth
        }
      },
      _sum: {
        amount: true
      },
      _count: {
        id: true
      }
    });

    // Enrich with category data
    const enrichedCategoryBreakdown = await Promise.all(
      categoryBreakdown.map(async (item) => {
        const category = await prisma.category.findUnique({
          where: { id: item.categoryId }
        });
        return {
          categoryId: item.categoryId,
          category,
          _sum: item._sum,
          _count: item._count
        };
      })
    );

    res.json({
      currentBalance,
      monthlyIncome,
      monthlyExpenses,
      monthlyBalance,
      monthlyEvolution,
      categoryBreakdown: enrichedCategoryBreakdown
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get projections based on last 3 months
router.get('/projections', async (req, res) => {
  try {
    const userId = req.user.userId;
    const now = new Date();
    
    // Get last 3 months data
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const last3MonthsTransactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: {
          gte: threeMonthsAgo,
          lt: currentMonth
        }
      }
    });

    // Calculate averages
    const totalIncome = last3MonthsTransactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = last3MonthsTransactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0);

    const averages = {
      income: totalIncome / 3,
      expenses: totalExpenses / 3,
      balance: (totalIncome - totalExpenses) / 3
    };

    // Generate 6 months projections
    const projections = [];
    for (let i = 0; i < 6; i++) {
      const projectionDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
      projections.push({
        month: projectionDate.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
        projectedIncome: averages.income,
        projectedExpenses: averages.expenses,
        projectedBalance: averages.balance
      });
    }

    res.json({
      averages,
      projections
    });

  } catch (error) {
    console.error('Projections error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;