import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { budgets as budgetsApi, clients as clientsApi } from '../api';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import TrialBlockModal from '../components/TrialBlockModal';

export default function BudgetFormPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, updateUser } = useAuth();
    const isEdit = !!id;
    const isPaidActive = (() => {
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
    })();

    const [clients, setClients] = useState([]);
    const [formData, setFormData] = useState({
        client_id: '',
        observacoes: '',
        status: 'rascunho',
        logo_data: '',
        items: [{ descricao: '', quantidade: 1, valor_unitario: 0 }]
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showTrialModal, setShowTrialModal] = useState(false);
    const [showClientModal, setShowClientModal] = useState(false);
    const [newClientData, setNewClientData] = useState({ nome: '', telefone: '', email: '' });

    useEffect(() => {
        loadClients();
        if (isEdit) {
            loadBudget();
        }
    }, [id]);

    const loadClients = async () => {
        try {
            const res = await clientsApi.list();
            setClients(res.data);
        } catch (error) {
            console.error('Error loading clients:', error);
        }
    };

    const loadBudget = async () => {
        try {
            const res = await budgetsApi.get(id);
            setFormData({
                client_id: res.data.client_id,
                observacoes: res.data.observacoes || '',
                status: res.data.status,
                logo_data: res.data.logo_data || '',
                items: res.data.items
            });
        } catch (error) {
            console.error('Error loading budget:', error);
            setError('Erro ao carregar orçamento');
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index][field] = field === 'descricao' ? value : parseFloat(value) || 0;
        setFormData({ ...formData, items: newItems });
    };

    const handleLogoChange = (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) {
            return;
        }
        if (file.size > 1024 * 1024) {
            setError('Logo muito grande. Use até 1MB.');
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            setFormData({ ...formData, logo_data: reader.result });
        };
        reader.readAsDataURL(file);
    };

    const handleRemoveLogo = () => {
        setFormData({ ...formData, logo_data: '' });
    };

    const addItem = () => {
        setFormData({
            ...formData,
            items: [...formData.items, { descricao: '', quantidade: 1, valor_unitario: 0 }]
        });
    };

    const removeItem = (index) => {
        if (formData.items.length > 1) {
            const newItems = formData.items.filter((_, i) => i !== index);
            setFormData({ ...formData, items: newItems });
        }
    };

    const calculateTotal = () => {
        return formData.items.reduce((sum, item) => sum + (item.quantidade * item.valor_unitario), 0);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isEdit) {
                await budgetsApi.update(id, formData);
                navigate('/budgets');
            } else {
                const res = await budgetsApi.create(formData);
                // Update trial count after successful creation
                if (!isPaidActive) {
                    updateUser({ trial_budget_count: user.trial_budget_count + 1 });
                }
                // Redireciona para a página de visualização com indicador de sucesso
                navigate(`/budgets/${res.data.id}`, { state: { justCreated: true } });
            }
        } catch (err) {
            if (err.response?.data?.trial_expired) {
                setShowTrialModal(true);
            } else {
                setError(err.response?.data?.error || 'Erro ao salvar orçamento');
            }
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    const handleOpenClientModal = () => {
        setNewClientData({ nome: '', telefone: '', email: '' });
        setShowClientModal(true);
    };

    const handleCloseClientModal = () => {
        setShowClientModal(false);
        setNewClientData({ nome: '', telefone: '', email: '' });
    };

    const handleCreateClient = async (e) => {
        e.preventDefault();
        try {
            const res = await clientsApi.create(newClientData);
            await loadClients();
            setFormData({ ...formData, client_id: res.data.id });
            handleCloseClientModal();
        } catch (error) {
            console.error('Error creating client:', error);
            alert('Erro ao criar cliente');
        }
    };

    return (
        <div>
            <Navbar />

            <div className="container page">
                <h1 className="mb-xl">{isEdit ? 'Editar Orçamento' : 'Novo Orçamento'}</h1>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="card mb-lg">
                        <h3 className="mb-lg">Informações do Cliente</h3>

                        <div className="form-group">
                            <label>Cliente *</label>
                            <select
                                name="client_id"
                                className="select"
                                value={formData.client_id}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Selecione um cliente</option>
                                {clients.map(client => (
                                    <option key={client.id} value={client.id}>
                                        {client.nome}
                                    </option>
                                ))}
                            </select>
                            <button 
                                type="button" 
                                onClick={handleOpenClientModal}
                                className="btn btn-primary"
                                style={{ 
                                    marginTop: 'var(--space-sm)',
                                    width: '100%',
                                    fontSize: '0.95rem',
                                    padding: 'var(--space-sm) var(--space-md)'
                                }}
                            >
                                + Adicionar Novo Cliente
                            </button>
                        </div>

                        <div className="form-group" style={{ marginTop: 'var(--space-lg)' }}>
                            <label>Logo do orçamento (opcional)</label>
                            <input
                                type="file"
                                accept="image/*"
                                className="input"
                                onChange={handleLogoChange}
                            />
                            <div className="text-secondary text-xs" style={{ marginTop: 'var(--space-xs)' }}>
                                PNG ou JPG até 1MB.
                            </div>
                            {formData.logo_data && (
                                <div style={{ marginTop: 'var(--space-sm)', display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                                    <img
                                        src={formData.logo_data}
                                        alt="Logo do orçamento"
                                        style={{ maxHeight: '60px', maxWidth: '180px', objectFit: 'contain', border: '1px solid var(--border)', padding: '4px', borderRadius: '6px' }}
                                    />
                                    <button type="button" className="btn btn-secondary btn-sm" onClick={handleRemoveLogo}>
                                        Remover
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="card mb-lg">
                        <div className="flex justify-between items-center mb-lg">
                            <h3>Itens do Orçamento</h3>
                            <button type="button" onClick={addItem} className="btn btn-secondary btn-sm">
                                + Adicionar Item
                            </button>
                        </div>

                        {formData.items.map((item, index) => (
                            <div key={index} style={{
                                display: 'grid',
                                gridTemplateColumns: '2fr 1fr 1fr auto',
                                gap: 'var(--space-md)',
                                marginBottom: 'var(--space-md)',
                                alignItems: 'end'
                            }}>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label>Descrição</label>
                                    <input
                                        type="text"
                                        className="input"
                                        placeholder="Ex: Instalação de tomada"
                                        value={item.descricao}
                                        onChange={(e) => handleItemChange(index, 'descricao', e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label>Quantidade</label>
                                    <input
                                        type="number"
                                        className="input"
                                        min="0.01"
                                        step="0.01"
                                        value={item.quantidade}
                                        onChange={(e) => handleItemChange(index, 'quantidade', e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label>Valor Unit.</label>
                                    <input
                                        type="number"
                                        className="input"
                                        min="0"
                                        step="0.01"
                                        placeholder="0,00"
                                        value={item.valor_unitario}
                                        onChange={(e) => handleItemChange(index, 'valor_unitario', e.target.value)}
                                        required
                                    />
                                </div>

                                {formData.items.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeItem(index)}
                                        className="btn btn-danger btn-sm"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        ))}

                        <div style={{
                            borderTop: '2px solid var(--border)',
                            paddingTop: 'var(--space-md)',
                            marginTop: 'var(--space-md)',
                            textAlign: 'right'
                        }}>
                            <div style={{ fontSize: '1.25rem', fontWeight: '700' }}>
                                Total: <span style={{ color: 'var(--primary)' }}>{formatCurrency(calculateTotal())}</span>
                            </div>
                        </div>
                    </div>

                    <div className="card mb-lg">
                        <h3 className="mb-lg">Observações</h3>
                        <textarea
                            name="observacoes"
                            className="textarea"
                            placeholder="Observações adicionais (opcional)"
                            value={formData.observacoes}
                            onChange={handleChange}
                        />
                    </div>

                    {isEdit && (
                        <div className="card mb-lg">
                            <h3 className="mb-lg">Status</h3>
                            <select
                                name="status"
                                className="select"
                                value={formData.status}
                                onChange={handleChange}
                            >
                                <option value="rascunho">Rascunho</option>
                                <option value="enviado">Enviado</option>
                                <option value="aprovado">Aprovado</option>
                                <option value="recusado">Recusado</option>
                            </select>
                        </div>
                    )}

                    <div className="flex justify-end gap-md">
                        <button
                            type="button"
                            onClick={() => navigate('/budgets')}
                            className="btn btn-secondary"
                        >
                            Cancelar
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Salvando...' : 'Salvar Orçamento'}
                        </button>
                    </div>
                </form>
            </div>

            {showTrialModal && <TrialBlockModal onClose={() => setShowTrialModal(false)} />}
            
            {showClientModal && (
                <div className="modal-overlay" onClick={handleCloseClientModal}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h2 className="mb-lg">Novo Cliente</h2>

                        <form onSubmit={handleCreateClient}>
                            <div className="form-group">
                                <label>Nome *</label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="Nome do cliente"
                                    value={newClientData.nome}
                                    onChange={(e) => setNewClientData({ ...newClientData, nome: e.target.value })}
                                    required
                                    autoFocus
                                />
                            </div>

                            <div className="form-group">
                                <label>Telefone</label>
                                <input
                                    type="tel"
                                    className="input"
                                    placeholder="(11) 99999-9999"
                                    value={newClientData.telefone}
                                    onChange={(e) => setNewClientData({ ...newClientData, telefone: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label>Email</label>
                                <input
                                    type="email"
                                    className="input"
                                    placeholder="cliente@email.com"
                                    value={newClientData.email}
                                    onChange={(e) => setNewClientData({ ...newClientData, email: e.target.value })}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: 'var(--space-lg)' }}>
                                <button type="button" onClick={handleCloseClientModal} className="btn btn-secondary" style={{ flex: 1 }}>
                                    Cancelar
                                </button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                                    Criar Cliente
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
