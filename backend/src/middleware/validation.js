import { z } from 'zod';

// Input sanitization
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input.trim().replace(/[<>]/g, '');
};

// Validation schemas
export const userRegistrationSchema = z.object({
  email: z.string()
    .email('E-mail inválido')
    .max(254, 'E-mail muito longo')
    .transform(sanitizeInput),
  password: z.string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
    .max(128, 'Senha muito longa')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Senha deve conter pelo menos uma letra minúscula, uma maiúscula e um número'),
  name: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome muito longo')
    .transform(sanitizeInput)
});

export const userLoginSchema = z.object({
  email: z.string()
    .email('E-mail inválido')
    .max(254, 'E-mail muito longo')
    .transform(sanitizeInput),
  password: z.string()
    .min(1, 'Senha é obrigatória')
    .max(128, 'Senha muito longa')
});

export const categorySchema = z.object({
  name: z.string()
    .min(1, 'Nome é obrigatório')
    .max(100, 'Nome muito longo')
    .transform(sanitizeInput),
  type: z.enum(['INCOME', 'EXPENSE'], {
    errorMap: () => ({ message: 'Tipo deve ser INCOME ou EXPENSE' })
  }),
  color: z.string()
    .regex(/^#[0-9A-F]{6}$/i, 'Cor deve ser um código hexadecimal válido')
    .default('#6B7280')
});

export const transactionSchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE'], {
    errorMap: () => ({ message: 'Tipo deve ser INCOME ou EXPENSE' })
  }),
  amount: z.number()
    .positive('Valor deve ser positivo')
    .max(999999999.99, 'Valor muito alto')
    .refine(val => Number.isFinite(val), 'Valor deve ser um número válido'),
  description: z.string()
    .max(500, 'Descrição muito longa')
    .transform(sanitizeInput)
    .optional(),
  date: z.string()
    .datetime('Data inválida')
    .refine(dateStr => {
      const date = new Date(dateStr);
      const now = new Date();
      const minDate = new Date('2000-01-01');
      const maxDate = new Date(now.getFullYear() + 10, 11, 31);
      return date >= minDate && date <= maxDate;
    }, 'Data deve estar entre 2000 e 10 anos no futuro'),
  categoryId: z.string()
    .min(1, 'Categoria é obrigatória')
});

// Validation middleware
export const validateRequest = (schema) => {
  return (req, res, next) => {
    try {
      const validatedData = schema.parse(req.body);
      req.body = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Dados inválidos',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      next(error);
    }
  };
};

// Rate limiting by user
export const createUserRateLimit = (windowMs, max) => {
  const attempts = new Map();
  
  return (req, res, next) => {
    const userId = req.user?.id || req.ip;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Clean old attempts
    const userAttempts = attempts.get(userId) || [];
    const recentAttempts = userAttempts.filter(time => time > windowStart);
    
    if (recentAttempts.length >= max) {
      return res.status(429).json({
        error: 'Muitas tentativas. Tente novamente mais tarde.',
        retryAfter: Math.ceil((recentAttempts[0] + windowMs - now) / 1000)
      });
    }
    
    recentAttempts.push(now);
    attempts.set(userId, recentAttempts);
    
    next();
  };
};