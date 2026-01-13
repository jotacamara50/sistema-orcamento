import { Link } from 'react-router-dom';
import SiteLayout from '../components/SiteLayout';

export default function HomePage() {
    return (
        <SiteLayout>
            <section className="site-hero site-hero-centered">
                <div className="container site-hero-inner">
                    <p className="site-hero-kicker">Orçamentos profissionais para prestadores de serviço</p>
                    <h1 className="site-hero-title">Pare de perder tempo fazendo orçamento no WhatsApp</h1>
                    <p className="site-hero-subtitle">
                        Gere um PDF bonito com preço e organize tudo em <span className="site-hero-highlight">30 segundos</span>.
                    </p>
                    <div className="site-hero-actions">
                        <Link to="/login" className="btn btn-secondary btn-lg">Entrar</Link>
                        <Link to="/register" className="btn btn-primary btn-lg">Cadastrar grátis</Link>
                    </div>
                    <p className="site-hero-trust">Sistema online. Sem instalação.</p>
                </div>
            </section>

            <section className="site-highlight-section">
                <div className="container">
                    <div className="site-card-grid">
                        <div className="site-card">
                            <div className="site-card-icon">⚡</div>
                            <h3>Rápido</h3>
                            <p>Crie orçamentos profissionais em menos de 1 minuto.</p>
                        </div>
                        <div className="site-card">
                            <div className="site-card-icon">📄</div>
                            <h3>Profissional</h3>
                            <p>PDFs com visual limpo que impressionam seus clientes.</p>
                        </div>
                        <div className="site-card">
                            <div className="site-card-icon">💬</div>
                            <h3>WhatsApp</h3>
                            <p>Envie o orçamento com um clique e feche mais rápido.</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="site-section">
                <div className="container site-section-inner">
                    <h2>O que é</h2>
                    <p className="site-section-text">
                        O OrçaZap é um sistema online para prestadores de serviço criarem orçamentos profissionais
                        rapidamente e enviarem para seus clientes pelo WhatsApp. Tudo fica organizado em um só lugar,
                        com visual profissional e foco no dia a dia.
                    </p>
                </div>
            </section>

            <section className="site-section">
                <div className="container site-section-inner">
                    <h2>Para quem</h2>
                    <ul className="site-list">
                        <li>Prestadores de serviço em geral</li>
                        <li>Eletricistas e técnicos</li>
                        <li>Manutenção e reformas</li>
                    </ul>
                </div>
            </section>

            <section className="site-section">
                <div className="container site-section-inner">
                    <h2>Principais recursos</h2>
                    <ul className="site-list">
                        <li>Visual profissional de orçamentos</li>
                        <li>Criação de orçamentos em PDF</li>
                        <li>Envio pelo WhatsApp</li>
                        <li>Controle simples de orçamentos</li>
                    </ul>
                </div>
            </section>
        </SiteLayout>
    );
}
