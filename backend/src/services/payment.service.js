import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';

const accessToken = process.env.MP_ACCESS_TOKEN;
const mpClient = new MercadoPagoConfig({ accessToken });
const FRONTEND_URL = process.env.FRONTEND_URL || process.env.APP_URL || 'https://orcazap.net';

export async function createAnnualPreference(user) {
    if (!accessToken) {
        throw new Error('MP_ACCESS_TOKEN not configured');
    }
    const preference = new Preference(mpClient);
    const response = await preference.create({
        body: {
            items: [
                {
                    title: 'OrçaZap PRO - Plano Anual (12 Meses)',
                    quantity: 1,
                    unit_price: 297.0,
                    currency_id: 'BRL'
                }
            ],
            payer: {
                email: user.email
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

export async function getPaymentDetails(paymentId) {
    if (!accessToken) {
        throw new Error('MP_ACCESS_TOKEN not configured');
    }
    const payment = new Payment(mpClient);
    return payment.get({ id: paymentId });
}
