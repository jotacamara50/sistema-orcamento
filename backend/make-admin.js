import Database from 'better-sqlite3';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const email = process.argv[2];

if (!email) {
  console.error('❌ Erro: Você precisa fornecer um email.');
  console.log('\nUso: node make-admin.js email@example.com');
  console.log('\nExemplo: node make-admin.js admin@orcazap.net');
  process.exit(1);
}

const DB_PATH = process.env.DB_PATH || join(__dirname, '..', 'orcamentos.db');
const db = new Database(DB_PATH);

// Verificar se o usuário existe
const user = db.prepare('SELECT id, email, nome, is_admin FROM users WHERE email = ?').get(email);

if (!user) {
  console.error(`❌ Usuário com email "${email}" não encontrado.`);
  process.exit(1);
}

if (user.is_admin === 1) {
  console.log(`ℹ️  O usuário "${user.nome}" (${user.email}) já é administrador.`);
  process.exit(0);
}

// Tornar admin
const result = db.prepare('UPDATE users SET is_admin = 1 WHERE email = ?').run(email);

if (result.changes > 0) {
  console.log(`✅ Sucesso! O usuário "${user.nome}" (${user.email}) agora é administrador.`);
  console.log('\n🔐 O usuário poderá acessar o painel admin em: /admin');
} else {
  console.error('❌ Erro ao atualizar usuário.');
  process.exit(1);
}
