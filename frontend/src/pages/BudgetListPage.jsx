import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { budgets, actions } from '../api';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';
import TrialBlockModal from '../components/TrialBlockModal';

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
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    marginBottom: 'var(--space-lg)'
                }}>
                    <div className="card" style={{ borderLeft: '6px solid #16a34a' }}>
                        <div className="text-secondary text-sm" style={{ marginBottom: 'var(--space-xs)' }}>
                            Aprovados este mês
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#16a34a' }}>
                            {formatCurrency(stats.approvedTotal)}
                        </div>
                    </div>

                    <div className="card" style={{ borderLeft: '6px solid #f59e0b' }}>
                        <div className="text-secondary text-sm" style={{ marginBottom: 'var(--space-xs)' }}>
                            Pendentes
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#b45309' }}>
                            {formatCurrency(stats.pendingTotal)}
                        </div>
                    </div>

                    <div className="card" style={{ borderLeft: '6px solid #0ea5e9' }}>
                        <div className="text-secondary text-sm" style={{ marginBottom: 'var(--space-xs)' }}>
                            Taxa de conversão
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0ea5e9' }}>
                            {Math.round(stats.conversionRate * 100)}%
                        </div>
                    </div>
                </div>

                {renewal && (
                    <div className="card" style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 'var(--space-lg)',
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
                            >
                                {renewLoading ? 'Abrindo...' : 'Renovar no WhatsApp'}
                            </button>
                        )}
                    </div>
                )}

                <div className="flex justify-between items-center mb-xl">
                    <div>
                        <h1>Orçamentos</h1>
                        {!isPaidActive && (
                            <span className="badge badge-trial mt-sm">
                                {user.trial_budget_count}/3 orçamentos grátis
                            </span>
                        )}
                    </div>
                    <div className="flex gap-md">
                        <Link to="/clients" className="btn btn-secondary">
                            Gerenciar Clientes
                        </Link>
                        <button onClick={handleNewBudget} className="btn btn-primary">
                            + Novo Orçamento
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center" style={{ padding: 'var(--space-xl)' }}>
                        Carregando...
                    </div>
                ) : budgetList.length === 0 ? (
                    <div className="empty-state">
                        <h3>Nenhum orçamento criado ainda</h3>
                        <p>Crie seu primeiro orçamento profissional em 2 minutos!</p>
                        <button onClick={handleNewBudget} className="btn btn-primary mt-lg">
                            Criar Primeiro Orçamento
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
                        {budgetList.map((budget) => (
                            <Link
                                key={budget.id}
                                to={`/budgets/${budget.id}`}
                                style={{ textDecoration: 'none', color: 'inherit' }}
                            >
                                <div className="card" style={{ transition: 'transform 0.2s' }}>
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <div className="flex items-center gap-md mb-sm">
                                                <h3>Orçamento #{String(budget.numero).padStart(4, '0')}</h3>
                                                <StatusBadge status={budget.status} />
                                            </div>
                                            <p className="text-secondary text-sm">
                                                Cliente: {budget.client_nome}
                                            </p>
                                            <p className="text-secondary text-xs mt-sm">
                                                {formatDate(budget.data)}
                                            </p>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--primary)' }}>
                                                {formatCurrency(budget.total)}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={(event) => {
                                                    event.preventDefault();
                                                    event.stopPropagation();
                                                    handleDuplicate(budget.id);
                                                }}
                                                className="btn btn-secondary btn-sm"
                                                style={{ marginTop: 'var(--space-sm)' }}
                                                disabled={duplicatingId === budget.id}
                                            >
                                                {duplicatingId === budget.id ? 'Duplicando...' : 'Duplicar'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {showTrialModal && <TrialBlockModal onClose={() => setShowTrialModal(false)} />}
        </div>
    );
}
