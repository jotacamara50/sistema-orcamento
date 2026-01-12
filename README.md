# Como Rodar o Sistema

## Backend

```bash
cd backend
npm install
npm start
```

O backend estará rodando em `http://localhost:3000`

## Frontend

```bash
cd frontend
npm install
npm run dev
```

O frontend estará rodando em `http://localhost:5173`

## Primeiro Acesso

1. Abra `http://localhost:5173`
2. Clique em "Não tem conta? Criar agora"
3. Preencha seus dados (nome, email, senha, etc.)
4. Após criar conta, você será redirecionado para criar seu primeiro orçamento
5. Você tem 3 orçamentos grátis antes de precisar ativar

## Ativação Manual (Teste)

Para testar a ativação manual:
1. Crie 3 orçamentos
2. Ao tentar criar o 4º, verá o modal de trial expirado
3. Clique em "Ativar Conta" para abrir WhatsApp
4. Para liberar manualmente, conecte ao banco:

```bash
cd backend
sqlite3 orcamentos.db
UPDATE users SET is_paid = 1 WHERE email = 'seu@email.com';
.exit
```

## Número de Suporte WhatsApp

Edite o arquivo `backend/src/services/whatsapp.service.js` e altere:
```javascript
const SUPPORT_WHATSAPP = '5511999999999'; // Seu número aqui
```

## ⚠️ Troubleshooting (Windows)

Se você encontrar erros ao instalar as dependências do backend (bcrypt ou better-sqlite3), isso ocorre porque esses pacotes precisam compilar código nativo e requerem ferramentas de build do Windows.

### Solução Rápida: Instalar Build Tools

**Opção 1 - Instalador Automático:**
```powershell
npm install --global windows-build-tools
```

**Opção 2 - Visual Studio Build Tools (Mais Completo):**
1. Baixe: https://visualstudio.microsoft.com/downloads/
2. Instale "Build Tools for Visual Studio 2022"
3. Durante a instalação, selecione "Desktop development with C++"
4. Aguarde a instalação completa (pode demorar)

**Opção 3 - Usar WSL (Linux no Windows):**
Execute todo o backend dentro do WSL para evitar problemas de compilação.

Após instalar as build tools, rode:
```bash
cd backend
npm cache clean --force
npm install
```

### Testar Sem Backend Localmente

Se quiser apenas ver o frontend, você pode:
1. Fazer deploy do backend no Railway/Render (eles compilam automaticamente)
2. Conectar o frontend à API em produção alterando o `API_URL` em `frontend/src/api.js`

