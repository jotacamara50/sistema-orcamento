import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { budgets as budgetsApi, actions } from '../api';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';

export default function BudgetViewPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [budget, setBudget] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);
    const [whatsappSent, setWhatsappSent] = useState(false);
    const [pdfLoading, setPdfLoading] = useState(false);

    useEffect(() => {
        // Sempre rola para o topo ao abrir a página
        window.scrollTo(0, 0);
        
        loadBudget();
        // Verifica se veio da criação de orçamento
        if (location.state?.justCreated) {
            setShowSuccessMessage(true);
            // Remove o estado para não mostrar novamente ao atualizar
            window.history.replaceState({}, document.title);
            // Esconde a mensagem após 5 segundos
            setTimeout(() => setShowSuccessMessage(false), 5000);
        }
    }, [id, location]);

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

    const handleDownloadPDF = async (isRetry = false) => {
        if (pdfLoading) return; // Evita cliques múltiplos
        
        setPdfLoading(true);
        try {
            const res = await actions.downloadPDF(id);
            
            // Verifica se recebeu dados válidos
            if (!res.data || res.data.size === 0) {
                throw new Error('PDF vazio recebido');
            }
            
            const blob = new Blob([res.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            
            // Tenta abrir em nova aba primeiro
            try {
                const printWindow = window.open(url, '_blank');
                
                if (printWindow && !printWindow.closed) {
                    // Sucesso ao abrir em nova aba
                    printWindow.onload = () => {
                        setTimeout(() => window.URL.revokeObjectURL(url), 100);
                    };
                } else {
                    // Popup bloqueado, tenta download direto
                    throw new Error('Popup bloqueado');
                }
            } catch (popupError) {
                // Fallback 1: Download direto
                const link = document.createElement('a');
                link.href = url;
                link.download = `orcamento-${String(budget.numero).padStart(4, '0')}.pdf`;
                link.style.display = 'none';
                document.body.appendChild(link);
                
                try {
                    link.click();
                } catch (clickError) {
                    // Fallback 2: Forçar download via dispatchEvent
                    const clickEvent = new MouseEvent('click', {
                        view: window,
                        bubbles: true,
                        cancelable: true
                    });
                    link.dispatchEvent(clickEvent);
                }
                
                document.body.removeChild(link);
                setTimeout(() => window.URL.revokeObjectURL(url), 1000);
            }
            
            setPdfLoading(false);
        } catch (error) {
            console.error('Error downloading PDF:', error);
            setPdfLoading(false);
            
            // Se for primeiro erro e não foi retry, tenta novamente
            if (!isRetry && confirm('Erro ao carregar PDF. Tentar novamente?')) {
                setTimeout(() => handleDownloadPDF(true), 500);
            } else {
                // Mensagem de erro mais detalhada
                const errorMsg = error.response?.status === 404 
                    ? 'Orçamento não encontrado'
                    : error.response?.status === 500
                    ? 'Erro no servidor ao gerar PDF. Tente novamente em alguns segundos.'
                    : error.message?.includes('Network')
                    ? 'Erro de conexão. Verifique sua internet e tente novamente.'
                    : 'Erro ao carregar PDF. Tente novamente ou entre em contato com o suporte.';
                    
                alert(errorMsg);
            }
        }
    };

    const handleWhatsApp = async () => {
        try {
            const res = await actions.getWhatsAppLink(id);
            window.open(res.data.whatsapp_link, '_blank');
            
            // Atualiza status para "enviado" automaticamente
            if (budget.status === 'rascunho') {
                await budgetsApi.update(id, { ...budget, status: 'enviado' });
                setBudget({ ...budget, status: 'enviado' });
            }
            
            // Mostra confirmação visual
            setWhatsappSent(true);
            setTimeout(() => setWhatsappSent(false), 4000);
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

    const handleDuplicate = async () => {
        try {
            const { client_id, observacoes, items, logo_data } = budget;
            const created = await budgetsApi.create({
                client_id,
                observacoes,
                items,
                logo_data
            });
            navigate(`/budgets/${created.data.id}/edit`);
        } catch (error) {
            console.error('Error duplicating budget:', error);
            alert(error.response?.data?.error || 'Erro ao duplicar orçamento');
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
                {/* Mensagem de sucesso ao criar */}
                {showSuccessMessage && (
                    <div style={{
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        color: 'white',
                        padding: 'clamp(1rem, 3vw, 1.5rem)',
                        borderRadius: '8px',
                        marginBottom: 'var(--space-lg)',
                        textAlign: 'center',
                        fontWeight: 'bold',
                        fontSize: 'clamp(0.95rem, 2.5vw, 1.1rem)',
                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                        lineHeight: '1.5'
                    }}>
                        ✅ Orçamento criado com sucesso! Agora você pode ver o PDF ou enviar pelo WhatsApp
                    </div>
                )}

                {/* Confirmação de envio WhatsApp */}
                {whatsappSent && (
                    <div style={{
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        color: 'white',
                        padding: 'clamp(1rem, 3vw, 1.5rem)',
                        borderRadius: '8px',
                        marginBottom: 'var(--space-lg)',
                        textAlign: 'center',
                        fontWeight: 'bold',
                        fontSize: 'clamp(0.95rem, 2.5vw, 1.1rem)',
                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                        lineHeight: '1.5'
                    }}>
                        ✅ Enviado com sucesso para {budget.client_nome}!
                    </div>
                )}

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

                {/* Botão WhatsApp destacado */}
                <div style={{ marginBottom: 'var(--space-lg)' }}>
                    <button 
                        onClick={handleWhatsApp} 
                        style={{
                            width: '100%',
                            padding: 'clamp(1rem, 3vw, 1.5rem)',
                            fontSize: 'clamp(1.1rem, 3vw, 1.3rem)',
                            fontWeight: 'bold',
                            background: '#25D366',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(37, 211, 102, 0.3)',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 'var(--space-md)',
                            minHeight: '56px'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = '#20BA5A'}
                        onMouseOut={(e) => e.currentTarget.style.background = '#25D366'}
                    >
                        <span style={{ fontSize: 'clamp(1.3rem, 4vw, 1.5rem)' }}>📱</span>
                        Enviar pelo WhatsApp
                    </button>
                </div>

                {/* Actions */}
                <div className="card mb-lg">
                    <h3 className="mb-md">Outras Ações</h3>
                    <div style={{ display: 'grid', gap: 'var(--space-md)', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
                        <button 
                            onClick={() => handleDownloadPDF(false)} 
                            className="btn btn-primary"
                            disabled={pdfLoading}
                        >
                            {pdfLoading ? '⏳ Carregando...' : '📄 Ver PDF'}
                        </button>
                        <Link to={`/budgets/${id}/edit`} className="btn btn-secondary">
                            ✏️ Editar
                        </Link>
                        <button onClick={handleDuplicate} className="btn btn-secondary">
                            📋 Duplicar
                        </button>
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
