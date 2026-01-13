import { Link } from 'react-router-dom';
import SiteLayout from '../components/SiteLayout';

export default function HomePage() {
    return (
        <SiteLayout>
            <section className="site-hero">
                <div className="container site-hero-inner">
                    <h1>Orçamentos profissionais, sem complicação.</h1>
                    <p className="site-hero-subtitle text-secondary">
                        Crie orçamentos em PDF, envie pelo WhatsApp e organize seus serviços em um só lugar.
                    </p>
                    <div className="site-hero-actions">
                        <Link to="/login" className="btn btn-secondary btn-lg">Entrar</Link>
                        <Link to="/register" className="btn btn-primary btn-lg">Criar conta</Link>
                    </div>
                    <p className="site-hero-trust">Sistema online. Sem instalação.</p>
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
