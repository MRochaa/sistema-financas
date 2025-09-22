import React, { createContext, useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';

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
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (userData) {
            setUser({
              id: userData.id,
              email: userData.email,
              name: userData.name
            });
            setToken(session.access_token);
          }
        }
      } catch (error) {
        console.error('Error checking user session:', error);
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (userData) {
          setUser({
            id: userData.id,
            email: userData.email,
            name: userData.name
          });
          setToken(session.access_token);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setToken(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
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
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: sanitizedEmail,
        password
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.user) {
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single();
        
        if (userData) {
          setUser({
            id: userData.id,
            email: userData.email,
            name: userData.name
          });
          setToken(data.session?.access_token || null);
          toast.success(`Bem-vindo, ${userData.name}!`);
        }
      }
    } catch (error: any) {
      const message = error.message || 'Erro ao fazer login';
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
      
      // First, create the auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: sanitizedEmail,
        password
      });

      if (authError) {
        throw new Error(authError.message);
      }

      if (authData.user) {
        // Create user profile
        const { data: userData, error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email: sanitizedEmail,
            name: sanitizedName
          })
          .select()
          .single();

        if (profileError) {
          throw new Error(profileError.message);
        }

        // Create default categories for the user
        const defaultCategories = [
          // Income categories
          { name: 'Salário', type: 'INCOME' as const, color: '#10B981', user_id: authData.user.id },
          { name: 'Freelance', type: 'INCOME' as const, color: '#059669', user_id: authData.user.id },
          { name: 'Investimentos', type: 'INCOME' as const, color: '#047857', user_id: authData.user.id },
          { name: 'Outros Rendimentos', type: 'INCOME' as const, color: '#065f46', user_id: authData.user.id },
          
          // Expense categories
          { name: 'Alimentação', type: 'EXPENSE' as const, color: '#EF4444', user_id: authData.user.id },
          { name: 'Transporte', type: 'EXPENSE' as const, color: '#DC2626', user_id: authData.user.id },
          { name: 'Moradia', type: 'EXPENSE' as const, color: '#B91C1C', user_id: authData.user.id },
          { name: 'Saúde', type: 'EXPENSE' as const, color: '#991B1B', user_id: authData.user.id },
          { name: 'Educação', type: 'EXPENSE' as const, color: '#7F1D1D', user_id: authData.user.id },
          { name: 'Lazer', type: 'EXPENSE' as const, color: '#F59E0B', user_id: authData.user.id },
          { name: 'Roupas', type: 'EXPENSE' as const, color: '#D97706', user_id: authData.user.id },
          { name: 'Tecnologia', type: 'EXPENSE' as const, color: '#B45309', user_id: authData.user.id },
          { name: 'Contas', type: 'EXPENSE' as const, color: '#92400E', user_id: authData.user.id },
          { name: 'Outros Gastos', type: 'EXPENSE' as const, color: '#78350F', user_id: authData.user.id }
        ];

        await supabase.from('categories').insert(defaultCategories);

        if (userData) {
          setUser({
            id: userData.id,
            email: userData.email,
            name: userData.name
          });
          setToken(authData.session?.access_token || null);
          toast.success(`Conta criada com sucesso! Bem-vindo, ${userData.name}!`);
        }
      }
    } catch (error: any) {
      const message = error.message || 'Erro ao criar conta';
      toast.error(message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setToken(null);
      toast.success('Logout realizado com sucesso');
    } catch (error) {
      console.error('Error during logout:', error);
      // Force logout even if there's an error
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