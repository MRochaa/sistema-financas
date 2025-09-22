import React, { createContext, useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import axios from 'axios';

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

// Configure axios defaults
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

// Set authorization header if token exists
const token = localStorage.getItem('token');
if (token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      try {
        const savedToken = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');
        
        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
          axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
        }
      } catch (error) {
        console.error('Error checking user session:', error);
      } finally {
        setLoading(false);
      }
    };

    checkUser();
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
      
      const response = await axios.post('/api/auth/login', {
        email: sanitizedEmail,
        password
      });

      const { user: userData, token: userToken } = response.data;

      // Store in localStorage
      localStorage.setItem('token', userToken);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Set axios default header
      axios.defaults.headers.common['Authorization'] = `Bearer ${userToken}`;
      
      // Update state
      setUser(userData);
      setToken(userToken);
      
      toast.success(`Bem-vindo, ${userData.name}!`);
      
    } catch (error: any) {
      const message = error.response?.data?.error || error.message || 'Erro ao fazer login';
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
      
      const response = await axios.post('/api/auth/register', {
        email: sanitizedEmail,
        password,
        name: sanitizedName
      });

      const { user: userData, token: userToken } = response.data;

      // Store in localStorage
      localStorage.setItem('token', userToken);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Set axios default header
      axios.defaults.headers.common['Authorization'] = `Bearer ${userToken}`;
      
      // Update state
      setUser(userData);
      setToken(userToken);
      
      toast.success(`Conta criada com sucesso! Bem-vindo, ${userData.name}!`);
      
    } catch (error: any) {
      const message = error.response?.data?.error || error.message || 'Erro ao criar conta';
      toast.error(message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Clear localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Clear axios default header
      delete axios.defaults.headers.common['Authorization'];
      
      // Update state
      setUser(null);
      setToken(null);
      
      toast.success('Logout realizado com sucesso');
    } catch (error) {
      console.error('Error during logout:', error);
      // Force logout even if there's an error
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      delete axios.defaults.headers.common['Authorization'];
      setUser(null);
      setToken(null);
      toast.success('Logout realizado com sucesso');
    }
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