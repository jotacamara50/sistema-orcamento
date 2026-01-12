import express from 'express';
import bcrypt from 'bcrypt';
import db from '../database.js';
import { generateToken, authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
    try {
        const { email, password, nome, telefone, tipo_servico } = req.body;

        // Validate required fields
        if (!email || !password || !nome) {
            return res.status(400).json({ error: 'Email, senha e nome são obrigatórios' });
        }

        // Check if user already exists
        const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
        if (existingUser) {
            return res.status(400).json({ error: 'Email já cadastrado' });
        }

        // Hash password
        const password_hash = await bcrypt.hash(password, 10);

        // Insert user
        const result = db.prepare(`
      INSERT INTO users (email, password_hash, nome, telefone, tipo_servico)
      VALUES (?, ?, ?, ?, ?)
    `).run(email, password_hash, nome, telefone || null, tipo_servico || null);

        const token = generateToken({ id: result.lastInsertRowid, email });

        res.status(201).json({
            message: 'Usuário criado com sucesso',
            token,
            user: { id: result.lastInsertRowid, email, nome }
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Erro ao criar usuário' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email e senha são obrigatórios' });
        }

        // Find user
        const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
        if (!user) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        // Check password
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        const token = generateToken({ id: user.id, email: user.email });

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                nome: user.nome,
                is_paid: user.is_paid,
                trial_budget_count: user.trial_budget_count
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Erro ao fazer login' });
    }
});

// Get current user
router.get('/me', authenticateToken, (req, res) => {
    try {
        const user = db.prepare(`
      SELECT id, email, nome, telefone, tipo_servico, is_paid, trial_budget_count
      FROM users WHERE id = ?
    `).get(req.user.id);

        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        res.json(user);
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Erro ao buscar usuário' });
    }
});

export default router;
