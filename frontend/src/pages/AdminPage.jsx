import { useState, useEffect } from 'react';
import api from '../api';

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [expiringUsers, setExpiringUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('users'); // users, expiring

  useEffect(() => {
    loadData();
  }, [filter, search]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter) params.append('filter', filter);
      if (search) params.append('search', search);

      const [usersRes, statsRes, expiringRes] = await Promise.all([
        api.get(`/admin/users?${params.toString()}`),
        api.get('/admin/stats'),
        api.get('/admin/expiring-soon')
      ]);

      setUsers(usersRes.data);
      setStats(statsRes.data);
      setExpiringUsers(expiringRes.data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      alert('Erro ao carregar dados do painel');
    } finally {
      setLoading(false);
    }
  };

  const activatePlan = async (userId, days) => {
    if (!confirm(`Confirma ativação do plano de ${days} dias?`)) return;

    try {
      await api.post(`/admin/activate-plan/${userId}`, { days });
      alert(`Plano de ${days} dias ativado com sucesso!`);
      loadData();
    } catch (error) {
      console.error('Erro ao ativar plano:', error);
      alert('Erro ao ativar plano');
    }
  };

  const deactivatePlan = async (userId) => {
    if (!confirm('Confirma desativação do plano?')) return;

    try {
      await api.post(`/admin/deactivate-plan/${userId}`);
      alert('Plano desativado com sucesso!');
      loadData();
    } catch (error) {
      console.error('Erro ao desativar plano:', error);
      alert('Erro ao desativar plano');
    }
  };

  const openWhatsApp = (telefone, nome) => {
    if (!telefone) {
      alert('Usuário não tem telefone cadastrado');
      return;
    }
    const cleanPhone = telefone.replace(/\D/g, '');
    const message = encodeURIComponent(`Olá ${nome}! Bem-vindo(a) ao OrcaZap! 🎉\n\nEstamos muito felizes em tê-lo(a) conosco. Qualquer dúvida, estou à disposição!`);
    window.open(`https://wa.me/55${cleanPhone}?text=${message}`, '_blank');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusBadge = (user) => {
    if (user.is_paid_active) {
      return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Pago ({user.days_remaining}d)</span>;
    }
    if (user.is_blocked) {
      return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Bloqueado</span>;
    }
    if (user.is_trial) {
      return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">Trial ({3 - user.trial_budget_count})</span>;
    }
    return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">Inativo</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Carregando painel...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Painel Administrativo</h1>

      {/* Estatísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-gray-500 text-sm">Total de Usuários</div>
            <div className="text-3xl font-bold text-gray-900">{stats.total_users}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-gray-500 text-sm">Novos Hoje</div>
            <div className="text-3xl font-bold text-blue-600">{stats.new_today}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-gray-500 text-sm">Pagos Ativos</div>
            <div className="text-3xl font-bold text-green-600">{stats.paid_active}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-gray-500 text-sm">Em Trial</div>
            <div className="text-3xl font-bold text-yellow-600">{stats.trial_users}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-gray-500 text-sm">Bloqueados</div>
            <div className="text-3xl font-bold text-red-600">{stats.blocked_users}</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('users')}
            className={`${
              activeTab === 'users'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Todos os Usuários ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('expiring')}
            className={`${
              activeTab === 'expiring'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Planos a Vencer ({expiringUsers.length})
          </button>
        </nav>
      </div>

      {activeTab === 'users' && (
        <>
          {/* Filtros */}
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <div className="flex flex-wrap gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Filtrar por data
                </label>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="border rounded px-3 py-2"
                >
                  <option value="">Todos</option>
                  <option value="today">Hoje</option>
                  <option value="yesterday">Ontem</option>
                  <option value="week">Última semana</option>
                  <option value="month">Último mês</option>
                </select>
              </div>

              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Buscar
                </label>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Nome ou email..."
                  className="border rounded px-3 py-2 w-full max-w-md"
                />
              </div>
            </div>
          </div>

          {/* Lista de usuários */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Nome/Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Telefone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Cadastro
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{user.nome}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                      {user.tipo_servico && (
                        <div className="text-xs text-gray-400">{user.tipo_servico}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{user.telefone || '-'}</div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(user)}
                      {user.paid_until && (
                        <div className="text-xs text-gray-500 mt-1">
                          Até {formatDate(user.paid_until)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex flex-wrap gap-2">
                        {user.telefone && (
                          <button
                            onClick={() => openWhatsApp(user.telefone, user.nome)}
                            className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-xs"
                            title="WhatsApp"
                          >
                            📱 WhatsApp
                          </button>
                        )}
                        
                        {!user.is_paid_active && (
                          <>
                            <button
                              onClick={() => activatePlan(user.id, 30)}
                              className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-xs"
                            >
                              ✓ 30 dias
                            </button>
                            <button
                              onClick={() => activatePlan(user.id, 90)}
                              className="bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700 text-xs"
                            >
                              ✓ 90 dias
                            </button>
                          </>
                        )}
                        
                        {user.is_paid_active && (
                          <button
                            onClick={() => deactivatePlan(user.id)}
                            className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 text-xs"
                          >
                            ✗ Desativar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {users.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Nenhum usuário encontrado
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'expiring' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Nome/Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Telefone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Vencimento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Dias Restantes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {expiringUsers.map((user) => (
                <tr key={user.id} className="bg-yellow-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{user.nome}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {user.telefone || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {formatDate(user.paid_until)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      user.days_remaining <= 3 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {user.days_remaining} dias
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex flex-wrap gap-2">
                      {user.telefone && (
                        <button
                          onClick={() => openWhatsApp(user.telefone, user.nome)}
                          className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-xs"
                        >
                          📱 WhatsApp
                        </button>
                      )}
                      <button
                        onClick={() => activatePlan(user.id, 30)}
                        className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-xs"
                      >
                        🔄 Renovar 30d
                      </button>
                      <button
                        onClick={() => activatePlan(user.id, 90)}
                        className="bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700 text-xs"
                      >
                        🔄 Renovar 90d
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {expiringUsers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Nenhum plano a vencer nos próximos 7 dias
            </div>
          )}
        </div>
      )}
    </div>
  );
}
