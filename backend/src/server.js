import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import authRoutes from './routes/auth.routes.js';
import clientsRoutes from './routes/clients.routes.js';
import budgetsRoutes from './routes/budgets.routes.js';
import actionsRoutes from './routes/actions.routes.js';
import adminRoutes from './routes/admin.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Cria pasta pública para PDFs se não existir
const publicPdfsPath = path.join(__dirname, '../public/pdfs');
if (!fs.existsSync(publicPdfsPath)) {
    fs.mkdirSync(publicPdfsPath, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Servir PDFs publicamente
app.use('/pdfs', express.static(publicPdfsPath));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/budgets', budgetsRoutes);
app.use('/api/actions', actionsRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Sistema de Orçamentos API' });
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Algo deu errado!' });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
