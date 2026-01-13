import SiteLayout from '../components/SiteLayout';

export default function TermsPage() {
    return (
        <SiteLayout>
            <section className="site-section">
                <div className="container">
                    <div className="card site-legal">
                        <h1>Termos de Uso</h1>
                        <p className="text-secondary">
                            Estes termos explicam como o OrçaZap funciona de forma simples e transparente.
                        </p>

                        <h2>Quem é o serviço</h2>
                        <p>
                            O OrçaZap é um sistema online para criação e envio de orçamentos profissionais para
                            prestadores de serviço e pequenas equipes.
                        </p>

                        <h2>Responsabilidade</h2>
                        <p>
                            Você é responsável pelas informações inseridas no sistema e pelo uso correto das suas
                            credenciais. Nós mantemos a plataforma disponível, mas não garantimos ausência total de
                            falhas ou indisponibilidades.
                        </p>

                        <h2>Cancelamento</h2>
                        <p>
                            Você pode cancelar sua conta a qualquer momento. O acesso a recursos pagos é encerrado ao
                            final do período vigente, mantendo seus dados por um tempo razoável para suporte.
                        </p>

                        <h2>Uso adequado</h2>
                        <p>
                            Não use o sistema para fins ilegais, envio de spam, violação de direitos de terceiros ou
                            tentativas de burlar limites do produto.
                        </p>
                    </div>
                </div>
            </section>
        </SiteLayout>
    );
}
