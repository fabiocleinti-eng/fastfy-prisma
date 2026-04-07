import authRoutes from './routes/authRoutes.js';
import contatosRoutes from './routes/contatosRoutes.js';

async function router(app) {
    app.get('/health', async () => ({
        status: 'ok'
    }));

    await app.register(authRoutes);
    await app.register(contatosRoutes);
}

export default router;
