const SUPPORT_WHATSAPP = '5511999999999'; // Replace with your WhatsApp number

export function generateBudgetWhatsAppLink(budget, clientPhone, template) {
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

    // Clean phone number (remove non-digits)
    const cleanPhone = clientPhone.replace(/\D/g, '');

    // Encode message for URL
    const encodedMessage = encodeURIComponent(message);

    return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}

export function generateActivationWhatsAppLink(userEmail) {
    const message = `Olá! Criei meus primeiros orçamentos no sistema e quero ativar minha conta.\nPlano mensal: R$ 79.\nEmail cadastrado: ${userEmail}`;

    const encodedMessage = encodeURIComponent(message);

    return `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodedMessage}`;
}
