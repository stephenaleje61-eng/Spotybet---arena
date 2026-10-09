import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { router as apiRouter } from './server/routes.js';
import { seedInitialAdmin } from './server/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProd = process.env.NODE_ENV === 'production';

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'SAFE PICKS ARENA Core Engine',
    timestamp: new Date().toISOString(),
    version: '1.0.0-production',
  });
});

// Mount API routes
app.use('/api', apiRouter);

// Start server function
async function startServer() {
  // Seed verified initial Admin & baseline data
  await seedInitialAdmin();

  if (!isProd) {
    // In development mode, mount Vite middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('[SafePicksArena] Vite middleware attached for live development');
  } else {
    // In production mode, serve built files from dist
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SafePicksArena] Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[SafePicksArena] Failed to start server:', err);
  process.exit(1);
});
