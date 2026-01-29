import { useEffect, useMemo, useState } from 'react';
import { initMercadoPago, Payment } from '@mercadopago/sdk-react';
import api, { actions } from '../api';

const ANNUAL_PRICE = 297.0;
const PUBLIC_KEY = import.meta.env.VITE_MP_PUBLIC_KEY;

export default function TrialBlockModal({ onClose }) {
    const [loading, setLoading] = useState(false);
    const [paymentResult, setPaymentResult] = useState(null);

    useEffect(() => {
        if (PUBLIC_KEY) {
            initMercadoPago(PUBLIC_KEY, { locale: 'pt-BR' });
        }
    }, []);

    const initialization = useMemo(() => ({ amount: ANNUAL_PRICE }), []);
    const customization = useMemo(() => ({
        paymentMethods: {
            creditCard: 'all',
            debitCard: 'all',
            pix: 'all'
        }
    }), []);

    const handleSubmit = async (formData) => {
        try {
            setLoading(true);
            const payload = {
                payment_method_id: formData?.paymentMethodId,
                token: formData?.token,
                issuer_id: formData?.issuerId,
                installments: formData?.installments,
                payer: formData?.payer
            };
            const res = await api.post('/payment/transparent', payload);
            setPaymentResult(res.data);
            return res.data;
        } catch (error) {
            console.error('Error processing payment:', error);
            alert('Erro ao processar pagamento. Verifique os dados e tente novamente.');
            throw error;
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

    const pixData = paymentResult?.point_of_interaction?.transaction_data;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-sm)' }}>🎯</div>
                    <h2 style={{ marginBottom: 'var(--space-sm)', fontSize: '1.8rem' }}>
                        Seus 3 orçamentos gratuitos acabaram!
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-md)', fontSize: '1.05rem' }}>
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
                            De <s>R$ 468,00</s> (12 mensalidades) por <strong>R$ 297,00/ano</strong>
                            <br />
                            <strong style={{ color: '#22c55e' }}>Você economiza R$ 171,00</strong> comparado ao mensal
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
                            <span>✓</span> Acesso liberado imediatamente
                        </div>
                    </div>

                    {PUBLIC_KEY ? (
                        <div style={{ textAlign: 'left', marginBottom: 'var(--space-md)' }}>
                            <Payment
                                initialization={initialization}
                                customization={customization}
                                onSubmit={handleSubmit}
                                onError={(error) => console.error('Brick error:', error)}
                                onReady={() => {}}
                            />
                        </div>
                    ) : (
                        <div className="error-message" style={{ marginBottom: 'var(--space-md)' }}>
                            Chave pública do Mercado Pago não configurada.
                        </div>
                    )}

                    {loading && (
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 'var(--space-sm)' }}>
                            Processando pagamento...
                        </div>
                    )}

                    {pixData?.qr_code_base64 && (
                        <div style={{
                            background: '#f8fafc',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-md)',
                            padding: 'var(--space-md)',
                            textAlign: 'center',
                            marginBottom: 'var(--space-md)'
                        }}>
                            <div style={{ fontWeight: 600, marginBottom: 'var(--space-sm)' }}>Pague com Pix</div>
                            <img
                                alt="QR Code Pix"
                                src={`data:image/png;base64,${pixData.qr_code_base64}`}
                                style={{ width: '180px', height: '180px', marginBottom: 'var(--space-sm)' }}
                            />
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-sm)' }}>
                                Escaneie o QR Code ou copie o código abaixo.
                            </div>
                            <textarea
                                readOnly
                                className="textarea"
                                value={pixData.qr_code}
                                style={{ fontSize: '0.8rem' }}
                            />
                            {pixData.ticket_url && (
                                <a
                                    href={pixData.ticket_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="btn btn-secondary btn-sm"
                                    style={{ marginTop: 'var(--space-sm)' }}
                                >
                                    Abrir no app do banco
                                </a>
                            )}
                        </div>
                    )}

                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>
                        🔒 Pagamento seguro via Mercado Pago
                    </div>

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
    );
}
