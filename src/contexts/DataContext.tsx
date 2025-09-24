import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

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

interface User {
  id: string;
  email: string;
  name: string;
}

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
  user: User | null;
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

// Initial mock data
const initialCategories: Category[] = [
  { id: '1', name: 'Alimentação', type: 'EXPENSE', color: '#EF4444' },
  { id: '2', name: 'Salário', type: 'INCOME', color: '#10B981' },
  { id: '3', name: 'Transporte', type: 'EXPENSE', color: '#DC2626' },
  { id: '4', name: 'Lazer', type: 'EXPENSE', color: '#F59E0B' },
  { id: '5', name: 'Freelance', type: 'INCOME', color: '#059669' },
  { id: '6', name: 'Moradia', type: 'EXPENSE', color: '#B91C1C' },
  { id: '7', name: 'Investimentos', type: 'INCOME', color: '#047857' },
  { id: '8', name: 'Saúde', type: 'EXPENSE', color: '#991B1B' },
  { id: '9', name: 'Educação', type: 'EXPENSE', color: '#7F1D1D' },
  { id: '10', name: 'Tecnologia', type: 'EXPENSE', color: '#B45309' },
];

const initialTransactions: Transaction[] = [
  {
    id: '1',
    type: 'EXPENSE',
    amount: 150.50,
    description: 'Supermercado',
    date: '2024-01-15T10:00:00Z',
    category: initialCategories[0], // Alimentação
    user: { name: 'João', email: 'joao@email.com' }
  },
  {
    id: '2',
    type: 'INCOME',
    amount: 4250.00,
    description: 'Salário Janeiro',
    date: '2024-01-01T09:00:00Z',
    category: initialCategories[1], // Salário
    user: { name: 'Maria', email: 'maria@email.com' }
  },
  {
    id: '3',
    type: 'EXPENSE',
    amount: 80.00,
    description: 'Combustível',
    date: '2024-01-14T16:30:00Z',
    category: initialCategories[2], // Transporte
    user: { name: 'João', email: 'joao@email.com' }
  },
  {
    id: '4',
    type: 'EXPENSE',
    amount: 1200.00,
    description: 'Aluguel Janeiro',
    date: '2024-01-01T08:00:00Z',
    category: initialCategories[5], // Moradia
    user: { name: 'Maria', email: 'maria@email.com' }
  },
  {
    id: '5',
    type: 'INCOME',
    amount: 800.00,
    description: 'Projeto Freelance',
    date: '2024-01-10T14:00:00Z',
    category: initialCategories[4], // Freelance
    user: { name: 'João', email: 'joao@email.com' }
  },
  {
    id: '6',
    type: 'EXPENSE',
    amount: 200.00,
    description: 'Cinema e jantar',
    date: '2024-01-12T19:00:00Z',
    category: initialCategories[3], // Lazer
    user: { name: 'Maria', email: 'maria@email.com' }
  }
];

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('categories');
    return saved ? JSON.parse(saved) : initialCategories;
  });
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('transactions');
    return saved ? JSON.parse(saved) : initialTransactions;
  });
  const [loading] = useState(false);
  const { user } = useAuth();

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('transactions', JSON.stringify(transactions));
  }, [transactions]);

  // Update user info in transactions when user changes
  useEffect(() => {
    if (user) {
      setTransactions(prev => prev.map(transaction => ({
        ...transaction,
        user: { name: user.name, email: user.email }
      })));
    }
  }, [user]);

  // Category methods
  const addCategory = (categoryData: Omit<Category, 'id'>) => {
    try {
      // Input validation
      if (!categoryData.name || categoryData.name.length < 1 || categoryData.name.length > 100) {
        toast.error('Nome da categoria deve ter entre 1 e 100 caracteres');
        return null;
      }
      
      if (!['INCOME', 'EXPENSE'].includes(categoryData.type)) {
        toast.error('Tipo de categoria inválido');
        return null;
      }

      const sanitizedName = sanitizeInput(categoryData.name);
      
    // Check if category already exists
      const existingCategory = categories.find(cat => 
        cat.name.toLowerCase() === sanitizedName.toLowerCase()
      );
    if (existingCategory) {
      toast.error('Categoria já existe');
      return existingCategory;
    }

    const newCategory: Category = {
      id: Date.now().toString(),
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
      // Input validation
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
    
    // Update transactions that use this category
    setTransactions(prev => prev.map(transaction => 
      transaction.category.id === id 
          ? { ...transaction, category: { id, name: sanitizedName, type: categoryData.type, color: categoryData.color || transaction.category.color } }
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

  // Transaction methods
  const addTransaction = (transactionData: Omit<Transaction, 'id' | 'category' | 'user'> & { categoryId: string }) => {
    try {
      // Input validation
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

    const newTransaction: Transaction = {
      id: Date.now().toString(),
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

  const updateTransaction = (id: string, transactionData: Omit<Transaction, 'id' | 'category' | 'user'> & { categoryId: string }) => {
    try {
      // Input validation
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

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    toast.success('Transação excluída com sucesso');
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