import React, { useState } from 'react';
import { Plus, CreditCard as Edit, Trash2, Search, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useData } from '../contexts/DataContext';

interface TransactionFormData {
  type: 'INCOME' | 'EXPENSE';
  amount: string;
  description: string;
  date: string;
  categoryId: string;
  recurrenceType: 'SINGLE' | 'RECURRING' | 'INSTALLMENTS';
  recurrenceInterval: 'MONTHLY' | 'WEEKLY' | 'YEARLY';
  endDate: string;
  installments: string;
}

const Transactions: React.FC = () => {
  const { transactions, categories, addTransaction, updateTransaction, deleteTransaction } = useData();
  const [showModal, setShowModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [filters, setFilters] = useState({
    type: '',
    categoryId: '',
    search: ''
  });

  console.log('Transactions in component:', transactions);
  const [formData, setFormData] = useState<TransactionFormData>({
    type: 'EXPENSE',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    categoryId: '',
    recurrenceType: 'SINGLE',
    recurrenceInterval: 'MONTHLY',
    endDate: '',
    installments: ''
  });

  // Filter transactions based on current filters
  const filteredTransactions = transactions
    .filter(t => t && t.id) // Ensure transaction exists
    .filter(transaction => {
      const matchesType = !filters.type || transaction.type === filters.type;
      const matchesCategory = !filters.categoryId || transaction.category?.id === filters.categoryId;
      const matchesSearch = !filters.search ||
        transaction.description?.toLowerCase().includes(filters.search.toLowerCase()) ||
        transaction.category?.name?.toLowerCase().includes(filters.search.toLowerCase());

      return matchesType && matchesCategory && matchesSearch;
    });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let transactionData = {
      type: formData.type,
      amount: parseFloat(formData.amount),
      description: formData.description || undefined,
      date: new Date(formData.date).toISOString(),
      categoryId: formData.categoryId
    };

    // Handle recurring transactions
    if (formData.recurrenceType !== 'SINGLE') {
      // For now, just create the first transaction
      // In a real app, you'd want to create a recurring transaction record
      // and generate future transactions based on the recurrence rules
      
      if (formData.recurrenceType === 'INSTALLMENTS' && formData.installments) {
        transactionData.description = `${transactionData.description} (1/${formData.installments})`;
      }
    }

    if (editingTransaction) {
      updateTransaction(editingTransaction.id, transactionData);
    } else {
      addTransaction(transactionData);
    }
    
    setShowModal(false);
    setEditingTransaction(null);
    resetForm();
  };

  const handleEdit = (transaction: any) => {
    setEditingTransaction(transaction);
    setFormData({
      type: transaction.type,
      amount: transaction.amount.toString(),
      description: transaction.description || '',
      date: new Date(transaction.date).toISOString().split('T')[0],
      categoryId: transaction.category?.id || '',
      recurrenceType: 'SINGLE',
      recurrenceInterval: 'MONTHLY',
      endDate: '',
      installments: ''
    });
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta transação?')) {
      deleteTransaction(id);
    }
  };

  const resetForm = () => {
    setFormData({
      type: 'EXPENSE',
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      categoryId: '',
      recurrenceType: 'SINGLE',
      recurrenceInterval: 'MONTHLY',
      endDate: '',
      installments: ''
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getFilteredCategories = () => {
    return categories.filter(cat => cat.type === formData.type);
  };

  if (transactions.some(t => !t.category)) {
    console.warn('Found transactions without category:', transactions.filter(t => !t.category));
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex space-x-4">
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Transação
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Search className="h-4 w-4 inline mr-1" />
              Buscar
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              placeholder="Descrição ou categoria..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Filter className="h-4 w-4 inline mr-1" />
              Tipo
            </label>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            >
              <option value="">Todos</option>
              <option value="INCOME">Receitas</option>
              <option value="EXPENSE">Despesas</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categoria
            </label>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              value={filters.categoryId}
              onChange={(e) => setFilters({ ...filters, categoryId: e.target.value })}
            >
              <option value="">Todas</option>
              {categories.filter(c => c && c.id && c.name).map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setFilters({ type: '', categoryId: '', search: '' })}
              className="w-full px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Limpar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descrição
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoria
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuário
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransactions.map((transaction) => {
                console.log('Rendering transaction:', transaction);
                return (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {format(new Date(transaction.date), 'dd/MM/yyyy', { locale: ptBR })}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {transaction.description || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      {transaction.category ? (
                        <>
                          <div
                            className="w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: transaction.category.color }}
                          ></div>
                          {transaction.category.name}
                        </>
                      ) : (
                        <span className="text-gray-400">Sem categoria</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      transaction.type === 'INCOME' 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {transaction.type === 'INCOME' ? 'Receita' : 'Despesa'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <span className={transaction.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}>
                      {formatCurrency(transaction.amount)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transaction.user.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(transaction)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(transaction.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              );
              })}
            </tbody>
          </table>
          {filteredTransactions.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">Nenhuma transação encontrada</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingTransaction ? 'Editar Transação' : 'Nova Transação'}
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
                      type: e.target.value as 'INCOME' | 'EXPENSE',
                      categoryId: ''
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
                    {getFilteredCategories().filter(c => c && c.id && c.name).map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
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
                    Descrição
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descrição opcional"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
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
                    className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
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

export default Transactions;