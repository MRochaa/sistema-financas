import React, { useState, useEffect } from 'react';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { TrendingUp, TrendingDown, DollarSign, Calendar, User, Home, ChevronDown } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Dashboard: React.FC = () => {
  const { transactions, categories } = useData();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'house' | 'personal'>('house');
  const [timeRange, setTimeRange] = useState<'month' | '3months' | '6months' | 'year'>('month');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // Force re-render when transactions change
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 100);
    return () => clearTimeout(timer);
  }, [transactions, categories, viewMode, timeRange, selectedMonth]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getDateRange = () => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    if (timeRange === 'month') {
      const [year, month] = selectedMonth.split('-').map(Number);
      startDate = new Date(year, month - 1, 1);
      endDate = new Date(year, month, 1);
    } else {
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      
      switch (timeRange) {
        case '3months':
          startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
          break;
        case '6months':
          startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }
    }

    return { startDate, endDate };
  };

  const calculateDashboardData = () => {
    const { startDate, endDate } = getDateRange();
    
    // Filter transactions based on view mode and date range
    let filteredTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      const inDateRange = transactionDate >= startDate && transactionDate < endDate;
      
      if (viewMode === 'personal') {
        return inDateRange && t.user.name === user?.name;
      }
      return inDateRange;
    });

    // Calculate totals
    const totalIncome = filteredTransactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = filteredTransactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0);

    // Generate evolution data based on time range
    const evolutionData = [];
    const monthsToShow = timeRange === 'month' ? 1 : 
                       timeRange === '3months' ? 3 : 
                       timeRange === '6months' ? 6 : 12;

    for (let i = monthsToShow - 1; i >= 0; i--) {
      let monthStart: Date;
      let monthEnd: Date;
      
      if (timeRange === 'month') {
        const [year, month] = selectedMonth.split('-').map(Number);
        monthStart = new Date(year, month - 1, 1);
        monthEnd = new Date(year, month, 1);
      } else {
        const now = new Date();
        monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      }
      
      const monthTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        const inDateRange = transactionDate >= monthStart && transactionDate < monthEnd;
        
        if (viewMode === 'personal') {
          return inDateRange && t.user.name === user?.name;
        }
        return inDateRange;
      });

      const income = monthTransactions
        .filter(t => t.type === 'INCOME')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const expenses = monthTransactions
        .filter(t => t.type === 'EXPENSE')
        .reduce((sum, t) => sum + t.amount, 0);

      evolutionData.push({
        month: monthStart.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
        income,
        expenses,
        balance: income - expenses
      });
    }

    // Category breakdown
    const categoryBreakdown = categories.map(category => {
      const categoryTransactions = filteredTransactions.filter(t => t.category?.id === category.id);
      const amount = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);

      return {
        categoryId: category.id,
        _sum: { amount },
        _count: { id: categoryTransactions.length },
        category
      };
    }).filter(item => item._sum.amount > 0);

    return {
      totalIncome,
      totalExpenses,
      totalBalance: totalIncome - totalExpenses,
      evolutionData,
      categoryBreakdown
    };
  };

  const dashboardData = calculateDashboardData();

  const lineChartData = {
    labels: dashboardData.evolutionData.map(item => item.month),
    datasets: [
      {
        label: 'Receitas',
        data: dashboardData.evolutionData.map(item => item.income),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        tension: 0.4,
      },
      {
        label: 'Despesas',
        data: dashboardData.evolutionData.map(item => item.expenses),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        tension: 0.4,
      },
      {
        label: 'Saldo',
        data: dashboardData.evolutionData.map(item => item.balance),
        borderColor: 'rgb(37, 99, 235)',
        backgroundColor: 'rgba(37, 99, 235, 0.2)',
        tension: 0.4,
      },
    ],
  };

  const lineChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `Evolução ${viewMode === 'personal' ? 'Pessoal' : 'Familiar'}`,
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

  const expenseCategories = dashboardData.categoryBreakdown.filter(
    item => item.category && item.category.type === 'EXPENSE'
  );

  const doughnutChartData = {
    labels: expenseCategories.map(item => item.category?.name || 'Sem categoria'),
    datasets: [
      {
        data: expenseCategories.map(item => item._sum.amount),
        backgroundColor: expenseCategories.map(item => item.category?.color || '#cccccc'),
        borderWidth: 2,
        borderColor: '#fff',
      },
    ],
  };

  const doughnutChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right' as const,
      },
      title: {
        display: true,
        text: `Despesas por Categoria ${viewMode === 'personal' ? '(Pessoal)' : '(Familiar)'}`,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `${context.label}: ${formatCurrency(context.parsed)}`;
          }
        }
      }
    },
  };

  const getTimeRangeLabel = () => {
    switch (timeRange) {
      case 'month': return 'do Mês';
      case '3months': return 'dos Últimos 3 Meses';
      case '6months': return 'dos Últimos 6 Meses';
      case 'year': return 'do Ano';
      default: return 'do Mês';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* View Mode Toggle */}
      <div className="flex items-center justify-center">
        <div className="bg-white rounded-lg p-1 shadow-sm border">
          <div className="flex">
            <button
              onClick={() => setViewMode('house')}
              className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'house'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Home className="h-4 w-4 mr-2" />
              Casa
            </button>
            <button
              onClick={() => setViewMode('personal')}
              className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'personal'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <User className="h-4 w-4 mr-2" />
              Pessoal
            </button>
          </div>
        </div>
      </div>

      {/* Time Range and Month Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          {/* Time Range Selector */}
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Período:</span>
            <div className="flex bg-gray-100 rounded-lg p-1">
              {[
                { key: 'month', label: 'Mês' },
                { key: '3months', label: '3 Meses' },
                { key: '6months', label: '6 Meses' },
                { key: 'year', label: 'Anual' }
              ].map((option) => (
                <button
                  key={option.key}
                  onClick={() => setTimeRange(option.key as any)}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    timeRange === option.key
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Month Selector (only show when timeRange is 'month') */}
          {timeRange === 'month' && (
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Mês:</span>
              <div className="relative">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 rounded-md px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {Array.from({ length: 12 }, (_, i) => {
                    const date = new Date();
                    date.setMonth(date.getMonth() - i);
                    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                    const label = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
                    return (
                      <option key={value} value={value}>
                        {label.charAt(0).toUpperCase() + label.slice(1)}
                      </option>
                    );
                  })}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Saldo Total
                  </dt>
                  <dd className={`text-lg font-medium ${
                    dashboardData.totalBalance >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(dashboardData.totalBalance)}
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
                <TrendingUp className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Receitas {getTimeRangeLabel()}
                  </dt>
                  <dd className="text-lg font-medium text-green-600">
                    {formatCurrency(dashboardData.totalIncome)}
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
                    Despesas {getTimeRangeLabel()}
                  </dt>
                  <dd className="text-lg font-medium text-red-600">
                    {formatCurrency(dashboardData.totalExpenses)}
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
                    Saldo {getTimeRangeLabel()}
                  </dt>
                  <dd className={`text-lg font-medium ${
                    dashboardData.totalBalance >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(dashboardData.totalBalance)}
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
          <Line data={lineChartData} options={lineChartOptions} />
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          {expenseCategories.length > 0 ? (
            <Doughnut data={doughnutChartData} options={doughnutChartOptions} />
          ) : (
            <div className="flex items-center justify-center h-64">
              <p className="text-gray-500">Nenhuma despesa registrada no período</p>
            </div>
          )}
        </div>
      </div>

      {/* Categories Table */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Resumo por Categoria {viewMode === 'personal' ? '(Pessoal)' : '(Familiar)'} - {getTimeRangeLabel()}
          </h3>
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoria
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transações
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dashboardData.categoryBreakdown.map((item) => (
                  <tr key={item.categoryId}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {item.category ? (
                          <>
                            <div
                              className="w-4 h-4 rounded-full mr-3"
                              style={{ backgroundColor: item.category.color }}
                            ></div>
                            <div className="text-sm font-medium text-gray-900">
                              {item.category.name}
                            </div>
                          </>
                        ) : (
                          <div className="text-sm font-medium text-gray-400">
                            Sem categoria
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        item.category?.type === 'INCOME'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {item.category?.type === 'INCOME' ? 'Receita' : 'Despesa'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item._count.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <span className={item.category?.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}>
                        {formatCurrency(item._sum.amount)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {dashboardData.categoryBreakdown.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">Nenhuma transação encontrada no período selecionado</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;