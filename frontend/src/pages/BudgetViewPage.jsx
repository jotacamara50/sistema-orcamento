import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { budgets as budgetsApi, actions } from '../api';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';

export default function BudgetViewPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [budget, setBudget] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadBudget();
    }, [id]);

    const loadBudget = async () => {
        try {
            const res = await budgetsApi.get(id);
            setBudget(res.data);
        } catch (error) {
            console.error('Error loading budget:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPDF = async () => {
        try {
            const res = await actions.downloadPDF(id);
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `orcamento-${String(budget.numero).padStart(4, '0')}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Error downloading PDF:', error);
            alert('Erro ao baixar PDF');
        }
    };

    const handleWhatsApp = async () => {
        try {
            const res = await actions.getWhatsAppLink(id);
            window.open(res.data.whatsapp_link, '_blank');
        } catch (error) {
            console.error('Error generating WhatsApp link:', error);
            alert(error.response?.data?.error || 'Erro ao gerar link do WhatsApp');
        }
    };

    const handleStatusChange = async (newStatus) => {
        try {
            await budgetsApi.update(id, { ...budget, status: newStatus });
            setBudget({ ...budget, status: newStatus });
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Erro ao atualizar status');
        }
    };

    const handleDelete = async () => {
        if (window.confirm('Tem certeza que deseja deletar este orçamento?')) {
            try {
                await budgetsApi.delete(id);
                navigate('/budgets');
            } catch (error) {
                console.error('Error deleting budget:', error);
                alert('Erro ao deletar orçamento');
            }
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

    if (loading) {
        return (
            <div>
                <Navbar />
                <div className="container page text-center">Carregando...</div>
            </div>
        );
    }

    if (!budget) {
        return (
            <div>
                <Navbar />
                <div className="container page text-center">
                    <h2>Orçamento não encontrado</h2>
                    <Link to="/budgets" className="btn btn-primary mt-lg">Voltar</Link>
                </div>
            </div>
        );
    }

    return (
        <div>
            <Navbar />

            <div className="container page">
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-md)',
                    marginBottom: 'var(--space-xl)'
                }}>
                    <div>
                        <h1>Orçamento #{String(budget.numero).padStart(4, '0')}</h1>
                        <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'center', marginTop: 'var(--space-sm)', flexWrap: 'wrap' }}>
                            <StatusBadge status={budget.status} />
                            <span className="text-sm text-secondary">{formatDate(budget.data)}</span>
                        </div>
                    </div>
                    <Link to="/budgets" className="btn btn-secondary" style={{ alignSelf: 'flex-start', minWidth: '120px' }}>← Voltar</Link>
                </div>

                {/* Actions */}
                <div className="card mb-lg">
                    <h3 className="mb-md">Ações</h3>
                    <div style={{ display: 'grid', gap: 'var(--space-md)', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
                        <button onClick={handleDownloadPDF} className="btn btn-primary">
                            📄 Baixar PDF
                        </button>
                        <button onClick={handleWhatsApp} className="btn btn-whatsapp">
                            📱 Enviar WhatsApp
                        </button>
                        <Link to={`/budgets/${id}/edit`} className="btn btn-secondary">
                            ✏️ Editar
                        </Link>
                        <button onClick={handleDelete} className="btn btn-danger">
                            🗑️ Deletar
                        </button>
                    </div>
                </div>

                {/* Status */}
                <div className="card mb-lg">
                    <h3 className="mb-md">Alterar Status</h3>
                    <div style={{ display: 'grid', gap: 'var(--space-sm)', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))' }}>
                        {['rascunho', 'enviado', 'aprovado', 'recusado'].map(status => (
                            <button
                                key={status}
                                onClick={() => handleStatusChange(status)}
                                className={budget.status === status ? 'btn btn-primary' : 'btn btn-secondary'}
                                style={{ textTransform: 'capitalize' }}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Client info */}
                <div className="card mb-lg">
                    <h3 className="mb-md">Cliente</h3>
                    <p><strong>Nome:</strong> {budget.client_nome}</p>
                    {budget.client_telefone && <p><strong>Telefone:</strong> {budget.client_telefone}</p>}
                    {budget.client_email && <p><strong>Email:</strong> {budget.client_email}</p>}
                </div>

                {/* Items */}
                <div className="card mb-lg">
                    <h3 className="mb-md">Itens</h3>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Descrição</th>
                                <th style={{ textAlign: 'center' }}>Quantidade</th>
                                <th style={{ textAlign: 'right' }}>Valor Unit.</th>
                                <th style={{ textAlign: 'right' }}>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {budget.items.map((item, index) => (
                                <tr key={index}>
                                    <td>{item.descricao}</td>
                                    <td style={{ textAlign: 'center' }}>{item.quantidade}</td>
                                    <td style={{ textAlign: 'right' }}>{formatCurrency(item.valor_unitario)}</td>
                                    <td style={{ textAlign: 'right' }}>{formatCurrency(item.quantidade * item.valor_unitario)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div style={{
                        borderTop: '2px solid var(--border)',
                        paddingTop: 'var(--space-md)',
                        marginTop: 'var(--space-md)',
                        textAlign: 'right'
                    }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>
                            TOTAL: <span style={{ color: 'var(--primary)' }}>{formatCurrency(budget.total)}</span>
                        </div>
                    </div>
                </div>

                {/* Observations */}
                {budget.observacoes && (
                    <div className="card">
                        <h3 className="mb-md">Observações</h3>
                        <p>{budget.observacoes}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
