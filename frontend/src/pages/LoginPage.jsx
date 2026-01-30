import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage({ defaultRegister = false }) {
    const [isRegister, setIsRegister] = useState(defaultRegister);
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

    useEffect(() => {
        setIsRegister(defaultRegister);
        setError('');
    }, [defaultRegister]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isRegister) {
                await register(formData);
                
                // Dispara evento de conversão no Facebook Pixel
                if (window.fbq) {
                    window.fbq('track', 'CompleteRegistration');
                }
                
                // Redirect to budgets home (shows first-time banner)
                navigate('/budgets');
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
            minHeight: '100vh',
            background: 'var(--bg-gray)',
            padding: 'var(--space-md) 0'
        }}>
            <div className="card" style={{ maxWidth: '420px', width: '100%', margin: 'var(--space-md)', padding: 'var(--space-lg)' }}>
                <div style={{ textAlign: 'center', marginBottom: 'var(--space-md)' }}>
                    <img src="/logo1.png" alt="OrçaZap" className="auth-logo" />
                    <h1 style={{ marginBottom: 'var(--space-xs)', fontSize: '1.5rem' }}>
                        {isRegister ? 'Cadastro' : 'Entrar'}
                    </h1>
                    <p className="text-secondary" style={{ fontSize: '0.875rem' }}>
                        {isRegister
                            ? 'Crie sua conta - 3 orçamentos grátis'
                            : 'Bem-vindo de volta!'}
                    </p>
                </div>

                {error && (
                    <div className="error-message">{error}</div>
                )}

                <form onSubmit={handleSubmit}>
                    {isRegister && (
                        <>
                            <div className="form-group" style={{ marginBottom: 'var(--space-md)' }}>
                                <label style={{ fontSize: '0.8125rem' }}>Nome Completo</label>
                                <input
                                    type="text"
                                    name="nome"
                                    className="input"
                                    placeholder="João Silva"
                                    value={formData.nome}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="form-group" style={{ marginBottom: 'var(--space-md)' }}>
                                <label style={{ fontSize: '0.8125rem' }}>Email</label>
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

                            <div className="form-group" style={{ marginBottom: 'var(--space-md)' }}>
                                <label style={{ fontSize: '0.8125rem' }}>Telefone</label>
                                <input
                                    type="tel"
                                    name="telefone"
                                    className="input"
                                    placeholder="(11) 99999-9999"
                                    value={formData.telefone}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="form-group" style={{ marginBottom: 'var(--space-md)' }}>
                                <label style={{ fontSize: '0.8125rem' }}>Profissão</label>
                                <input
                                    type="text"
                                    name="tipo_servico"
                                    className="input"
                                    placeholder="Marceneiro, Eletricista..."
                                    value={formData.tipo_servico}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="form-group" style={{ marginBottom: 'var(--space-md)' }}>
                                <label style={{ fontSize: '0.8125rem' }}>Senha</label>
                                <input
                                    type="password"
                                    name="password"
                                    className="input"
                                    placeholder="Sua senha"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </>
                    )}

                    {!isRegister && (
                        <>
                            <div className="form-group" style={{ marginBottom: 'var(--space-md)' }}>
                                <label style={{ fontSize: '0.8125rem' }}>Email</label>
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

                            <div className="form-group" style={{ marginBottom: 'var(--space-md)' }}>
                                <label style={{ fontSize: '0.8125rem' }}>Senha</label>
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
                        </>
                    )}

                    <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
                        {loading ? 'Aguarde...' : (isRegister ? 'Cadastrar' : 'Entrar')}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: 'var(--space-md)' }}>
                    <button
                        onClick={() => {
                            navigate(isRegister ? '/login' : '/register');
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
