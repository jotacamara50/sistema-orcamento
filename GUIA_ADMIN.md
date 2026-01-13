# 🚀 Guia Rápido - Painel Admin

## Como começar a usar o Painel Admin

### 1️⃣ Tornar seu usuário admin

**Opção mais fácil - Via script:**
```bash
# Entre no container do backend
docker exec -it orcazap-backend sh

# Execute o script (substitua pelo seu email)
node make-admin.js seu-email@example.com

# Saia do container
exit
```

**Opção alternativa - Via SQLite direto:**
```bash
# Entre no container
docker exec -it orcazap-backend sh

# Abra o banco de dados
sqlite3 /app/data/orcamentos.db

# Execute o comando (substitua pelo seu email)
UPDATE users SET is_admin = 1 WHERE email = 'seu-email@example.com';

# Saia
.quit
exit
```

### 2️⃣ Acessar o painel

1. Faça login no sistema normalmente
2. Um novo link "🔐 Admin" aparecerá no menu
3. Clique para acessar `/admin`

### 3️⃣ Usar o painel

#### Ver novos cadastros de hoje:
- Clique no filtro "Hoje"

#### Ativar um plano quando o cliente pagar:
1. Localize o usuário (use busca se necessário)
2. Clique em "✓ 30 dias" para plano mensal
3. Ou clique em "✓ 90 dias" para plano trimestral
4. Confirme a ativação

#### Enviar mensagem de boas-vindas:
- Clique no botão "📱 WhatsApp" ao lado do usuário
- O WhatsApp Web abrirá com mensagem pronta

#### Ver planos que estão vencendo:
1. Clique na aba "Planos a Vencer"
2. Verá todos os planos que vencem nos próximos 7 dias
3. Planos com 3 dias ou menos aparecem destacados em vermelho

#### Renovar um plano:
- Na aba "Planos a Vencer", clique em "🔄 Renovar 30d" ou "🔄 Renovar 90d"

#### Desativar um plano:
- Clique no botão "✗ Desativar" ao lado do usuário

## 📊 Entendendo os status

- **Pago (Xd)**: Cliente com plano ativo, X dias restantes
- **Trial (X)**: Cliente em período gratuito, X orçamentos restantes
- **Bloqueado**: Cliente que atingiu o limite do trial
- **Inativo**: Cliente sem plano e sem trial

## 💡 Dicas

1. Use os filtros para ver cadastros de períodos específicos
2. A busca funciona por nome ou email
3. O botão WhatsApp só aparece se o usuário cadastrou telefone
4. Verifique a aba "Planos a Vencer" diariamente para contatos proativos
5. Planos são automaticamente bloqueados quando vencem

## ⚠️ Importante

- Apenas usuários com `is_admin = 1` podem acessar o painel
- Ao ativar um plano, a data de expiração é calculada automaticamente
- Planos de 30 dias = 30 dias corridos a partir de hoje
- Planos de 90 dias = 90 dias corridos a partir de hoje
- Ao desativar, o plano é removido imediatamente
