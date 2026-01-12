import PDFDocument from 'pdfkit';

const DEFAULT_ACCENT_COLOR = '#2563eb';

export function generateBudgetPDF(budget, user) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 40 });
            const chunks = [];

            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            const accentColor = getAccentColor(user && user.brand_color);
            const date = new Date(budget.data);
            const formattedDate = date.toLocaleDateString('pt-BR');
            const logoBuffer = getLogoBuffer(budget.logo_data);

            // Header
            doc.fillColor(accentColor)
                .rect(50, 32, doc.page.width - 100, 3)
                .fill();
            if (logoBuffer) {
                doc.image(logoBuffer, 50, 38, { fit: [90, 45] });
                doc.moveDown(0.6);
            }
            doc.fillColor(accentColor).fontSize(22).font('Helvetica-Bold').text('OR\u00c7AMENTO', { align: 'center' });
            doc.moveDown(0.5);
            const metaY = doc.y;
            doc.fontSize(10).font('Helvetica-Bold');
            doc.text(`Or\u00e7amento #${String(budget.numero).padStart(4, '0')}`, 50, metaY, { width: 250 });
            doc.text(formattedDate, 300, metaY, { width: 240, align: 'right' });
            doc.fillColor('black');
            doc.moveDown(1.6);

            // User and client info
            const leftX = 50;
            const columnGap = 20;
            const contentWidth = doc.page.width - 100;
            const columnWidth = (contentWidth - columnGap) / 2;
            const rightX = leftX + columnWidth + columnGap;
            const blockTopY = doc.y;

            doc.fontSize(11).font('Helvetica-Bold').fillColor(accentColor);
            doc.text('Prestador', leftX, blockTopY, { width: columnWidth });
            doc.text('Cliente', rightX, blockTopY, { width: columnWidth });
            doc.fillColor('black');

            let leftY = blockTopY + doc.currentLineHeight() + 8;
            let rightY = blockTopY + doc.currentLineHeight() + 8;

            doc.fontSize(12).font('Helvetica-Bold').text(user.nome, leftX, leftY, { width: columnWidth });
            leftY += doc.currentLineHeight() + 2;

            const formattedUserPhone = formatPhone(user.telefone);
            if (formattedUserPhone) {
                doc.fontSize(10).font('Helvetica').text(`Telefone: ${formattedUserPhone}`, leftX, leftY, { width: columnWidth });
                leftY += doc.currentLineHeight() + 2;
            }
            if (user.email) {
                doc.fontSize(9).text(`Email: ${user.email}`, leftX, leftY, { width: columnWidth });
                leftY += doc.currentLineHeight() + 2;
            }
            if (user.tipo_servico) {
                doc.fontSize(9).text(`Servi\u00e7o: ${user.tipo_servico}`, leftX, leftY, { width: columnWidth });
                leftY += doc.currentLineHeight() + 2;
            }

            doc.fontSize(12).font('Helvetica-Bold').text(budget.client_nome, rightX, rightY, { width: columnWidth });
            rightY += doc.currentLineHeight() + 2;

            const formattedClientPhone = formatPhone(budget.client_telefone);
            if (formattedClientPhone) {
                doc.fontSize(10).font('Helvetica').text(`Telefone: ${formattedClientPhone}`, rightX, rightY, { width: columnWidth });
                rightY += doc.currentLineHeight() + 2;
            }
            if (budget.client_email) {
                doc.fontSize(9).text(`Email: ${budget.client_email}`, rightX, rightY, { width: columnWidth });
                rightY += doc.currentLineHeight() + 2;
            }

            doc.y = Math.max(leftY, rightY) + 28;

            // Items table header
            doc.fontSize(12).font('Helvetica-Bold').fillColor(accentColor).text('Itens');
            doc.fillColor('black');
            doc.moveDown(0.8);
            const tableTop = doc.y;
            const headerHeight = 18;
            doc.fillColor('#f5f5f5').rect(50, tableTop - 4, 490, headerHeight).fill();
            doc.fontSize(10).font('Helvetica-Bold').fillColor(accentColor);
            doc.text('Descri\u00e7\u00e3o', 50, tableTop, { width: 250 });
            doc.text('Qtd', 310, tableTop, { width: 50, align: 'center' });
            doc.text('Valor Unit.', 370, tableTop, { width: 80, align: 'right' });
            doc.text('Total', 460, tableTop, { width: 80, align: 'right' });

            doc.strokeColor(accentColor).lineWidth(1.2).moveTo(50, tableTop + 15).lineTo(540, tableTop + 15).stroke();
            doc.lineWidth(1);
            doc.fillColor('black');

            let y = tableTop + 25;
            doc.font('Helvetica');

            // Items
            for (const item of budget.items) {
                const itemTotal = item.quantidade * item.valor_unitario;

                doc.text(item.descricao, 50, y, { width: 250 });
                doc.text(item.quantidade.toString(), 310, y, { width: 50, align: 'center' });
                doc.text(formatCurrency(item.valor_unitario), 370, y, { width: 80, align: 'right' });
                doc.text(formatCurrency(itemTotal), 460, y, { width: 80, align: 'right' });

                y += 25;

                // Add new page if needed
                if (y > 700) {
                    doc.addPage();
                    y = 50;
                }
            }

            doc.strokeColor('black').moveTo(50, y).lineTo(540, y).stroke();
            y += 15;

            // Total
            doc.fontSize(12).font('Helvetica-Bold');
            doc.text('TOTAL:', 370, y, { width: 80, align: 'right' });
            doc.fillColor(accentColor).fontSize(14).text(formatCurrency(budget.total), 460, y, { width: 80, align: 'right' });
            doc.fillColor('black');

            // Observations
            if (budget.observacoes) {
                doc.moveDown(2);
                doc.fillColor(accentColor);
                doc.fontSize(10).font('Helvetica-Bold').text('Observa\u00e7\u00f5es:');
                doc.fillColor('black');
                doc.fontSize(9).font('Helvetica').text(budget.observacoes, { width: 490 });
            }

            // Footer
            doc.fontSize(8).font('Helvetica').text(
                'Or\u00e7amento v\u00e1lido por 30 dias',
                50,
                doc.page.height - 50,
                { align: 'center' }
            );

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
}

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

function formatPhone(value) {
    if (!value) {
        return '';
    }
    let digits = String(value).replace(/\D/g, '');
    if (!digits) {
        return '';
    }
    if (digits.length > 11 && digits.startsWith('55')) {
        digits = digits.slice(-11);
    }
    if (digits.length == 11) {
        return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    }
    if (digits.length == 10) {
        return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    }
    return digits;
}

function getLogoBuffer(value) {
    if (!value || typeof value !== 'string') {
        return null;
    }
    const trimmed = value.trim();
    if (!trimmed) {
        return null;
    }
    const dataIndex = trimmed.indexOf('base64,');
    const base64 = dataIndex >= 0 ? trimmed.slice(dataIndex + 7) : trimmed;
    try {
        return Buffer.from(base64, 'base64');
    } catch {
        return null;
    }
}

function getAccentColor(value) {
    const color = typeof value === 'string' ? value.trim() : '';
    return /^#[0-9a-fA-F]{6}$/.test(color) ? color.toLowerCase() : DEFAULT_ACCENT_COLOR;
}
