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

            // Header
            doc.fillColor(accentColor)
                .rect(50, 32, doc.page.width - 100, 3)
                .fill();
            doc.fillColor(accentColor).fontSize(22).font('Helvetica-Bold').text('ORCAMENTO', { align: 'center' });
            doc.moveDown(0.3);
            const metaY = doc.y;
            doc.fontSize(10).font('Helvetica-Bold');
            doc.text(`Orcamento #${String(budget.numero).padStart(4, '0')}`, 50, metaY, { width: 250 });
            doc.text(formattedDate, 300, metaY, { width: 240, align: 'right' });
            doc.fillColor('black');
            doc.moveDown(1);

            // User info
            doc.fontSize(13).font('Helvetica-Bold').text(user.nome);
            if (user.telefone) doc.fontSize(10).font('Helvetica').text(`WhatsApp: ${user.telefone}`);
            if (user.email) doc.fontSize(9).text(`Email: ${user.email}`);
            if (user.tipo_servico) doc.fontSize(9).text(`Servico: ${user.tipo_servico}`);
            doc.moveDown(0.8);

            // Client info
            doc.fontSize(12).font('Helvetica-Bold').fillColor(accentColor).text('Cliente:');
            doc.fillColor('black');
            doc.fontSize(10).font('Helvetica').text(budget.client_nome);
            if (budget.client_telefone) doc.text(`Tel: ${budget.client_telefone}`);
            if (budget.client_email) doc.text(`Email: ${budget.client_email}`);
            doc.moveDown(1);

            // Items table header
            doc.fontSize(12).font('Helvetica-Bold').fillColor(accentColor).text('Itens');
            doc.fillColor('black');
            doc.moveDown(0.5);
            const tableTop = doc.y;
            const headerHeight = 18;
            doc.fillColor('#f5f5f5').rect(50, tableTop - 4, 490, headerHeight).fill();
            doc.fontSize(10).font('Helvetica-Bold').fillColor(accentColor);
            doc.text('Descrição', 50, tableTop, { width: 250 });
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
                doc.fontSize(10).font('Helvetica-Bold').text('Observações:');
                doc.fillColor('black');
                doc.fontSize(9).font('Helvetica').text(budget.observacoes, { width: 490 });
            }

            // Footer
            doc.fontSize(8).font('Helvetica').text(
                'Orçamento válido por 30 dias',
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

function getAccentColor(value) {
    const color = typeof value === 'string' ? value.trim() : '';
    return /^#[0-9a-fA-F]{6}$/.test(color) ? color.toLowerCase() : DEFAULT_ACCENT_COLOR;
}
