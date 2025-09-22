import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';
import axios from 'axios';

// Security: Input validation and sanitization
const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

const validateAmount = (amount: number): boolean => {
  return !isNaN(amount) && amount > 0 && amount <= 999999999.99;
};

const validateDate = (date: string): boolean => {
  const parsedDate = new Date(date);
  const now = new Date();
  const minDate = new Date('2000-01-01');
  const maxDate = new Date(now.getFullYear() + 10, 11, 31);
  
  return parsedDate >= minDate && parsedDate <= maxDate;
};

interface Category {
  id: string;
  name: string;
  type: 'INCOME' | 'EXPENSE';
  color: string;
}

interface Transaction {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  description?: string;
  date: string;
  category: Category;
  user: { name: string; email: string };
}

interface DataContextType {
  categories: Category[];
  transactions: Transaction[];
  loading: boolean;
  user: any;
  // Category methods
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, category: Omit<Category, 'id'>) => void;
  deleteCategory: (id: string) => void;
  // Transaction methods
  addTransaction: (transaction: Omit<Transaction, 'id' | 'category' | 'user'> & { categoryId: string }) => void;
  updateTransaction: (id: string, transaction: Omit<Transaction, 'id' | 'category' | 'user'> & { categoryId: string }) => void;
  deleteTransaction: (id: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Load data when user changes
  useEffect(() => {
    if (user) {
      loadCategories();
      loadTransactions();
    } else {
      setCategories([]);
      setTransactions([]);
    }
  }, [user]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error('Erro ao carregar categorias');
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/transactions');
      setTransactions(response.data.transactions || []);
    } catch (error) {
      console.error('Error loading transactions:', error);
      toast.error('Erro ao carregar transações');
    } finally {
      setLoading(false);
    }
  };

  // Category methods
  const addCategory = (categoryData: Omit<Category, 'id'>) => {
    return new Promise(async (resolve, reject) => {
      try {
      // Input validation
      if (!categoryData.name || categoryData.name.length < 1 || categoryData.name.length > 100) {
        toast.error('Nome da categoria deve ter entre 1 e 100 caracteres');
        return reject(new Error('Invalid name'));
      }
      
      if (!['INCOME', 'EXPENSE'].includes(categoryData.type)) {
        toast.error('Tipo de categoria inválido');
        return reject(new Error('Invalid type'));
      }

      const sanitizedName = sanitizeInput(categoryData.name);
      
        const response = await axios.post('/categories', {
          name: sanitizedName,
          type: categoryData.type,
          color: categoryData.color || '#6B7280'
        });

        const newCategory = response.data;
        setCategories(prev => [...prev, newCategory]);
        toast.success('Categoria criada com sucesso');
        resolve(newCategory);
      } catch (error: any) {
        console.error('Error adding category:', error);
        const message = error.response?.data?.error || 'Erro ao criar categoria';
        toast.error(message);
        reject(error);
      }
    });
  };

  const updateCategory = (id: string, categoryData: Omit<Category, 'id'>) => {
    return new Promise(async (resolve, reject) => {
      try {
      // Input validation
      if (!categoryData.name || categoryData.name.length < 1 || categoryData.name.length > 100) {
        toast.error('Nome da categoria deve ter entre 1 e 100 caracteres');
        return reject(new Error('Invalid name'));
      }
      
      const sanitizedName = sanitizeInput(categoryData.name);
      
        const response = await axios.put(`/categories/${id}`, {
          name: sanitizedName,
          type: categoryData.type,
          color: categoryData.color
        });

        const updatedCategory = response.data;
        setCategories(prev => prev.map(cat => 
          cat.id === id ? updatedCategory : cat
        ));
        
        // Reload transactions to get updated category info
        await loadTransactions();
        
        toast.success('Categoria atualizada com sucesso');
        resolve(updatedCategory);
      } catch (error: any) {
        console.error('Error updating category:', error);
        const message = error.response?.data?.error || 'Erro ao atualizar categoria';
        toast.error(message);
        reject(error);
      }
    });
  };

  const deleteCategory = (id: string) => {
    return new Promise(async (resolve, reject) => {
      try {
        await axios.delete(`/categories/${id}`);
        setCategories(prev => prev.filter(cat => cat.id !== id));
        toast.success('Categoria excluída com sucesso');
        resolve(true);
      } catch (error: any) {
        console.error('Error deleting category:', error);
        const message = error.response?.data?.error || 'Erro ao excluir categoria';
        toast.error(message);
        reject(error);
      }
    });
  };

  // Transaction methods
  const addTransaction = (transactionData: Omit<Transaction, 'id' | 'category' | 'user'> & { categoryId: string }) => {
    return new Promise(async (resolve, reject) => {
      try {
      // Input validation
      if (!validateAmount(transactionData.amount)) {
        toast.error('Valor deve ser um número positivo válido');
        return reject(new Error('Invalid amount'));
      }
      
      if (!validateDate(transactionData.date)) {
        toast.error('Data inválida');
        return reject(new Error('Invalid date'));
      }
      
      if (!['INCOME', 'EXPENSE'].includes(transactionData.type)) {
        toast.error('Tipo de transação inválido');
        return reject(new Error('Invalid type'));
      }

      const sanitizedDescription = transactionData.description ? 
        sanitizeInput(transactionData.description).substring(0, 500) : undefined;

        const response = await axios.post('/transactions', {
          type: transactionData.type,
          amount: transactionData.amount,
        description: sanitizedDescription,
          date: transactionData.date,
          categoryId: transactionData.categoryId
        });

        const newTransaction = response.data;
        setTransactions(prev => [newTransaction, ...prev]);
        toast.success('Transação criada com sucesso');
        resolve(newTransaction);
      } catch (error: any) {
        console.error('Error adding transaction:', error);
        const message = error.response?.data?.error || 'Erro ao criar transação';
        toast.error(message);
        reject(error);
      }
    });
  };

  const updateTransaction = (id: string, transactionData: Omit<Transaction, 'id' | 'category' | 'user'> & { categoryId: string }) => {
    return new Promise(async (resolve, reject) => {
      try {
      // Input validation
      if (!validateAmount(transactionData.amount)) {
        toast.error('Valor deve ser um número positivo válido');
        return reject(new Error('Invalid amount'));
      }
      
      if (!validateDate(transactionData.date)) {
        toast.error('Data inválida');
        return reject(new Error('Invalid date'));
      }

      const sanitizedDescription = transactionData.description ? 
        sanitizeInput(transactionData.description).substring(0, 500) : undefined;

        const response = await axios.put(`/transactions/${id}`, {
          type: transactionData.type,
          amount: transactionData.amount,
              description: sanitizedDescription,
          date: transactionData.date,
          categoryId: transactionData.categoryId
        });

        const updatedTransaction = response.data;
        setTransactions(prev => prev.map(transaction => 
          transaction.id === id ? updatedTransaction : transaction
        ));
        
        toast.success('Transação atualizada com sucesso');
        resolve(updatedTransaction);
      } catch (error: any) {
        console.error('Error updating transaction:', error);
        const message = error.response?.data?.error || 'Erro ao atualizar transação';
        toast.error(message);
        reject(error);
      }
    });
  };

  const deleteTransaction = (id: string) => {
    return new Promise(async (resolve, reject) => {
      try {
        await axios.delete(`/transactions/${id}`);
        setTransactions(prev => prev.filter(t => t.id !== id));
        toast.success('Transação excluída com sucesso');
        resolve(true);
      } catch (error: any) {
        console.error('Error deleting transaction:', error);
        const message = error.response?.data?.error || 'Erro ao excluir transação';
        toast.error(message);
        reject(error);
      }
    });
  };

  const value = {
    categories,
    transactions,
    loading,
    user,
    addCategory,
    updateCategory,
    deleteCategory,
    addTransaction,
    updateTransaction,
    deleteTransaction
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};