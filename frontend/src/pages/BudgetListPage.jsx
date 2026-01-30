import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { budgets, actions } from '../api';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';
import TrialBlockModal from '../components/TrialBlockModal';
import FirstTimeTooltip from '../components/FirstTimeTooltip';
import Toast from '../components/Toast';

export default function BudgetListPage() {
    const { user, updateUser } = useAuth();
    const navigate = useNavigate();
    const isPaidActive = useMemo(() => {
        if (!user || !user.is_paid) {
            return false;
        }
        if (!user.paid_until) {
            return true;
        }
        const paidUntilValue = String(user.paid_until);
        const paidUntilMs = Date.parse(paidUntilValue);
        if (Number.isNaN(paidUntilMs)) {
            return false;
        }
        const endOfDay = new Date(paidUntilMs);
        endOfDay.setHours(23, 59, 59, 999);
        return endOfDay.getTime() >= Date.now();
    }, [user]);
    const [budgetList, setBudgetList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showTrialModal, setShowTrialModal] = useState(false);
    const [duplicatingId, setDuplicatingId] = useState(null);
    const [renewLoading, setRenewLoading] = useState(false);
    const [toast, setToast] = useState(null);

    useEffect(() => {
        loadBudgets();
    }, []);

    const loadBudgets = async () => {
        try {
            const res = await budgets.list();
            setBudgetList(res.data);
        } catch (error) {
            console.error('Error loading budgets:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleNewBudget = () => {
        if (!isPaidActive && user.trial_budget_count >= 3) {
            setShowTrialModal(true);
        } else {
            window.location.href = '/budgets/new';
        }
    };

    const handleDuplicate = async (budgetId) => {
        if (!isPaidActive && user.trial_budget_count >= 3) {
            setShowTrialModal(true);
            return;
        }

        setDuplicatingId(budgetId);
        try {
            const res = await budgets.get(budgetId);
            const { client_id, observacoes, items, logo_data } = res.data;
            const created = await budgets.create({
                client_id,
                observacoes,
                items,
                logo_data
            });

            if (!isPaidActive) {
                updateUser({ trial_budget_count: user.trial_budget_count + 1 });
            }

            setToast({ message: 'Orçamento duplicado com sucesso!', type: 'success' });
            navigate(`/budgets/${created.data.id}/edit`);
        } catch (error) {
            if (error.response?.data?.trial_expired) {
                setShowTrialModal(true);
            } else {
                console.error('Error duplicating budget:', error);
                alert(error.response?.data?.error || 'Erro ao duplicar orçamento');
            }
        } finally {
            setDuplicatingId(null);
        }
    };

    const handleQuickWhatsApp = async (e, budgetId) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            const res = await actions.getWhatsAppLink(budgetId);
            window.open(res.data.whatsapp_link, '_blank');
            setToast({ message: 'WhatsApp aberto! Envie a mensagem pro cliente.', type: 'success' });
        } catch (error) {
            console.error('Error generating WhatsApp link:', error);
            alert(error.response?.data?.error || 'Erro ao gerar link do WhatsApp');
        }
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('pt-BR');
    };

    const stats = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        let approvedTotal = 0;
        let pendingTotal = 0;
        let approvedCount = 0;
        let refusedCount = 0;

        for (const budget of budgetList) {
            const total = Number(budget.total) || 0;
            const status = budget.status;
            const budgetDate = new Date(budget.data);
            const isCurrentMonth = budgetDate.getMonth() === currentMonth && budgetDate.getFullYear() === currentYear;

            if (status === 'aprovado') {
                approvedCount += 1;
                if (isCurrentMonth) {
                    approvedTotal += total;
                }
            }

            if (status === 'rascunho' || status === 'enviado') {
                pendingTotal += total;
            }

            if (status === 'recusado') {
                refusedCount += 1;
            }
        }

        const decidedCount = approvedCount + refusedCount;
        const conversionRate = decidedCount > 0 ? approvedCount / decidedCount : 0;

        return {
            approvedTotal,
            pendingTotal,
            conversionRate
        };
    }, [budgetList]);

    const renewal = useMemo(() => {
        if (!user || !user.paid_until) {
            return null;
        }
        const paidUntilMs = Date.parse(user.paid_until);
        if (Number.isNaN(paidUntilMs)) {
            return null;
        }
        const daysRemaining = Math.ceil((paidUntilMs - Date.now()) / 86400000);
        return {
            daysRemaining,
            paidUntilMs
        };
    }, [user]);

    const isExpired = renewal ? renewal.daysRemaining < 0 : false;
    const isExpiringSoon = renewal ? renewal.daysRemaining >= 0 && renewal.daysRemaining <= 3 : false;

    const handleRenew = async () => {
        setRenewLoading(true);
        try {
            const res = await actions.getActivationLink();
            window.open(res.data.whatsapp_link, '_blank');
        } catch (error) {
            console.error('Error generating activation link:', error);
            alert(error.response?.data?.error || 'Erro ao gerar link de renovação');
        } finally {
            setRenewLoading(false);
        }
    };

    return (
        <div>
            <Navbar />

            <div className="container page">
                <div style={{
                    display: 'grid',
                    gap: 'var(--space-md)',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    marginBottom: 'var(--space-lg)'
                }}>
                    <div className="card" style={{ borderLeft: '6px solid #16a34a' }}>
                        <div className="text-secondary text-sm" style={{ marginBottom: 'var(--space-xs)' }}>
                            Aprovados este mês
                        </div>
                        <div style={{ fontSize: 'clamp(1.25rem, 4vw, 1.5rem)', fontWeight: 700, color: '#16a34a' }}>
                            {formatCurrency(stats.approvedTotal)}
                        </div>
                    </div>

                    <div className="card" style={{ borderLeft: '6px solid #f59e0b' }}>
                        <div className="text-secondary text-sm" style={{ marginBottom: 'var(--space-xs)' }}>
                            Pendentes
                        </div>
                        <div style={{ fontSize: 'clamp(1.25rem, 4vw, 1.5rem)', fontWeight: 700, color: '#b45309' }}>
                            {formatCurrency(stats.pendingTotal)}
                        </div>
                    </div>

                    <div className="card" style={{ borderLeft: '6px solid #0ea5e9' }}>
                        <div className="text-secondary text-sm" style={{ marginBottom: 'var(--space-xs)' }}>
                            Taxa de conversão
                        </div>
                        <div style={{ fontSize: 'clamp(1.25rem, 4vw, 1.5rem)', fontWeight: 700, color: '#0ea5e9' }}>
                            {Math.round(stats.conversionRate * 100)}%
                        </div>
                    </div>
                </div>

                {renewal && (
                    <div className="card renewal-card" style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 'var(--space-md)',
                        marginBottom: 'var(--space-lg)',
                        background: isExpired ? '#fef2f2' : (isExpiringSoon ? '#fef9c3' : '#eff6ff'),
                        borderLeft: isExpired ? '6px solid #dc2626' : (isExpiringSoon ? '6px solid #f59e0b' : '6px solid #0ea5e9')
                    }}>
                        <div>
                            <div style={{ fontWeight: 700, color: isExpired ? '#b91c1c' : (isExpiringSoon ? '#92400e' : '#0ea5e9') }}>
                                {isExpired ? 'Plano vencido' : 'Plano ativo'}
                            </div>
                            <div className="text-secondary text-sm" style={{ marginTop: 'var(--space-xs)' }}>
                                {isExpired
                                    ? `Seu plano venceu há ${Math.abs(renewal.daysRemaining)} dias.`
                                    : `Faltam ${renewal.daysRemaining} dias para vencer.`}
                            </div>
                        </div>
                        {isExpired && (
                            <button
                                type="button"
                                onClick={handleRenew}
                                className="btn btn-primary"
                                disabled={renewLoading}
                                style={{ width: '100%', maxWidth: '300px' }}
                            >
                                {renewLoading ? 'Abrindo...' : 'Renovar no WhatsApp'}
                            </button>
                        )}
                    </div>
                )}

                <div className="budget-header" style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-md)',
                    marginBottom: 'var(--space-xl)'
                }}>
                    <div>
                        <h1>Orçamentos</h1>
                        {!isPaidActive && (
                            <span className="badge badge-trial mt-sm">
                                {user.trial_budget_count}/3 orçamentos grátis
                            </span>
                        )}
                    </div>
                    <div className="budget-actions" style={{
                        display: 'flex',
                        gap: 'var(--space-md)',
                        flexWrap: 'wrap'
                    }}>
                        <Link to="/clients" className="btn btn-secondary" style={{ flex: '0 1 auto', minWidth: '140px' }}>
                            👥 Gerenciar Clientes
                        </Link>
                        <button 
                            onClick={handleNewBudget} 
                            className="btn btn-primary" 
                            style={{ 
                                flex: '1 1 auto', 
                                minWidth: '200px',
                                fontSize: '1.1rem',
                                fontWeight: 700,
                                padding: 'var(--space-md) var(--space-lg)',
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
                            }}
                        >
                            ✨ Criar Novo Orçamento
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center" style={{ padding: 'var(--space-xl)' }}>
                        Carregando...
                    </div>
                ) : budgetList.length === 0 ? (
                    <div className="empty-state" style={{ 
                        textAlign: 'center', 
                        padding: 'clamp(2rem, 5vw, 4rem)',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        borderRadius: '12px',
                        color: 'white',
                        boxShadow: '0 8px 20px rgba(102, 126, 234, 0.2)'
                    }}>
                        <div style={{ fontSize: 'clamp(3rem, 8vw, 5rem)', marginBottom: 'var(--space-lg)' }}>🚀</div>
                        <h2 style={{ color: 'white', fontSize: 'clamp(1.5rem, 4vw, 2rem)', marginBottom: 'var(--space-md)' }}>
                            Bem-vindo! Vamos criar seu primeiro orçamento?
                        </h2>
                        <p style={{ fontSize: 'clamp(1rem, 2.5vw, 1.2rem)', marginBottom: 'var(--space-xl)', opacity: 0.95, maxWidth: '600px', margin: '0 auto var(--space-xl)' }}>
                            É super rápido! Basta preencher os dados do cliente e do serviço. 
                            Em menos de 1 minuto você terá um PDF profissional pronto para enviar.
                        </p>
                        <button 
                            onClick={handleNewBudget} 
                            style={{ 
                                background: 'white',
                                color: '#667eea',
                                padding: 'clamp(0.875rem, 2vw, 1.25rem) clamp(1.5rem, 4vw, 2.5rem)',
                                fontSize: 'clamp(1rem, 2.5vw, 1.2rem)',
                                fontWeight: 'bold',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                transition: 'all 0.2s',
                                minHeight: '56px'
                            }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                            }}
                        >
                            Criar Primeiro Orçamento
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
                        {budgetList.map((budget) => (
                            <div key={budget.id} className="card budget-card" style={{ transition: 'transform 0.2s' }}>
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 'var(--space-md)'
                                }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'flex-start',
                                            marginBottom: '4px',
                                            gap: 'var(--space-sm)'
                                        }}>
                                            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1f2937' }}>
                                                {budget.client_nome}
                                            </h3>
                                            <StatusBadge status={budget.status} />
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: '#6b7280', display: 'flex', gap: '8px' }}>
                                            <span>#{String(budget.numero).padStart(4, '0')}</span>
                                            <span>&bull;</span>
                                            <span>{formatDate(budget.data)}</span>
                                        </div>
                                    </div>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        gap: 'var(--space-md)',
                                        paddingTop: 'var(--space-sm)',
                                        borderTop: '1px solid var(--border)'
                                    }}>
                                        <div style={{ fontSize: 'clamp(1.25rem, 5vw, 1.5rem)', fontWeight: '700', color: 'var(--primary)' }}>
                                            {formatCurrency(budget.total)}
                                        </div>
                                    </div>
                                    
                                    {/* Ações rápidas */}
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))',
                                        gap: 'var(--space-sm)',
                                        paddingTop: 'var(--space-sm)',
                                        borderTop: '1px solid var(--border)'
                                    }}>
                                        <Link
                                            to={`/budgets/${budget.id}`}
                                            className="btn btn-primary btn-sm"
                                            style={{ 
                                                textDecoration: 'none', 
                                                textAlign: 'center',
                                                fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
                                                padding: 'var(--space-sm) var(--space-xs)'
                                            }}
                                        >
                                            👁️ Ver
                                        </Link>
                                        <button
                                            type="button"
                                            onClick={(e) => handleQuickWhatsApp(e, budget.id)}
                                            className="btn btn-sm"
                                            style={{ 
                                                background: '#25D366', 
                                                color: 'white',
                                                border: 'none',
                                                fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
                                                padding: 'var(--space-sm) var(--space-xs)'
                                            }}
                                        >
                                            📱 Zap
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(event) => {
                                                event.preventDefault();
                                                event.stopPropagation();
                                                handleDuplicate(budget.id);
                                            }}
                                            className="btn btn-secondary btn-sm"
                                            disabled={duplicatingId === budget.id}
                                            style={{
                                                fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
                                                padding: 'var(--space-sm) var(--space-xs)'
                                            }}
                                        >
                                            {duplicatingId === budget.id ? '...' : '📋 Copiar'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {showTrialModal && <TrialBlockModal onClose={() => setShowTrialModal(false)} />}
        </div>
    );
}
