import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import serverless from 'serverless-http';
import { router as apiRouter } from '../../server/routes.js';
import { seedInitialAdmin } from '../../server/auth.js';

const app = express();

// Security Headers
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// CORS Middleware
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-load-test-bypass'],
  })
);

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Mount routes at multiple base paths to accommodate any Netlify redirect routing
app.use('/api', apiRouter);
app.use('/.netlify/functions/api', apiRouter);
app.use('/', apiRouter);

let initialized = false;
async function initializeBackend() {
  if (!initialized) {
    try {
      await seedInitialAdmin();
    } catch (e) {
      console.error('[Netlify Function] Error seeding admin:', e);
    }
    initialized = true;
  }
}

const serverlessHandler = serverless(app);

export const handler = async (event: any, context: any) => {
  await initializeBackend();
  return serverlessHandler(event, context);
};
