import { describe, it, expect, beforeEach, vi } from 'vitest'
import request from 'supertest'
import { app } from '../src/server.js'

// Mock do Prisma
const mockPrisma = {
  transaction: {
    findMany: vi.fn(),
    aggregate: vi.fn(),
  },
  category: {
    findMany: vi.fn(),
  },
}

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => mockPrisma),
}))

describe('Dashboard Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/dashboard/summary', () => {
    it('should get dashboard summary', async () => {
      const mockTransactions = [
        {
          id: '1',
          amount: 100.00,
          type: 'INCOME',
          date: new Date('2024-01-15'),
          category: { name: 'Salary', color: '#10B981' }
        },
        {
          id: '2',
          amount: 50.00,
          type: 'EXPENSE',
          date: new Date('2024-01-16'),
          category: { name: 'Food', color: '#EF4444' }
        }
      ]

      const mockAggregate = {
        _sum: {
          amount: 100.00
        }
      }

      mockPrisma.transaction.findMany.mockResolvedValue(mockTransactions)
      mockPrisma.transaction.aggregate.mockResolvedValue(mockAggregate)

      const response = await request(app)
        .get('/api/dashboard/summary')
        .set('Authorization', 'Bearer valid-token')

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('summary')
      expect(response.body.summary).toHaveProperty('totalIncome')
      expect(response.body.summary).toHaveProperty('totalExpenses')
      expect(response.body.summary).toHaveProperty('balance')
    })

    it('should get summary for specific date range', async () => {
      const mockTransactions = []
      mockPrisma.transaction.findMany.mockResolvedValue(mockTransactions)
      mockPrisma.transaction.aggregate.mockResolvedValue({ _sum: { amount: 0 } })

      const response = await request(app)
        .get('/api/dashboard/summary?startDate=2024-01-01&endDate=2024-01-31')
        .set('Authorization', 'Bearer valid-token')

      expect(response.status).toBe(200)
      expect(mockPrisma.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            date: expect.objectContaining({
              gte: expect.any(Date),
              lte: expect.any(Date)
            })
          })
        })
      )
    })
  })

  describe('GET /api/dashboard/categories', () => {
    it('should get category statistics', async () => {
      const mockCategories = [
        {
          id: '1',
          name: 'Food',
          type: 'EXPENSE',
          color: '#EF4444',
          _count: { transactions: 5 }
        },
        {
          id: '2',
          name: 'Salary',
          type: 'INCOME',
          color: '#10B981',
          _count: { transactions: 1 }
        }
      ]

      mockPrisma.category.findMany.mockResolvedValue(mockCategories)

      const response = await request(app)
        .get('/api/dashboard/categories')
        .set('Authorization', 'Bearer valid-token')

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('categories')
      expect(response.body.categories).toHaveLength(2)
    })
  })

  describe('GET /api/dashboard/trends', () => {
    it('should get spending trends', async () => {
      const mockTransactions = [
        {
          id: '1',
          amount: 100.00,
          type: 'EXPENSE',
          date: new Date('2024-01-01'),
          category: { name: 'Food' }
        },
        {
          id: '2',
          amount: 150.00,
          type: 'EXPENSE',
          date: new Date('2024-01-02'),
          category: { name: 'Food' }
        }
      ]

      mockPrisma.transaction.findMany.mockResolvedValue(mockTransactions)

      const response = await request(app)
        .get('/api/dashboard/trends')
        .set('Authorization', 'Bearer valid-token')

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('trends')
      expect(response.body.trends).toHaveProperty('daily')
      expect(response.body.trends).toHaveProperty('monthly')
    })

    it('should get trends for specific period', async () => {
      const mockTransactions = []
      mockPrisma.transaction.findMany.mockResolvedValue(mockTransactions)

      const response = await request(app)
        .get('/api/dashboard/trends?period=monthly&months=6')
        .set('Authorization', 'Bearer valid-token')

      expect(response.status).toBe(200)
      expect(mockPrisma.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            date: expect.objectContaining({
              gte: expect.any(Date)
            })
          })
        })
      )
    })
  })

  describe('GET /api/dashboard/recent', () => {
    it('should get recent transactions', async () => {
      const mockTransactions = [
        {
          id: '1',
          description: 'Recent Transaction',
          amount: 50.00,
          type: 'EXPENSE',
          date: new Date(),
          category: { name: 'Food', color: '#EF4444' }
        }
      ]

      mockPrisma.transaction.findMany.mockResolvedValue(mockTransactions)

      const response = await request(app)
        .get('/api/dashboard/recent')
        .set('Authorization', 'Bearer valid-token')

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('transactions')
      expect(response.body.transactions).toHaveLength(1)
    })

    it('should limit recent transactions', async () => {
      const mockTransactions = []
      mockPrisma.transaction.findMany.mockResolvedValue(mockTransactions)

      const response = await request(app)
        .get('/api/dashboard/recent?limit=5')
        .set('Authorization', 'Bearer valid-token')

      expect(response.status).toBe(200)
      expect(mockPrisma.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 5
        })
      )
    })
  })
})
