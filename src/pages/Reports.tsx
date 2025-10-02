import React, { useState, useEffect, useMemo } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { TrendingUp, TrendingDown, Calculator, Calendar } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { startOfMonth, subMonths, format, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const Reports: React.FC = () => {
  const { transactions, loading } = useData();

  // Calculate averages from last 3 months of actual data
  const averagesData = useMemo(() => {
    const now = new Date();
    const threeMonthsAgo = subMonths(now, 3);

    const recentTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= threeMonthsAgo && transactionDate <= now;
    });

    const totalIncome = recentTransactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = recentTransactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0);

    const monthCount = Math.max(1, 3); // Always divide by 3 months
    const avgIncome = totalIncome / monthCount;
    const avgExpenses = totalExpenses / monthCount;
    const avgBalance = avgIncome - avgExpenses;

    return {
      income: avgIncome,
      expenses: avgExpenses,
      balance: avgBalance
    };
  }, [transactions]);

  // Generate projections for next 6 months based on averages
  const projectionData = useMemo(() => {
    const projections = [];
    const now = new Date();

    for (let i = 1; i <= 6; i++) {
      const futureMonth = addMonths(now, i);
      projections.push({
        month: format(futureMonth, 'MMM/yy', { locale: ptBR }),
        projectedIncome: averagesData.income,
        projectedExpenses: averagesData.expenses,
        projectedBalance: averagesData.balance
      });
    }

    return {
      averages: averagesData,
      projections
    };
  }, [averagesData]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const projectionChartData = {
    labels: projectionData.projections.map(item => item.month),
    datasets: [
      {
        label: 'Receita Projetada',
        data: projectionData.projections.map(item => item.projectedIncome),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        tension: 0.4,
      },
      {
        label: 'Despesa Projetada',
        data: projectionData.projections.map(item => item.projectedExpenses),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        tension: 0.4,
      },
      {
        label: 'Saldo Projetado',
        data: projectionData.projections.map(item => item.projectedBalance),
        borderColor: 'rgb(37, 99, 235)',
        backgroundColor: 'rgba(37, 99, 235, 0.2)',
        tension: 0.4,
      },
    ],
  };

  const projectionChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Projeções Financeiras (Próximos 6 Meses)',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return formatCurrency(value);
          }
        }
      }
    }
  };

  const averagesChartData = {
    labels: ['Receitas', 'Despesas', 'Saldo'],
    datasets: [
      {
        label: 'Média dos Últimos 3 Meses',
        data: [
          projectionData.averages.income,
          projectionData.averages.expenses,
          projectionData.averages.balance,
        ],
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          projectionData.averages.balance >= 0 
            ? 'rgba(37, 99, 235, 0.8)'
            : 'rgba(239, 68, 68, 0.8)',
        ],
        borderColor: [
          'rgb(16, 185, 129)',
          'rgb(239, 68, 68)',
          projectionData.averages.balance >= 0 
            ? 'rgb(37, 99, 235)'
            : 'rgb(239, 68, 68)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const averagesChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Médias dos Últimos 3 Meses',
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `${context.label}: ${formatCurrency(context.parsed)}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return formatCurrency(value);
          }
        }
      }
    }
  };

  const projectedSavings = projectionData.projections.reduce((total, projection) => {
    return total + projection.projectedBalance;
  }, 0);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
                    Média Receitas (3m)
                  </dt>
                  <dd className="text-lg font-medium text-green-600">
                    {formatCurrency(projectionData.averages.income)}
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
                    Média Despesas (3m)
                  </dt>
                  <dd className="text-lg font-medium text-red-600">
                    {formatCurrency(projectionData.averages.expenses)}
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
                  projectionData.averages.balance >= 0 ? 'text-green-400' : 'text-red-400'
                }`} />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Saldo Médio (3m)
                  </dt>
                  <dd className={`text-lg font-medium ${
                    projectionData.averages.balance >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(projectionData.averages.balance)}
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
                <Calendar className={`h-6 w-6 ${
                  projectedSavings >= 0 ? 'text-blue-400' : 'text-red-400'
                }`} />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Economia Proj. (6m)
                  </dt>
                  <dd className={`text-lg font-medium ${
                    projectedSavings >= 0 ? 'text-blue-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(projectedSavings)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <Bar data={averagesChartData} options={averagesChartOptions} />
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <Line data={projectionChartData} options={projectionChartOptions} />
        </div>
      </div>

      {/* Detailed Projections Table */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Detalhamento das Projeções
          </h3>
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mês
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Receita Projetada
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Despesa Projetada
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Saldo Projetado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {projectionData.projections.map((projection, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {projection.month}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                      {formatCurrency(projection.projectedIncome)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                      {formatCurrency(projection.projectedExpenses)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <span className={projection.projectedBalance >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatCurrency(projection.projectedBalance)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        projection.projectedBalance >= 0 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {projection.projectedBalance >= 0 ? 'Positivo' : 'Negativo'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Analysis */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Análise Financeira
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Situação Atual</h4>
              <div className="text-sm text-gray-600 space-y-2">
                <p>
                  • <strong>Receita média mensal:</strong> {formatCurrency(projectionData.averages.income)}
                </p>
                <p>
                  • <strong>Despesa média mensal:</strong> {formatCurrency(projectionData.averages.expenses)}
                </p>
                <p>
                  • <strong>Saldo médio mensal:</strong> {formatCurrency(projectionData.averages.balance)}
                </p>
                <p className={projectionData.averages.balance >= 0 ? 'text-green-600' : 'text-red-600'}>
                  • <strong>Status:</strong> {projectionData.averages.balance >= 0 ? 'Superávit' : 'Déficit'}
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Projeções</h4>
              <div className="text-sm text-gray-600 space-y-2">
                <p>
                  • <strong>Total projetado (6 meses):</strong> {formatCurrency(projectedSavings)}
                </p>
                <p>
                  • <strong>Economia mensal estimada:</strong> {formatCurrency(projectedSavings / 6)}
                </p>
                <p className={projectedSavings >= 0 ? 'text-green-600' : 'text-red-600'}>
                  • <strong>Tendência:</strong> {projectedSavings >= 0 ? 'Crescimento' : 'Declínio'}
                </p>
                {projectionData.averages.balance < 0 && (
                  <p className="text-amber-600">
                    • <strong>⚠️ Atenção:</strong> Saldo médio negativo requer atenção
                  </p>
                )}
              </div>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h5 className="font-medium text-blue-900 mb-2">💡 Dicas Financeiras</h5>
            <ul className="text-sm text-blue-800 space-y-1">
              {projectionData.averages.balance >= 0 ? (
                <>
                  <li>• Continue mantendo o controle das despesas</li>
                  <li>• Considere investir o excedente para aumentar a renda</li>
                  <li>• Mantenha uma reserva de emergência</li>
                </>
              ) : (
                <>
                  <li>• Analise as categorias de maior gasto e tente reduzi-las</li>
                  <li>• Busque fontes de renda adicional</li>
                  <li>• Estabeleça metas de economia mensal</li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;