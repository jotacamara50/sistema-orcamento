import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = process.env.DB_PATH || join(__dirname, '..', 'orcamentos.db');
const db = new Database(DB_PATH);
const DEFAULT_BRAND_COLOR = '#2563eb';
export const DEFAULT_WHATSAPP_TEMPLATE = 'Olá {{cliente}}, tudo bem?\n\nConforme conversamos, preparei seu orçamento detalhado. \ud83d\udee0\ufe0f\n\n\ud83d\udcc4 Toque no link abaixo para ver o PDF:\n{{pdf}}\n\nFico no aguardo do seu de acordo para começarmos!';

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables
function initializeDatabase() {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      nome TEXT NOT NULL,
      telefone TEXT,
      tipo_servico TEXT,
      brand_color TEXT DEFAULT '${DEFAULT_BRAND_COLOR}',
      whatsapp_template TEXT DEFAULT '${DEFAULT_WHATSAPP_TEMPLATE}',
      is_paid INTEGER DEFAULT 0,
      paid_until TEXT,
      trial_budget_count INTEGER DEFAULT 0,
      trial_blocked_at TEXT,
      is_admin INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const userColumns = db.prepare('PRAGMA table_info(users)').all().map((column) => column.name);
  if (!userColumns.includes('brand_color')) {
    db.exec(`ALTER TABLE users ADD COLUMN brand_color TEXT DEFAULT '${DEFAULT_BRAND_COLOR}'`);
  }

  if (!userColumns.includes('whatsapp_template')) {
    db.exec(`ALTER TABLE users ADD COLUMN whatsapp_template TEXT DEFAULT '${DEFAULT_WHATSAPP_TEMPLATE}'`);
  }

  if (!userColumns.includes('paid_until')) {
    db.exec('ALTER TABLE users ADD COLUMN paid_until TEXT');
  }

  if (!userColumns.includes('is_admin')) {
    db.exec('ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0');
  }

  // Atualiza templates antigos para o novo formato com {{pdf}}
  const legacyTemplates = [
    'Olá {{cliente}}, segue o orçamento {{numero}} no valor de {{total}}. Qualquer dúvida fico à disposição.',
    'Olá {{cliente}}, tudo bem?\n\nSegue o orçamento {{numero}} no valor de {{total}}.\n\nFico à disposição para qualquer dúvida.',
    'Olá {{cliente}}, tudo bem?\n\nConforme conversamos, preparei seu orçamento detalhado.\n\nToque no link abaixo para ver o PDF:\n{{pdf}}\n\nFico no aguardo do seu de acordo para começarmos!'
  ];
  const placeholders = legacyTemplates.map(() => '?').join(', ');
  db.prepare(
    `UPDATE users SET whatsapp_template = ? WHERE whatsapp_template IS NULL OR whatsapp_template = '' OR whatsapp_template IN (${placeholders})`
  ).run(DEFAULT_WHATSAPP_TEMPLATE, ...legacyTemplates);

  // Clients table
  db.exec(`
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      nome TEXT NOT NULL,
      telefone TEXT,
      email TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Budgets table with ENUM check constraint
  db.exec(`
    CREATE TABLE IF NOT EXISTS budgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      client_id INTEGER NOT NULL,
      numero INTEGER NOT NULL,
      data TEXT DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'rascunho',
      total REAL DEFAULT 0,
      logo_data TEXT,
      observacoes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
      CHECK(status IN ('rascunho', 'enviado', 'aprovado', 'recusado'))
    )
  `);

  const budgetColumns = db.prepare('PRAGMA table_info(budgets)').all().map((column) => column.name);
  if (!budgetColumns.includes('logo_data')) {
    db.exec('ALTER TABLE budgets ADD COLUMN logo_data TEXT');
  }

  // Budget items table
  db.exec(`
    CREATE TABLE IF NOT EXISTS budget_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      budget_id INTEGER NOT NULL,
      descricao TEXT NOT NULL,
      quantidade REAL NOT NULL,
      valor_unitario REAL NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (budget_id) REFERENCES budgets(id) ON DELETE CASCADE
    )
  `);

  console.log('✅ Database initialized successfully');
}

// Initialize on import
initializeDatabase();

export default db;
