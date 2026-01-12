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

    const [clients, setClients] = useState([]);
    const [formData, setFormData] = useState({
        client_id: '',
        observacoes: '',
        status: 'rascunho',
        items: [{ descricao: '', quantidade: 1, valor_unitario: 0 }]
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showTrialModal, setShowTrialModal] = useState(false);

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
            } else {
                const res = await budgetsApi.create(formData);
                // Update trial count after successful creation
                if (!user.is_paid) {
                    updateUser({ trial_budget_count: user.trial_budget_count + 1 });
                }
            }
            navigate('/budgets');
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
                            {clients.length === 0 && (
                                <p className="text-sm text-secondary mt-sm">
                                    Nenhum cliente cadastrado.{' '}
                                    <a href="/clients" style={{ color: 'var(--primary)' }}>Criar cliente</a>
                                </p>
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
        </div>
    );
}
