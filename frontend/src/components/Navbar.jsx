import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);

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
            zIndex: 100,
            overflow: 'visible'
        }}>
            <div className="container" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                minHeight: '72px',
                padding: 'var(--space-sm) var(--space-lg)',
                overflow: 'visible'
            }}>
                <Link to="/budgets" className="app-logo" aria-label="OrçaZap">
                    <img src="/logo1.png" alt="OrçaZap" />
                </Link>

                {/* Menu Desktop */}
                <div className="navbar-desktop" style={{ display: 'flex', gap: 'var(--space-lg)', alignItems: 'center' }}>
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

                {/* Menu Hamburguer Mobile */}
                <button
                    className="navbar-hamburger"
                    onClick={() => setMenuOpen(!menuOpen)}
                    aria-label="Menu"
                    style={{
                        display: 'none',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 'var(--space-sm)',
                        fontSize: '1.5rem'
                    }}
                >
                    {menuOpen ? '✕' : '☰'}
                </button>
            </div>

            {/* Menu Mobile Dropdown */}
            {menuOpen && (
                <div className="navbar-mobile" style={{
                    background: 'white',
                    borderTop: '1px solid var(--border)',
                    padding: 'var(--space-md)',
                    display: 'none',
                    flexDirection: 'column',
                    gap: 'var(--space-md)'
                }}>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', paddingBottom: 'var(--space-sm)', borderBottom: '1px solid var(--border)' }}>
                        {user?.nome}
                    </div>
                    <Link
                        to="/budgets"
                        onClick={() => setMenuOpen(false)}
                        style={{ textDecoration: 'none', color: 'var(--text-primary)', fontWeight: 500, padding: 'var(--space-sm) 0' }}
                    >
                        Orçamentos
                    </Link>
                    <Link
                        to="/clients"
                        onClick={() => setMenuOpen(false)}
                        style={{ textDecoration: 'none', color: 'var(--text-primary)', fontWeight: 500, padding: 'var(--space-sm) 0' }}
                    >
                        Clientes
                    </Link>
                    <Link
                        to="/profile"
                        onClick={() => setMenuOpen(false)}
                        style={{ textDecoration: 'none', color: 'var(--text-primary)', fontWeight: 500, padding: 'var(--space-sm) 0' }}
                    >
                        Meu Perfil
                    </Link>
                    <button onClick={handleLogout} className="btn btn-secondary" style={{ marginTop: 'var(--space-sm)' }}>
                        Sair
                    </button>
                </div>
            )}
        </nav>
    );
}
