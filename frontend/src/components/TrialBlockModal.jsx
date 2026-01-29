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
                    <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-sm)' }}>🎯</div>
                    <h2 style={{ marginBottom: 'var(--space-sm)' }}>
                        Seus 3 orçamentos gratuitos acabaram!
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-md)', fontSize: '1.1rem' }}>
                        Continue gerando orçamentos profissionais e fechando mais serviços.
                    </p>

                    <div style={{
                        background: 'linear-gradient(135deg, rgba(102,126,234,0.15), rgba(118,75,162,0.15))',
                        border: '2px solid #667eea',
                        padding: 'var(--space-lg)',
                        borderRadius: 'var(--radius-lg)',
                        marginBottom: 'var(--space-md)',
                        position: 'relative'
                    }}>
                        <div style={{
                            position: 'absolute',
                            top: '-12px',
                            right: '20px',
                            background: '#22c55e',
                            color: 'white',
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: 'bold'
                        }}>
                            ECONOMIZE 36%
                        </div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 'var(--space-sm)' }}>
                            Plano Anual - Melhor Custo Benefício
                        </div>
                        <div style={{ fontSize: '2rem', fontWeight: 700, color: '#667eea', marginBottom: 'var(--space-xs)' }}>
                            12x de R$ 24,75
                        </div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>
                            ou R$ 297,00 à vista
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            De <s>R$ 468,00</s> por <strong>R$ 297,00/ano</strong>
                            <br />
                            <strong style={{ color: '#22c55e' }}>Você economiza R$ 171,00</strong> em relação ao mensal
                        </div>
                    </div>

                    <div style={{
                        background: '#f8f9fa',
                        padding: 'var(--space-md)',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: 'var(--space-lg)',
                        textAlign: 'left',
                        fontSize: '0.9rem'
                    }}>
                        <div style={{ marginBottom: 'var(--space-xs)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>✓</span> Orçamentos ilimitados
                        </div>
                        <div style={{ marginBottom: 'var(--space-xs)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>✓</span> PDFs profissionais com sua logo
                        </div>
                        <div style={{ marginBottom: 'var(--space-xs)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>✓</span> Envio direto para WhatsApp
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>✓</span> Acesso liberado automaticamente
                        </div>
                    </div>

                    <button
                        onClick={handleCheckout}
                        className="btn btn-whatsapp btn-lg"
                        style={{ width: '100%', fontWeight: 700, fontSize: '1.1rem' }}
                        disabled={loading}
                    >
                        {loading ? 'Redirecionando...' : 'Assinar Agora e Liberar Acesso'}
                    </button>

                    <div style={{ marginTop: 'var(--space-md)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        Pagamento seguro via Mercado Pago
                    </div>

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
