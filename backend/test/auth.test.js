import { describe, it, expect, beforeEach, vi } from 'vitest'
import request from 'supertest'
import { app } from '../src/server.js'

// Mock do Prisma
const mockPrisma = {
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
}

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => mockPrisma),
}))

describe('Auth Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      }

      mockPrisma.user.findUnique.mockResolvedValue(null)
      mockPrisma.user.create.mockResolvedValue({
        id: '1',
        email: userData.email,
        name: userData.name,
        createdAt: new Date()
      })

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)

      expect(response.status).toBe(201)
      expect(response.body).toHaveProperty('user')
      expect(response.body).toHaveProperty('token')
      expect(response.body.user.email).toBe(userData.email)
    })

    it('should return error if user already exists', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      }

      mockPrisma.user.findUnique.mockResolvedValue({
        id: '1',
        email: userData.email,
        name: userData.name
      })

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
    })

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({})

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
    })
  })

  describe('POST /api/auth/login', () => {
    it('should login user successfully', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      }

      mockPrisma.user.findUnique.mockResolvedValue({
        id: '1',
        email: loginData.email,
        name: 'Test User',
        password: '$2a$12$hashedpassword'
      })

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('user')
      expect(response.body).toHaveProperty('token')
    })

    it('should return error for invalid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      }

      mockPrisma.user.findUnique.mockResolvedValue(null)

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)

      expect(response.status).toBe(401)
      expect(response.body).toHaveProperty('error')
    })
  })

  describe('GET /api/auth/me', () => {
    it('should return user info with valid token', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User'
      }

      // Mock do middleware de autenticação
      vi.mock('../src/middleware/auth.js', () => ({
        authenticateToken: (req, res, next) => {
          req.user = mockUser
          next()
        }
      }))

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer valid-token')

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('user')
      expect(response.body.user.email).toBe(mockUser.email)
    })
  })
})
