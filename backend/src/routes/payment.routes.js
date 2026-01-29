import express from 'express';
import db from '../database.js';
import { authenticateToken } from '../middleware/auth.js';
import { createAnnualPreference, getPaymentDetails } from '../services/payment.service.js';

const router = express.Router();

router.post('/checkout', authenticateToken, async (req, res) => {
    try {
        const user = db.prepare('SELECT id, email FROM users WHERE id = ?').get(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        const preference = await createAnnualPreference(user);
        res.json({
            init_point: preference.init_point,
            id: preference.id
        });
    } catch (error) {
        console.error('Checkout error:', error);
        res.status(500).json({ error: 'Erro ao criar pagamento' });
    }
});

router.post('/webhook', async (req, res) => {
    try {
        const topic = req.query.topic || req.query.type;
        if (topic !== 'payment') {
            return res.status(200).json({ received: true });
        }

        const paymentId = req.query.id || req.body?.data?.id || req.body?.id;
        if (!paymentId) {
            return res.status(400).json({ error: 'Pagamento não informado' });
        }

        const payment = await getPaymentDetails(paymentId);
        if (payment.status !== 'approved') {
            return res.status(200).json({ received: true, status: payment.status });
        }

        const userId = parseInt(payment.external_reference, 10);
        if (!Number.isFinite(userId)) {
            return res.status(200).json({ received: true });
        }

        const paidUntil = new Date();
        paidUntil.setDate(paidUntil.getDate() + 365);
        const paidUntilValue = paidUntil.toISOString().slice(0, 10);

        db.prepare(`
      UPDATE users
      SET is_paid = 1, paid_until = ?, trial_blocked_at = NULL
      WHERE id = ?
    `).run(paidUntilValue, userId);

        res.status(200).json({ received: true });
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ error: 'Erro ao processar webhook' });
    }
});

export default router;
