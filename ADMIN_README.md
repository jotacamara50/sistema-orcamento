# Painel Administrativo - OrcaZap

## 🎯 Funcionalidades

O painel administrativo permite gerenciar todos os usuários da plataforma, incluindo:

### 📊 Dashboard com Estatísticas
- Total de usuários cadastrados
- Novos cadastros do dia
- Usuários com planos ativos
- Usuários em período trial
- Usuários bloqueados

### 👥 Gestão de Usuários
- **Filtros por data**: Hoje, ontem, última semana, último mês
- **Busca**: Por nome ou email
- **Visualização completa**: Nome, email, telefone, tipo de serviço, status do plano
- **Status detalhado**: 
  - Pago (com dias restantes)
  - Trial (com orçamentos restantes)
  - Bloqueado
  - Inativo

### ⚡ Ações Rápidas
- **Ativar plano de 30 dias**: Ativa assinatura mensal
- **Ativar plano de 90 dias**: Ativa assinatura trimestral
- **Desativar plano**: Remove assinatura ativa
- **WhatsApp direto**: Botão para enviar mensagem de boas-vindas
- **Visualização de planos a vencer**: Tab dedicada para planos que vencem nos próximos 7 dias

### 🔔 Alertas de Vencimento
- Lista separada de planos que vencem nos próximos 7 dias
- Destaque visual para planos críticos (≤3 dias)
- Opção de renovação rápida

## 🔐 Como Tornar um Usuário Admin

### Opção 1: Via SQLite Command Line

1. Acesse o container do backend:
   ```bash
   docker exec -it orcazap-backend sh
   ```

2. Abra o banco de dados:
   ```bash
   sqlite3 /app/data/orcamentos.db
   ```

3. Torne o usuário admin (substitua o email):
   ```sql
   UPDATE users SET is_admin = 1 WHERE email = 'seu-email@example.com';
   ```

4. Verifique:
   ```sql
   SELECT id, email, nome, is_admin FROM users WHERE is_admin = 1;
   ```

5. Saia do SQLite:
   ```sql
   .quit
   ```

### Opção 2: Via Arquivo SQL

1. Edite o arquivo `backend/make_admin.sql`
2. Substitua `seu-email@example.com` pelo seu email
3. Execute no container:
   ```bash
   docker exec -it orcazap-backend sh
   sqlite3 /app/data/orcamentos.db < /app/make_admin.sql
   ```

### Opção 3: Via Script Node.js

1. Crie um arquivo `backend/scripts/make-admin.js`:
   ```javascript
   import Database from 'better-sqlite3';
   
   const email = process.argv[2];
   if (!email) {
     console.error('Uso: node make-admin.js email@example.com');
     process.exit(1);
   }
   
   const db = new Database(process.env.DB_PATH || './data/orcamentos.db');
   const result = db.prepare('UPDATE users SET is_admin = 1 WHERE email = ?').run(email);
   
   if (result.changes > 0) {
     console.log(`✅ Usuário ${email} agora é admin!`);
   } else {
     console.log(`❌ Usuário ${email} não encontrado.`);
   }
   ```

2. Execute:
   ```bash
   docker exec orcazap-backend node /app/scripts/make-admin.js seu@email.com
   ```

## 📱 Interface do Painel

### Acesso
- URL: `/admin`
- Somente usuários com `is_admin = 1` podem acessar
- Link aparece automaticamente no menu quando o usuário é admin

### Tabs Disponíveis

#### 1. Todos os Usuários
- Lista completa de usuários
- Filtros e busca
- Ações de ativação/desativação
- Botão WhatsApp

#### 2. Planos a Vencer
- Usuários com planos que vencem nos próximos 7 dias
- Ordem por data de vencimento
- Destaque para planos críticos
- Opções de renovação rápida

## 🎨 Recursos Visuais

- **Badges de status coloridos**:
  - Verde: Plano ativo (com dias restantes)
  - Azul: Trial (com orçamentos restantes)
  - Vermelho: Bloqueado
  - Cinza: Inativo

- **Alertas visuais**:
  - Fundo amarelo para planos a vencer
  - Vermelho para planos críticos (≤3 dias)

## 🔄 Workflow de Ativação

1. Usuário se cadastra (trial: 3 orçamentos)
2. Após 3 orçamentos, sistema bloqueia
3. Usuário vai pro WhatsApp e solicita plano
4. Admin acessa painel `/admin`
5. Localiza o usuário (por filtro ou busca)
6. Clica em "✓ 30 dias" ou "✓ 90 dias"
7. Sistema ativa e calcula data de expiração
8. Admin envia mensagem de boas-vindas pelo WhatsApp
9. Usuário pode usar o sistema normalmente
10. 7 dias antes do vencimento, usuário aparece na aba "Planos a Vencer"

## 📋 API Endpoints

### GET `/api/admin/users`
Query params: `filter` (today, yesterday, week, month), `search` (nome ou email)

### GET `/api/admin/stats`
Retorna estatísticas gerais

### GET `/api/admin/expiring-soon`
Retorna planos que vencem nos próximos 7 dias

### POST `/api/admin/activate-plan/:userId`
Body: `{ days: 30 | 90 }`

### POST `/api/admin/deactivate-plan/:userId`

### GET `/api/admin/users/:userId`
Detalhes completos de um usuário

## 🛡️ Segurança

- Middleware `authenticateAdmin` valida se usuário é admin
- Frontend verifica `user.is_admin` antes de mostrar link
- Rota `/admin` protegida com `adminOnly={true}`
- Tokens JWT validados em todas as requisições
