import React, { useState, useEffect } from 'react';
import { Plus, CreditCard as Edit, Trash2, ShoppingCart, Check, X, GripVertical, ChevronDown, ChevronUp, Minus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { shoppingListService } from '../services/api';
import toast from 'react-hot-toast';

interface ShoppingItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  checked: boolean;
  isCustom: boolean; // true if added by user, false if default
  createdBy: string;
  order: number;
}

interface ShoppingList {
  id: string;
  name: string;
  description?: string;
  items: ShoppingItem[];
  createdBy: string;
  createdAt: string;
  isActive: boolean;
}

// Default shopping list items organized by categories
const defaultShoppingItems: Omit<ShoppingItem, 'id' | 'quantity' | 'checked' | 'createdBy' | 'order'>[] = [
  // Mercearia e alimentos básicos
  { name: 'Arroz agulhinha', category: 'Mercearia e alimentos básicos', unit: 'kg', isCustom: false },
  { name: 'Arroz parboilizado', category: 'Mercearia e alimentos básicos', unit: 'kg', isCustom: false },
  { name: 'Arroz integral', category: 'Mercearia e alimentos básicos', unit: 'kg', isCustom: false },
  { name: 'Feijão carioca', category: 'Mercearia e alimentos básicos', unit: 'kg', isCustom: false },
  { name: 'Feijão preto', category: 'Mercearia e alimentos básicos', unit: 'kg', isCustom: false },
  { name: 'Feijão branco', category: 'Mercearia e alimentos básicos', unit: 'kg', isCustom: false },
  { name: 'Macarrão', category: 'Mercearia e alimentos básicos', unit: 'pacote', isCustom: false },
  { name: 'Espaguete', category: 'Mercearia e alimentos básicos', unit: 'pacote', isCustom: false },
  { name: 'Massa para lasanha', category: 'Mercearia e alimentos básicos', unit: 'pacote', isCustom: false },
  { name: 'Farinha de trigo', category: 'Mercearia e alimentos básicos', unit: 'kg', isCustom: false },
  { name: 'Óleo de soja', category: 'Mercearia e alimentos básicos', unit: 'litro', isCustom: false },
  { name: 'Óleo de girassol', category: 'Mercearia e alimentos básicos', unit: 'litro', isCustom: false },
  { name: 'Óleo de canola', category: 'Mercearia e alimentos básicos', unit: 'litro', isCustom: false },
  { name: 'Azeite de oliva', category: 'Mercearia e alimentos básicos', unit: 'ml', isCustom: false },
  { name: 'Açúcar refinado', category: 'Mercearia e alimentos básicos', unit: 'kg', isCustom: false },
  { name: 'Açúcar cristal', category: 'Mercearia e alimentos básicos', unit: 'kg', isCustom: false },
  { name: 'Açúcar mascavo', category: 'Mercearia e alimentos básicos', unit: 'kg', isCustom: false },
  { name: 'Adoçante', category: 'Mercearia e alimentos básicos', unit: 'unidade', isCustom: false },
  { name: 'Sal fino', category: 'Mercearia e alimentos básicos', unit: 'kg', isCustom: false },
  { name: 'Sal grosso', category: 'Mercearia e alimentos básicos', unit: 'kg', isCustom: false },
  { name: 'Molho de tomate', category: 'Mercearia e alimentos básicos', unit: 'unidade', isCustom: false },
  { name: 'Milho enlatado', category: 'Mercearia e alimentos básicos', unit: 'lata', isCustom: false },
  { name: 'Ervilha enlatada', category: 'Mercearia e alimentos básicos', unit: 'lata', isCustom: false },
  { name: 'Atum enlatado', category: 'Mercearia e alimentos básicos', unit: 'lata', isCustom: false },
  { name: 'Sardinha enlatada', category: 'Mercearia e alimentos básicos', unit: 'lata', isCustom: false },
  { name: 'Alho', category: 'Mercearia e alimentos básicos', unit: 'kg', isCustom: false },
  { name: 'Cebola', category: 'Mercearia e alimentos básicos', unit: 'kg', isCustom: false },
  { name: 'Pimenta-do-reino', category: 'Mercearia e alimentos básicos', unit: 'unidade', isCustom: false },
  { name: 'Orégano', category: 'Mercearia e alimentos básicos', unit: 'unidade', isCustom: false },
  { name: 'Café em pó', category: 'Mercearia e alimentos básicos', unit: 'pacote', isCustom: false },
  { name: 'Café em grãos', category: 'Mercearia e alimentos básicos', unit: 'kg', isCustom: false },
  { name: 'Chá em sachês', category: 'Mercearia e alimentos básicos', unit: 'caixa', isCustom: false },
  { name: 'Aveia', category: 'Mercearia e alimentos básicos', unit: 'kg', isCustom: false },
  { name: 'Granola', category: 'Mercearia e alimentos básicos', unit: 'kg', isCustom: false },
  { name: 'Flocos de milho', category: 'Mercearia e alimentos básicos', unit: 'caixa', isCustom: false },
  { name: 'Biscoitos doces', category: 'Mercearia e alimentos básicos', unit: 'pacote', isCustom: false },
  { name: 'Biscoitos salgados', category: 'Mercearia e alimentos básicos', unit: 'pacote', isCustom: false },
  { name: 'Bolacha água e sal', category: 'Mercearia e alimentos básicos', unit: 'pacote', isCustom: false },
  { name: 'Pão de forma', category: 'Mercearia e alimentos básicos', unit: 'unidade', isCustom: false },
  { name: 'Pão francês', category: 'Mercearia e alimentos básicos', unit: 'kg', isCustom: false },

  // Hortifrúti
  { name: 'Tomate', category: 'Hortifrúti', unit: 'kg', isCustom: false },
  { name: 'Cebola', category: 'Hortifrúti', unit: 'kg', isCustom: false },
  { name: 'Alho', category: 'Hortifrúti', unit: 'kg', isCustom: false },
  { name: 'Batata', category: 'Hortifrúti', unit: 'kg', isCustom: false },
  { name: 'Cenoura', category: 'Hortifrúti', unit: 'kg', isCustom: false },
  { name: 'Vagem', category: 'Hortifrúti', unit: 'kg', isCustom: false },
  { name: 'Pepino', category: 'Hortifrúti', unit: 'kg', isCustom: false },
  { name: 'Abobrinha', category: 'Hortifrúti', unit: 'kg', isCustom: false },
  { name: 'Pimentão', category: 'Hortifrúti', unit: 'kg', isCustom: false },
  { name: 'Alface', category: 'Hortifrúti', unit: 'unidade', isCustom: false },
  { name: 'Couve', category: 'Hortifrúti', unit: 'maço', isCustom: false },
  { name: 'Rúcula', category: 'Hortifrúti', unit: 'maço', isCustom: false },
  { name: 'Brócolis', category: 'Hortifrúti', unit: 'unidade', isCustom: false },
  { name: 'Banana', category: 'Hortifrúti', unit: 'kg', isCustom: false },
  { name: 'Maçã', category: 'Hortifrúti', unit: 'kg', isCustom: false },
  { name: 'Laranja', category: 'Hortifrúti', unit: 'kg', isCustom: false },
  { name: 'Mamão', category: 'Hortifrúti', unit: 'unidade', isCustom: false },
  { name: 'Morango', category: 'Hortifrúti', unit: 'bandeja', isCustom: false },

  // Carnes, frios e laticínios
  { name: 'Carne moída', category: 'Carnes, frios e laticínios', unit: 'kg', isCustom: false },
  { name: 'Bife', category: 'Carnes, frios e laticínios', unit: 'kg', isCustom: false },
  { name: 'Peito de frango', category: 'Carnes, frios e laticínios', unit: 'kg', isCustom: false },
  { name: 'Coxa de frango', category: 'Carnes, frios e laticínios', unit: 'kg', isCustom: false },
  { name: 'Peixe', category: 'Carnes, frios e laticínios', unit: 'kg', isCustom: false },
  { name: 'Ovos brancos', category: 'Carnes, frios e laticínios', unit: 'dúzia', isCustom: false },
  { name: 'Ovos caipira', category: 'Carnes, frios e laticínios', unit: 'dúzia', isCustom: false },
  { name: 'Leite integral', category: 'Carnes, frios e laticínios', unit: 'litro', isCustom: false },
  { name: 'Leite desnatado', category: 'Carnes, frios e laticínios', unit: 'litro', isCustom: false },
  { name: 'Leite semidesnatado', category: 'Carnes, frios e laticínios', unit: 'litro', isCustom: false },
  { name: 'Leite em pó', category: 'Carnes, frios e laticínios', unit: 'lata', isCustom: false },
  { name: 'Queijo mussarela', category: 'Carnes, frios e laticínios', unit: 'kg', isCustom: false },
  { name: 'Queijo branco', category: 'Carnes, frios e laticínios', unit: 'kg', isCustom: false },
  { name: 'Queijo ralado', category: 'Carnes, frios e laticínios', unit: 'pacote', isCustom: false },
  { name: 'Manteiga', category: 'Carnes, frios e laticínios', unit: 'unidade', isCustom: false },
  { name: 'Margarina', category: 'Carnes, frios e laticínios', unit: 'unidade', isCustom: false },
  { name: 'Iogurte natural', category: 'Carnes, frios e laticínios', unit: 'unidade', isCustom: false },
  { name: 'Iogurte com frutas', category: 'Carnes, frios e laticínios', unit: 'unidade', isCustom: false },
  { name: 'Iogurte grego', category: 'Carnes, frios e laticínios', unit: 'unidade', isCustom: false },
  { name: 'Presunto', category: 'Carnes, frios e laticínios', unit: 'kg', isCustom: false },
  { name: 'Peito de peru', category: 'Carnes, frios e laticínios', unit: 'kg', isCustom: false },
  { name: 'Salame', category: 'Carnes, frios e laticínios', unit: 'kg', isCustom: false },

  // Produtos de limpeza
  { name: 'Detergente', category: 'Produtos de limpeza', unit: 'unidade', isCustom: false },
  { name: 'Desinfetante', category: 'Produtos de limpeza', unit: 'litro', isCustom: false },
  { name: 'Água sanitária', category: 'Produtos de limpeza', unit: 'litro', isCustom: false },
  { name: 'Sabão em pó', category: 'Produtos de limpeza', unit: 'kg', isCustom: false },
  { name: 'Sabão líquido', category: 'Produtos de limpeza', unit: 'litro', isCustom: false },
  { name: 'Amaciante', category: 'Produtos de limpeza', unit: 'litro', isCustom: false },
  { name: 'Multiuso', category: 'Produtos de limpeza', unit: 'unidade', isCustom: false },
  { name: 'Sacos de lixo', category: 'Produtos de limpeza', unit: 'pacote', isCustom: false },
  { name: 'Esponja', category: 'Produtos de limpeza', unit: 'unidade', isCustom: false },
  { name: 'Pano de chão', category: 'Produtos de limpeza', unit: 'unidade', isCustom: false },
  { name: 'Vassoura', category: 'Produtos de limpeza', unit: 'unidade', isCustom: false },
  { name: 'Pá de lixo', category: 'Produtos de limpeza', unit: 'unidade', isCustom: false },

  // Higiene pessoal
  { name: 'Sabonete em barra', category: 'Higiene pessoal', unit: 'unidade', isCustom: false },
  { name: 'Sabonete líquido', category: 'Higiene pessoal', unit: 'unidade', isCustom: false },
  { name: 'Papel higiênico', category: 'Higiene pessoal', unit: 'pacote', isCustom: false },
  { name: 'Shampoo', category: 'Higiene pessoal', unit: 'unidade', isCustom: false },
  { name: 'Condicionador', category: 'Higiene pessoal', unit: 'unidade', isCustom: false },
  { name: 'Creme dental', category: 'Higiene pessoal', unit: 'unidade', isCustom: false },
  { name: 'Escova de dente', category: 'Higiene pessoal', unit: 'unidade', isCustom: false },
  { name: 'Desodorante spray', category: 'Higiene pessoal', unit: 'unidade', isCustom: false },
  { name: 'Desodorante roll-on', category: 'Higiene pessoal', unit: 'unidade', isCustom: false },
  { name: 'Absorventes higiênicos', category: 'Higiene pessoal', unit: 'pacote', isCustom: false },
  { name: 'Fio dental', category: 'Higiene pessoal', unit: 'unidade', isCustom: false },
];

const ShoppingList: React.FC = () => {
  const { user } = useAuth();
  const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>([]);
  const [customItems, setCustomItems] = useState<Omit<ShoppingItem, 'id' | 'quantity' | 'checked' | 'createdBy' | 'order'>[]>([]);
  const [showListModal, setShowListModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingList, setEditingList] = useState<ShoppingList | null>(null);
  const [selectedListId, setSelectedListId] = useState<string>('');
  const [expandedLists, setExpandedLists] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [lists, custom] = await Promise.all([
        shoppingListService.getAll(),
        shoppingListService.getCustomItems()
      ]);
      setShoppingLists(lists);
      setCustomItems(custom);
    } catch (error: any) {
      console.error('Error loading shopping lists:', error);
      toast.error('Erro ao carregar listas de compras');
    } finally {
      setLoading(false);
    }
  };

  const [listFormData, setListFormData] = useState({
    name: '',
    description: ''
  });

  const [itemFormData, setItemFormData] = useState({
    name: '',
    category: '',
    unit: 'unidade'
  });

  const resetListForm = () => {
    setListFormData({ name: '', description: '' });
  };

  const resetItemForm = () => {
    setItemFormData({ name: '', category: '', unit: 'unidade' });
  };

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newList = await shoppingListService.create({ name: listFormData.name });
      setShoppingLists(prev => [...prev, newList]);
      setShowListModal(false);
      setEditingList(null);
      resetListForm();
      toast.success('Lista criada com sucesso');
    } catch (error: any) {
      console.error('Error creating list:', error);
      toast.error('Erro ao criar lista');
    }
  };

  const handleUpdateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingList) return;

    try {
      const updated = await shoppingListService.update(editingList.id, { name: listFormData.name });
      setShoppingLists(prev => prev.map(list => list.id === editingList.id ? updated : list));
      setShowListModal(false);
      setEditingList(null);
      resetListForm();
      toast.success('Lista atualizada com sucesso');
    } catch (error: any) {
      console.error('Error updating list:', error);
      toast.error('Erro ao atualizar lista');
    }
  };

  const handleDeleteList = async (listId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta lista de compras?')) {
      try {
        await shoppingListService.delete(listId);
        setShoppingLists(prev => prev.filter(list => list.id !== listId));
        toast.success('Lista excluída com sucesso');
      } catch (error: any) {
        console.error('Error deleting list:', error);
        toast.error('Erro ao excluir lista');
      }
    }
  };

  const handleCreateCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newCustomItem = {
      name: itemFormData.name,
      category: itemFormData.category,
      unit: itemFormData.unit,
      isCustom: true
    };

    setCustomItems(prev => [...prev, newCustomItem]);
    setShowItemModal(false);
    resetItemForm();
    toast.success('Item personalizado criado com sucesso');
  };

  const addItemToList = async (listId: string, itemTemplate: Omit<ShoppingItem, 'id' | 'quantity' | 'checked' | 'createdBy' | 'order'>) => {
    try {
      const newItem = await shoppingListService.createItem(listId, {
        name: itemTemplate.name,
        quantity: 1,
        unit: itemTemplate.unit,
        category: itemTemplate.category,
        isCustom: itemTemplate.isCustom
      });
      setShoppingLists(prev => prev.map(list =>
        list.id === listId
          ? { ...list, items: [...list.items, newItem] }
          : list
      ));
      toast.success(`${itemTemplate.name} adicionado à lista`);
    } catch (error: any) {
      console.error('Error adding item:', error);
      toast.error('Erro ao adicionar item');
    }
  };

  const updateItemQuantity = async (listId: string, itemId: string, change: number) => {
    const list = shoppingLists.find(l => l.id === listId);
    const item = list?.items.find(i => i.id === itemId);
    if (!item) return;

    const newQuantity = Math.max(0, item.quantity + change);

    if (newQuantity === 0) {
      await removeItemFromList(listId, itemId);
      return;
    }

    try {
      const updated = await shoppingListService.updateItem(listId, itemId, {
        name: item.name,
        quantity: newQuantity,
        unit: item.unit,
        category: item.category,
        checked: item.checked
      });
      setShoppingLists(prev => prev.map(l =>
        l.id === listId
          ? {
              ...l,
              items: l.items.map(i => i.id === itemId ? updated : i)
            }
          : l
      ));
    } catch (error: any) {
      console.error('Error updating quantity:', error);
      toast.error('Erro ao atualizar quantidade');
    }
  };

  const toggleItemCheck = async (listId: string, itemId: string) => {
    const list = shoppingLists.find(l => l.id === listId);
    const item = list?.items.find(i => i.id === itemId);
    if (!item) return;

    try {
      const updated = await shoppingListService.updateItem(listId, itemId, {
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        category: item.category,
        checked: !item.checked
      });
      setShoppingLists(prev => prev.map(l =>
        l.id === listId
          ? {
              ...l,
              items: l.items.map(i => i.id === itemId ? updated : i)
            }
          : l
      ));
    } catch (error: any) {
      console.error('Error toggling item:', error);
      toast.error('Erro ao atualizar item');
    }
  };

  const removeItemFromList = async (listId: string, itemId: string) => {
    try {
      await shoppingListService.deleteItem(listId, itemId);
      setShoppingLists(prev => prev.map(list =>
        list.id === listId
          ? { ...list, items: list.items.filter(item => item.id !== itemId) }
          : list
      ));
    } catch (error: any) {
      console.error('Error removing item:', error);
      toast.error('Erro ao remover item');
    }
  };

  const editList = (list: ShoppingList) => {
    setEditingList(list);
    setListFormData({ name: list.name, description: list.description || '' });
    setShowListModal(true);
  };

  const toggleListExpansion = (listId: string) => {
    setExpandedLists(prev => {
      const newSet = new Set(prev);
      if (newSet.has(listId)) {
        newSet.delete(listId);
      } else {
        newSet.add(listId);
      }
      return newSet;
    });
  };

  const clearCheckedItems = async (listId: string) => {
    if (window.confirm('Remover todos os itens marcados da lista?')) {
      const list = shoppingLists.find(l => l.id === listId);
      if (!list) return;

      const checkedItems = list.items.filter(item => item.checked);
      try {
        await Promise.all(checkedItems.map(item => shoppingListService.deleteItem(listId, item.id)));
        setShoppingLists(prev => prev.map(l =>
          l.id === listId
            ? { ...l, items: l.items.filter(item => !item.checked) }
            : l
        ));
        toast.success('Itens marcados removidos');
      } catch (error: any) {
        console.error('Error clearing checked items:', error);
        toast.error('Erro ao limpar itens');
      }
    }
  };

  // Get all available items (default + custom)
  const allAvailableItems = [...defaultShoppingItems, ...customItems];

  // Group items by category
  const itemsByCategory = allAvailableItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof allAvailableItems>);

  const categories = Object.keys(itemsByCategory).sort();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <ShoppingCart className="h-6 w-6 text-gray-400" />
          <span className="text-lg text-gray-600">Organize suas compras com listas personalizadas</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowItemModal(true)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Item Personalizado
          </button>
          <button
            onClick={() => setShowListModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Lista
          </button>
        </div>
      </div>

      {/* Shopping Lists */}
      <div className="space-y-4">
        {shoppingLists.map((list) => {
          const isExpanded = expandedLists.has(list.id);
          const totalItems = list.items.length;
          const checkedItems = list.items.filter(item => item.checked).length;
          const progress = totalItems > 0 ? (checkedItems / totalItems) * 100 : 0;
          
          return (
            <div key={list.id} className="bg-white shadow rounded-lg overflow-hidden">
              {/* List Header */}
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => toggleListExpansion(list.id)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </button>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{list.name}</h3>
                      {list.description && (
                        <p className="text-sm text-gray-500">{list.description}</p>
                      )}
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-xs text-gray-400">
                          Criado por {list.createdBy}
                        </span>
                        <span className="text-xs text-gray-600">
                          {checkedItems}/{totalItems} itens
                        </span>
                        {totalItems > 0 && (
                          <div className="flex items-center space-x-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-green-600 font-medium">
                              {progress.toFixed(0)}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {checkedItems > 0 && (
                      <button
                        onClick={() => clearCheckedItems(list.id)}
                        className="text-red-600 hover:text-red-800 transition-colors text-sm"
                        title="Limpar itens marcados"
                      >
                        Limpar marcados
                      </button>
                    )}
                    <button
                      onClick={() => editList(list)}
                      className="text-blue-600 hover:text-blue-800 transition-colors"
                      title="Editar lista"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteList(list.id)}
                      className="text-red-600 hover:text-red-800 transition-colors"
                      title="Excluir lista"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* List Items */}
              {isExpanded && (
                <div className="p-6">
                  {list.items.length > 0 ? (
                    <div className="space-y-4">
                      {/* Current Items */}
                      <div className="space-y-2">
                        <h4 className="font-medium text-gray-900">Itens na Lista</h4>
                        {list.items.map((item) => (
                          <div
                            key={item.id}
                            className={`flex items-center justify-between p-3 rounded-lg border ${
                              item.checked ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <button
                                onClick={() => toggleItemCheck(list.id, item.id)}
                                className={`p-1 rounded transition-colors ${
                                  item.checked 
                                    ? 'text-green-600 hover:text-green-800' 
                                    : 'text-gray-400 hover:text-green-600'
                                }`}
                              >
                                {item.checked ? <Check className="h-5 w-5" /> : <div className="h-5 w-5 border-2 border-gray-300 rounded"></div>}
                              </button>
                              <div>
                                <span className={`font-medium ${item.checked ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                                  {item.name}
                                </span>
                                <div className="text-xs text-gray-500">
                                  {item.category} • {item.quantity} {item.unit}
                                  {item.isCustom && <span className="ml-1 text-blue-600">• Personalizado</span>}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => updateItemQuantity(list.id, item.id, -1)}
                                className="text-gray-400 hover:text-red-600 transition-colors"
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                              <span className="text-sm font-medium text-gray-700 min-w-[2rem] text-center">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateItemQuantity(list.id, item.id, 1)}
                                className="text-gray-400 hover:text-green-600 transition-colors"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => removeItemFromList(list.id, item.id)}
                                className="text-red-600 hover:text-red-800 transition-colors ml-2"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <hr className="my-4" />
                    </div>
                  ) : (
                    <div className="text-center py-4 mb-6">
                      <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">Lista vazia</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Adicione itens da lista abaixo.
                      </p>
                    </div>
                  )}

                  {/* Available Items by Category */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Adicionar Itens</h4>
                    {categories.map((category) => (
                      <div key={category} className="space-y-2">
                        <h5 className="text-sm font-medium text-gray-700 bg-gray-100 px-3 py-1 rounded">
                          {category}
                        </h5>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                          {itemsByCategory[category].map((item, index) => (
                            <button
                              key={`${category}-${index}`}
                              onClick={() => addItemToList(list.id, item)}
                              className="text-left p-2 text-sm bg-white border border-gray-200 rounded hover:bg-blue-50 hover:border-blue-300 transition-colors"
                            >
                              <div className="font-medium text-gray-900">{item.name}</div>
                              <div className="text-xs text-gray-500">
                                {item.unit}
                                {item.isCustom && <span className="ml-1 text-blue-600">• Personalizado</span>}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {shoppingLists.length === 0 && (
          <div className="text-center py-12">
            <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">Nenhuma lista de compras</h3>
            <p className="mt-1 text-sm text-gray-500">
              Crie sua primeira lista de compras para organizar suas compras.
            </p>
            <button
              onClick={() => setShowListModal(true)}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Criar primeira lista
            </button>
          </div>
        )}
      </div>

      {/* List Modal */}
      {showListModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingList ? 'Editar Lista' : 'Nova Lista de Compras'}
              </h3>
              <form onSubmit={editingList ? handleUpdateList : handleCreateList} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome da Lista
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    value={listFormData.name}
                    onChange={(e) => setListFormData({ ...listFormData, name: e.target.value })}
                    placeholder="Ex: Compras da Semana, Supermercado..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição (opcional)
                  </label>
                  <textarea
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    rows={3}
                    value={listFormData.description}
                    onChange={(e) => setListFormData({ ...listFormData, description: e.target.value })}
                    placeholder="Descreva o propósito desta lista..."
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowListModal(false);
                      setEditingList(null);
                      resetListForm();
                    }}
                    className="px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors"
                  >
                    {editingList ? 'Atualizar' : 'Criar Lista'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Custom Item Modal */}
      {showItemModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Criar Item Personalizado
              </h3>
              <form onSubmit={handleCreateCustomItem} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome do Item
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    value={itemFormData.name}
                    onChange={(e) => setItemFormData({ ...itemFormData, name: e.target.value })}
                    placeholder="Nome do produto"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoria
                  </label>
                  <select
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    value={itemFormData.category}
                    onChange={(e) => setItemFormData({ ...itemFormData, category: e.target.value })}
                  >
                    <option value="">Selecione uma categoria</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unidade de Medida
                  </label>
                  <select
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    value={itemFormData.unit}
                    onChange={(e) => setItemFormData({ ...itemFormData, unit: e.target.value })}
                  >
                    <option value="unidade">Unidade</option>
                    <option value="kg">Quilograma (kg)</option>
                    <option value="g">Grama (g)</option>
                    <option value="litro">Litro</option>
                    <option value="ml">Mililitro (ml)</option>
                    <option value="pacote">Pacote</option>
                    <option value="caixa">Caixa</option>
                    <option value="lata">Lata</option>
                    <option value="dúzia">Dúzia</option>
                    <option value="maço">Maço</option>
                    <option value="bandeja">Bandeja</option>
                  </select>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowItemModal(false);
                      resetItemForm();
                    }}
                    className="px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors"
                  >
                    Criar Item
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

export default ShoppingList;