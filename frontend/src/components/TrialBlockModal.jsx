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
                    <div style={{ fontSize: '2.25rem', marginBottom: 'var(--space-sm)' }}>??</div>
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
                        padding: 'var(--space-md)',
                        borderRadius: 'var(--radius-lg)',
                        marginBottom: 'var(--space-lg)',
                        textAlign: 'left'
                    }}>
                        <div style={{ marginBottom: 'var(--space-xs)', fontWeight: 600 }}>? Acesso liberado automaticamente</div>
                        <div style={{ marginBottom: 'var(--space-xs)' }}>? Or?amentos ilimitados e PDFs profissionais</div>
                        <div>? Envio r?pido por WhatsApp</div>
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
                            Chave p?blica do Mercado Pago n?o configurada.
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
                                Escaneie o QR Code ou copie o c?digo abaixo.
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
                        Pagamento seguro via Mercado Pago
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
