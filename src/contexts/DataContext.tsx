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

// Initial categories - basic set for new users
const initialCategories: Category[] = [
  // Income categories
  { id: '1', name: 'Salário', type: 'INCOME', color: '#10B981' },
  { id: '2', name: 'Freelance', type: 'INCOME', color: '#059669' },
  { id: '3', name: 'Investimentos', type: 'INCOME', color: '#047857' },
  { id: '4', name: 'Outros Rendimentos', type: 'INCOME', color: '#065f46' },
  
  // Expense categories
  { id: '5', name: 'Alimentação', type: 'EXPENSE', color: '#EF4444' },
  { id: '6', name: 'Transporte', type: 'EXPENSE', color: '#DC2626' },
  { id: '7', name: 'Moradia', type: 'EXPENSE', color: '#B91C1C' },
  { id: '8', name: 'Saúde', type: 'EXPENSE', color: '#991B1B' },
  { id: '9', name: 'Educação', type: 'EXPENSE', color: '#7F1D1D' },
  { id: '10', name: 'Lazer', type: 'EXPENSE', color: '#F59E0B' },
  { id: '11', name: 'Roupas', type: 'EXPENSE', color: '#D97706' },
  { id: '12', name: 'Tecnologia', type: 'EXPENSE', color: '#B45309' },
  { id: '13', name: 'Contas', type: 'EXPENSE', color: '#92400E' },
  { id: '14', name: 'Outros Gastos', type: 'EXPENSE', color: '#78350F' }
];

// No initial transactions - start clean
const initialTransactions: Transaction[] = [];

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const refreshCategories = async () => {
    if (!user) return;
    try {
      const data = await categoryService.getAll();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const refreshTransactions = async () => {
    if (!user) return;
    try {
      const data = await transactionService.getAll();
      setTransactions(data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
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

      // Dispatch event for savings sync
      window.dispatchEvent(new CustomEvent('transactionCreated', { detail: newTransaction }));

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

      // Dispatch event for savings sync
      window.dispatchEvent(new CustomEvent('transactionDeleted', { detail: { id } }));

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
