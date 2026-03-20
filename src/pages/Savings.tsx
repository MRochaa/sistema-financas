import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, PiggyBank, TrendingUp, Users, Calculator, Target, Percent } from 'lucide-react';
import { useData } from '../contexts/DataContext';

interface SavingsAccount {
  id: string;
  name: string;
  description?: string;
  targetAmount?: number;
  interestRate: number; // percentage
  interestType: 'MONTHLY' | 'YEARLY';
  createdBy: string;
  createdAt: string;
  categoryId?: string; // Will be created automatically
}

interface SavingsContribution {
  id: string;
  savingsId: string;
  amount: number;
  contributedBy: string;
  date: string;
  transactionId?: string; // Link to original transaction
}

const Savings: React.FC = () => {
  const { categories, transactions, addCategory, deleteCategory, user } = useData();
  const [savingsAccounts, setSavingsAccounts] = useState<SavingsAccount[]>(() => {
    const saved = localStorage.getItem('savingsAccounts');
    return saved ? JSON.parse(saved) : [];
  });
  const [contributions, setContributions] = useState<SavingsContribution[]>(() => {
    const saved = localStorage.getItem('contributions');
    return saved ? JSON.parse(saved) : [];
  });
  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<SavingsAccount | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  
  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('savingsAccounts', JSON.stringify(savingsAccounts));
  }, [savingsAccounts]);

  useEffect(() => {
    localStorage.setItem('contributions', JSON.stringify(contributions));
  }, [contributions]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    targetAmount: '',
    interestRate: '',
    interestType: 'MONTHLY' as 'MONTHLY' | 'YEARLY'
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Monitor transactions to automatically add contributions
  useEffect(() => {
    const savingsCategories = categories.filter(cat => 
      cat.name.startsWith('Poupança:') && cat.type === 'EXPENSE'
    );

    // Clear existing auto-generated contributions to avoid duplicates
    const manualContributions = contributions.filter(c => !c.transactionId);
    const newContributions: SavingsContribution[] = [...manualContributions];

    savingsCategories.forEach(category => {
      const savingsAccount = savingsAccounts.find(acc => acc.categoryId === category.id);
      if (!savingsAccount) return;

      const relatedTransactions = transactions.filter(t => 
        t.category.id === category.id && t.type === 'EXPENSE'
      );

      relatedTransactions.forEach(transaction => {
        newContributions.push({
          id: `contrib-${transaction.id}`,
          savingsId: savingsAccount.id,
          amount: transaction.amount,
          contributedBy: transaction.user.name,
          date: transaction.date,
          transactionId: transaction.id
        });
      });
    });

    setContributions(newContributions);
  }, [transactions, categories, savingsAccounts]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      targetAmount: '',
      interestRate: '',
      interestType: 'MONTHLY'
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create corresponding category
    const categoryName = `Poupança: ${formData.name}`;
    const categoryData = {
      name: categoryName,
      type: 'EXPENSE' as const,
      color: '#10B981' // Green color for savings
    };

    // Create category and get the result
    const createdCategory = addCategory(categoryData);
    
    const newAccount: SavingsAccount = {
      id: editingAccount?.id || Date.now().toString(),
      name: formData.name,
      description: formData.description || undefined,
      targetAmount: formData.targetAmount ? parseFloat(formData.targetAmount) : undefined,
      interestRate: parseFloat(formData.interestRate),
      interestType: formData.interestType,
      createdBy: user?.name || 'Usuário',
      createdAt: editingAccount?.createdAt || new Date().toISOString(),
      categoryId: createdCategory?.id
    };
    
    if (editingAccount) {
      setSavingsAccounts(prev => prev.map(acc => 
        acc.id === editingAccount.id ? newAccount : acc
      ));
    } else {
      setSavingsAccounts(prev => [...prev, newAccount]);
    }
    
    setShowModal(false);
    setEditingAccount(null);
    resetForm();
  };

  const handleEdit = (account: SavingsAccount) => {
    setEditingAccount(account);
    setFormData({
      name: account.name,
      description: account.description || '',
      targetAmount: account.targetAmount?.toString() || '',
      interestRate: account.interestRate.toString(),
      interestType: account.interestType
    });
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta poupança? Isso também removerá a categoria associada.')) {
      // Find the account to get category info
      const account = savingsAccounts.find(acc => acc.id === id);
      
      // Remove the account
      setSavingsAccounts(prev => prev.filter(acc => acc.id !== id));
      
      // Remove associated contributions
      setContributions(prev => prev.filter(contrib => contrib.savingsId !== id));
      
      // Remove associated category if it exists
      if (account && account.categoryId) {
        deleteCategory(account.categoryId);
      }
    }
  };

  const calculateAccountData = (accountId: string) => {
    const account = savingsAccounts.find(acc => acc.id === accountId);
    const accountContributions = contributions.filter(c => c.savingsId === accountId);
    
    const totalInvested = accountContributions.reduce((sum, contrib) => sum + contrib.amount, 0);
    
    const contributionsByUser = accountContributions.reduce((acc, contrib) => {
      acc[contrib.contributedBy] = (acc[contrib.contributedBy] || 0) + contrib.amount;
      return acc;
    }, {} as Record<string, number>);

    let totalEarnings = 0;
    
    if (account && accountContributions.length > 0) {
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      
      accountContributions.forEach(contrib => {
        const contributionDate = new Date(contrib.date);
        const daysElapsed = Math.floor((today.getTime() - contributionDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysElapsed >= 1) {
          let dailyRate: number;
          
          if (account.interestType === 'MONTHLY') {
            // Get days in the month of contribution
            const contributionMonth = contributionDate.getMonth();
            const contributionYear = contributionDate.getFullYear();
            const daysInMonth = new Date(contributionYear, contributionMonth + 1, 0).getDate();
            dailyRate = (account.interestRate / 100) / daysInMonth;
          } else {
            // Yearly interest
            dailyRate = (account.interestRate / 100) / 365;
          }
          
          // Calculate earnings: valor × (taxa_diária × dias_passados)
          const earnings = contrib.amount * (dailyRate * daysElapsed);
          totalEarnings += earnings;
        }
      });
    }

    const projectedValue = totalInvested + totalEarnings;

    return {
      totalInvested,
      projectedValue,
      earnings: totalEarnings,
      contributionsByUser,
      contributionsCount: accountContributions.length
    };
  };

  const getTotalSavings = () => {
    return savingsAccounts.reduce((total, account) => {
      const data = calculateAccountData(account.id);
      return total + data.projectedValue;
    }, 0);
  };

  const getTotalInvested = () => {
    return savingsAccounts.reduce((total, account) => {
      const data = calculateAccountData(account.id);
      return total + data.totalInvested;
    }, 0);
  };

  const getTotalEarnings = () => {
    return getTotalSavings() - getTotalInvested();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <PiggyBank className="h-6 w-6 text-gray-400" />
          <span className="text-lg text-gray-600">Gerencie suas poupanças e acompanhe o crescimento dos investimentos</span>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Poupança
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <PiggyBank className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Poupado
                  </dt>
                  <dd className="text-lg font-medium text-green-600">
                    {formatCurrency(getTotalSavings())}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Target className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Investido
                  </dt>
                  <dd className="text-lg font-medium text-blue-600">
                    {formatCurrency(getTotalInvested())}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-6 w-6 text-purple-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Rendimentos
                  </dt>
                  <dd className="text-lg font-medium text-purple-600">
                    {formatCurrency(getTotalEarnings())}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calculator className="h-6 w-6 text-orange-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Poupanças Ativas
                  </dt>
                  <dd className="text-lg font-medium text-orange-600">
                    {savingsAccounts.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Savings Accounts */}
      <div className="space-y-4">
        {savingsAccounts.map((account) => {
          const accountData = calculateAccountData(account.id);
          const progressPercentage = account.targetAmount ? 
            Math.min((accountData.projectedValue / account.targetAmount) * 100, 100) : 0;
          
          return (
            <div key={account.id} className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <PiggyBank className="h-6 w-6 text-green-500" />
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{account.name}</h3>
                        {account.description && (
                          <p className="text-sm text-gray-500">{account.description}</p>
                        )}
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-xs text-gray-400">
                            Criado por {account.createdBy}
                          </span>
                          <span className="text-xs text-gray-400">
                            {accountData.contributionsCount} contribuições
                          </span>
                          <span className="text-xs text-green-600 font-medium">
                            {account.interestRate}% {account.interestType === 'MONTHLY' ? 'a.m.' : 'a.a.'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEdit(account)}
                      className="text-blue-600 hover:text-blue-800 transition-colors"
                      title="Editar poupança"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(account.id)}
                      className="text-red-600 hover:text-red-800 transition-colors"
                      title="Excluir poupança"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Financial Summary */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Resumo Financeiro</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Valor Investido:</span>
                        <span className="font-medium text-blue-600">
                          {formatCurrency(accountData.totalInvested)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Rendimentos:</span>
                        <span className="font-medium text-purple-600">
                          {formatCurrency(accountData.earnings)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center border-t pt-2">
                        <span className="text-sm font-medium text-gray-900">Total Atual:</span>
                        <span className="font-bold text-green-600">
                          {formatCurrency(accountData.projectedValue)}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {account.targetAmount && (
                      <div className="mt-4">
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>Meta: {formatCurrency(account.targetAmount)}</span>
                          <span>{progressPercentage.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Contributions by User */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900 flex items-center">
                      <Users className="h-4 w-4 mr-2" />
                      Contribuições por Usuário
                    </h4>
                    {Object.keys(accountData.contributionsByUser).length > 0 ? (
                      <div className="space-y-2">
                        {Object.entries(accountData.contributionsByUser).map(([userName, amount]) => {
                          const percentage = accountData.totalInvested > 0 ? 
                            (amount / accountData.totalInvested) * 100 : 0;
                          
                          return (
                            <div key={userName} className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                <span className="text-sm text-gray-700">{userName}</span>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-medium text-gray-900">
                                  {formatCurrency(amount)}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {percentage.toFixed(1)}%
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">Nenhuma contribuição ainda</p>
                    )}
                  </div>

                  {/* Growth Simulation */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900 flex items-center">
                      <Percent className="h-4 w-4 mr-2" />
                      Simulação de Crescimento
                    </h4>
                    <div className="space-y-2">
                      {[6, 12, 24].map(months => {
                        // Calculate future earnings based on current contributions
                        let futureEarnings = 0;
                        const futureDays = months * 30; // Approximate days
                        
                        const accountContributions = contributions.filter(c => c.savingsId === account.id);
                        accountContributions.forEach(contrib => {
                          const contributionDate = new Date(contrib.date);
                          const today = new Date();
                          const currentDaysElapsed = Math.floor((today.getTime() - contributionDate.getTime()) / (1000 * 60 * 60 * 24));
                          const totalFutureDays = Math.max(1, currentDaysElapsed + futureDays);
                          
                          let dailyRate: number;
                          if (account.interestType === 'MONTHLY') {
                            const contributionMonth = contributionDate.getMonth();
                            const contributionYear = contributionDate.getFullYear();
                            const daysInMonth = new Date(contributionYear, contributionMonth + 1, 0).getDate();
                            dailyRate = (account.interestRate / 100) / daysInMonth;
                          } else {
                            dailyRate = (account.interestRate / 100) / 365;
                          }
                          
                          futureEarnings += contrib.amount * (dailyRate * totalFutureDays);
                        });
                        
                        const futureValue = accountData.totalInvested + futureEarnings;
                        
                        return (
                          <div key={months} className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">
                              {months} {months === 1 ? 'mês' : 'meses'}:
                            </span>
                            <div className="text-right">
                              <div className="font-medium text-gray-900">
                                {formatCurrency(futureValue)}
                              </div>
                              <div className="text-xs text-green-600">
                                +{formatCurrency(futureEarnings - accountData.earnings)}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {savingsAccounts.length === 0 && (
          <div className="text-center py-12">
            <PiggyBank className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">Nenhuma poupança criada</h3>
            <p className="mt-1 text-sm text-gray-500">
              Crie sua primeira poupança para começar a economizar e acompanhar o crescimento.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Criar primeira poupança
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingAccount ? 'Editar Poupança' : 'Nova Poupança'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome da Poupança
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Reserva de Emergência, Viagem..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição (opcional)
                  </label>
                  <textarea
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descreva o objetivo desta poupança..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Meta de Valor (opcional)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    value={formData.targetAmount}
                    onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                    placeholder="Ex: 10000.00"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Taxa de Juros (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      required
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      value={formData.interestRate}
                      onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
                      placeholder="Ex: 1.5"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Período
                    </label>
                    <select
                      required
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      value={formData.interestType}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        interestType: e.target.value as 'MONTHLY' | 'YEARLY'
                      })}
                    >
                      <option value="MONTHLY">Mensal</option>
                      <option value="YEARLY">Anual</option>
                    </select>
                  </div>
                </div>

                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-800">
                    💡 <strong>Dica:</strong> Após criar a poupança, uma nova categoria será adicionada automaticamente. 
                    Use essa categoria ao lançar despesas para que sejam contabilizadas como contribuições para esta poupança.
                  </p>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingAccount(null);
                      resetForm();
                    }}
                    className="px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors"
                  >
                    {editingAccount ? 'Atualizar' : 'Criar Poupança'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Savings;
