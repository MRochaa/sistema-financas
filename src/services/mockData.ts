import type {
  User,
  Category,
  Transaction,
  Wishlist,
  WishlistItem,
  ShoppingList,
  ShoppingListItem,
  SavingsAccount,
  Contribution,
  Simulation,
  DashboardSummary,
  DashboardStats,
} from '../types/index.ts';

export const mockUser: User = {
  id: '1',
  email: 'demo@example.com',
  name: 'Usuário Demo',
  createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  updatedAt: new Date().toISOString(),
};

export const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwibmFtZSI6IlVzdWFyaW8gRGVtbyIsImVtYWlsIjoiZGVtb0BleGFtcGxlLmNvbSIsImlhdCI6MTcwMzAwMDAwMH0.ZjMwZ2JkZWY0MjM4YzUwZTczOWQyZjg4YWI2ZjE5ZjM';

export const mockCategories: Category[] = [
  {
    id: 'cat-1',
    name: 'Salário',
    type: 'INCOME',
    color: '#10B981',
    userId: '1',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cat-2',
    name: 'Freelance',
    type: 'INCOME',
    color: '#059669',
    userId: '1',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cat-3',
    name: 'Investimentos',
    type: 'INCOME',
    color: '#047857',
    userId: '1',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cat-4',
    name: 'Outros Rendimentos',
    type: 'INCOME',
    color: '#065f46',
    userId: '1',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cat-5',
    name: 'Alimentação',
    type: 'EXPENSE',
    color: '#EF4444',
    userId: '1',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cat-6',
    name: 'Transporte',
    type: 'EXPENSE',
    color: '#DC2626',
    userId: '1',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cat-7',
    name: 'Moradia',
    type: 'EXPENSE',
    color: '#B91C1C',
    userId: '1',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cat-8',
    name: 'Saúde',
    type: 'EXPENSE',
    color: '#991B1B',
    userId: '1',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cat-9',
    name: 'Educação',
    type: 'EXPENSE',
    color: '#7F1D1D',
    userId: '1',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cat-10',
    name: 'Lazer',
    type: 'EXPENSE',
    color: '#F59E0B',
    userId: '1',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cat-11',
    name: 'Roupas',
    type: 'EXPENSE',
    color: '#D97706',
    userId: '1',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cat-12',
    name: 'Tecnologia',
    type: 'EXPENSE',
    color: '#B45309',
    userId: '1',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cat-13',
    name: 'Contas',
    type: 'EXPENSE',
    color: '#92400E',
    userId: '1',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cat-14',
    name: 'Outros Gastos',
    type: 'EXPENSE',
    color: '#78350F',
    userId: '1',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const descriptions = [
  'Compra no supermercado',
  'Almoço com colegas',
  'Conta de energia',
  'Gasolina',
  'Presente',
  'Assinatura digital',
  'Passagem aérea',
  'Consultório',
  'Academia',
  'Livro',
];

export function generateMockTransactions(): Transaction[] {
  const transactions: Transaction[] = [];
  const expenseCategories = mockCategories.filter(c => c.type === 'EXPENSE');
  const incomeCategories = mockCategories.filter(c => c.type === 'INCOME');

  for (let i = 0; i < 30; i++) {
    const isIncome = Math.random() > 0.7;
    const categories = isIncome ? incomeCategories : expenseCategories;
    const category = categories[Math.floor(Math.random() * categories.length)];
    const daysAgo = Math.floor(Math.random() * 30);

    transactions.push({
      id: `trans-${i + 1}`,
      type: isIncome ? 'INCOME' : 'EXPENSE',
      amount: Math.floor(Math.random() * (isIncome ? 5000 : 500)) + 50,
      description: descriptions[Math.floor(Math.random() * descriptions.length)],
      date: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
      categoryId: category.id,
      userId: '1',
      category,
      createdAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  return transactions;
}

export function generateMockWishlists(): Wishlist[] {
  return [
    {
      id: 'wish-1',
      name: 'Férias de Verão',
      description: 'Itens desejados para as férias',
      userId: '1',
      items: [
        {
          id: 'item-1',
          wishlistId: 'wish-1',
          name: 'Câmera Digital',
          price: 1200,
          approved: false,
          order: 1,
          link: 'https://example.com',
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'item-2',
          wishlistId: 'wish-1',
          name: 'Mochila de Viagem',
          price: 350,
          approved: true,
          order: 2,
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ],
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'wish-2',
      name: 'Casa e Decoração',
      description: 'Itens para melhorar a casa',
      userId: '1',
      items: [
        {
          id: 'item-3',
          wishlistId: 'wish-2',
          name: 'Sofá Cinza',
          price: 2500,
          approved: false,
          order: 1,
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ],
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];
}

export function generateMockShoppingLists(): ShoppingList[] {
  return [
    {
      id: 'shop-1',
      name: 'Mercado - Semana',
      userId: '1',
      items: [
        {
          id: 'shop-item-1',
          listId: 'shop-1',
          name: 'Pão',
          quantity: 2,
          unit: 'unidade',
          category: 'Padaria',
          checked: false,
          isCustom: false,
        },
        {
          id: 'shop-item-2',
          listId: 'shop-1',
          name: 'Leite',
          quantity: 1,
          unit: 'litro',
          category: 'Laticínios',
          checked: true,
          isCustom: false,
        },
        {
          id: 'shop-item-3',
          listId: 'shop-1',
          name: 'Alface',
          quantity: 1,
          unit: 'maço',
          category: 'Vegetais',
          checked: false,
          isCustom: true,
        },
      ],
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];
}

export function generateMockSavingsAccounts(): SavingsAccount[] {
  return [
    {
      id: 'save-1',
      name: 'Viagem Orlando',
      description: 'Poupança para viagem em família',
      targetAmount: 10000,
      currentAmount: 4500,
      interestRate: 0.5,
      interestType: 'MONTHLY',
      userId: '1',
      contributions: [
        {
          id: 'contrib-1',
          savingsId: 'save-1',
          amount: 1000,
          date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          contributedBy: 'Pai',
          createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'contrib-2',
          savingsId: 'save-1',
          amount: 1500,
          date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          contributedBy: 'Mãe',
          createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'contrib-3',
          savingsId: 'save-1',
          amount: 2000,
          date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          contributedBy: 'Usuário Demo',
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ],
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'save-2',
      name: 'Fundo de Emergência',
      description: 'Reserva para emergências',
      targetAmount: 5000,
      currentAmount: 3200,
      interestRate: 1.0,
      interestType: 'YEARLY',
      userId: '1',
      contributions: [
        {
          id: 'contrib-4',
          savingsId: 'save-2',
          amount: 3200,
          date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          contributedBy: 'Usuário Demo',
          createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ],
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];
}

export function generateMockSimulations(): Simulation[] {
  const categories = mockCategories.filter(c => c.type === 'EXPENSE');

  return [
    {
      id: 'sim-1',
      type: 'EXPENSE',
      amount: 300,
      description: 'Viagem planejada',
      date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      categoryId: categories[0].id,
      userId: '1',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'sim-2',
      type: 'INCOME',
      amount: 2000,
      description: 'Bônus esperado',
      date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      categoryId: mockCategories.find(c => c.name === 'Salário')!.id,
      userId: '1',
      createdAt: new Date().toISOString(),
    },
  ];
}

export function generateDashboardSummary(transactions: Transaction[]): DashboardSummary {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const income = transactions
    .filter(t => t.type === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0);

  const expense = transactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyTransactions = transactions.filter(t => {
    const tDate = new Date(t.date);
    return tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
  });

  const monthlyIncome = monthlyTransactions
    .filter(t => t.type === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyExpense = monthlyTransactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0);

  return {
    totalIncome: income,
    totalExpense: expense,
    balance: income - expense,
    monthlyIncome,
    monthlyExpense,
    monthlyBalance: monthlyIncome - monthlyExpense,
    savingsTotal: 7700,
  };
}

export function generateDashboardStats(transactions: Transaction[]): DashboardStats {
  const byCategory = mockCategories.map(category => {
    const categoryTransactions = transactions.filter(t => t.categoryId === category.id);
    const total = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
    return {
      categoryId: category.id,
      categoryName: category.name,
      total,
    };
  });

  const monthlyMap = new Map<string, { income: number; expense: number }>();

  transactions.forEach(t => {
    const date = new Date(t.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (!monthlyMap.has(monthKey)) {
      monthlyMap.set(monthKey, { income: 0, expense: 0 });
    }

    const month = monthlyMap.get(monthKey)!;
    if (t.type === 'INCOME') {
      month.income += t.amount;
    } else {
      month.expense += t.amount;
    }
  });

  const byMonth = Array.from(monthlyMap.entries())
    .sort()
    .map(([month, data]) => ({
      month,
      income: data.income,
      expense: data.expense,
    }));

  return { byCategory, byMonth };
}

export async function simulateNetworkDelay(ms: number = 500): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, Math.random() * ms));
}
