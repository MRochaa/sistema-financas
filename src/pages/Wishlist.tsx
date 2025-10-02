import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Heart, ExternalLink, Check, X, GripVertical, ChevronDown, ChevronUp } from 'lucide-react';
import { useData } from '../contexts/DataContext';

interface WishlistItem {
  id: string;
  name: string;
  price?: number;
  image?: string;
  link?: string;
  approved: boolean;
  approvedBy?: string;
  createdBy: string;
  order: number;
}

interface Wishlist {
  id: string;
  name: string;
  description?: string;
  items: WishlistItem[];
  createdBy: string;
  createdAt: string;
}

const Wishlist: React.FC = () => {
  const { user } = useData();
  const [wishlists, setWishlists] = useState<Wishlist[]>(() => {
    const saved = localStorage.getItem('wishlists');
    return saved ? JSON.parse(saved) : [];
  });
  const [showListModal, setShowListModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingList, setEditingList] = useState<Wishlist | null>(null);
  const [editingItem, setEditingItem] = useState<WishlistItem | null>(null);
  const [selectedListId, setSelectedListId] = useState<string>('');
  const [expandedLists, setExpandedLists] = useState<Set<string>>(new Set());
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('wishlists', JSON.stringify(wishlists));
  }, [wishlists]);

  const [listFormData, setListFormData] = useState({
    name: '',
    description: ''
  });

  const [itemFormData, setItemFormData] = useState({
    name: '',
    price: '',
    image: '',
    link: ''
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleCreateList = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newList: Wishlist = {
      id: Date.now().toString(),
      name: listFormData.name,
      description: listFormData.description,
      items: [],
      createdBy: user?.name || 'Usuário',
      createdAt: new Date().toISOString()
    };

    setWishlists(prev => [...prev, newList]);
    setShowListModal(false);
    setEditingList(null);
    resetListForm();
  };

  const handleUpdateList = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingList) return;

    setWishlists(prev => prev.map(list => 
      list.id === editingList.id 
        ? { ...list, name: listFormData.name, description: listFormData.description }
        : list
    ));
    
    setShowListModal(false);
    setEditingList(null);
    resetListForm();
  };

  const handleDeleteList = (listId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta lista de desejos?')) {
      setWishlists(prev => prev.filter(list => list.id !== listId));
    }
  };

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedListId) return;

    const targetList = wishlists.find(list => list.id === selectedListId);
    if (!targetList) return;

    const newItem: WishlistItem = {
      id: Date.now().toString(),
      name: itemFormData.name,
      price: itemFormData.price ? parseFloat(itemFormData.price) : undefined,
      image: itemFormData.image || undefined,
      link: itemFormData.link || undefined,
      approved: false,
      createdBy: user?.name || 'Usuário',
      order: targetList.items.length
    };

    setWishlists(prev => prev.map(list => 
      list.id === selectedListId 
        ? { ...list, items: [...list.items, newItem] }
        : list
    ));

    setShowItemModal(false);
    setEditingItem(null);
    resetItemForm();
  };

  const handleUpdateItem = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingItem || !selectedListId) return;

    setWishlists(prev => prev.map(list => 
      list.id === selectedListId 
        ? {
            ...list,
            items: list.items.map(item => 
              item.id === editingItem.id 
                ? {
                    ...item,
                    name: itemFormData.name,
                    price: itemFormData.price ? parseFloat(itemFormData.price) : undefined,
                    image: itemFormData.image || undefined,
                    link: itemFormData.link || undefined
                  }
                : item
            )
          }
        : list
    ));

    setShowItemModal(false);
    setEditingItem(null);
    resetItemForm();
  };

  const handleDeleteItem = (listId: string, itemId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este item?')) {
      setWishlists(prev => prev.map(list => 
        list.id === listId 
          ? { ...list, items: list.items.filter(item => item.id !== itemId) }
          : list
      ));
    }
  };

  const handleApproveItem = (listId: string, itemId: string) => {
    setWishlists(prev => prev.map(list => 
      list.id === listId 
        ? {
            ...list,
            items: list.items.map(item => 
              item.id === itemId 
                ? { ...item, approved: !item.approved, approvedBy: !item.approved ? user?.name : undefined }
                : item
            )
          }
        : list
    ));
  };

  const handleDragStart = (itemId: string) => {
    setDraggedItem(itemId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetItemId: string, listId: string) => {
    e.preventDefault();
    
    if (!draggedItem || draggedItem === targetItemId) return;

    setWishlists(prev => prev.map(list => {
      if (list.id !== listId) return list;

      const items = [...list.items];
      const draggedIndex = items.findIndex(item => item.id === draggedItem);
      const targetIndex = items.findIndex(item => item.id === targetItemId);

      if (draggedIndex === -1 || targetIndex === -1) return list;

      // Remove dragged item and insert at target position
      const [draggedItemObj] = items.splice(draggedIndex, 1);
      items.splice(targetIndex, 0, draggedItemObj);

      // Update order
      const updatedItems = items.map((item, index) => ({ ...item, order: index }));

      return { ...list, items: updatedItems };
    }));

    setDraggedItem(null);
  };

  const resetListForm = () => {
    setListFormData({ name: '', description: '' });
  };

  const resetItemForm = () => {
    setItemFormData({ name: '', price: '', image: '', link: '' });
  };

  const editList = (list: Wishlist) => {
    setEditingList(list);
    setListFormData({ name: list.name, description: list.description || '' });
    setShowListModal(true);
  };

  const editItem = (item: WishlistItem, listId: string) => {
    setEditingItem(item);
    setSelectedListId(listId);
    setItemFormData({
      name: item.name,
      price: item.price?.toString() || '',
      image: item.image || '',
      link: item.link || ''
    });
    setShowItemModal(true);
  };

  const addItemToList = (listId: string) => {
    setSelectedListId(listId);
    setShowItemModal(true);
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

  const calculateListTotal = (items: WishlistItem[]) => {
    return items.reduce((total, item) => total + (item.price || 0), 0);
  };

  const getApprovedTotal = (items: WishlistItem[]) => {
    return items.filter(item => item.approved).reduce((total, item) => total + (item.price || 0), 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Heart className="h-6 w-6 text-gray-400" />
          <span className="text-lg text-gray-600">Gerencie suas listas de desejos e organize suas compras</span>
        </div>
        <button
          onClick={() => setShowListModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Lista
        </button>
      </div>

      {/* Wishlists */}
      <div className="space-y-4">
        {wishlists.map((wishlist) => {
          const isExpanded = expandedLists.has(wishlist.id);
          const listTotal = calculateListTotal(wishlist.items);
          const approvedTotal = getApprovedTotal(wishlist.items);
          
          return (
            <div key={wishlist.id} className="bg-white shadow rounded-lg overflow-hidden">
              {/* List Header */}
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => toggleListExpansion(wishlist.id)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </button>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{wishlist.name}</h3>
                      {wishlist.description && (
                        <p className="text-sm text-gray-500">{wishlist.description}</p>
                      )}
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-xs text-gray-400">
                          Criado por {wishlist.createdBy}
                        </span>
                        <span className="text-xs text-gray-400">
                          {wishlist.items.length} {wishlist.items.length === 1 ? 'item' : 'itens'}
                        </span>
                        {listTotal > 0 && (
                          <span className="text-xs text-gray-600 font-medium">
                            Total: {formatCurrency(listTotal)}
                          </span>
                        )}
                        {approvedTotal > 0 && (
                          <span className="text-xs text-green-600 font-medium">
                            Aprovado: {formatCurrency(approvedTotal)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => addItemToList(wishlist.id)}
                      className="text-pink-600 hover:text-pink-800 transition-colors"
                      title="Adicionar item"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => editList(wishlist)}
                      className="text-blue-600 hover:text-blue-800 transition-colors"
                      title="Editar lista"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteList(wishlist.id)}
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
                  {wishlist.items.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {wishlist.items
                        .sort((a, b) => a.order - b.order)
                        .map((item) => (
                          <div
                            key={item.id}
                            draggable
                            onDragStart={() => handleDragStart(item.id)}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, item.id, wishlist.id)}
                            className={`bg-gray-50 rounded-lg p-4 border-2 border-dashed border-transparent hover:border-gray-300 transition-all cursor-move ${
                              item.approved ? 'ring-2 ring-green-200 bg-green-50' : ''
                            }`}
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center space-x-2">
                                <GripVertical className="h-4 w-4 text-gray-400" />
                                <h4 className="font-medium text-gray-900 text-sm">{item.name}</h4>
                              </div>
                              <div className="flex items-center space-x-1">
                                <button
                                  onClick={() => handleApproveItem(wishlist.id, item.id)}
                                  className={`p-1 rounded transition-colors ${
                                    item.approved 
                                      ? 'text-green-600 hover:text-green-800' 
                                      : 'text-gray-400 hover:text-green-600'
                                  }`}
                                  title={item.approved ? 'Remover aprovação' : 'Aprovar compra'}
                                >
                                  {item.approved ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                                </button>
                                <button
                                  onClick={() => editItem(item, wishlist.id)}
                                  className="text-blue-600 hover:text-blue-800 transition-colors p-1"
                                  title="Editar item"
                                >
                                  <Edit className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={() => handleDeleteItem(wishlist.id, item.id)}
                                  className="text-red-600 hover:text-red-800 transition-colors p-1"
                                  title="Excluir item"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </div>

                            {item.image && (
                              <div className="mb-3">
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="w-full h-32 object-cover rounded-md"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              </div>
                            )}

                            <div className="space-y-2">
                              {item.price && (
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-gray-600">Preço:</span>
                                  <span className="font-medium text-gray-900">
                                    {formatCurrency(item.price)}
                                  </span>
                                </div>
                              )}

                              {item.link && (
                                <a
                                  href={item.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors"
                                >
                                  <ExternalLink className="h-3 w-3 mr-1" />
                                  Ver produto
                                </a>
                              )}

                              <div className="flex justify-between items-center text-xs text-gray-500">
                                <span>Por {item.createdBy}</span>
                                {item.approved && item.approvedBy && (
                                  <span className="text-green-600">✓ {item.approvedBy}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Heart className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum item na lista</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Comece adicionando itens à sua lista de desejos.
                      </p>
                      <button
                        onClick={() => addItemToList(wishlist.id)}
                        className="mt-3 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-pink-700 bg-pink-100 hover:bg-pink-200 transition-colors"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Adicionar item
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {wishlists.length === 0 && (
          <div className="text-center py-12">
            <Heart className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">Nenhuma lista de desejos</h3>
            <p className="mt-1 text-sm text-gray-500">
              Crie sua primeira lista de desejos para organizar suas compras.
            </p>
            <button
              onClick={() => setShowListModal(true)}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-pink-600 hover:bg-pink-700 transition-colors"
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
                {editingList ? 'Editar Lista' : 'Nova Lista de Desejos'}
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
                    placeholder="Ex: Eletrônicos, Casa Nova, Viagem..."
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
                    className="px-4 py-2 text-sm text-white bg-pink-600 hover:bg-pink-700 rounded-md transition-colors"
                  >
                    {editingList ? 'Atualizar' : 'Criar Lista'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Item Modal */}
      {showItemModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingItem ? 'Editar Item' : 'Novo Item'}
              </h3>
              <form onSubmit={editingItem ? handleUpdateItem : handleCreateItem} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome do Produto
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
                    Preço (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    value={itemFormData.price}
                    onChange={(e) => setItemFormData({ ...itemFormData, price: e.target.value })}
                    placeholder="0,00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL da Imagem
                  </label>
                  <input
                    type="url"
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    value={itemFormData.image}
                    onChange={(e) => setItemFormData({ ...itemFormData, image: e.target.value })}
                    placeholder="https://exemplo.com/imagem.jpg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Link do Produto
                  </label>
                  <input
                    type="url"
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    value={itemFormData.link}
                    onChange={(e) => setItemFormData({ ...itemFormData, link: e.target.value })}
                    placeholder="https://loja.com/produto"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowItemModal(false);
                      setEditingItem(null);
                      setSelectedListId('');
                      resetItemForm();
                    }}
                    className="px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm text-white bg-pink-600 hover:bg-pink-700 rounded-md transition-colors"
                  >
                    {editingItem ? 'Atualizar' : 'Adicionar'}
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

export default Wishlist;