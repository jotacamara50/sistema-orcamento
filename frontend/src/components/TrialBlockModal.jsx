import { actions } from '../api';

export default function TrialBlockModal({ onClose }) {
    const handleActivate = async () => {
        try {
            const res = await actions.getActivationLink();
            window.open(res.data.whatsapp_link, '_blank');
        } catch (error) {
            console.error('Error getting activation link:', error);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '3rem', marginBottom: 'var(--space-md)' }}>🎉</div>
                    <h2 style={{ marginBottom: 'var(--space-md)' }}>
                        Você já criou seus 3 primeiros orçamentos profissionais
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)' }}>
                        Para continuar enviando orçamentos em PDF e fechar mais serviços,
                        ative sua conta por <strong>R$ 39/mês</strong>.
                    </p>

                    <div style={{
                        background: 'var(--bg-gray)',
                        padding: 'var(--space-lg)',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: 'var(--space-xl)',
                        textAlign: 'left'
                    }}>
                        <div style={{ marginBottom: 'var(--space-sm)' }}>✔ PDFs profissionais</div>
                        <div style={{ marginBottom: 'var(--space-sm)' }}>✔ Envio por WhatsApp</div>
                        <div>✔ Sem limite de orçamentos</div>
                    </div>

                    <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                        <button onClick={handleActivate} className="btn btn-primary btn-lg" style={{ flex: 1 }}>
                            Ativar Conta
                        </button>
                        <button onClick={onClose} className="btn btn-secondary btn-lg">
                            Depois
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
