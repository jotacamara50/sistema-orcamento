import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../api';

const SERVICE_OPTIONS = [
    'Eletricista',
    'Ar Condicionado',
    'TI / Suporte',
    'Reformas',
    'Automação',
    'Outro'
];

export default function ProfilePage() {
    const { user, updateUser } = useAuth();
    const [formData, setFormData] = useState({
        nome: '',
        telefone: '',
        tipo_servico: '',
        brand_color: '',
        termos_pagamento_padrao: ''
    });
    const [error, setError] = useState('');
    const [saved, setSaved] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData({
                nome: user.nome || '',
                telefone: user.telefone || '',
                tipo_servico: user.tipo_servico || '',
                brand_color: user.brand_color || '',
                termos_pagamento_padrao: user.termos_pagamento_padrao || ''
            });
        }
    }, [user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSaved(false);
        setLoading(true);

        try {
            const res = await auth.updateMe(formData);
            updateUser(res.data);
            setSaved(true);
        } catch (err) {
            setError(err.response?.data?.error || 'Erro ao salvar perfil');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <Navbar />

            <div className="container page">
                <div className="mb-xl">
                    <h1>Meu Perfil</h1>
                    <p className="text-secondary text-sm">
                        Esses dados aparecem nos PDFs de orçamento.
                    </p>
                </div>

                <div className="card" style={{ maxWidth: '600px' }}>
                    {error && <div className="error-message">{error}</div>}
                    {saved && (
                        <div style={{
                            background: '#dcfce7',
                            color: '#166534',
                            padding: 'var(--space-md)',
                            borderRadius: 'var(--radius-md)',
                            fontSize: '0.875rem',
                            marginBottom: 'var(--space-lg)'
                        }}>
                            Dados atualizados com sucesso.
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Nome *</label>
                            <input
                                type="text"
                                className="input"
                                value={formData.nome}
                                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Telefone</label>
                            <input
                                type="tel"
                                className="input"
                                placeholder="(11) 99999-9999"
                                value={formData.telefone}
                                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                            />
                        </div>

                        <div className="form-group">
                            <label>Tipo de serviço</label>
                            <select
                                className="select"
                                value={formData.tipo_servico}
                                onChange={(e) => setFormData({ ...formData, tipo_servico: e.target.value })}
                            >
                                <option value="">Selecione...</option>
                                {SERVICE_OPTIONS.map((option) => (
                                    <option key={option} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Cor do orçamento (hex)</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="#2563eb"
                                    value={formData.brand_color}
                                    onChange={(e) => setFormData({ ...formData, brand_color: e.target.value })}
                                />
                                <div
                                    aria-hidden="true"
                                    style={{
                                        width: '36px',
                                        height: '36px',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border)',
                                        background: formData.brand_color || '#2563eb'
                                    }}
                                />
                            </div>
                            <div className="text-secondary text-xs" style={{ marginTop: 'var(--space-xs)' }}>
                                Opcional. Use o formato #RRGGBB.
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Termos de Pagamento Padrão</label>
                            <textarea
                                className="textarea"
                                rows={4}
                                placeholder="Ex: 50% de entrada, restante na conclusão."
                                value={formData.termos_pagamento_padrao}
                                onChange={(e) => setFormData({ ...formData, termos_pagamento_padrao: e.target.value })}
                            />
                        </div>

                        <div className="form-group">
                            <label>Email</label>
                            <input
                                type="email"
                                className="input"
                                value={user?.email || ''}
                                disabled
                            />
                        </div>

                        <div className="flex justify-end gap-md">
                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                {loading ? 'Salvando...' : 'Salvar'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
