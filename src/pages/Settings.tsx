import React, { useState, useEffect } from 'react';
import { Plus, CreditCard as Edit, Trash2, Settings as SettingsIcon, User, Users, Save, Eye, EyeOff, Shield, Mail, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/api';
import toast from 'react-hot-toast';

interface LinkedUser {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'USER';
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  lastLogin?: string;
}

interface UserFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'ADMIN' | 'USER';
}

interface ProfileFormData {
  name: string;
  email: string;
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

const Settings: React.FC = () => {
  const { user, logout } = useAuth();
  const [linkedUsers, setLinkedUsers] = useState<LinkedUser[]>(() => {
    const saved = localStorage.getItem('linkedUsers');
    return saved ? JSON.parse(saved) : [];
  });
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<LinkedUser | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'users' | 'security'>('profile');

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('linkedUsers', JSON.stringify(linkedUsers));
  }, [linkedUsers]);

  const [userFormData, setUserFormData] = useState<UserFormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'USER'
  });

  const [profileFormData, setProfileFormData] = useState<ProfileFormData>({
    name: user?.name || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });

  // Update profile form when user changes
  useEffect(() => {
    if (user) {
      setProfileFormData(prev => ({
        ...prev,
        name: user.name,
        email: user.email
      }));
    }
  }, [user]);

  const resetUserForm = () => {
    setUserFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'USER'
    });
  };

  const resetProfileForm = () => {
    setProfileFormData(prev => ({
      ...prev,
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: ''
    }));
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validations
    if (userFormData.password !== userFormData.confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    if (userFormData.password.length < 8) {
      toast.error('A senha deve ter pelo menos 8 caracteres');
      return;
    }

    // Check if email already exists locally
    const emailExists = linkedUsers.some(u => u.email === userFormData.email) ||
                       user?.email === userFormData.email;

    if (emailExists) {
      toast.error('Este e-mail já está em uso');
      return;
    }

    try {
      // Create user in the backend
      await authService.register(userFormData.email, userFormData.password, userFormData.name);

      const newUser: LinkedUser = {
        id: Date.now().toString(),
        name: userFormData.name,
        email: userFormData.email,
        role: userFormData.role,
        isActive: true,
        createdBy: user?.name || 'Admin',
        createdAt: new Date().toISOString()
      };

      setLinkedUsers(prev => [...prev, newUser]);
      setShowUserModal(false);
      setEditingUser(null);
      resetUserForm();
      toast.success('Usuário criado com sucesso! Agora ele pode fazer login.');
    } catch (error: any) {
      console.error('Error creating user:', error);
      const message = error.response?.data?.error || 'Erro ao criar usuário';
      toast.error(message);
    }
  };

  const handleUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingUser) return;

    // Check if email already exists (excluding current user)
    const emailExists = linkedUsers.some(u => 
      u.email === userFormData.email && u.id !== editingUser.id
    ) || (user?.email === userFormData.email);
    
    if (emailExists) {
      toast.error('Este e-mail já está em uso');
      return;
    }

    setLinkedUsers(prev => prev.map(u => 
      u.id === editingUser.id 
        ? { 
            ...u, 
            name: userFormData.name,
            email: userFormData.email,
            role: userFormData.role
          }
        : u
    ));

    setShowUserModal(false);
    setEditingUser(null);
    resetUserForm();
    toast.success('Usuário atualizado com sucesso');
  };

  const handleDeleteUser = (id: string) => {
    const userToDelete = linkedUsers.find(u => u.id === id);
    if (!userToDelete) return;

    if (window.confirm(`Tem certeza que deseja excluir o usuário "${userToDelete.name}"?`)) {
      setLinkedUsers(prev => prev.filter(u => u.id !== id));
      toast.success('Usuário excluído com sucesso');
    }
  };

  const handleToggleUserStatus = (id: string) => {
    setLinkedUsers(prev => prev.map(u => 
      u.id === id ? { ...u, isActive: !u.isActive } : u
    ));
    
    const user = linkedUsers.find(u => u.id === id);
    toast.success(`Usuário ${user?.isActive ? 'desativado' : 'ativado'} com sucesso`);
  };

  const handleEditUser = (user: LinkedUser) => {
    setEditingUser(user);
    setUserFormData({
      name: user.name,
      email: user.email,
      password: '',
      confirmPassword: '',
      role: user.role
    });
    setShowUserModal(true);
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate current password (in a real app, this would be validated on the server)
    if (profileFormData.newPassword && !profileFormData.currentPassword) {
      toast.error('Digite sua senha atual para alterar a senha');
      return;
    }

    if (profileFormData.newPassword && profileFormData.newPassword !== profileFormData.confirmNewPassword) {
      toast.error('As novas senhas não coincidem');
      return;
    }

    if (profileFormData.newPassword && profileFormData.newPassword.length < 8) {
      toast.error('A nova senha deve ter pelo menos 8 caracteres');
      return;
    }

    // In a real app, this would make an API call
    toast.success('Perfil atualizado com sucesso');
    resetProfileForm();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleLabel = (role: 'ADMIN' | 'USER') => {
    return role === 'ADMIN' ? 'Administrador' : 'Usuário';
  };

  const getRoleBadgeColor = (role: 'ADMIN' | 'USER') => {
    return role === 'ADMIN' 
      ? 'bg-purple-100 text-purple-800'
      : 'bg-blue-100 text-blue-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-2">
        <SettingsIcon className="h-6 w-6 text-gray-400" />
        <span className="text-lg text-gray-600">Configurações da conta e gerenciamento de usuários</span>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'profile'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <User className="h-4 w-4 inline mr-2" />
              Meu Perfil
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Users className="h-4 w-4 inline mr-2" />
              Usuários ({linkedUsers.length})
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'security'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Shield className="h-4 w-4 inline mr-2" />
              Segurança
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Informações Pessoais</h3>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nome Completo
                      </label>
                      <input
                        type="text"
                        required
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                        value={profileFormData.name}
                        onChange={(e) => setProfileFormData({ ...profileFormData, name: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        E-mail
                      </label>
                      <input
                        type="email"
                        required
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                        value={profileFormData.email}
                        onChange={(e) => setProfileFormData({ ...profileFormData, email: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h4 className="text-md font-medium text-gray-900 mb-4">Alterar Senha</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Senha Atual
                        </label>
                        <input
                          type="password"
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                          value={profileFormData.currentPassword}
                          onChange={(e) => setProfileFormData({ ...profileFormData, currentPassword: e.target.value })}
                          placeholder="Digite sua senha atual"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nova Senha
                        </label>
                        <input
                          type="password"
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                          value={profileFormData.newPassword}
                          onChange={(e) => setProfileFormData({ ...profileFormData, newPassword: e.target.value })}
                          placeholder="Nova senha (mín. 8 caracteres)"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Confirmar Nova Senha
                        </label>
                        <input
                          type="password"
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                          value={profileFormData.confirmNewPassword}
                          onChange={(e) => setProfileFormData({ ...profileFormData, confirmNewPassword: e.target.value })}
                          placeholder="Confirme a nova senha"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      type="submit"
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Salvar Alterações
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Usuários Vinculados</h3>
                  <p className="text-sm text-gray-500">Gerencie os usuários que têm acesso ao sistema</p>
                </div>
                <button
                  onClick={() => setShowUserModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Usuário
                </button>
              </div>

              {/* Current User Card */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{user?.name}</h4>
                      <p className="text-sm text-gray-600">{user?.email}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                          Administrador Principal
                        </span>
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          Ativo
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    Você
                  </div>
                </div>
              </div>

              {/* Linked Users */}
              {linkedUsers.length > 0 ? (
                <div className="space-y-3">
                  {linkedUsers.map((linkedUser) => (
                    <div key={linkedUser.id} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            linkedUser.isActive ? 'bg-gray-600' : 'bg-gray-400'
                          }`}>
                            <User className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{linkedUser.name}</h4>
                            <p className="text-sm text-gray-600">{linkedUser.email}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(linkedUser.role)}`}>
                                {getRoleLabel(linkedUser.role)}
                              </span>
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                linkedUser.isActive 
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {linkedUser.isActive ? 'Ativo' : 'Inativo'}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              Criado por {linkedUser.createdBy} em {formatDate(linkedUser.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleToggleUserStatus(linkedUser.id)}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                              linkedUser.isActive
                                ? 'text-red-700 bg-red-100 hover:bg-red-200'
                                : 'text-green-700 bg-green-100 hover:bg-green-200'
                            }`}
                          >
                            {linkedUser.isActive ? 'Desativar' : 'Ativar'}
                          </button>
                          <button
                            onClick={() => handleEditUser(linkedUser)}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                            title="Editar usuário"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(linkedUser.id)}
                            className="text-red-600 hover:text-red-800 transition-colors"
                            title="Excluir usuário"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum usuário vinculado</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Adicione usuários para compartilhar o acesso ao sistema.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Configurações de Segurança</h3>
                
                <div className="space-y-6">
                  {/* Session Management */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Gerenciamento de Sessão</h4>
                    <p className="text-sm text-gray-600 mb-4">
                      Controle suas sessões ativas e faça logout de todos os dispositivos.
                    </p>
                    <button
                      onClick={logout}
                      className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 transition-colors"
                    >
                      <Lock className="h-4 w-4 mr-2" />
                      Fazer Logout
                    </button>
                  </div>

                  {/* Data Management */}
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Gerenciamento de Dados</h4>
                    <p className="text-sm text-gray-600 mb-4">
                      Seus dados são armazenados localmente no navegador. Use as opções abaixo para gerenciar seus dados.
                    </p>
                    <div className="space-x-3">
                      <button
                        onClick={() => {
                          const data = {
                            categories: localStorage.getItem('categories'),
                            transactions: localStorage.getItem('transactions'),
                            linkedUsers: localStorage.getItem('linkedUsers'),
                            savingsAccounts: localStorage.getItem('savingsAccounts'),
                            contributions: localStorage.getItem('contributions'),
                            wishlists: localStorage.getItem('wishlists'),
                            simulatedTransactions: localStorage.getItem('simulatedTransactions')
                          };
                          const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `backup-financas-${new Date().toISOString().split('T')[0]}.json`;
                          a.click();
                          URL.revokeObjectURL(url);
                          toast.success('Backup criado com sucesso');
                        }}
                        className="inline-flex items-center px-4 py-2 border border-blue-300 rounded-md shadow-sm text-sm font-medium text-blue-700 bg-white hover:bg-blue-50 transition-colors"
                      >
                        Fazer Backup dos Dados
                      </button>
                    </div>
                  </div>

                  {/* Account Info */}
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Informações da Conta</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p><strong>Usuário:</strong> {user?.name}</p>
                      <p><strong>E-mail:</strong> {user?.email}</p>
                      <p><strong>Usuários vinculados:</strong> {linkedUsers.length}</p>
                      <p><strong>Tipo de conta:</strong> Administrador Principal</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
              </h3>
              <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    value={userFormData.name}
                    onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                    placeholder="Nome do usuário"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    E-mail
                  </label>
                  <input
                    type="email"
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    value={userFormData.email}
                    onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                    placeholder="email@exemplo.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nível de Acesso
                  </label>
                  <select
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    value={userFormData.role}
                    onChange={(e) => setUserFormData({ 
                      ...userFormData, 
                      role: e.target.value as 'ADMIN' | 'USER'
                    })}
                  >
                    <option value="USER">Usuário - Acesso básico</option>
                    <option value="ADMIN">Administrador - Acesso completo</option>
                  </select>
                </div>

                {!editingUser && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Senha
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          className="w-full border border-gray-300 rounded-md px-3 py-2 pr-10"
                          value={userFormData.password}
                          onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                          placeholder="Mínimo 8 caracteres"
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Confirmar Senha
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          required
                          className="w-full border border-gray-300 rounded-md px-3 py-2 pr-10"
                          value={userFormData.confirmPassword}
                          onChange={(e) => setUserFormData({ ...userFormData, confirmPassword: e.target.value })}
                          placeholder="Confirme a senha"
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                        </button>
                      </div>
                    </div>
                  </>
                )}

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserModal(false);
                      setEditingUser(null);
                      resetUserForm();
                    }}
                    className="px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors"
                  >
                    {editingUser ? 'Atualizar' : 'Criar Usuário'}
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

export default Settings;