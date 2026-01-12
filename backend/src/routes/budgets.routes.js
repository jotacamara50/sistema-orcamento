import express from 'express';
import db from '../database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

// List budgets
router.get('/', (req, res) => {
    try {
        const budgets = db.prepare(`
      SELECT b.*, c.nome as client_nome
      FROM budgets b
      JOIN clients c ON b.client_id = c.id
      WHERE b.user_id = ?
      ORDER BY b.created_at DESC
    `).all(req.user.id);

        res.json(budgets);
    } catch (error) {
        console.error('List budgets error:', error);
        res.status(500).json({ error: 'Erro ao listar orçamentos' });
    }
});

// Get budget details
router.get('/:id', (req, res) => {
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

        const items = db.prepare(`
      SELECT * FROM budget_items WHERE budget_id = ?
    `).all(req.params.id);

        res.json({ ...budget, items });
    } catch (error) {
        console.error('Get budget error:', error);
        res.status(500).json({ error: 'Erro ao buscar orçamento' });
    }
});

// Create budget with trial validation
router.post('/', (req, res) => {
    try {
        const { client_id, items, observacoes } = req.body;

        if (!client_id || !items || items.length === 0) {
            return res.status(400).json({ error: 'Cliente e itens são obrigatórios' });
        }

        // Check trial limit
        const user = db.prepare('SELECT is_paid, trial_budget_count FROM users WHERE id = ?').get(req.user.id);

        if (!user.is_paid && user.trial_budget_count >= 3) {
            return res.status(403).json({
                error: 'Limite de orçamentos gratuitos atingido',
                trial_expired: true
            });
        }

        // Verify client ownership
        const client = db.prepare('SELECT user_id FROM clients WHERE id = ?').get(client_id);
        if (!client || client.user_id !== req.user.id) {
            return res.status(404).json({ error: 'Cliente não encontrado' });
        }

        // Get next numero for this user
        const lastBudget = db.prepare(`
      SELECT MAX(numero) as max_numero FROM budgets WHERE user_id = ?
    `).get(req.user.id);
        const numero = (lastBudget.max_numero || 0) + 1;

        // Calculate total
        const total = items.reduce((sum, item) => sum + (item.quantidade * item.valor_unitario), 0);

        // Insert budget
        const budgetResult = db.prepare(`
      INSERT INTO budgets (user_id, client_id, numero, total, observacoes)
      VALUES (?, ?, ?, ?, ?)
    `).run(req.user.id, client_id, numero, total, observacoes || null);

        const budgetId = budgetResult.lastInsertRowid;

        // Insert items
        const insertItem = db.prepare(`
      INSERT INTO budget_items (budget_id, descricao, quantidade, valor_unitario)
      VALUES (?, ?, ?, ?)
    `);

        for (const item of items) {
            insertItem.run(budgetId, item.descricao, item.quantidade, item.valor_unitario);
        }

        // Increment trial count if not paid
        if (!user.is_paid) {
            db.prepare('UPDATE users SET trial_budget_count = trial_budget_count + 1 WHERE id = ?').run(req.user.id);
        }

        // Get created budget
        const budget = db.prepare(`
      SELECT b.*, c.nome as client_nome
      FROM budgets b
      JOIN clients c ON b.client_id = c.id
      WHERE b.id = ?
    `).get(budgetId);

        const budgetItems = db.prepare('SELECT * FROM budget_items WHERE budget_id = ?').all(budgetId);

        res.status(201).json({ ...budget, items: budgetItems });
    } catch (error) {
        console.error('Create budget error:', error);
        res.status(500).json({ error: 'Erro ao criar orçamento' });
    }
});

// Update budget
router.put('/:id', (req, res) => {
    try {
        const { client_id, items, observacoes, status } = req.body;
        const budgetId = req.params.id;

        // Verify ownership
        const budget = db.prepare('SELECT user_id FROM budgets WHERE id = ?').get(budgetId);
        if (!budget || budget.user_id !== req.user.id) {
            return res.status(404).json({ error: 'Orçamento não encontrado' });
        }

        // Calculate new total
        const total = items.reduce((sum, item) => sum + (item.quantidade * item.valor_unitario), 0);

        // Update budget
        db.prepare(`
      UPDATE budgets
      SET client_id = ?, total = ?, observacoes = ?, status = ?
      WHERE id = ?
    `).run(client_id, total, observacoes || null, status || 'rascunho', budgetId);

        // Delete old items
        db.prepare('DELETE FROM budget_items WHERE budget_id = ?').run(budgetId);

        // Insert new items
        const insertItem = db.prepare(`
      INSERT INTO budget_items (budget_id, descricao, quantidade, valor_unitario)
      VALUES (?, ?, ?, ?)
    `);

        for (const item of items) {
            insertItem.run(budgetId, item.descricao, item.quantidade, item.valor_unitario);
        }

        // Get updated budget
        const updated = db.prepare(`
      SELECT b.*, c.nome as client_nome
      FROM budgets b
      JOIN clients c ON b.client_id = c.id
      WHERE b.id = ?
    `).get(budgetId);

        const budgetItems = db.prepare('SELECT * FROM budget_items WHERE budget_id = ?').all(budgetId);

        res.json({ ...updated, items: budgetItems });
    } catch (error) {
        console.error('Update budget error:', error);
        res.status(500).json({ error: 'Erro ao atualizar orçamento' });
    }
});

// Delete budget
router.delete('/:id', (req, res) => {
    try {
        const budgetId = req.params.id;

        // Verify ownership
        const budget = db.prepare('SELECT user_id FROM budgets WHERE id = ?').get(budgetId);
        if (!budget || budget.user_id !== req.user.id) {
            return res.status(404).json({ error: 'Orçamento não encontrado' });
        }

        db.prepare('DELETE FROM budgets WHERE id = ?').run(budgetId);
        res.json({ message: 'Orçamento deletado com sucesso' });
    } catch (error) {
        console.error('Delete budget error:', error);
        res.status(500).json({ error: 'Erro ao deletar orçamento' });
    }
});

export default router;
