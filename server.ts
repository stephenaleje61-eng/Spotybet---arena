import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { router as apiRouter } from './server/routes.js';
import { seedInitialAdmin } from './server/auth.js';
import { flushDatabaseSync } from './server/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProd = process.env.NODE_ENV === 'production';

// Trust proxy for reverse proxy load balancers / Cloud Run
app.set('trust proxy', 1);

// Security Headers Middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Middleware
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-load-test-bypass'],
  })
);

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

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
    // In production mode, serve built files from dist with caching
    const distPath = path.resolve(__dirname, 'dist');
    app.use(
      express.static(distPath, {
        maxAge: '1d',
        etag: true,
      })
    );
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SafePicksArena] Production-Ready Server active on http://0.0.0.0:${PORT}`);
  });

  // Graceful shutdown
  const handleShutdown = (signal: string) => {
    console.log(`[SafePicksArena] Received ${signal}. Flushing database buffers and shutting down cleanly...`);
    flushDatabaseSync();
    server.close(() => {
      console.log('[SafePicksArena] HTTP server terminated cleanly.');
      process.exit(0);
    });
    // Force close if graceful shutdown hangs
    setTimeout(() => {
      console.error('[SafePicksArena] Force exiting after timeout.');
      process.exit(1);
    }, 5000).unref();
  };

  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('SIGINT', () => handleShutdown('SIGINT'));
}

startServer().catch((err) => {
  console.error('[SafePicksArena] Failed to start server:', err);
  process.exit(1);
});
