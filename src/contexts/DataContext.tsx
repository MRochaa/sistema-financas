import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './AuthContext';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

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
  addCategory: (category: Omit<Category, 'id'>) => Category | null;
  updateCategory: (id: string, category: Omit<Category, 'id'>) => void;
  deleteCategory: (id: string) => void;
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

  useEffect(() => {
    if (user) {
      fetchCategories();
      fetchTransactions();
    }
  }, [user]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          category:categories(*)
        `)
        .order('date', { ascending: false });

      if (error) throw error;

      const formattedTransactions = (data || []).map((t: any) => ({
        id: t.id,
        type: t.type,
        amount: parseFloat(t.amount),
        description: t.description,
        date: t.date,
        category: t.category,
        user: { name: user?.name || 'Usuário', email: user?.email || '' }
      }));

      setTransactions(formattedTransactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const addCategory = (categoryData: Omit<Category, 'id'>) => {
    try {
      if (!categoryData.name || categoryData.name.length < 1 || categoryData.name.length > 100) {
        toast.error('Nome da categoria deve ter entre 1 e 100 caracteres');
        return null;
      }

      if (!['INCOME', 'EXPENSE'].includes(categoryData.type)) {
        toast.error('Tipo de categoria inválido');
        return null;
      }

      const sanitizedName = sanitizeInput(categoryData.name);

      const existingCategory = categories.find(cat =>
        cat.name.toLowerCase() === sanitizedName.toLowerCase()
      );

      if (existingCategory) {
        toast.error('Categoria já existe');
        return existingCategory;
      }

      const newCategory: Category = {
        id: crypto.randomUUID(),
        name: sanitizedName,
        type: categoryData.type,
        color: categoryData.color || '#6B7280'
      };

      setCategories(prev => [...prev, newCategory]);
      toast.success('Categoria criada com sucesso');
      return newCategory;
    } catch (error) {
      console.error('Error adding category:', error);
      toast.error('Erro ao criar categoria');
      return null;
    }
  };

  const updateCategory = (id: string, categoryData: Omit<Category, 'id'>) => {
    try {
      if (!categoryData.name || categoryData.name.length < 1 || categoryData.name.length > 100) {
        toast.error('Nome da categoria deve ter entre 1 e 100 caracteres');
        return;
      }

      const sanitizedName = sanitizeInput(categoryData.name);

      setCategories(prev => prev.map(cat =>
        cat.id === id ? {
          ...cat,
          name: sanitizedName,
          type: categoryData.type,
          color: categoryData.color || cat.color
        } : cat
      ));

      setTransactions(prev => prev.map(transaction =>
        transaction.category.id === id
          ? {
              ...transaction,
              category: {
                id,
                name: sanitizedName,
                type: categoryData.type,
                color: categoryData.color || transaction.category.color
              }
            }
          : transaction
      ));

      toast.success('Categoria atualizada com sucesso');
    } catch (error) {
      console.error('Error updating category:', error);
      toast.error('Erro ao atualizar categoria');
    }
  };

  const deleteCategory = (id: string) => {
    const hasTransactions = transactions.some(t => t.category.id === id);

    if (hasTransactions) {
      toast.error('Não é possível excluir uma categoria que possui transações associadas');
      return;
    }

    setCategories(prev => prev.filter(cat => cat.id !== id));
    toast.success('Categoria excluída com sucesso');
  };

  const addTransaction = async (transactionData: Omit<Transaction, 'id' | 'category' | 'user'> & { categoryId: string }) => {
    try {
      if (!validateAmount(transactionData.amount)) {
        toast.error('Valor deve ser um número positivo válido');
        return;
      }

      if (!validateDate(transactionData.date)) {
        toast.error('Data inválida');
        return;
      }

      if (!['INCOME', 'EXPENSE'].includes(transactionData.type)) {
        toast.error('Tipo de transação inválido');
        return;
      }

      const category = categories.find(cat => cat.id === transactionData.categoryId);
      if (!category) {
        toast.error('Categoria não encontrada');
        return;
      }

      const sanitizedDescription = transactionData.description ?
        sanitizeInput(transactionData.description).substring(0, 500) : undefined;

      const { data, error } = await supabase
        .from('transactions')
        .insert({
          user_id: user?.id,
          category_id: transactionData.categoryId,
          type: transactionData.type,
          amount: transactionData.amount,
          description: sanitizedDescription,
          date: transactionData.date
        })
        .select()
        .single();

      if (error) throw error;

      const newTransaction: Transaction = {
        id: data.id,
        type: transactionData.type,
        amount: transactionData.amount,
        description: sanitizedDescription,
        date: transactionData.date,
        category,
        user: { name: user?.name || 'Usuário', email: user?.email || 'user@email.com' }
      };

      setTransactions(prev => [newTransaction, ...prev]);
      toast.success('Transação criada com sucesso');
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast.error('Erro ao criar transação');
    }
  };

  const updateTransaction = async (id: string, transactionData: Omit<Transaction, 'id' | 'category' | 'user'> & { categoryId: string }) => {
    try {
      if (!validateAmount(transactionData.amount)) {
        toast.error('Valor deve ser um número positivo válido');
        return;
      }

      if (!validateDate(transactionData.date)) {
        toast.error('Data inválida');
        return;
      }

      const category = categories.find(cat => cat.id === transactionData.categoryId);
      if (!category) {
        toast.error('Categoria não encontrada');
        return;
      }

      const sanitizedDescription = transactionData.description ?
        sanitizeInput(transactionData.description).substring(0, 500) : undefined;

      const { error } = await supabase
        .from('transactions')
        .update({
          category_id: transactionData.categoryId,
          type: transactionData.type,
          amount: transactionData.amount,
          description: sanitizedDescription,
          date: transactionData.date
        })
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) throw error;

      setTransactions(prev => prev.map(transaction =>
        transaction.id === id
          ? {
              ...transaction,
              type: transactionData.type,
              amount: transactionData.amount,
              description: sanitizedDescription,
              date: transactionData.date,
              category
            }
          : transaction
      ));

      toast.success('Transação atualizada com sucesso');
    } catch (error) {
      console.error('Error updating transaction:', error);
      toast.error('Erro ao atualizar transação');
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) throw error;

      setTransactions(prev => prev.filter(t => t.id !== id));
      toast.success('Transação excluída com sucesso');
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast.error('Erro ao excluir transação');
    }
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