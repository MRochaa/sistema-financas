import React, { createContext, useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';
import { categoryService, transactionService } from '../services/api';

export interface Category {
  id: string;
  name: string;
  type: 'INCOME' | 'EXPENSE';
  color: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  description?: string;
  date: string;
  categoryId: string;
  userId: string;
  category?: Category;
  createdAt: string;
  updatedAt: string;
}

interface DataContextType {
  categories: Category[];
  transactions: Transaction[];
  loading: boolean;
  refreshCategories: () => Promise<void>;
  refreshTransactions: () => Promise<void>;
  addCategory: (category: Omit<Category, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'category'>) => Promise<void>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
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
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshCategories = async () => {
    if (!user) return;
    try {
      const data = await categoryService.getAll();
      console.log('Categories received:', data);
      // Filter out any invalid categories
      const validCategories = (data || []).filter(cat =>
        cat && cat.id && cat.type && ['INCOME', 'EXPENSE'].includes(cat.type)
      );
      setCategories(validCategories);
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      toast.error('Erro ao carregar categorias');
    }
  };

  const refreshTransactions = async () => {
    if (!user) return;
    try {
      const data = await transactionService.getAll();
      setTransactions(data);
    } catch (error: any) {
      console.error('Error fetching transactions:', error);
      toast.error('Erro ao carregar transações');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      if (user) {
        setLoading(true);
        await Promise.all([refreshCategories(), refreshTransactions()]);
        setLoading(false);
      } else {
        setCategories([]);
        setTransactions([]);
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  const addCategory = async (categoryData: Omit<Category, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newCategory = await categoryService.create(categoryData);
      console.log('New category created:', newCategory);

      // Validate the new category before adding
      if (newCategory && newCategory.id && newCategory.type) {
        setCategories([...categories, newCategory]);
        toast.success('Categoria criada com sucesso!');
      } else {
        console.error('Invalid category data:', newCategory);
        toast.error('Erro: Dados da categoria inválidos');
      }
    } catch (error: any) {
      console.error('Error creating category:', error);
      const message = error.response?.data?.error || 'Erro ao criar categoria';
      toast.error(message);
      throw error;
    }
  };

  const updateCategory = async (id: string, updates: Partial<Category>) => {
    try {
      const updatedCategory = await categoryService.update(id, updates);
      setCategories(categories.map(cat => cat.id === id ? updatedCategory : cat));
      toast.success('Categoria atualizada!');
    } catch (error: any) {
      const message = error.response?.data?.error || 'Erro ao atualizar categoria';
      toast.error(message);
      throw error;
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      await categoryService.delete(id);
      setCategories(categories.filter(cat => cat.id !== id));
      toast.success('Categoria excluída!');
    } catch (error: any) {
      const message = error.response?.data?.error || 'Erro ao excluir categoria';
      toast.error(message);
      throw error;
    }
  };

  const addTransaction = async (transactionData: Omit<Transaction, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'category'>) => {
    try {
      const newTransaction = await transactionService.create(transactionData);
      console.log('New transaction created:', newTransaction);
      await refreshTransactions();
      toast.success('Transação criada com sucesso!');
    } catch (error: any) {
      const message = error.response?.data?.error || 'Erro ao criar transação';
      toast.error(message);
      throw error;
    }
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    try {
      await transactionService.update(id, updates);
      await refreshTransactions();
      toast.success('Transação atualizada!');
    } catch (error: any) {
      const message = error.response?.data?.error || 'Erro ao atualizar transação';
      toast.error(message);
      throw error;
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      await transactionService.delete(id);
      setTransactions(transactions.filter(t => t.id !== id));
      toast.success('Transação excluída!');
    } catch (error: any) {
      const message = error.response?.data?.error || 'Erro ao excluir transação';
      toast.error(message);
      throw error;
    }
  };

  const value = {
    categories,
    transactions,
    loading,
    refreshCategories,
    refreshTransactions,
    addCategory,
    updateCategory,
    deleteCategory,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};
