import PDFDocument from 'pdfkit';

export function generateBudgetPDF(budget, user) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50 });
            const chunks = [];

            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            // Header
            doc.fontSize(24).font('Helvetica-Bold').text('ORÇAMENTO', { align: 'center' });
            doc.moveDown(0.5);
            doc.fontSize(18).text(`#${String(budget.numero).padStart(4, '0')}`, { align: 'center' });
            doc.moveDown(1.5);

            // User info
            doc.fontSize(12).font('Helvetica-Bold').text(user.nome);
            if (user.telefone) doc.fontSize(10).font('Helvetica').text(`Tel: ${user.telefone}`);
            if (user.email) doc.text(`Email: ${user.email}`);
            if (user.tipo_servico) doc.text(`Serviço: ${user.tipo_servico}`);
            doc.moveDown(1);

            // Client info
            doc.fontSize(12).font('Helvetica-Bold').text('Cliente:');
            doc.fontSize(10).font('Helvetica').text(budget.client_nome);
            if (budget.client_telefone) doc.text(`Tel: ${budget.client_telefone}`);
            if (budget.client_email) doc.text(`Email: ${budget.client_email}`);
            doc.moveDown(1);

            // Date
            const date = new Date(budget.data);
            doc.fontSize(10).text(`Data: ${date.toLocaleDateString('pt-BR')}`);
            doc.moveDown(1.5);

            // Items table header
            const tableTop = doc.y;
            doc.fontSize(10).font('Helvetica-Bold');
            doc.text('Descrição', 50, tableTop, { width: 250 });
            doc.text('Qtd', 310, tableTop, { width: 50, align: 'center' });
            doc.text('Valor Unit.', 370, tableTop, { width: 80, align: 'right' });
            doc.text('Total', 460, tableTop, { width: 80, align: 'right' });

            doc.moveTo(50, tableTop + 15).lineTo(540, tableTop + 15).stroke();

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

            doc.moveTo(50, y).lineTo(540, y).stroke();
            y += 15;

            // Total
            doc.fontSize(12).font('Helvetica-Bold');
            doc.text('TOTAL:', 370, y, { width: 80, align: 'right' });
            doc.fontSize(14).text(formatCurrency(budget.total), 460, y, { width: 80, align: 'right' });

            // Observations
            if (budget.observacoes) {
                doc.moveDown(2);
                doc.fontSize(10).font('Helvetica-Bold').text('Observações:');
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
