import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../database.js';
import { authenticateToken } from '../middleware/auth.js';
import { generateBudgetPDF } from '../services/pdf.service.js';
import { generateBudgetWhatsAppLink, generateActivationWhatsAppLink } from '../services/whatsapp.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

router.use(authenticateToken);

// Generate PDF
router.get('/budgets/:id/pdf', async (req, res) => {
    try {
        const budget = db.prepare(`
      SELECT b.*, c.nome as client_nome, c.telefone as client_telefone, c.email as client_email
      FROM budgets b
      JOIN clients c ON b.client_id = c.id
      WHERE b.id = ? AND b.user_id = ?
    `).get(req.params.id, req.user.id);

        if (!budget) {
            return res.status(404).json({ error: 'Orçamento não encontrado' });
        }

        const items = db.prepare('SELECT * FROM budget_items WHERE budget_id = ?').all(req.params.id);
        
        // Garante que sempre há itens
        if (!items || items.length === 0) {
            return res.status(400).json({ error: 'Orçamento sem itens' });
        }
        
        budget.items = items;

        const user = db.prepare('SELECT nome, email, telefone, tipo_servico, brand_color FROM users WHERE id = ?').get(req.user.id);

        const pdfBuffer = await generateBudgetPDF(budget, user);
        
        // Verifica se o PDF foi gerado corretamente
        if (!pdfBuffer || pdfBuffer.length === 0) {
            throw new Error('PDF vazio gerado');
        }

        // Salva PDF em pasta pública
        const filename = `orcamento-${req.user.id}-${req.params.id}.pdf`;
        const publicPdfsPath = path.join(__dirname, '../../public/pdfs');
        const filePath = path.join(publicPdfsPath, filename);
        
        fs.writeFileSync(filePath, pdfBuffer);
        
        // Gera URL público do PDF
        const protocol = req.protocol;
        const host = req.get('host');
        const pdfUrl = `${protocol}://${host}/pdfs/${filename}`;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=orcamento-${String(budget.numero).padStart(4, '0')}.pdf`);
        res.setHeader('Content-Length', pdfBuffer.length);
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('X-PDF-URL', pdfUrl);
        res.send(pdfBuffer);
    } catch (error) {
        console.error('PDF generation error:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ 
            error: 'Erro ao gerar PDF',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Generate WhatsApp link for budget
router.get('/budgets/:id/whatsapp', (req, res) => {
    try {
        const budget = db.prepare(`
      SELECT b.*, c.nome as client_nome, c.telefone as client_telefone
      FROM budgets b
      JOIN clients c ON b.client_id = c.id
      WHERE b.id = ? AND b.user_id = ?
    `).get(req.params.id, req.user.id);

        if (!budget) {
            return res.status(404).json({ error: 'Orçamento não encontrado' });
        }

        if (!budget.client_telefone) {
            return res.status(400).json({ error: 'Cliente não possui telefone cadastrado' });
        }

        const user = db.prepare('SELECT whatsapp_template FROM users WHERE id = ?').get(req.user.id);

        // Gera URL do PDF
        const filename = `orcamento-${req.user.id}-${req.params.id}.pdf`;
        const protocol = req.protocol;
        const host = req.get('host');
        const pdfUrl = `${protocol}://${host}/pdfs/${filename}`;

        const link = generateBudgetWhatsAppLink(budget, budget.client_telefone, user.whatsapp_template, pdfUrl);

        res.json({ whatsapp_link: link });
    } catch (error) {
        console.error('WhatsApp link error:', error);
        res.status(500).json({ error: 'Erro ao gerar link do WhatsApp' });
    }
});

// Generate activation WhatsApp link
router.get('/activation/whatsapp', (req, res) => {
    try {
        const link = generateActivationWhatsAppLink(req.user.email);
        res.json({ whatsapp_link: link });
    } catch (error) {
        console.error('Activation link error:', error);
        res.status(500).json({ error: 'Erro ao gerar link de ativação' });
    }
});

export default router;
