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

// Serviço de Wishlist
export const wishlistService = {
  async getAll() {
    const response = await api.get('/wishlists');
    return response.data || [];
  },

  async create(data: { name: string; description?: string }) {
    const response = await api.post('/wishlists', data);
    return response.data;
  },

  async update(id: string, data: { name: string; description?: string }) {
    const response = await api.put(`/wishlists/${id}`, data);
    return response.data;
  },

  async delete(id: string) {
    await api.delete(`/wishlists/${id}`);
  },

  async createItem(wishlistId: string, data: { name: string; price?: number; image?: string; link?: string }) {
    const response = await api.post(`/wishlists/${wishlistId}/items`, data);
    return response.data;
  },

  async updateItem(wishlistId: string, itemId: string, data: { name: string; price?: number; image?: string; link?: string }) {
    const response = await api.put(`/wishlists/${wishlistId}/items/${itemId}`, data);
    return response.data;
  },

  async deleteItem(wishlistId: string, itemId: string) {
    await api.delete(`/wishlists/${wishlistId}/items/${itemId}`);
  },

  async approveItem(wishlistId: string, itemId: string) {
    const response = await api.patch(`/wishlists/${wishlistId}/items/${itemId}/approve`);
    return response.data;
  },

  async reorderItems(wishlistId: string, items: Array<{ id: string; order: number }>) {
    const response = await api.patch(`/wishlists/${wishlistId}/items/reorder`, { items });
    return response.data;
  },
};

// Serviço de Lista de Compras
export const shoppingListService = {
  async getAll() {
    const response = await api.get('/shopping-lists');
    return response.data || [];
  },

  async create(data: { name: string }) {
    const response = await api.post('/shopping-lists', data);
    return response.data;
  },

  async update(id: string, data: { name: string }) {
    const response = await api.put(`/shopping-lists/${id}`, data);
    return response.data;
  },

  async delete(id: string) {
    await api.delete(`/shopping-lists/${id}`);
  },

  async createItem(listId: string, data: { name: string; quantity?: number; unit?: string; category?: string; isCustom?: boolean }) {
    const response = await api.post(`/shopping-lists/${listId}/items`, data);
    return response.data;
  },

  async updateItem(listId: string, itemId: string, data: { name: string; quantity?: number; unit?: string; category?: string; checked: boolean }) {
    const response = await api.put(`/shopping-lists/${listId}/items/${itemId}`, data);
    return response.data;
  },

  async deleteItem(listId: string, itemId: string) {
    await api.delete(`/shopping-lists/${listId}/items/${itemId}`);
  },

  async getCustomItems() {
    const response = await api.get('/shopping-lists/custom-items');
    return response.data || [];
  },
};

// Serviço de Poupança
export const savingsService = {
  async getAccounts() {
    const response = await api.get('/savings/accounts');
    return response.data || [];
  },

  async createAccount(data: { name: string; description?: string; targetAmount?: number; interestRate: number; interestType: 'MONTHLY' | 'YEARLY' }) {
    const response = await api.post('/savings/accounts', data);
    return response.data;
  },

  async updateAccount(id: string, data: { name: string; description?: string; targetAmount?: number; interestRate: number; interestType: 'MONTHLY' | 'YEARLY'; categoryId?: string }) {
    const response = await api.put(`/savings/accounts/${id}`, data);
    return response.data;
  },

  async deleteAccount(id: string) {
    await api.delete(`/savings/accounts/${id}`);
  },

  async createContribution(savingsId: string, data: { amount: number; date: string; contributedBy: string; transactionId?: string }) {
    const response = await api.post(`/savings/accounts/${savingsId}/contributions`, data);
    return response.data;
  },

  async deleteContribution(savingsId: string, contributionId: string) {
    await api.delete(`/savings/accounts/${savingsId}/contributions/${contributionId}`);
  },
};
// Serviço de Simulação
export const simulationService = {
  async getAll() {
    const response = await api.get('/simulations');
    return response.data || [];
  },

  async create(data: { type: 'INCOME' | 'EXPENSE'; amount: number; description?: string; date: string; categoryId: string }) {
    const payload = {
      type: data.type,
      amount: data.amount,
      description: data.description,
      date: data.date,
      category_id: data.categoryId
    };
    const response = await api.post('/simulations', payload);
    return response.data;
  },

  async delete(id: string) {
    await api.delete(`/simulations/${id}`);
  },

  async deleteAll() {
    await api.delete('/simulations');
  },
};

export default api;
