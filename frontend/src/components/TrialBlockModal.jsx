import { useState } from 'react';
import api, { actions } from '../api';

export default function TrialBlockModal({ onClose }) {
    const [loading, setLoading] = useState(false);

    const handleCheckout = async () => {
        try {
            setLoading(true);
            const res = await api.post('/payment/checkout');
            const link = res.data?.init_point;
            if (link) {
                window.location.href = link;
            }
        } catch (error) {
            console.error('Error creating checkout:', error);
            alert('Erro ao iniciar pagamento. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const handleSupport = async () => {
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
                    <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-sm)' }}>??</div>
                    <h2 style={{ marginBottom: 'var(--space-sm)' }}>
                        Seu per?odo gratuito acabou!
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)' }}>
                        De <strong>R$ 468,00</strong> (total de 12 mensalidades) por apenas <strong>R$ 297,00</strong> ? vista no plano Anual.
                        <br />
                        <strong>Economize R$ 171,00</strong> em rela??o ao plano mensal.
                        <br />
                        Isso d? <strong>menos de R$ 25,00 por m?s</strong>.
                    </p>

                    <div style={{
                        background: 'linear-gradient(135deg, rgba(34,197,94,0.12), rgba(34,197,94,0.05))',
                        border: '1px solid rgba(34,197,94,0.3)',
                        padding: 'var(--space-lg)',
                        borderRadius: 'var(--radius-lg)',
                        marginBottom: 'var(--space-lg)',
                        textAlign: 'left'
                    }}>
                        <div style={{ marginBottom: 'var(--space-sm)', fontWeight: 600 }}>? Acesso liberado automaticamente</div>
                        <div style={{ marginBottom: 'var(--space-sm)' }}>? Or?amentos ilimitados e PDFs profissionais</div>
                        <div>? Envio r?pido por WhatsApp</div>
                    </div>

                    <button
                        onClick={handleCheckout}
                        className="btn btn-whatsapp btn-lg"
                        style={{ width: '100%', fontWeight: 700 }}
                        disabled={loading}
                    >
                        {loading ? 'Redirecionando...' : 'Liberar Acesso Agora'}
                    </button>

                    <div style={{ marginTop: 'var(--space-md)' }}>
                        <button
                            type="button"
                            onClick={handleSupport}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-secondary)',
                                fontSize: '0.85rem',
                                textDecoration: 'underline',
                                cursor: 'pointer'
                            }}
                        >
                            Falar com suporte
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
