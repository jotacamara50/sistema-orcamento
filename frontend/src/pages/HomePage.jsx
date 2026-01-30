import { Link, Navigate } from 'react-router-dom';
import SiteLayout from '../components/SiteLayout';
import { useAuth } from '../contexts/AuthContext';

export default function HomePage() {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <div>Carregando...</div>
            </div>
        );
    }

    if (user) {
        return <Navigate to="/budgets" replace />;
    }

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
                        <Link to="/register" className="btn btn-primary btn-lg">Criar meu primeiro orçamento grátis</Link>
                        <Link to="/login" className="btn btn-secondary btn-lg">Já tenho conta</Link>
                    </div>
                    <p className="site-hero-trust">✓ Grátis para começar • ✓ Sem instalação • ✓ Funciona no celular</p>
                    
                    {/* Vídeo do produto */}
                    <div style={{ 
                        marginTop: '3rem', 
                        textAlign: 'center',
                        position: 'relative',
                        maxWidth: '800px',
                        margin: '3rem auto 0'
                    }}>
                        <div style={{
                            position: 'relative',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.15)'
                        }}>
                            {/* Barra para cobrir o navegador */}
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                height: '60px',
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                zIndex: 10,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontWeight: 'bold',
                                fontSize: '1.1rem'
                            }}>
                                Veja como é fácil criar um orçamento
                            </div>
                            
                            <video 
                                autoPlay 
                                muted 
                                loop 
                                playsInline
                                style={{ 
                                    width: '100%',
                                    display: 'block'
                                }}
                            >
                                <source src="/apresentacao.mp4" type="video/mp4" />
                                Seu navegador não suporta vídeo.
                            </video>
                        </div>
                    </div>
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

            {/* Como funciona - Passo a passo */}
            <section className="site-section" style={{ background: '#f8f9fa' }}>
                <div className="container site-section-inner">
                    <h2 style={{ textAlign: 'center', marginBottom: '3rem' }}>Como funciona</h2>
                    <div className="site-card-grid">
                        <div className="site-card" style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>1️⃣</div>
                            <h3>Preencha os dados</h3>
                            <p>Nome do cliente, serviço e valor. Simples assim.</p>
                        </div>
                        <div className="site-card" style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>2️⃣</div>
                            <h3>Gere o PDF</h3>
                            <p>Um clique e pronto. PDF bonito e profissional.</p>
                        </div>
                        <div className="site-card" style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>3️⃣</div>
                            <h3>Envie no Zap</h3>
                            <p>Mande direto pro WhatsApp do cliente e feche o serviço.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Para quem - melhorado */}
            <section className="site-section">
                <div className="container site-section-inner" style={{ textAlign: 'center' }}>
                    <h2>Feito para você que trabalha com serviços</h2>
                    <p style={{ fontSize: '1.2rem', marginTop: '1rem', color: '#666' }}>
                        ⚡ Eletricistas • 🔧 Técnicos • 🏗️ Pedreiros • 🛠️ Maridos de Aluguel • 🎨 Pintores • 🚿 Encanadores
                    </p>
                    <p style={{ marginTop: '1.5rem', fontSize: '1.1rem' }}>
                        Se você faz orçamento pelo WhatsApp, esse sistema foi feito pra você.
                    </p>
                </div>
            </section>

            {/* Principais recursos */}
            <section className="site-section" style={{ background: '#f8f9fa' }}>
                <div className="container site-section-inner">
                    <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Principais recursos</h2>
                    <ul className="site-list">
                        <li>✓ Visual profissional de orçamentos</li>
                        <li>✓ Criação de orçamentos em PDF</li>
                        <li>✓ Envio pelo WhatsApp</li>
                        <li>✓ Controle simples de orçamentos</li>
                        <li>✓ Cadastro de clientes</li>
                        <li>✓ Funciona no celular e computador</li>
                    </ul>
                </div>
            </section>

            {/* CTA Final */}
            <section className="site-section" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', padding: '4rem 1rem' }}>
                <div className="container" style={{ textAlign: 'center' }}>
                    <h2 style={{ color: 'white', fontSize: '2.5rem', marginBottom: '1rem' }}>
                        Pronto para impressionar seus clientes?
                    </h2>
                    <p style={{ fontSize: '1.3rem', marginBottom: '2rem', opacity: 0.95 }}>
                        Crie seu primeiro orçamento profissional agora mesmo. É grátis!
                    </p>
                    <Link 
                        to="/register" 
                        className="btn btn-lg"
                        style={{ 
                            background: 'white', 
                            color: '#667eea',
                            padding: '1rem 2rem',
                            fontSize: '1.1rem',
                            fontWeight: 'bold',
                            border: 'none',
                            boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
                            maxWidth: '100%',
                            display: 'inline-block',
                            wordWrap: 'break-word'
                        }}
                    >
                        Criar meu primeiro orçamento grátis
                    </Link>
                    <p style={{ marginTop: '1.5rem', fontSize: '0.95rem', opacity: 0.9 }}>
                        ✓ Sem cartão de crédito • ✓ Sem compromisso
                    </p>
                </div>
            </section>
        </SiteLayout>
    );
}
