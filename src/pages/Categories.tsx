import React, { useState } from 'react';
import { Plus, Edit, Trash2, Tag } from 'lucide-react';
import { useData } from '../contexts/DataContext';

const Categories: React.FC = () => {
  const { categories, addCategory, updateCategory, deleteCategory } = useData();
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'EXPENSE' as 'INCOME' | 'EXPENSE',
    color: '#6B7280'
  });

  const colors = [
    '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6',
    '#EC4899', '#14B8A6', '#F97316', '#84CC16', '#6366F1',
    '#DC2626', '#D97706', '#059669', '#2563EB', '#7C3AED'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingCategory) {
      updateCategory(editingCategory.id, formData);
    } else {
      addCategory(formData);
    }
    
    setShowModal(false);
    setEditingCategory(null);
    resetForm();
  };

  const handleEdit = (category: any) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      type: category.type,
      color: category.color
    });
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta categoria?')) {
      deleteCategory(id);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'EXPENSE',
      color: '#6B7280'
    });
  };

  const groupedCategories = {
    INCOME: categories.filter(cat => cat.type === 'INCOME'),
    EXPENSE: categories.filter(cat => cat.type === 'EXPENSE')
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Tag className="h-6 w-6 text-gray-400" />
          <span className="text-lg text-gray-600">Gerencie suas categorias de transações</span>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Categoria
        </button>
      </div>

      {/* Categories Grid */}
      <div className="space-y-8">
        {/* Income Categories */}
        <div>
          <h3 className="text-lg font-medium text-green-800 mb-4 flex items-center">
            <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
            Categorias de Receita ({groupedCategories.INCOME.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groupedCategories.INCOME.map((category) => (
              <div key={category.id} className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-6 h-6 rounded-full"
                      style={{ backgroundColor: category.color }}
                    ></div>
                    <div>
                      <h4 className="font-medium text-gray-900">{category.name}</h4>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(category)}
                      className="text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(category.id)}
                      className="text-red-600 hover:text-red-800 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {groupedCategories.INCOME.length === 0 && (
              <div className="col-span-full text-center py-8 text-gray-500">
                Nenhuma categoria de receita encontrada
              </div>
            )}
          </div>
        </div>

        {/* Expense Categories */}
        <div>
          <h3 className="text-lg font-medium text-red-800 mb-4 flex items-center">
            <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
            Categorias de Despesa ({groupedCategories.EXPENSE.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groupedCategories.EXPENSE.map((category) => (
              <div key={category.id} className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-6 h-6 rounded-full"
                      style={{ backgroundColor: category.color }}
                    ></div>
                    <div>
                      <h4 className="font-medium text-gray-900">{category.name}</h4>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(category)}
                      className="text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(category.id)}
                      className="text-red-600 hover:text-red-800 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {groupedCategories.EXPENSE.length === 0 && (
              <div className="col-span-full text-center py-8 text-gray-500">
                Nenhuma categoria de despesa encontrada
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nome da categoria"
                  />
                </div>

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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cor
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {colors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`w-10 h-10 rounded-full border-2 transition-all ${
                          formData.color === color 
                            ? 'border-gray-800 scale-110' 
                            : 'border-gray-300 hover:border-gray-500'
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setFormData({ ...formData, color })}
                      />
                    ))}
                  </div>
                  <div className="mt-2">
                    <input
                      type="color"
                      className="w-full h-10 border border-gray-300 rounded cursor-pointer"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingCategory(null);
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
                    {editingCategory ? 'Atualizar' : 'Criar'}
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

export default Categories;