import axios from 'axios';

const API_URL = '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token JWT em todas as requisições
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratar erros de resposta
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token inválido ou expirado
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Serviço de Autenticação
export const authService = {
  async register(email: string, password: string, name: string) {
    const response = await api.post('/auth/register', { email, password, name });
    if (response.data.token) {
      localStorage.setItem('auth_token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  async login(email: string, password: string) {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('auth_token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  async getMe() {
    const response = await api.get('/auth/me');
    return response.data.user;
  },

  logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  },
};

// Serviço de Categorias
export const categoryService = {
  async getAll() {
    const response = await api.get('/categories');
    return response.data || [];
  },

  async create(data: { name: string; type: 'INCOME' | 'EXPENSE'; color: string }) {
    const response = await api.post('/categories', data);
    return response.data;
  },

  async update(id: string, data: { name?: string; color?: string }) {
    const response = await api.put(`/categories/${id}`, data);
    return response.data;
  },

  async delete(id: string) {
    await api.delete(`/categories/${id}`);
  },
};

// Serviço de Transações
export const transactionService = {
  async getAll(filters?: {
    type?: 'INCOME' | 'EXPENSE';
    categoryId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    const response = await api.get('/transactions', { params: filters });
    return response.data || [];
  },

  async create(data: {
    type: 'INCOME' | 'EXPENSE';
    amount: number;
    description?: string;
    date: string;
    categoryId: string;
  }) {
    const payload = {
      type: data.type,
      amount: data.amount,
      description: data.description,
      date: data.date,
      category_id: data.categoryId
    };
    const response = await api.post('/transactions', payload);
    return response.data;
  },

  async update(id: string, data: any) {
    const payload: any = {
      type: data.type,
      amount: data.amount,
      description: data.description,
      date: data.date
    };
    if (data.categoryId) {
      payload.category_id = data.categoryId;
    }
    const response = await api.put(`/transactions/${id}`, payload);
    return response.data;
  },

  async delete(id: string) {
    await api.delete(`/transactions/${id}`);
  },
};

// Serviço de Dashboard
export const dashboardService = {
  async getSummary() {
    const response = await api.get('/dashboard/summary');
    return response.data;
  },

  async getStats(startDate?: string, endDate?: string) {
    const response = await api.get('/dashboard/stats', {
      params: { startDate, endDate },
    });
    return response.data;
  },
};

export default api;
