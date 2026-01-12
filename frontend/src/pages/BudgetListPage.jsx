import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { budgets } from '../api';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';
import TrialBlockModal from '../components/TrialBlockModal';

export default function BudgetListPage() {
    const { user } = useAuth();
    const [budgetList, setBudgetList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showTrialModal, setShowTrialModal] = useState(false);

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
        if (!user.is_paid && user.trial_budget_count >= 3) {
            setShowTrialModal(true);
        } else {
            window.location.href = '/budgets/new';
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
                            Aprovados este mes
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
                            Taxa de conversao
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0ea5e9' }}>
                            {Math.round(stats.conversionRate * 100)}%
                        </div>
                    </div>
                </div>
                <div className="flex justify-between items-center mb-xl">
                    <div>
                        <h1>Orçamentos</h1>
                        {!user.is_paid && (
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
