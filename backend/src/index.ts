import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import 'dotenv/config';
import { config } from './config';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import skillsRoutes from './routes/skills';
import swapsRoutes from './routes/swaps';
import sessionsRoutes from './routes/sessions';
import creditsRoutes from './routes/credits';
import reviewsRoutes from './routes/reviews';
import matchesRoutes from './routes/matches';
import messagesRoutes from './routes/messages';
import coursesRoutes from './routes/courses';
import { errorHandler } from './middleware/errorHandler';

const app = express();

// Render and other hosts forward requests through a proxy. Trusting the first
// proxy makes req.ip represent the visitor instead of one shared proxy IP.
app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: config.corsOrigin === '*' ? true : config.corsOrigin }));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'skillswap-campus-api' });
});

app.get('/api/v1', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'SkillSwap Campus API is running.',
    health: '/api/health',
    auth: '/api/v1/auth',
  });
});

// API v1 Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/skills', skillsRoutes);
app.use('/api/v1/swaps', swapsRoutes);
app.use('/api/v1/sessions', sessionsRoutes);
app.use('/api/v1/credits', creditsRoutes);
app.use('/api/v1/reviews', reviewsRoutes);
app.use('/api/v1/matches', matchesRoutes);
app.use('/api/v1/messages', messagesRoutes);
app.use('/api/v1/courses', coursesRoutes);

// The project intentionally has a no-build frontend. Serving it here makes
// `npm start` a complete, usable application instead of an API-only process.
const frontendDir = path.resolve(__dirname, '../..');
app.use(express.static(frontendDir));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(frontendDir, 'index.html'));
});

// Global Error Handler
app.use(errorHandler);

const PORT = config.port || 4000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 SkillSwap Campus Backend is LIVE!`);
  console.log(`📡 API URL: http://localhost:${PORT}/api/v1`);
  console.log(`🛠️  Mode: ${config.nodeEnv}\n`);
});
