-- Script para tornar um usuário administrador
-- Execute este script no banco de dados SQLite

-- Para tornar um usuário admin pelo email:
UPDATE users SET is_admin = 1 WHERE email = 'seu-email@example.com';

-- Para tornar um usuário admin pelo ID:
-- UPDATE users SET is_admin = 1 WHERE id = 1;

-- Para verificar quais usuários são admin:
-- SELECT id, email, nome, is_admin FROM users WHERE is_admin = 1;

-- Para remover admin de um usuário:
-- UPDATE users SET is_admin = 0 WHERE email = 'seu-email@example.com';
