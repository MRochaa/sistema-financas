import { z } from 'zod';
import rateLimit from 'express-rate-limit';

// ============================================
// SCHEMAS DE VALIDAÇÃO
// ============================================

export const userRegistrationSchema = z.object({
  email: z.string().email().max(254).transform(val => val.toLowerCase()),
  password: z.string().min(8).max(128),
  name: z.string().min(2).max(100).trim()
});

export const userLoginSchema = z.object({
  email: z.string().email().transform(val => val.toLowerCase()),
  password: z.string()
});

export const transactionSchema = z.object({
  description: z.string().min(1).max(500).trim(),
  amount: z.number().positive().multipleOf(0.01), // Precisão de centavos
  type: z.enum(['INCOME', 'EXPENSE']),
  date: z.string().datetime(),
  categoryId: z.string().uuid(),
  accountId: z.string().uuid().optional()
});

export const categorySchema = z.object({
  name: z.string().min(1).max(50).trim(),
  type: z.enum(['INCOME', 'EXPENSE']),
  icon: z.string().emoji().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional()
});

// ============================================
// MIDDLEWARE DE VALIDAÇÃO
// ============================================

export const validateRequest = (schema) => {
  return async (req, res, next) => {
    try {
      // Valida e transforma os dados
      const validated = await schema.parseAsync(req.body);
      req.body = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      
      return res.status(400).json({
        error: 'Invalid request data'
      });
    }
  };
};

// ============================================
// RATE LIMITING
// ============================================

// Rate limit geral
export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requisições
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limit para autenticação (mais restritivo)
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 tentativas
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true // Não conta requisições bem-sucedidas
});

// Rate limit para criação de recursos
export const createRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10, // 10 criações por minuto
  message: 'Too many resources created, please slow down',
  standardHeaders: true,
  legacyHeaders: false
});

// Função helper para criar rate limit customizado
export const createUserRateLimit = (windowMs, max) => {
  return rateLimit({
    windowMs,
    max,
    message: `Too many requests, please try again later`,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      // Usa o ID do usuário se autenticado, senão usa IP
      return req.user?.id || req.ip;
    }
  });
};