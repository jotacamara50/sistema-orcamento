import { Link } from 'react-router-dom';

export default function SiteLayout({ children }) {
    return (
        <div className="site-page">
            <header className="site-header">
                <div className="container site-header-inner">
                    <Link to="/" className="site-logo" aria-label="OrçaZap">
                        <img src="/logo1.png" alt="OrçaZap" className="site-logo-image" />
                    </Link>
                    <div className="site-header-actions">
                        <Link to="/login" className="btn btn-secondary btn-sm">Entrar</Link>
                        <Link to="/register" className="btn btn-primary btn-sm">Criar conta</Link>
                    </div>
                </div>
            </header>
            <main className="site-main">
                {children}
            </main>
            <footer className="site-footer">
                <div className="container site-footer-inner">
                    <div className="site-footer-brand">
                        <span className="site-footer-logo" aria-label="OrçaZap">
                            <img src="/logo1.png" alt="OrçaZap" className="site-footer-logo-image" />
                        </span>
                        <span className="text-secondary text-sm">© OrçaZap</span>
                    </div>
                    <div className="site-footer-links">
                        <Link to="/termos">Termos</Link>
                        <Link to="/privacidade">Privacidade</Link>
                        <a href="mailto:contato@orcazap.net">contato@orcazap.net</a>
                        <Link to="/login">Entrar no sistema</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
