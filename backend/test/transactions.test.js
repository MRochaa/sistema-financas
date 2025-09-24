import { describe, it, expect, beforeEach, vi } from 'vitest'
import request from 'supertest'
import { app } from '../src/server.js'

// Mock do Prisma
const mockPrisma = {
  transaction: {
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  category: {
    findMany: vi.fn(),
  },
}

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => mockPrisma),
}))

describe('Transaction Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/transactions', () => {
    it('should get all transactions for user', async () => {
      const mockTransactions = [
        {
          id: '1',
          description: 'Test Transaction',
          amount: 100.50,
          type: 'EXPENSE',
          date: new Date(),
          userId: 'user1',
          categoryId: 'cat1'
        }
      ]

      mockPrisma.transaction.findMany.mockResolvedValue(mockTransactions)

      const response = await request(app)
        .get('/api/transactions')
        .set('Authorization', 'Bearer valid-token')

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('transactions')
      expect(response.body.transactions).toHaveLength(1)
    })

    it('should filter transactions by date range', async () => {
      const mockTransactions = []
      mockPrisma.transaction.findMany.mockResolvedValue(mockTransactions)

      const response = await request(app)
        .get('/api/transactions?startDate=2024-01-01&endDate=2024-12-31')
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

  describe('POST /api/transactions', () => {
    it('should create a new transaction', async () => {
      const transactionData = {
        description: 'New Transaction',
        amount: 50.00,
        type: 'INCOME',
        date: '2024-01-15',
        categoryId: 'cat1'
      }

      const mockTransaction = {
        id: '1',
        ...transactionData,
        userId: 'user1',
        createdAt: new Date()
      }

      mockPrisma.transaction.create.mockResolvedValue(mockTransaction)

      const response = await request(app)
        .post('/api/transactions')
        .set('Authorization', 'Bearer valid-token')
        .send(transactionData)

      expect(response.status).toBe(201)
      expect(response.body).toHaveProperty('transaction')
      expect(response.body.transaction.description).toBe(transactionData.description)
    })

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/transactions')
        .set('Authorization', 'Bearer valid-token')
        .send({})

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
    })

    it('should validate amount is positive', async () => {
      const transactionData = {
        description: 'Test',
        amount: -50.00,
        type: 'INCOME',
        date: '2024-01-15'
      }

      const response = await request(app)
        .post('/api/transactions')
        .set('Authorization', 'Bearer valid-token')
        .send(transactionData)

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
    })
  })

  describe('PUT /api/transactions/:id', () => {
    it('should update an existing transaction', async () => {
      const transactionId = '1'
      const updateData = {
        description: 'Updated Transaction',
        amount: 75.00
      }

      const mockTransaction = {
        id: transactionId,
        ...updateData,
        type: 'EXPENSE',
        date: new Date(),
        userId: 'user1'
      }

      mockPrisma.transaction.update.mockResolvedValue(mockTransaction)

      const response = await request(app)
        .put(`/api/transactions/${transactionId}`)
        .set('Authorization', 'Bearer valid-token')
        .send(updateData)

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('transaction')
      expect(response.body.transaction.description).toBe(updateData.description)
    })

    it('should return 404 for non-existent transaction', async () => {
      mockPrisma.transaction.update.mockRejectedValue(new Error('Record not found'))

      const response = await request(app)
        .put('/api/transactions/nonexistent')
        .set('Authorization', 'Bearer valid-token')
        .send({ description: 'Test' })

      expect(response.status).toBe(404)
      expect(response.body).toHaveProperty('error')
    })
  })

  describe('DELETE /api/transactions/:id', () => {
    it('should delete a transaction', async () => {
      const transactionId = '1'
      mockPrisma.transaction.delete.mockResolvedValue({ id: transactionId })

      const response = await request(app)
        .delete(`/api/transactions/${transactionId}`)
        .set('Authorization', 'Bearer valid-token')

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('message')
    })

    it('should return 404 for non-existent transaction', async () => {
      mockPrisma.transaction.delete.mockRejectedValue(new Error('Record not found'))

      const response = await request(app)
        .delete('/api/transactions/nonexistent')
        .set('Authorization', 'Bearer valid-token')

      expect(response.status).toBe(404)
      expect(response.body).toHaveProperty('error')
    })
  })
})
