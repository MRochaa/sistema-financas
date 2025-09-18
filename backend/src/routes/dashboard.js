import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get dashboard data
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // Current month totals
    const [currentMonthIncome, currentMonthExpenses] = await Promise.all([
      prisma.transaction.aggregate({
        where: {
          userId,
          type: 'INCOME',
          date: {
            gte: currentMonth,
            lt: nextMonth
          }
        },
        _sum: { amount: true }
      }),
      prisma.transaction.aggregate({
        where: {
          userId,
          type: 'EXPENSE',
          date: {
            gte: currentMonth,
            lt: nextMonth
          }
        },
        _sum: { amount: true }
      })
    ]);

    // Total balance
    const [totalIncome, totalExpenses] = await Promise.all([
      prisma.transaction.aggregate({
        where: { userId, type: 'INCOME' },
        _sum: { amount: true }
      }),
      prisma.transaction.aggregate({
        where: { userId, type: 'EXPENSE' },
        _sum: { amount: true }
      })
    ]);

    // Monthly evolution (last 6 months)
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      
      const [income, expenses] = await Promise.all([
        prisma.transaction.aggregate({
          where: {
            userId,
            type: 'INCOME',
            date: { gte: monthStart, lt: monthEnd }
          },
          _sum: { amount: true }
        }),
        prisma.transaction.aggregate({
          where: {
            userId,
            type: 'EXPENSE',
            date: { gte: monthStart, lt: monthEnd }
          },
          _sum: { amount: true }
        })
      ]);

      const incomeAmount = income._sum.amount || 0;
      const expenseAmount = expenses._sum.amount || 0;
      
      monthlyData.push({
        month: monthStart.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
        income: incomeAmount,
        expenses: expenseAmount,
        balance: incomeAmount - expenseAmount
      });
    }

    // Category breakdown for current month
    const categoryBreakdown = await prisma.transaction.groupBy({
      by: ['categoryId'],
      where: {
        userId,
        date: { gte: currentMonth, lt: nextMonth }
      },
      _sum: { amount: true },
      _count: { id: true }
    });

    const categoriesWithDetails = await Promise.all(
      categoryBreakdown.map(async (item) => {
        const category = await prisma.category.findUnique({
          where: { id: item.categoryId }
        });
        return {
          ...item,
          category
        };
      })
    );

    const currentBalance = (totalIncome._sum.amount || 0) - (totalExpenses._sum.amount || 0);
    const monthlyIncome = currentMonthIncome._sum.amount || 0;
    const monthlyExpenses = currentMonthExpenses._sum.amount || 0;

    res.json({
      currentBalance,
      monthlyIncome,
      monthlyExpenses,
      monthlyBalance: monthlyIncome - monthlyExpenses,
      monthlyEvolution: monthlyData,
      categoryBreakdown: categoriesWithDetails
    });
  } catch (error) {
    next(error);
  }
});

// Get financial projections
router.get('/projections', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    
    // Get last 3 months data for averages
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [avgIncome, avgExpenses] = await Promise.all([
      prisma.transaction.aggregate({
        where: {
          userId,
          type: 'INCOME',
          date: { gte: threeMonthsAgo, lt: currentMonth }
        },
        _sum: { amount: true }
      }),
      prisma.transaction.aggregate({
        where: {
          userId,
          type: 'EXPENSE',
          date: { gte: threeMonthsAgo, lt: currentMonth }
        },
        _sum: { amount: true }
      })
    ]);

    const monthlyAvgIncome = (avgIncome._sum.amount || 0) / 3;
    const monthlyAvgExpenses = (avgExpenses._sum.amount || 0) / 3;
    const monthlyAvgBalance = monthlyAvgIncome - monthlyAvgExpenses;

    // Project next 6 months
    const projections = [];
    for (let i = 0; i < 6; i++) {
      const projectionDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
      projections.push({
        month: projectionDate.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
        projectedIncome: monthlyAvgIncome,
        projectedExpenses: monthlyAvgExpenses,
        projectedBalance: monthlyAvgBalance
      });
    }

    res.json({
      averages: {
        income: monthlyAvgIncome,
        expenses: monthlyAvgExpenses,
        balance: monthlyAvgBalance
      },
      projections
    });
  } catch (error) {
    next(error);
  }
});

export default router;