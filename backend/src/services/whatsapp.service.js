const SUPPORT_WHATSAPP = '551151923162'; // Replace with your WhatsApp number

export function generateBudgetWhatsAppLink(budget, clientPhone, template, pdfUrl) {
    const numero = `#${String(budget.numero).padStart(4, '0')}`;
    const total = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(budget.total);

    // Replace template placeholders
    let message = template
        .replace(/\{\{cliente\}\}/g, budget.client_nome)
        .replace(/\{\{numero\}\}/g, numero)
        .replace(/\{\{total\}\}/g, total);

    // Adiciona link do PDF na mensagem
    if (pdfUrl) {
        message += `\n\n📄 *Ver orçamento em PDF:*\n${pdfUrl}`;
    }

    // Clean phone number (remove non-digits)
    const cleanPhone = clientPhone.replace(/\D/g, '');

    // Encode message for URL
    const encodedMessage = encodeURIComponent(message);

    return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}

export function generateActivationWhatsAppLink(userEmail) {
    const message = `Olá!

Já utilizei meus 3 orçamentos gratuitos e gostaria de ativar minha conta.

Planos disponíveis:
• Mensal: R$ 39
• Trimestral: R$ 97

Email cadastrado: ${userEmail}`;

    const encodedMessage = encodeURIComponent(message);

    return `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodedMessage}`;
}
