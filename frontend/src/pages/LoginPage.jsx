import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
    const [isRegister, setIsRegister] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        nome: '',
        telefone: '',
        tipo_servico: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login, register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isRegister) {
                await register(formData);
                // Redirect to create first budget (onboarding!)
                navigate('/budgets/new');
            } else {
                await login(formData.email, formData.password);
                navigate('/budgets');
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Erro ao processar solicitação');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="page" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}>
            <div className="card" style={{ maxWidth: '450px', width: '100%', margin: 'var(--space-lg)' }}>
                <div style={{ textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
                    <h1 style={{ marginBottom: 'var(--space-sm)' }}>
                        {isRegister ? 'Criar Conta' : 'Entrar'}
                    </h1>
                    <p className="text-secondary">
                        {isRegister
                            ? 'Crie orçamentos profissionais em 2 minutos'
                            : 'Bem-vindo de volta!'}
                    </p>
                </div>

                {error && (
                    <div className="error-message">{error}</div>
                )}

                <form onSubmit={handleSubmit}>
                    {isRegister && (
                        <>
                            <div className="form-group">
                                <label>Nome completo</label>
                                <input
                                    type="text"
                                    name="nome"
                                    className="input"
                                    placeholder="Seu nome"
                                    value={formData.nome}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Telefone</label>
                                <input
                                    type="tel"
                                    name="telefone"
                                    className="input"
                                    placeholder="(11) 99999-9999"
                                    value={formData.telefone}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="form-group">
                                <label>Tipo de serviço</label>
                                <select
                                    name="tipo_servico"
                                    className="select"
                                    value={formData.tipo_servico}
                                    onChange={handleChange}
                                >
                                    <option value="">Selecione...</option>
                                    <option value="Eletricista">Eletricista</option>
                                    <option value="Ar Condicionado">Ar Condicionado</option>
                                    <option value="TI / Suporte">TI / Suporte</option>
                                    <option value="Reformas">Reformas</option>
                                    <option value="Automação">Automação</option>
                                    <option value="Outro">Outro</option>
                                </select>
                            </div>
                        </>
                    )}

                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            name="email"
                            className="input"
                            placeholder="seu@email.com"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Senha</label>
                        <input
                            type="password"
                            name="password"
                            className="input"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
                        {loading ? 'Aguarde...' : (isRegister ? 'Criar Conta' : 'Entrar')}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: 'var(--space-lg)' }}>
                    <button
                        onClick={() => {
                            setIsRegister(!isRegister);
                            setError('');
                        }}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--primary)',
                            cursor: 'pointer',
                            fontSize: '0.875rem'
                        }}
                    >
                        {isRegister ? 'Já tem conta? Entrar' : 'Não tem conta? Criar agora'}
                    </button>
                </div>
            </div>
        </div>
    );
}
