import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Calculator, Calendar, Repeat, RotateCcw, TrendingUp, TrendingDown } from 'lucide-react';
import { format, addMonths, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useData } from '../contexts/DataContext';

interface SimulatedTransaction {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  description: string;
  categoryId: string;
  startDate: string;
  recurrenceType: 'SINGLE' | 'RECURRING' | 'INSTALLMENTS';
  recurrenceInterval?: 'MONTHLY' | 'WEEKLY' | 'YEARLY';
  endDate?: string;
  installments?: number;
  currentInstallment?: number;
  isActive: boolean;
  createdBy: string;
}

interface GeneratedTransaction {
  id: string;
  originalId: string;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  description: string;
  categoryId: string;
  date: string;
  installmentInfo?: string;
  isSimulated: boolean;
}

const Simulation: React.FC = () => {
  const { categories, transactions, user } = useData();
  const [simulatedTransactions, setSimulatedTransactions] = useState<SimulatedTransaction[]>(() => {
    const saved = localStorage.getItem('simulatedTransactions');
    return saved ? JSON.parse(saved) : [];
  });
  const [allTransactions, setAllTransactions] = useState<GeneratedTransaction[]>([]);
  const [simulationPeriod, setSimulationPeriod] = useState(12); // meses
  
  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('simulatedTransactions', JSON.stringify(simulatedTransactions));
  }, [simulatedTransactions]);

  // Quick form state
  const [quickForm, setQuickForm] = useState({
    type: 'EXPENSE' as 'INCOME' | 'EXPENSE',
    amount: '',
    description: '',
    categoryId: '',
    startDate: new Date().toISOString().split('T')[0],
    recurrenceType: 'SINGLE' as 'SINGLE' | 'RECURRING' | 'INSTALLMENTS',
    recurrenceInterval: 'MONTHLY' as 'MONTHLY' | 'WEEKLY' | 'YEARLY',
    endDate: '',
    installments: ''
  });
  
  const [formData, setFormData] = useState({
    type: 'EXPENSE' as 'INCOME' | 'EXPENSE',
    amount: '',
    description: '',
    categoryId: '',
    startDate: new Date().toISOString().split('T')[0],
    recurrenceType: 'SINGLE' as 'SINGLE' | 'RECURRING' | 'INSTALLMENTS',
    recurrenceInterval: 'MONTHLY' as 'MONTHLY' | 'WEEKLY' | 'YEARLY',
    endDate: '',
    installments: ''
  });

  const [showModal, setShowModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<SimulatedTransaction | null>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Generate all transactions (real + simulated) whenever data changes
  useEffect(() => {
    generateAllTransactions();
  }, [transactions, simulatedTransactions, simulationPeriod]);

  const generateAllTransactions = () => {
    const endDate = addMonths(new Date(), simulationPeriod);
    const generated: GeneratedTransaction[] = [];

    // Add real transactions (copy them)
    transactions.forEach(transaction => {
      const transactionDate = new Date(transaction.date);
      if (transactionDate <= endDate) {
        generated.push({
          id: `real-${transaction.id}`,
          originalId: transaction.id,
          type: transaction.type,
          amount: transaction.amount,
          description: transaction.description || 'Sem descrição',
          categoryId: transaction.category?.id || '',
          date: transaction.date,
          isSimulated: false
        });
      }
    });

    // Add simulated transactions
    simulatedTransactions.forEach(simTransaction => {
      if (!simTransaction.isActive) return;

      const startDate = new Date(simTransaction.startDate);
      let currentDate = new Date(startDate);
      let installmentCount = 1;

      while (currentDate <= endDate) {
        // Check if we should stop based on end date or installments
        if (simTransaction.endDate && currentDate > new Date(simTransaction.endDate)) break;
        if (simTransaction.recurrenceType === 'INSTALLMENTS' && 
            simTransaction.installments && 
            installmentCount > simTransaction.installments) break;

        let description = simTransaction.description;
        if (simTransaction.recurrenceType === 'INSTALLMENTS' && simTransaction.installments) {
          description += ` (${installmentCount}/${simTransaction.installments})`;
        }

        generated.push({
          id: `sim-${simTransaction.id}-${currentDate.getTime()}`,
          originalId: simTransaction.id,
          type: simTransaction.type,
          amount: simTransaction.amount,
          description,
          categoryId: simTransaction.categoryId,
          date: currentDate.toISOString(),
          installmentInfo: simTransaction.recurrenceType === 'INSTALLMENTS' 
            ? `${installmentCount}/${simTransaction.installments}` 
            : undefined,
          isSimulated: true
        });

        // Calculate next date
        if (simTransaction.recurrenceType === 'SINGLE') break;
        
        switch (simTransaction.recurrenceInterval) {
          case 'WEEKLY':
            currentDate = addDays(currentDate, 7);
            break;
          case 'MONTHLY':
            currentDate = addMonths(currentDate, 1);
            break;
          case 'YEARLY':
            currentDate = addMonths(currentDate, 12);
            break;
        }

        installmentCount++;
      }
    });

    // Sort by date
    generated.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    setAllTransactions(generated);
  };

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newTransaction: SimulatedTransaction = {
      id: Date.now().toString(),
      type: quickForm.type,
      amount: parseFloat(quickForm.amount),
      description: quickForm.description,
      categoryId: quickForm.categoryId,
      startDate: quickForm.startDate,
      recurrenceType: quickForm.recurrenceType,
      recurrenceInterval: quickForm.recurrenceType !== 'SINGLE' ? quickForm.recurrenceInterval : undefined,
      endDate: quickForm.endDate || undefined,
      installments: quickForm.recurrenceType === 'INSTALLMENTS' ? parseInt(quickForm.installments) : undefined,
      isActive: true,
      createdBy: user?.name || 'Usuário'
    };

    setSimulatedTransactions(prev => [...prev, newTransaction]);
    
    // Reset quick form
    setQuickForm({
      type: 'EXPENSE',
      amount: '',
      description: '',
      categoryId: '',
      startDate: new Date().toISOString().split('T')[0],
      recurrenceType: 'SINGLE',
      recurrenceInterval: 'MONTHLY',
      endDate: '',
      installments: ''
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newTransaction: SimulatedTransaction = {
      id: Date.now().toString(),
      type: formData.type,
      amount: parseFloat(formData.amount),
      description: formData.description,
      categoryId: formData.categoryId,
      startDate: formData.startDate,
      recurrenceType: formData.recurrenceType,
      recurrenceInterval: formData.recurrenceType !== 'SINGLE' ? formData.recurrenceInterval : undefined,
      endDate: formData.endDate || undefined,
      installments: formData.recurrenceType === 'INSTALLMENTS' ? parseInt(formData.installments) : undefined,
      isActive: true,
      createdBy: user?.name || 'Usuário'
    };

    if (editingTransaction) {
      setSimulatedTransactions(prev => prev.map(t => 
        t.id === editingTransaction.id ? { ...newTransaction, id: editingTransaction.id } : t
      ));
    } else {
      setSimulatedTransactions(prev => [...prev, newTransaction]);
    }
    
    setShowModal(false);
    setEditingTransaction(null);
    resetForm();
  };

  const handleEdit = (transaction: SimulatedTransaction) => {
    setEditingTransaction(transaction);
    setFormData({
      type: transaction.type,
      amount: transaction.amount.toString(),
      description: transaction.description,
      categoryId: transaction.categoryId,
      startDate: transaction.startDate,
      recurrenceType: transaction.recurrenceType,
      recurrenceInterval: transaction.recurrenceInterval || 'MONTHLY',
      endDate: transaction.endDate || '',
      installments: transaction.installments?.toString() || ''
    });
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta simulação?')) {
      setSimulatedTransactions(prev => prev.filter(t => t.id !== id));
    }
  };

  const toggleActive = (id: string) => {
    setSimulatedTransactions(prev => prev.map(t => 
      t.id === id ? { ...t, isActive: !t.isActive } : t
    ));
  };

  const resetForm = () => {
    setFormData({
      type: 'EXPENSE',
      amount: '',
      description: '',
      categoryId: '',
      startDate: new Date().toISOString().split('T')[0],
      recurrenceType: 'SINGLE',
      recurrenceInterval: 'MONTHLY',
      endDate: '',
      installments: ''
    });
  };

  const clearSimulation = () => {
    if (window.confirm('Tem certeza que deseja limpar todas as simulações?')) {
      setSimulatedTransactions([]);
    }
  };

  const getRecurrenceLabel = (transaction: SimulatedTransaction) => {
    switch (transaction.recurrenceType) {
      case 'SINGLE':
        return 'Único';
      case 'RECURRING':
        const intervalLabel = {
          'WEEKLY': 'Semanal',
          'MONTHLY': 'Mensal',
          'YEARLY': 'Anual'
        }[transaction.recurrenceInterval || 'MONTHLY'];
        return `${intervalLabel}${transaction.endDate ? ` até ${format(new Date(transaction.endDate), 'dd/MM/yyyy')}` : ''}`;
      case 'INSTALLMENTS':
        return `${transaction.installments}x ${transaction.recurrenceInterval === 'MONTHLY' ? 'Mensal' : 'Semanal'}`;
      default:
        return 'Único';
    }
  };

  const calculateTotals = () => {
    const totalIncome = allTransactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = allTransactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0);

    const simulatedIncome = allTransactions
      .filter(t => t.type === 'INCOME' && t.isSimulated)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const simulatedExpenses = allTransactions
      .filter(t => t.type === 'EXPENSE' && t.isSimulated)
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      totalIncome,
      totalExpenses,
      balance: totalIncome - totalExpenses,
      simulatedIncome,
      simulatedExpenses,
      simulatedBalance: simulatedIncome - simulatedExpenses
    };
  };

  const totals = calculateTotals();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Calculator className="h-6 w-6 text-gray-400" />
          <span className="text-lg text-gray-600">Simule gastos e receitas futuras baseado nos dados reais</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Simulação Avançada
          </button>
          <button
            onClick={clearSimulation}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Limpar Simulações
          </button>
        </div>
      </div>

      {/* Quick Add Form */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Lançamento Rápido de Simulação</h3>
        <form onSubmit={handleQuickSubmit} className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div>
            <select
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              value={quickForm.type}
              onChange={(e) => setQuickForm({ 
                ...quickForm, 
                type: e.target.value as 'INCOME' | 'EXPENSE',
                categoryId: ''
              })}
            >
              <option value="EXPENSE">Despesa</option>
              <option value="INCOME">Receita</option>
            </select>
          </div>

          <div>
            <select
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              value={quickForm.categoryId}
              onChange={(e) => setQuickForm({ ...quickForm, categoryId: e.target.value })}
            >
              <option value="">Categoria</option>
              {categories
                .filter(cat => cat.type === quickForm.type)
                .map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <input
              type="text"
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              value={quickForm.description}
              onChange={(e) => setQuickForm({ ...quickForm, description: e.target.value })}
              placeholder="Descrição"
            />
          </div>

          <div>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              value={quickForm.amount}
              onChange={(e) => setQuickForm({ ...quickForm, amount: e.target.value })}
              placeholder="Valor (R$)"
            />
          </div>

          <div>
            <select
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              value={quickForm.recurrenceType}
              onChange={(e) => setQuickForm({ 
                ...quickForm, 
                recurrenceType: e.target.value as 'SINGLE' | 'RECURRING' | 'INSTALLMENTS'
              })}
            >
              <option value="SINGLE">Único</option>
              <option value="RECURRING">Recorrente</option>
              <option value="INSTALLMENTS">Parcelado</option>
            </select>
          </div>

          <div>
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </button>
          </div>
        </form>
      </div>

      {/* Simulation Controls */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Período de simulação:</label>
              <select
                value={simulationPeriod}
                onChange={(e) => setSimulationPeriod(parseInt(e.target.value))}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm"
              >
                <option value={6}>6 meses</option>
                <option value={12}>12 meses</option>
                <option value={24}>24 meses</option>
                <option value={36}>36 meses</option>
              </select>
            </div>
          </div>
          
          <div className="text-sm text-gray-600">
            {allTransactions.length} transações totais ({allTransactions.filter(t => t.isSimulated).length} simuladas)
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Receitas (Real + Simulado)
                  </dt>
                  <dd className="text-lg font-medium text-green-600">
                    {formatCurrency(totals.totalIncome)}
                  </dd>
                  <dd className="text-xs text-gray-400">
                    Simulado: {formatCurrency(totals.simulatedIncome)}
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
                <TrendingDown className="h-6 w-6 text-red-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Despesas (Real + Simulado)
                  </dt>
                  <dd className="text-lg font-medium text-red-600">
                    {formatCurrency(totals.totalExpenses)}
                  </dd>
                  <dd className="text-xs text-gray-400">
                    Simulado: {formatCurrency(totals.simulatedExpenses)}
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
                <Calculator className={`h-6 w-6 ${totals.balance >= 0 ? 'text-green-400' : 'text-red-400'}`} />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Saldo Total Projetado
                  </dt>
                  <dd className={`text-lg font-medium ${totals.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(totals.balance)}
                  </dd>
                  <dd className="text-xs text-gray-400">
                    Impacto simulação: {formatCurrency(totals.simulatedBalance)}
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
                <Calendar className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Simulações Ativas
                  </dt>
                  <dd className="text-lg font-medium text-blue-600">
                    {simulatedTransactions.filter(t => t.isActive).length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Simulated Transactions */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Simulações Configuradas ({simulatedTransactions.length})
            </h3>
            
            {simulatedTransactions.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {simulatedTransactions.map((transaction) => {
                  const category = categories.find(c => c.id === transaction.categoryId);
                  return (
                    <div key={transaction.id} className={`p-4 border rounded-lg ${!transaction.isActive ? 'opacity-50 bg-gray-50' : 'bg-white border-gray-200'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => toggleActive(transaction.id)}
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              transaction.isActive 
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {transaction.isActive ? 'Ativo' : 'Inativo'}
                          </button>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            transaction.type === 'INCOME' 
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {transaction.type === 'INCOME' ? 'Receita' : 'Despesa'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEdit(transaction)}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(transaction.id)}
                            className="text-red-600 hover:text-red-800 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900">{transaction.description}</span>
                          <span className={`font-medium ${transaction.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(transaction.amount)}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <div
                              className="w-3 h-3 rounded-full mr-1"
                              style={{ backgroundColor: category?.color }}
                            ></div>
                            {category?.name}
                          </div>
                          <div className="flex items-center">
                            <Repeat className="h-3 w-3 mr-1" />
                            {getRecurrenceLabel(transaction)}
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {format(new Date(transaction.startDate), 'dd/MM/yyyy')}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calculator className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma simulação criada</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Use o formulário rápido acima para começar.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* All Transactions (Real + Simulated) */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Todas as Transações ({allTransactions.length})
            </h3>
            
            {allTransactions.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {allTransactions.slice(0, 50).map((transaction) => {
                  const category = categories.find(c => c.id === transaction.categoryId);
                  return (
                    <div key={transaction.id} className={`flex items-center justify-between p-3 rounded-lg ${
                      transaction.isSimulated ? 'bg-purple-50 border border-purple-200' : 'bg-gray-50'
                    }`}>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-900">{transaction.description}</span>
                            {transaction.isSimulated && (
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                                Simulado
                              </span>
                            )}
                          </div>
                          <span className={`text-sm font-medium ${transaction.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(transaction.amount)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-3 mt-1">
                          <div className="flex items-center text-xs text-gray-500">
                            <div
                              className="w-2 h-2 rounded-full mr-1"
                              style={{ backgroundColor: category?.color }}
                            ></div>
                            {category?.name}
                          </div>
                          <span className="text-xs text-gray-500">
                            {format(new Date(transaction.date), 'dd/MM/yyyy', { locale: ptBR })}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {allTransactions.length > 50 && (
                  <div className="text-center py-2 text-sm text-gray-500">
                    Mostrando primeiras 50 de {allTransactions.length} transações
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma transação encontrada</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Adicione transações reais ou simulações para visualizar.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Advanced Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingTransaction ? 'Editar Simulação' : 'Simulação Avançada'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo
                  </label>
                  <select
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    value={formData.type}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      type: e.target.value as 'INCOME' | 'EXPENSE'
                    })}
                  >
                    <option value="EXPENSE">Despesa</option>
                    <option value="INCOME">Receita</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoria
                  </label>
                  <select
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  >
                    <option value="">Selecione uma categoria</option>
                    {categories
                      .filter(cat => cat.type === formData.type)
                      .map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descrição da transação"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valor (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0,00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data de Início
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Recorrência
                  </label>
                  <select
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    value={formData.recurrenceType}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      recurrenceType: e.target.value as 'SINGLE' | 'RECURRING' | 'INSTALLMENTS'
                    })}
                  >
                    <option value="SINGLE">Único</option>
                    <option value="RECURRING">Recorrente</option>
                    <option value="INSTALLMENTS">Parcelado</option>
                  </select>
                </div>

                {formData.recurrenceType !== 'SINGLE' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Intervalo
                    </label>
                    <select
                      required
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      value={formData.recurrenceInterval}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        recurrenceInterval: e.target.value as 'MONTHLY' | 'WEEKLY' | 'YEARLY'
                      })}
                    >
                      <option value="WEEKLY">Semanal</option>
                      <option value="MONTHLY">Mensal</option>
                      <option value="YEARLY">Anual</option>
                    </select>
                  </div>
                )}

                {formData.recurrenceType === 'RECURRING' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data Final (opcional)
                    </label>
                    <input
                      type="date"
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    />
                  </div>
                )}

                {formData.recurrenceType === 'INSTALLMENTS' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Número de Parcelas
                    </label>
                    <input
                      type="number"
                      min="2"
                      max="120"
                      required
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      value={formData.installments}
                      onChange={(e) => setFormData({ ...formData, installments: e.target.value })}
                      placeholder="Ex: 12"
                    />
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingTransaction(null);
                      resetForm();
                    }}
                    className="px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm text-white bg-purple-600 hover:bg-purple-700 rounded-md transition-colors"
                  >
                    {editingTransaction ? 'Atualizar' : 'Criar'}
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

export default Simulation;