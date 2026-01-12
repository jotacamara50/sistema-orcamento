import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import clientsRoutes from './routes/clients.routes.js';
import budgetsRoutes from './routes/budgets.routes.js';
import actionsRoutes from './routes/actions.routes.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/budgets', budgetsRoutes);
app.use('/api/actions', actionsRoutes);

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
