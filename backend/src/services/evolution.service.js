import axios from 'axios';

const EVOLUTION_URL = process.env.EVOLUTION_URL;
const EVOLUTION_APIKEY = process.env.EVOLUTION_APIKEY;
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE;

const REQUEST_TIMEOUT_MS = 10000;

function normalizePhoneNumber(phone) {
    const digits = String(phone ?? '').replace(/\D/g, '');
    if (!digits) {
        return null;
    }
    if (digits.startsWith('55')) {
        return digits;
    }
    return `55${digits}`;
}

function buildEvolutionUrl(path) {
    const baseUrl = String(EVOLUTION_URL ?? '').trim().replace(/\/+$/, '');
    if (!baseUrl) {
        return null;
    }
    return `${baseUrl}${path}`;
}

export async function sendWelcomeMessage(name, phone) {
    const number = normalizePhoneNumber(phone);
    if (!number) {
        return;
    }

    const url = buildEvolutionUrl('/message/sendText');
    if (!url || !EVOLUTION_APIKEY) {
        return;
    }

    const safeName = String(name ?? '').trim() || 'cliente';
    const message = `Olá, ${safeName}! Bem-vindo ao OrçaZap 🚀

Sou a assistente virtual. Parabéns por dar o primeiro passo para profissionalizar seus orçamentos!

Se tiver qualquer dúvida ou precisar de ajuda para criar seu primeiro PDF, é só responder essa mensagem.

Bons negócios!`;

    const payload = {
        number,
        text: message,
        ...(EVOLUTION_INSTANCE ? { instanceName: EVOLUTION_INSTANCE } : {})
    };

    await axios.post(url, payload, {
        headers: {
            apikey: EVOLUTION_APIKEY,
            'Content-Type': 'application/json'
        },
        timeout: REQUEST_TIMEOUT_MS
    });
}
