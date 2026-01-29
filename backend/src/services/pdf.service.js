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
            const baseDate = Number.isNaN(date.getTime()) ? new Date() : date;
            const formattedDate = baseDate.toLocaleDateString('pt-BR');
            const validadeDias = Number.isFinite(parseInt(budget.validade, 10)) && parseInt(budget.validade, 10) > 0
                ? parseInt(budget.validade, 10)
                : 15;
            const validUntilDate = new Date(baseDate);
            validUntilDate.setDate(validUntilDate.getDate() + validadeDias);
            const formattedValidUntil = validUntilDate.toLocaleDateString('pt-BR');
            const logoBuffer = getLogoBuffer(budget.logo_data);

            const pageMargin = doc.page.margins.left;
            const pageWidth = doc.page.width;
            const pageHeight = doc.page.height;
            const contentWidth = pageWidth - pageMargin * 2;
            const columnGap = 20;
            const columnWidth = (contentWidth - columnGap) / 2;
            const leftX = pageMargin;
            const rightX = leftX + columnWidth + columnGap;
            const baseTextColor = '#111827';
            const mutedTextColor = '#6b7280';

            let cursorY = pageMargin;

            if (logoBuffer) {
                doc.image(logoBuffer, pageWidth - pageMargin - 90, cursorY, { fit: [90, 40] });
            }

            doc.fillColor(baseTextColor).fontSize(20).font('Helvetica-Bold').text('OR\u00c7AMENTO', leftX, cursorY);
            const titleHeight = doc.currentLineHeight();
            doc.fontSize(9).font('Helvetica').fillColor(mutedTextColor);
            const metaY = cursorY + titleHeight + 4;
            const metaLineHeight = doc.currentLineHeight();
            doc.text(`Data: ${formattedDate}`, leftX, metaY);
            doc.text(`V\u00e1lido at\u00e9: ${formattedValidUntil}`, leftX, metaY + metaLineHeight + 2);

            cursorY = metaY + metaLineHeight * 2 + 10;
            doc.strokeColor(accentColor).lineWidth(1).moveTo(leftX, cursorY).lineTo(leftX + contentWidth, cursorY).stroke();
            cursorY += 12;

            const formattedUserPhone = formatPhone(user?.telefone);
            const formattedClientPhone = formatPhone(budget.client_telefone);
            const cardPadding = 12;
            const cardGap = 16;
            const cardWidth = (contentWidth - cardGap) / 2;
            const cardInnerWidth = cardWidth - cardPadding * 2;

            const buildInfoLines = ({ title, name, service, phone, email }) => {
                const lines = [
                    { text: title, font: 'Helvetica-Bold', size: 9, color: accentColor, spacing: 6 },
                    { text: name || '-', font: 'Helvetica-Bold', size: 12, color: baseTextColor, spacing: 2 }
                ];
                if (service) {
                    lines.push({ text: service, font: 'Helvetica', size: 10, color: baseTextColor, spacing: 4 });
                }
                if (phone) {
                    lines.push({ text: `WhatsApp: ${phone}`, font: 'Helvetica', size: 9, color: accentColor, spacing: 4 });
                }
                if (email) {
                    lines.push({ text: `Email: ${email}`, font: 'Helvetica', size: 9, color: accentColor, spacing: 0 });
                }
                lines[lines.length - 1].spacing = 0;
                return lines;
            };

            const providerLines = buildInfoLines({
                title: 'Prestador',
                name: user?.nome,
                service: user?.tipo_servico,
                phone: formattedUserPhone,
                email: user?.email
            });

            const clientLines = buildInfoLines({
                title: 'Cliente',
                name: budget.client_nome,
                phone: formattedClientPhone,
                email: budget.client_email
            });

            const measureLine = (line) => {
                doc.font(line.font).fontSize(line.size);
                return doc.heightOfString(line.text, { width: cardInnerWidth });
            };

            const getBlockHeight = (lines) => {
                let height = cardPadding * 2;
                for (const line of lines) {
                    height += measureLine(line) + line.spacing;
                }
                return height;
            };

            const drawBlock = (x, y, height, lines) => {
                doc.fillColor('#f8fafc').roundedRect(x, y, cardWidth, height, 6).fill();
                doc.strokeColor('#e5e7eb').roundedRect(x, y, cardWidth, height, 6).stroke();

                let textY = y + cardPadding;
                for (const line of lines) {
                    doc.font(line.font).fontSize(line.size).fillColor(line.color)
                        .text(line.text, x + cardPadding, textY, { width: cardInnerWidth });
                    textY += doc.heightOfString(line.text, { width: cardInnerWidth }) + line.spacing;
                }
                doc.fillColor(baseTextColor);
            };

            const leftHeight = getBlockHeight(providerLines);
            const rightHeight = getBlockHeight(clientLines);
            const cardHeight = Math.max(leftHeight, rightHeight);
            const rightCardX = leftX + cardWidth + cardGap;

            drawBlock(leftX, cursorY, cardHeight, providerLines);
            drawBlock(rightCardX, cursorY, cardHeight, clientLines);

            cursorY += cardHeight + 16;

            doc.fontSize(10).font('Helvetica-Bold').fillColor(accentColor).text('Itens', leftX, cursorY);
            cursorY = doc.y + 8;

            const descWidth = Math.round(contentWidth * 0.48);
            const qtyWidth = 80;
            const unitWidth = 90;
            const totalWidth = contentWidth - descWidth - qtyWidth - unitWidth;
            const descX = leftX;
            const qtyX = descX + descWidth;
            const unitX = qtyX + qtyWidth;
            const totalX = unitX + unitWidth;
            const headerHeight = 18;

            const drawTableHeader = () => {
                doc.fillColor('#f3f4f6').rect(leftX, cursorY, contentWidth, headerHeight).fill();
                doc.fontSize(9).font('Helvetica-Bold').fillColor(accentColor);
                doc.text('Descri\u00e7\u00e3o', descX + 6, cursorY + 4, { width: descWidth - 8 });
                doc.text('Qtd', qtyX, cursorY + 4, { width: qtyWidth, align: 'center' });
                doc.text('Valor unit\u00e1rio', unitX, cursorY + 4, { width: unitWidth, align: 'right' });
                doc.text('Total do item', totalX, cursorY + 4, { width: totalWidth, align: 'right' });
                doc.fillColor(baseTextColor).font('Helvetica');
                cursorY += headerHeight + 6;
            };

            drawTableHeader();

            for (const item of budget.items) {
                const itemTotal = item.quantidade * item.valor_unitario;
                const description = item.descricao || '-';
                const descriptionHeight = doc.heightOfString(description, { width: descWidth - 8 });
                const rowHeight = Math.max(descriptionHeight, doc.currentLineHeight());
                const bottomLimit = pageHeight - pageMargin - 80;

                if (cursorY + rowHeight > bottomLimit) {
                    doc.addPage();
                    cursorY = pageMargin;
                    drawTableHeader();
                }

                const unidadeRaw = typeof item.unidade === 'string' && item.unidade.trim() ? item.unidade.trim() : 'un';
                const normalizedUnit = unidadeRaw.toLowerCase();
                const unidadeLabel = normalizedUnit === 'm\u00b2' || normalizedUnit === 'm2'
                    ? 'm\u00b2'
                    : unidadeRaw.toUpperCase();
                const quantityLabel = `${item.quantidade} ${unidadeLabel}`;

                doc.fontSize(9).fillColor(baseTextColor).text(description, descX + 6, cursorY, { width: descWidth - 8 });
                doc.text(quantityLabel, qtyX, cursorY, { width: qtyWidth, align: 'center' });
                doc.text(formatCurrency(item.valor_unitario), unitX, cursorY, { width: unitWidth, align: 'right' });
                doc.text(formatCurrency(itemTotal), totalX, cursorY, { width: totalWidth, align: 'right' });

                cursorY += rowHeight + 8;
            }

            doc.strokeColor('#e5e7eb').lineWidth(1).moveTo(leftX, cursorY).lineTo(leftX + contentWidth, cursorY).stroke();
            cursorY += 10;

            doc.fontSize(11).font('Helvetica-Bold').fillColor(baseTextColor);
            doc.text('TOTAL:', unitX, cursorY, { width: unitWidth, align: 'right' });
            doc.fillColor(accentColor).fontSize(12)
                .text(formatCurrency(budget.total), totalX, cursorY, { width: totalWidth, align: 'right' });
            doc.fillColor(baseTextColor);
            cursorY += 16;

            if (budget.observacoes) {
                const obsText = budget.observacoes;
                const trimmedObs = String(obsText).trim();
                const hasMultipleLines = trimmedObs.includes('\n');
                const obsTitle = (hasMultipleLines || trimmedObs.length > 80)
                    ? 'Observa\u00e7\u00f5es'
                    : 'Observa\u00e7\u00e3o';
                const boxPadding = 10;
                const boxGap = 6;
                const innerWidth = contentWidth - boxPadding * 2;
                const obsTitleHeight = doc.heightOfString(obsTitle, { width: innerWidth });
                const obsTextHeight = doc.heightOfString(obsText, { width: innerWidth });
                const obsBlockHeight = obsTitleHeight + obsTextHeight + boxPadding * 2 + boxGap;
                const footerReserve = 60;
                const maxY = pageHeight - pageMargin - footerReserve;

                if (cursorY + obsBlockHeight > maxY) {
                    doc.addPage();
                    cursorY = pageMargin;
                }

                doc.fillColor('#eef2ff').roundedRect(leftX, cursorY, contentWidth, obsBlockHeight, 6).fill();
                doc.strokeColor(accentColor).lineWidth(1).roundedRect(leftX, cursorY, contentWidth, obsBlockHeight, 6).stroke();

                const textStartY = cursorY + boxPadding;
                doc.fontSize(9).font('Helvetica-Bold').fillColor(accentColor)
                    .text(obsTitle, leftX + boxPadding, textStartY, { width: innerWidth });
                doc.fillColor(baseTextColor).fontSize(10).font('Helvetica')
                    .text(obsText, leftX + boxPadding, textStartY + obsTitleHeight + boxGap, { width: innerWidth });
                cursorY += obsBlockHeight + 12;
            }

            const contactText = formattedUserPhone
                ? `Para aprovar este or\u00e7amento, entre em contato pelo WhatsApp:\n${formattedUserPhone}`
                : 'Para aprovar este or\u00e7amento, entre em contato pelo WhatsApp.';
            const footerHeight = doc.heightOfString(contactText, { width: contentWidth, align: 'center' });
            let footerY = pageHeight - pageMargin - footerHeight;
            if (cursorY + 24 > footerY) {
                doc.addPage();
                footerY = doc.page.height - pageMargin - footerHeight;
            }
            doc.fontSize(9).font('Helvetica').fillColor(mutedTextColor)
                .text(contactText, leftX, footerY, { width: contentWidth, align: 'center' });

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
