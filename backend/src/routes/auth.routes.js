import express from 'express';
import bcrypt from 'bcrypt';
import db, { DEFAULT_WHATSAPP_TEMPLATE } from '../database.js';
import { generateToken, authenticateToken } from '../middleware/auth.js';

const router = express.Router();

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
      INSERT INTO users (email, password_hash, nome, telefone, tipo_servico, whatsapp_template)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(email, password_hash, nome, telefone || null, tipo_servico || null, DEFAULT_WHATSAPP_TEMPLATE);

        const token = generateToken({ id: result.lastInsertRowid, email });
        const createdUser = db.prepare(`
      SELECT id, email, nome, telefone, tipo_servico, brand_color, termos_pagamento_padrao, paid_until, is_paid, trial_budget_count, is_admin
      FROM users WHERE id = ?
    `).get(result.lastInsertRowid);
        const is_paid_active = isPaidActive(createdUser);

        res.status(201).json({
            message: 'Usuário criado com sucesso',
            token,
            user: {
                ...createdUser,
                is_paid_active
            }
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
        const is_paid_active = isPaidActive(user);

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                nome: user.nome,
                telefone: user.telefone,
                tipo_servico: user.tipo_servico,
                brand_color: user.brand_color,
                termos_pagamento_padrao: user.termos_pagamento_padrao,
                paid_until: user.paid_until,
                is_paid: user.is_paid,
                is_paid_active,
                trial_budget_count: user.trial_budget_count,
                is_admin: user.is_admin
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
      SELECT id, email, nome, telefone, tipo_servico, brand_color, termos_pagamento_padrao, paid_until, is_paid, trial_budget_count, is_admin
      FROM users WHERE id = ?
    `).get(req.user.id);

        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        res.json({
            ...user,
            is_paid_active: isPaidActive(user)
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Erro ao buscar usuário' });
    }
});

// Update current user profile
router.put('/me', authenticateToken, (req, res) => {
    try {
        const { nome, telefone, tipo_servico, brand_color, termos_pagamento_padrao } = req.body;

        if (nome === undefined && telefone === undefined && tipo_servico === undefined && brand_color === undefined && termos_pagamento_padrao === undefined) {
            return res.status(400).json({ error: 'Nenhum dado para atualizar' });
        }

        const user = db.prepare(`
      SELECT id, email, nome, telefone, tipo_servico, brand_color, termos_pagamento_padrao, paid_until, is_paid, trial_budget_count
      FROM users WHERE id = ?
    `).get(req.user.id);

        if (!user) {
            return res.status(404).json({ error: 'Usuario nao encontrado' });
        }

        const normalizeOptional = (value) => {
            if (value === undefined) {
                return undefined;
            }
            if (value === null) {
                return null;
            }
            const trimmed = String(value).trim();
            return trimmed ? trimmed : null;
        };

        const updatedNome = nome !== undefined ? String(nome ?? '').trim() : user.nome;
        if (nome !== undefined && !updatedNome) {
            return res.status(400).json({ error: 'Nome e obrigatorio' });
        }

        const normalizedTelefone = normalizeOptional(telefone);
        const normalizedTipoServico = normalizeOptional(tipo_servico);
        const normalizedBrandColor = normalizeOptional(brand_color);
        const normalizedTermos = normalizeOptional(termos_pagamento_padrao);

        const updatedTelefone = normalizedTelefone === undefined ? user.telefone : normalizedTelefone;
        const updatedTipoServico = normalizedTipoServico === undefined ? user.tipo_servico : normalizedTipoServico;
        const updatedTermos = normalizedTermos === undefined ? user.termos_pagamento_padrao : normalizedTermos;

        let updatedBrandColor = user.brand_color;
        if (normalizedBrandColor !== undefined) {
            if (normalizedBrandColor === null) {
                updatedBrandColor = null;
            } else if (!/^#[0-9a-fA-F]{6}$/.test(normalizedBrandColor)) {
                return res.status(400).json({ error: 'Cor invalida. Use #RRGGBB' });
            } else {
                updatedBrandColor = normalizedBrandColor.toLowerCase();
            }
        }

        db.prepare(`
      UPDATE users
      SET nome = ?, telefone = ?, tipo_servico = ?, brand_color = ?, termos_pagamento_padrao = ?
      WHERE id = ?
    `).run(updatedNome, updatedTelefone, updatedTipoServico, updatedBrandColor, updatedTermos, req.user.id);

        const updatedUser = {
            ...user,
            nome: updatedNome,
            telefone: updatedTelefone,
            tipo_servico: updatedTipoServico,
            brand_color: updatedBrandColor,
            termos_pagamento_padrao: updatedTermos
        };

        res.json({
            ...updatedUser,
            is_paid_active: isPaidActive(updatedUser)
        });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ error: 'Erro ao atualizar usuario' });
    }
});

export default router;
