import jwt from 'jsonwebtoken';
import db from '../database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: 'Token não fornecido' });
    }

    try {
        const user = jwt.verify(token, JWT_SECRET);
        req.user = user; // { id, email }
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Token inválido' });
    }
}

export function authenticateAdmin(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token não fornecido' });
    }

    try {
        const payload = jwt.verify(token, JWT_SECRET);
        const user = db.prepare('SELECT id, email, is_admin FROM users WHERE id = ?').get(payload.id);
        
        if (!user || !user.is_admin) {
            return res.status(403).json({ error: 'Acesso negado. Apenas administradores.' });
        }

        req.user = payload;
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Token inválido' });
    }
}

export function generateToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
}
