import crypto from 'crypto';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';

const accessToken = process.env.MP_ACCESS_TOKEN;
const mpClient = new MercadoPagoConfig({ accessToken });
const FRONTEND_URL = process.env.FRONTEND_URL || process.env.APP_URL || 'https://orcazap.net';
const ANNUAL_TITLE = 'Or?aZap PRO - Plano Anual (12 Meses)';
const ANNUAL_PRICE = 297.0;

export async function createAnnualPreference(user) {
    if (!accessToken) {
        throw new Error('MP_ACCESS_TOKEN not configured');
    }
    const preference = new Preference(mpClient);
    const response = await preference.create({
        body: {
            items: [
                {
                    title: ANNUAL_TITLE,
                    quantity: 1,
                    unit_price: ANNUAL_PRICE,
                    currency_id: 'BRL'
                }
            ],
            payer: {
                email: user.email
            },
            payment_methods: {
                excluded_payment_types: [],
                installments: 12
            },
            external_reference: String(user.id),
            back_urls: {
                success: `${FRONTEND_URL}/?payment=success`
            },
            auto_return: 'approved'
        }
    });

    return response;
}

export async function createTransparentPayment(user, payload = {}) {
    if (!accessToken) throw new Error('MP_ACCESS_TOKEN not configured');

    const payment = new Payment(mpClient);
    const idempotencyKey = crypto.randomUUID();
    const paymentMethodId =
        payload.payment_method_id ||
        payload.paymentMethodId ||
        payload?.payment_method?.id;
    const paymentMethod = String(paymentMethodId || '').toLowerCase();

    const nameParts = String(user.nome || '').trim().split(/\s+/).filter(Boolean);
    const firstName = nameParts[0] || 'Cliente';
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Cliente';

    const notificationUrl = process.env.NODE_ENV === 'production'
        ? 'https://orcazap.net/api/payment/webhook'
        : (process.env.WEBHOOK_URL || undefined);

    const baseBody = {
        transaction_amount: ANNUAL_PRICE,
        description: ANNUAL_TITLE,
        payment_method_id: paymentMethodId,
        external_reference: String(user.id),
        notification_url: notificationUrl,
        payer: {
            email: user.email,
            first_name: firstName,
            last_name: lastName,
            identification: payload?.payer?.identification
        }
    };

    if (paymentMethod !== 'pix') {
        baseBody.token = payload.token;
        baseBody.installments = payload.installments || 1;
        if (payload.issuer_id) baseBody.issuer_id = payload.issuer_id;
    }

    return payment.create({ body: baseBody, requestOptions: { idempotencyKey } });
}

export async function getPaymentDetails(paymentId) {
    if (!accessToken) {
        throw new Error('MP_ACCESS_TOKEN not configured');
    }
    const payment = new Payment(mpClient);
    return payment.get({ id: paymentId });
}
