import express from 'express';
import db from '../database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// List all clients for user
router.get('/', (req, res) => {
    try {
        const clients = db.prepare(`
      SELECT id, nome, telefone, email, created_at
      FROM clients
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).all(req.user.id);

        res.json(clients);
    } catch (error) {
        console.error('List clients error:', error);
        res.status(500).json({ error: 'Erro ao listar clientes' });
    }
});

// Create client
router.post('/', (req, res) => {
    try {
        const { nome, telefone, email } = req.body;

        if (!nome) {
            return res.status(400).json({ error: 'Nome é obrigatório' });
        }

        const result = db.prepare(`
      INSERT INTO clients (user_id, nome, telefone, email)
      VALUES (?, ?, ?, ?)
    `).run(req.user.id, nome, telefone || null, email || null);

        const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(result.lastInsertRowid);

        res.status(201).json(client);
    } catch (error) {
        console.error('Create client error:', error);
        res.status(500).json({ error: 'Erro ao criar cliente' });
    }
});

// Update client
router.put('/:id', (req, res) => {
    try {
        const { nome, telefone, email } = req.body;
        const clientId = req.params.id;

        // Verify ownership
        const client = db.prepare('SELECT user_id FROM clients WHERE id = ?').get(clientId);
        if (!client || client.user_id !== req.user.id) {
            return res.status(404).json({ error: 'Cliente não encontrado' });
        }

        db.prepare(`
      UPDATE clients
      SET nome = ?, telefone = ?, email = ?
      WHERE id = ?
    `).run(nome, telefone || null, email || null, clientId);

        const updated = db.prepare('SELECT * FROM clients WHERE id = ?').get(clientId);
        res.json(updated);
    } catch (error) {
        console.error('Update client error:', error);
        res.status(500).json({ error: 'Erro ao atualizar cliente' });
    }
});

// Delete client
router.delete('/:id', (req, res) => {
    try {
        const clientId = req.params.id;

        // Verify ownership
        const client = db.prepare('SELECT user_id FROM clients WHERE id = ?').get(clientId);
        if (!client || client.user_id !== req.user.id) {
            return res.status(404).json({ error: 'Cliente não encontrado' });
        }

        db.prepare('DELETE FROM clients WHERE id = ?').run(clientId);
        res.json({ message: 'Cliente deletado com sucesso' });
    } catch (error) {
        console.error('Delete client error:', error);
        res.status(500).json({ error: 'Erro ao deletar cliente' });
    }
});

export default router;
