import express from 'express';
import db from '../database.js';
import { authenticateAdmin } from '../middleware/auth.js';

const router = express.Router();

// Função auxiliar para verificar se o plano está ativo
function isPaidActive(user) {
    if (!user || !user.is_paid) {
        return false;
    }
    if (!user.paid_until) {
        return true;
    }
    const paidUntilValue = String(user.paid_until);
    const paidUntilMs = Date.parse(paidUntilValue);
    if (Number.isNaN(paidUntilMs)) {
        return false;
    }
    const nowMs = Date.now();
    if (paidUntilValue.length === 10) {
        const endOfDay = new Date(paidUntilMs);
        endOfDay.setHours(23, 59, 59, 999);
        return endOfDay.getTime() >= nowMs;
    }
    return paidUntilMs >= nowMs;
}

// Função para calcular dias restantes
function getDaysRemaining(paid_until) {
    if (!paid_until) return null;
    
    const paidUntilValue = String(paid_until);
    const paidUntilMs = Date.parse(paidUntilValue);
    if (Number.isNaN(paidUntilMs)) {
        return null;
    }
    
    const now = new Date();
    const endDate = new Date(paidUntilMs);
    
    if (paidUntilValue.length === 10) {
        endDate.setHours(23, 59, 59, 999);
    }
    
    const diffTime = endDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 0;
}

// Listar todos os usuários (com filtros)
router.get('/users', authenticateAdmin, (req, res) => {
    try {
        const { filter, search } = req.query;
        let query = `
            SELECT 
                id, email, nome, telefone, tipo_servico, 
                is_paid, paid_until, trial_budget_count, 
                trial_blocked_at, created_at
            FROM users
            WHERE is_admin = 0
        `;
        const params = [];

        // Filtro por data de cadastro
        if (filter) {
            const now = new Date();
            let startDate;

            switch (filter) {
                case 'today':
                    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    query += ' AND created_at >= ?';
                    params.push(startDate.toISOString());
                    break;
                case 'yesterday':
                    const yesterday = new Date(now);
                    yesterday.setDate(yesterday.getDate() - 1);
                    const yesterdayStart = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
                    const yesterdayEnd = new Date(yesterdayStart);
                    yesterdayEnd.setDate(yesterdayEnd.getDate() + 1);
                    query += ' AND created_at >= ? AND created_at < ?';
                    params.push(yesterdayStart.toISOString(), yesterdayEnd.toISOString());
                    break;
                case 'week':
                    const weekAgo = new Date(now);
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    query += ' AND created_at >= ?';
                    params.push(weekAgo.toISOString());
                    break;
                case 'month':
                    const monthAgo = new Date(now);
                    monthAgo.setMonth(monthAgo.getMonth() - 1);
                    query += ' AND created_at >= ?';
                    params.push(monthAgo.toISOString());
                    break;
            }
        }

        // Busca por nome ou email
        if (search) {
            query += ' AND (nome LIKE ? OR email LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        query += ' ORDER BY created_at DESC';

        const users = db.prepare(query).all(...params);

        // Adicionar informações calculadas
        const usersWithStatus = users.map(user => ({
            ...user,
            is_paid_active: isPaidActive(user),
            days_remaining: user.paid_until ? getDaysRemaining(user.paid_until) : null,
            is_trial: !user.is_paid && user.trial_budget_count < 3,
            is_blocked: !!user.trial_blocked_at
        }));

        res.json(usersWithStatus);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Erro ao buscar usuários' });
    }
});

// Estatísticas gerais
router.get('/stats', authenticateAdmin, (req, res) => {
    try {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        const stats = {
            total_users: db.prepare('SELECT COUNT(*) as count FROM users WHERE is_admin = 0').get().count,
            new_today: db.prepare('SELECT COUNT(*) as count FROM users WHERE is_admin = 0 AND created_at >= ?').get(today.toISOString()).count,
            paid_active: db.prepare('SELECT COUNT(*) as count FROM users WHERE is_admin = 0 AND is_paid = 1 AND (paid_until IS NULL OR paid_until >= ?)').get(now.toISOString()).count,
            trial_users: db.prepare('SELECT COUNT(*) as count FROM users WHERE is_admin = 0 AND is_paid = 0 AND trial_budget_count < 3 AND trial_blocked_at IS NULL').get().count,
            blocked_users: db.prepare('SELECT COUNT(*) as count FROM users WHERE is_admin = 0 AND trial_blocked_at IS NOT NULL').get().count
        };

        res.json(stats);
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Erro ao buscar estatísticas' });
    }
});

// Usuários com planos a vencer (próximos 7 dias)
router.get('/expiring-soon', authenticateAdmin, (req, res) => {
    try {
        const now = new Date();
        const sevenDaysLater = new Date(now);
        sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

        const users = db.prepare(`
            SELECT 
                id, email, nome, telefone, tipo_servico,
                is_paid, paid_until, created_at
            FROM users
            WHERE is_admin = 0 
            AND is_paid = 1 
            AND paid_until IS NOT NULL
            AND paid_until >= ?
            AND paid_until <= ?
            ORDER BY paid_until ASC
        `).all(now.toISOString(), sevenDaysLater.toISOString());

        const usersWithDays = users.map(user => ({
            ...user,
            days_remaining: getDaysRemaining(user.paid_until)
        }));

        res.json(usersWithDays);
    } catch (error) {
        console.error('Error fetching expiring users:', error);
        res.status(500).json({ error: 'Erro ao buscar planos a vencer' });
    }
});

// Ativar plano de 30 dias
router.post('/activate-plan/:userId', authenticateAdmin, (req, res) => {
    try {
        const { userId } = req.params;
        const { days } = req.body; // 30 ou 90

        if (!days || (days !== 30 && days !== 90)) {
            return res.status(400).json({ error: 'Plano inválido. Use 30 ou 90 dias.' });
        }

        const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        // Calcular data de expiração
        const now = new Date();
        const expirationDate = new Date(now);
        expirationDate.setDate(expirationDate.getDate() + days);

        // Formatar como YYYY-MM-DD
        const formattedDate = expirationDate.toISOString().split('T')[0];

        // Ativar plano
        db.prepare(`
            UPDATE users 
            SET is_paid = 1, 
                paid_until = ?,
                trial_blocked_at = NULL
            WHERE id = ?
        `).run(formattedDate, userId);

        const updatedUser = db.prepare(`
            SELECT id, email, nome, telefone, tipo_servico,
                   is_paid, paid_until, trial_budget_count, created_at
            FROM users WHERE id = ?
        `).get(userId);

        res.json({
            message: `Plano de ${days} dias ativado com sucesso`,
            user: {
                ...updatedUser,
                is_paid_active: true,
                days_remaining: days
            }
        });
    } catch (error) {
        console.error('Error activating plan:', error);
        res.status(500).json({ error: 'Erro ao ativar plano' });
    }
});

// Desativar plano
router.post('/deactivate-plan/:userId', authenticateAdmin, (req, res) => {
    try {
        const { userId } = req.params;

        const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        db.prepare(`
            UPDATE users 
            SET is_paid = 0, 
                paid_until = NULL
            WHERE id = ?
        `).run(userId);

        const updatedUser = db.prepare(`
            SELECT id, email, nome, telefone, tipo_servico,
                   is_paid, paid_until, trial_budget_count, created_at
            FROM users WHERE id = ?
        `).get(userId);

        res.json({
            message: 'Plano desativado com sucesso',
            user: {
                ...updatedUser,
                is_paid_active: false,
                days_remaining: 0
            }
        });
    } catch (error) {
        console.error('Error deactivating plan:', error);
        res.status(500).json({ error: 'Erro ao desativar plano' });
    }
});

// Obter detalhes de um usuário
router.get('/users/:userId', authenticateAdmin, (req, res) => {
    try {
        const { userId } = req.params;

        const user = db.prepare(`
            SELECT id, email, nome, telefone, tipo_servico,
                   is_paid, paid_until, trial_budget_count, 
                   trial_blocked_at, created_at
            FROM users WHERE id = ? AND is_admin = 0
        `).get(userId);

        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        // Buscar estatísticas de orçamentos
        const budgetStats = db.prepare(`
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN status = 'enviado' THEN 1 END) as enviados,
                COUNT(CASE WHEN status = 'aprovado' THEN 1 END) as aprovados,
                COUNT(CASE WHEN status = 'recusado' THEN 1 END) as recusados,
                COUNT(CASE WHEN status = 'rascunho' THEN 1 END) as rascunhos
            FROM budgets WHERE user_id = ?
        `).get(userId);

        res.json({
            ...user,
            is_paid_active: isPaidActive(user),
            days_remaining: user.paid_until ? getDaysRemaining(user.paid_until) : null,
            budget_stats: budgetStats
        });
    } catch (error) {
        console.error('Error fetching user details:', error);
        res.status(500).json({ error: 'Erro ao buscar detalhes do usuário' });
    }
});

export default router;
