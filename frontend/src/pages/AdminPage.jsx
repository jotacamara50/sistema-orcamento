import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../contexts/AuthContext';

export default function AdminPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [expiringUsers, setExpiringUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('users');

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
    const primeiroNome = nome.split(' ')[0];
    const message = encodeURIComponent(`Olá, ${primeiroNome}! Tudo bem?

Aqui é a Juliana, do atendimento do OrçaZap.

Vi que você acabou de realizar seu cadastro no sistema. Seja muito bem-vindo!

Passei rapidinho só para saber: você conseguiu gerar seu primeiro orçamento em PDF para testar ou ficou com alguma dúvida?

Se precisar de ajuda, é só me chamar por aqui, combinado?`);
    window.open(`https://wa.me/55${cleanPhone}?text=${message}`, '_blank');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusBadge = (user) => {
    if (user.is_paid_active) {
      return <span style={{ padding: '4px 8px', fontSize: '0.75rem', borderRadius: '12px', background: '#d1fae5', color: '#065f46' }}>Pago ({user.days_remaining}d)</span>;
    }
    if (user.is_blocked) {
      return <span style={{ padding: '4px 8px', fontSize: '0.75rem', borderRadius: '12px', background: '#fee2e2', color: '#991b1b' }}>Bloqueado</span>;
    }
    if (user.is_trial) {
      return <span style={{ padding: '4px 8px', fontSize: '0.75rem', borderRadius: '12px', background: '#dbeafe', color: '#1e40af' }}>Trial ({3 - user.trial_budget_count})</span>;
    }
    return <span style={{ padding: '4px 8px', fontSize: '0.75rem', borderRadius: '12px', background: '#f3f4f6', color: '#374151' }}>Inativo</span>;
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div>Carregando painel...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background-secondary)' }}>
      {/* Header Admin */}
      <div style={{ 
        background: 'white', 
        borderBottom: '1px solid var(--border)', 
        padding: 'var(--space-lg)',
        marginBottom: 'var(--space-xl)'
      }}>
        <div style={{ 
          maxWidth: '1400px', 
          margin: '0 auto', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center' 
        }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>
            🔐 Painel Administrativo
          </h1>
          <button onClick={handleLogout} className="btn btn-secondary btn-sm">
            Sair
          </button>
        </div>
      </div>

      <div className="container" style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 var(--space-lg) var(--space-xl)' }}>

        {/* Estatísticas */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            <div className="card" style={{ padding: 'var(--space-lg)' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Total de Usuários</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.total_users}</div>
            </div>
            <div className="card" style={{ padding: 'var(--space-lg)' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Novos Hoje</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2563eb' }}>{stats.new_today}</div>
            </div>
            <div className="card" style={{ padding: 'var(--space-lg)' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Pagos Ativos</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#16a34a' }}>{stats.paid_active}</div>
            </div>
            <div className="card" style={{ padding: 'var(--space-lg)' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Em Trial</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ca8a04' }}>{stats.trial_users}</div>
            </div>
            <div className="card" style={{ padding: 'var(--space-lg)' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Bloqueados</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#dc2626' }}>{stats.blocked_users}</div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div style={{ marginBottom: 'var(--space-lg)', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', gap: '2rem' }}>
            <button
              onClick={() => setActiveTab('users')}
              style={{
                padding: '1rem 0.5rem',
                border: 'none',
                background: 'transparent',
                borderBottom: activeTab === 'users' ? '2px solid var(--primary)' : '2px solid transparent',
                color: activeTab === 'users' ? 'var(--primary)' : 'var(--text-secondary)',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              Todos os Usuários ({users.length})
            </button>
            <button
              onClick={() => setActiveTab('expiring')}
              style={{
                padding: '1rem 0.5rem',
                border: 'none',
                background: 'transparent',
                borderBottom: activeTab === 'expiring' ? '2px solid var(--primary)' : '2px solid transparent',
                color: activeTab === 'expiring' ? 'var(--primary)' : 'var(--text-secondary)',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              Planos a Vencer ({expiringUsers.length})
            </button>
          </div>
        </div>

        {activeTab === 'users' && (
          <>
            {/* Filtros */}
            <div className="card" style={{ padding: 'var(--space-lg)', marginBottom: 'var(--space-lg)' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>
                    Filtrar por data
                  </label>
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="input"
                    style={{ minWidth: '150px' }}
                  >
                    <option value="">Todos</option>
                    <option value="today">Hoje</option>
                    <option value="yesterday">Ontem</option>
                    <option value="week">Última semana</option>
                    <option value="month">Último mês</option>
                  </select>
                </div>

                <div style={{ flex: 1, minWidth: '250px' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>
                    Buscar
                  </label>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Nome ou email..."
                    className="input"
                    style={{ width: '100%', maxWidth: '400px' }}
                  />
                </div>
              </div>
            </div>

            {/* Lista de usuários */}
            <div className="card" style={{ overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--background-secondary)' }}>
                    <th style={{ padding: 'var(--space-md)', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                      Nome/Email
                    </th>
                    <th style={{ padding: 'var(--space-md)', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                      Telefone
                    </th>
                    <th style={{ padding: 'var(--space-md)', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                      Status
                    </th>
                    <th style={{ padding: 'var(--space-md)', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                      Cadastro
                    </th>
                    <th style={{ padding: 'var(--space-md)', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: 'var(--space-md)' }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{user.nome}</div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{user.email}</div>
                        {user.tipo_servico && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user.tipo_servico}</div>
                        )}
                      </td>
                      <td style={{ padding: 'var(--space-md)', fontSize: '0.875rem' }}>
                        {user.telefone || '-'}
                      </td>
                      <td style={{ padding: 'var(--space-md)' }}>
                        {getStatusBadge(user)}
                        {user.paid_until && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                            Até {formatDate(user.paid_until)}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: 'var(--space-md)', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        {formatDate(user.created_at)}
                      </td>
                      <td style={{ padding: 'var(--space-md)' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                          {user.telefone && (
                            <button
                              onClick={() => openWhatsApp(user.telefone, user.nome)}
                              className="btn btn-sm"
                              style={{ background: '#16a34a', color: 'white', fontSize: '0.75rem' }}
                              title="WhatsApp"
                            >
                              📱 WhatsApp
                            </button>
                          )}
                          
                          {!user.is_paid_active && (
                            <>
                              <button
                                onClick={() => activatePlan(user.id, 30)}
                                className="btn btn-primary btn-sm"
                                style={{ fontSize: '0.75rem' }}
                              >
                                ✓ 30 dias
                              </button>
                              <button
                                onClick={() => activatePlan(user.id, 90)}
                                className="btn btn-sm"
                                style={{ background: '#9333ea', color: 'white', fontSize: '0.75rem' }}
                              >
                                ✓ 90 dias
                              </button>
                            </>
                          )}
                          
                          {user.is_paid_active && (
                            <button
                              onClick={() => deactivatePlan(user.id)}
                              className="btn btn-sm"
                              style={{ background: '#dc2626', color: 'white', fontSize: '0.75rem' }}
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
                <div style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--text-secondary)' }}>
                  Nenhum usuário encontrado
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'expiring' && (
          <div className="card" style={{ overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--background-secondary)' }}>
                  <th style={{ padding: 'var(--space-md)', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                    Nome/Email
                  </th>
                  <th style={{ padding: 'var(--space-md)', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                    Telefone
                  </th>
                  <th style={{ padding: 'var(--space-md)', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                    Vencimento
                  </th>
                  <th style={{ padding: 'var(--space-md)', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                    Dias Restantes
                  </th>
                  <th style={{ padding: 'var(--space-md)', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {expiringUsers.map((user) => (
                  <tr key={user.id} style={{ borderBottom: '1px solid var(--border)', background: '#fef3c7' }}>
                    <td style={{ padding: 'var(--space-md)' }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{user.nome}</div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{user.email}</div>
                    </td>
                    <td style={{ padding: 'var(--space-md)', fontSize: '0.875rem' }}>
                      {user.telefone || '-'}
                    </td>
                    <td style={{ padding: 'var(--space-md)', fontSize: '0.875rem' }}>
                      {formatDate(user.paid_until)}
                    </td>
                    <td style={{ padding: 'var(--space-md)' }}>
                      <span style={{
                        padding: '4px 8px',
                        fontSize: '0.75rem',
                        borderRadius: '12px',
                        background: user.days_remaining <= 3 ? '#fee2e2' : '#fef3c7',
                        color: user.days_remaining <= 3 ? '#991b1b' : '#92400e'
                      }}>
                        {user.days_remaining} dias
                      </span>
                    </td>
                    <td style={{ padding: 'var(--space-md)' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {user.telefone && (
                          <button
                            onClick={() => openWhatsApp(user.telefone, user.nome)}
                            className="btn btn-sm"
                            style={{ background: '#16a34a', color: 'white', fontSize: '0.75rem' }}
                          >
                            📱 WhatsApp
                          </button>
                        )}
                        <button
                          onClick={() => activatePlan(user.id, 30)}
                          className="btn btn-primary btn-sm"
                          style={{ fontSize: '0.75rem' }}
                        >
                          🔄 Renovar 30d
      div                  </button>
                        <button
                          onClick={() => activatePlan(user.id, 90)}
                          className="btn btn-sm"
                          style={{ background: '#9333ea', color: 'white', fontSize: '0.75rem' }}
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
              <div style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--text-secondary)' }}>
                Nenhum plano a vencer nos próximos 7 dias
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
