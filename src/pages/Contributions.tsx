import React, { useState } from 'react';
import { Users, Calculator, PieChart, TrendingUp, TrendingDown } from 'lucide-react';
import { useData } from '../contexts/DataContext';

const Contributions: React.FC = () => {
  const { transactions } = useData();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Calcular contribuições por usuário
  const calculateContributions = () => {
    const userContributions: { [key: string]: { income: number; expenses: number } } = {};
    
    transactions.forEach(transaction => {
      const userName = transaction.user.name;
      
      if (!userContributions[userName]) {
        userContributions[userName] = { income: 0, expenses: 0 };
      }
      
      if (transaction.type === 'INCOME') {
        userContributions[userName].income += transaction.amount;
      } else {
        userContributions[userName].expenses += transaction.amount;
      }
    });

    return userContributions;
  };

  const contributions = calculateContributions();
  const users = Object.keys(contributions);
  
  // Calcular totais
  const totalIncome = Object.values(contributions).reduce((sum, user) => sum + user.income, 0);
  const totalExpenses = Object.values(contributions).reduce((sum, user) => sum + user.expenses, 0);

  // Calcular percentuais e sugestões de pagamento
  const contributionData = users.map(userName => {
    const userIncome = contributions[userName].income;
    const percentage = totalIncome > 0 ? (userIncome / totalIncome) * 100 : 0;
    const suggestedPayment = (percentage / 100) * totalExpenses;
    const actualExpenses = contributions[userName].expenses;
    const difference = suggestedPayment - actualExpenses;

    return {
      name: userName,
      income: userIncome,
      percentage: percentage,
      suggestedPayment: suggestedPayment,
      actualExpenses: actualExpenses,
      difference: difference
    };
  });

  // Cores para os usuários
  const userColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-2">
        <Users className="h-6 w-6 text-gray-400" />
        <span className="text-lg text-gray-600">Análise de contribuições e divisão proporcional de despesas</span>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total de Entradas
                  </dt>
                  <dd className="text-lg font-medium text-green-600">
                    {formatCurrency(totalIncome)}
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
                    Total de Saídas
                  </dt>
                  <dd className="text-lg font-medium text-red-600">
                    {formatCurrency(totalExpenses)}
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
                <Calculator className={`h-6 w-6 ${
                  totalIncome - totalExpenses >= 0 ? 'text-green-400' : 'text-red-400'
                }`} />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Saldo Total
                  </dt>
                  <dd className={`text-lg font-medium ${
                    totalIncome - totalExpenses >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(totalIncome - totalExpenses)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contributions Analysis */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4 flex items-center">
            <PieChart className="h-5 w-5 mr-2" />
            Análise de Contribuições
          </h3>
          
          {contributionData.length > 0 ? (
            <div className="space-y-6">
              {/* Visual representation */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {contributionData.map((user, index) => (
                  <div key={user.name} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center mb-3">
                      <div
                        className="w-4 h-4 rounded-full mr-2"
                        style={{ backgroundColor: userColors[index % userColors.length] }}
                      ></div>
                      <h4 className="font-medium text-gray-900">{user.name}</h4>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Entradas:</span>
                        <span className="font-medium text-green-600">
                          {formatCurrency(user.income)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Participação:</span>
                        <span className="font-medium text-blue-600">
                          {user.percentage.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Saídas Atuais:</span>
                        <span className="font-medium text-red-600">
                          {formatCurrency(user.actualExpenses)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Detailed Table */}
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Usuário
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Entradas
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Participação
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pagamento Sugerido
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pagamento Atual
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Diferença
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {contributionData.map((user, index) => (
                      <tr key={user.name} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div
                              className="w-3 h-3 rounded-full mr-2"
                              style={{ backgroundColor: userColors[index % userColors.length] }}
                            ></div>
                            <div className="text-sm font-medium text-gray-900">
                              {user.name}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                          {formatCurrency(user.income)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                          {user.percentage.toFixed(1)}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600 font-medium">
                          {formatCurrency(user.suggestedPayment)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                          {formatCurrency(user.actualExpenses)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <span className={user.difference > 0 ? 'text-red-600' : 'text-green-600'}>
                            {user.difference > 0 ? '+' : ''}{formatCurrency(Math.abs(user.difference))}
                          </span>
                          {user.difference > 0 && (
                            <div className="text-xs text-gray-500">deve pagar mais</div>
                          )}
                          {user.difference < 0 && (
                            <div className="text-xs text-gray-500">pagou a mais</div>
                          )}
                          {user.difference === 0 && (
                            <div className="text-xs text-gray-500">equilibrado</div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary and Recommendations */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">💡 Resumo da Divisão Proporcional</h4>
                <div className="text-sm text-blue-800 space-y-1">
                  <p>
                    <strong>Critério:</strong> A divisão das despesas é proporcional à contribuição de cada um nas receitas.
                  </p>
                  <p>
                    <strong>Total de Receitas:</strong> {formatCurrency(totalIncome)} | 
                    <strong> Total de Despesas:</strong> {formatCurrency(totalExpenses)}
                  </p>
                  {contributionData.map((user, index) => (
                    <p key={user.name}>
                      <strong>{user.name}:</strong> Contribuiu {user.percentage.toFixed(1)}% das receitas, 
                      deveria pagar {user.percentage.toFixed(1)}% das despesas = {formatCurrency(user.suggestedPayment)}
                    </p>
                  ))}
                </div>
              </div>

              {/* Balance Recommendations */}
              {contributionData.some(user => Math.abs(user.difference) > 10) && (
                <div className="bg-amber-50 p-4 rounded-lg">
                  <h4 className="font-medium text-amber-900 mb-2">⚖️ Recomendações de Ajuste</h4>
                  <div className="text-sm text-amber-800 space-y-1">
                    {contributionData.map(user => {
                      if (Math.abs(user.difference) > 10) {
                        return (
                          <p key={user.name}>
                            <strong>{user.name}:</strong> {
                              user.difference > 0 
                                ? `Deveria pagar mais ${formatCurrency(user.difference)} para equilibrar`
                                : `Pagou ${formatCurrency(Math.abs(user.difference))} a mais que sua proporção`
                            }
                          </p>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma transação encontrada</h3>
              <p className="mt-1 text-sm text-gray-500">
                Adicione algumas transações para ver a análise de contribuições.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Contributions;