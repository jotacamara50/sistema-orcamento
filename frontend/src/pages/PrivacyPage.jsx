import SiteLayout from '../components/SiteLayout';

export default function PrivacyPage() {
    return (
        <SiteLayout>
            <section className="site-section">
                <div className="container">
                    <div className="card site-legal">
                        <h1>Política de Privacidade</h1>
                        <p className="text-secondary">
                            Esta política explica quais dados coletamos, por que coletamos e como protegemos suas
                            informações.
                        </p>

                        <h2>Quais dados são coletados</h2>
                        <p>
                            Coletamos dados de cadastro (nome, email, telefone), dados de acesso e informações que
                            você inclui nos orçamentos e clientes.
                        </p>

                        <h2>Para que são usados</h2>
                        <p>
                            Usamos esses dados para operar o sistema, permitir o envio de orçamentos, oferecer suporte
                            e melhorar o produto.
                        </p>

                        <h2>Como proteger</h2>
                        <p>
                            Utilizamos boas práticas de segurança e controle de acesso. Mesmo assim, nenhuma plataforma
                            é totalmente livre de riscos. Se houver qualquer incidente relevante, avisaremos pelos
                            canais cadastrados.
                        </p>

                        <h2>Contato</h2>
                        <p>
                            Em caso de dúvidas, fale com a gente em contato@orcazap.net.
                        </p>
                    </div>
                </div>
            </section>
        </SiteLayout>
    );
}
