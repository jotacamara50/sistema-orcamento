import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav style={{
            background: 'white',
            borderBottom: '1px solid var(--border)',
            position: 'sticky',
            top: 0,
            zIndex: 100
        }}>
            <div className="container" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                height: '64px'
            }}>
                <Link to="/budgets" style={{
                    fontSize: '1.25rem',
                    fontWeight: '700',
                    color: 'var(--primary)',
                    textDecoration: 'none'
                }}>
                    📊 Orçamentos
                </Link>

                <div style={{ display: 'flex', gap: 'var(--space-lg)', alignItems: 'center' }}>
                    <Link to="/budgets" style={{ textDecoration: 'none', color: 'var(--text-primary)', fontWeight: 500 }}>
                        Orçamentos
                    </Link>
                    <Link to="/clients" style={{ textDecoration: 'none', color: 'var(--text-primary)', fontWeight: 500 }}>
                        Clientes
                    </Link>
                    <Link to="/profile" style={{ textDecoration: 'none', color: 'var(--text-primary)', fontWeight: 500 }}>
                        Meu Perfil
                    </Link>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            {user?.nome}
                        </span>
                        <button onClick={handleLogout} className="btn btn-secondary btn-sm">
                            Sair
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
}
