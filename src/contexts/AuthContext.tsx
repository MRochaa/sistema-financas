import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

// Security: Input validation schemas
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
};

const validatePassword = (password: string): boolean => {
  return password.length >= 8 && password.length <= 128;
};

const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// API configuration - use relative URLs in production
const API_URL = import.meta.env.VITE_API_URL || '/api';

// Configure axios defaults
axios.defaults.baseURL = API_URL;
axios.defaults.timeout = 10000; // 10 second timeout

// Add request interceptor for security headers
axios.interceptors.request.use((config) => {
  config.headers['X-Requested-With'] = 'XMLHttpRequest';
  return config;
});

// Add response interceptor for error handling
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // For demo purposes, simulate authentication
    const demoUser = localStorage.getItem('demoUser');
    if (demoUser) {
      setUser(JSON.parse(demoUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      // Input validation
      if (!validateEmail(email)) {
        throw new Error('E-mail inválido');
      }
      if (!validatePassword(password)) {
        throw new Error('Senha deve ter entre 8 e 128 caracteres');
      }

      const sanitizedEmail = sanitizeInput(email);
      
      const response = await axios.post('/auth/login', { 
        email: sanitizedEmail, 
        password 
      });
      const { user: userData, token: userToken } = response.data;
      
      // Validate response data
      if (!userData || !userToken || !userData.id || !userData.email || !userData.name) {
        throw new Error('Resposta inválida do servidor');
      }
      
      localStorage.setItem('token', userToken);
      localStorage.setItem('user', JSON.stringify(userData));
      setToken(userToken);
      setUser(userData);
      axios.defaults.headers.common['Authorization'] = `Bearer ${userToken}`;
        
      toast.success(`Bem-vindo, ${userData.name}!`);
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Erro ao fazer login';
      toast.error(message);
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      // Input validation
      if (!validateEmail(email)) {
        throw new Error('E-mail inválido');
      }
      if (!validatePassword(password)) {
        throw new Error('Senha deve ter entre 8 e 128 caracteres');
      }
      if (!name || name.length < 2 || name.length > 100) {
        throw new Error('Nome deve ter entre 2 e 100 caracteres');
      }

      const sanitizedEmail = sanitizeInput(email);
      const sanitizedName = sanitizeInput(name);
      
      const response = await axios.post('/auth/register', { 
        email: sanitizedEmail, 
        password, 
        name: sanitizedName 
      });
      const { user: userData, token: userToken } = response.data;
      
      // Validate response data
      if (!userData || !userToken || !userData.id || !userData.email || !userData.name) {
        throw new Error('Resposta inválida do servidor');
      }
      
      localStorage.setItem('token', userToken);
      localStorage.setItem('user', JSON.stringify(userData));
      setToken(userToken);
      setUser(userData);
      axios.defaults.headers.common['Authorization'] = `Bearer ${userToken}`;
        
      toast.success(`Conta criada com sucesso! Bem-vindo, ${userData.name}!`);
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Erro ao criar conta';
      toast.error(message);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
    toast.success('Logout realizado com sucesso');
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};