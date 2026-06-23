import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

import connectDB from './config/db.js';
import { seedDevUsersIfEmpty } from './utils/seedDevUsers.js';
import errorHandler from './middleware/errorHandler.js';
import { initSocket } from './services/socketHandler.js';

// Routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import swipeRoutes from './routes/swipe.js';
import matchRoutes from './routes/matches.js';
import chatRoutes from './routes/chat.js';
import adminRoutes from './routes/admin.js';
import reportRoutes from './routes/reports.js';
import { setIo } from './controllers/chatController.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env') });
const app = express();
const httpServer = createServer(app);

// ── Socket.IO ────────────────────────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || ['http://localhost:5173', 'http://localhost:5000'],
    methods: ['GET', 'POST']
  }
});
initSocket(io);
setIo(io);

// ── Security Headers ─────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      'img-src': ["'self'", 'data:', 'https://images.unsplash.com', 'https://ui-avatars.com'],
    },
  },
}));

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rate limiting
const isTestOrDisabled = process.env.NODE_ENV === 'test' || process.env.DISABLE_RATE_LIMIT === 'true';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: isTestOrDisabled ? 100000 : 100,
  message: { success: false, message: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// Auth routes — stricter rate limit
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTestOrDisabled ? 100000 : 20,
  message: { success: false, message: 'Too many login attempts, please try again later.' }
});

// Granular rate limiters
const discoverLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isTestOrDisabled ? 100000 : 30,
  message: { success: false, message: 'Too many requests. Slow down.' }
});

const swipeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isTestOrDisabled ? 100000 : 60,
  message: { success: false, message: 'Too many swipes. Slow down.' }
});

const messageLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isTestOrDisabled ? 100000 : 30,
  message: { success: false, message: 'Too many messages. Slow down.' }
});

const exportLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isTestOrDisabled ? 100000 : 10,
  message: { success: false, message: 'Too many export requests. Slow down.' }
});

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users/discover', discoverLimiter);
app.use('/api/users', userRoutes);
app.use('/api/swipe', swipeLimiter, swipeRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/chat', messageLimiter, chatRoutes);
app.use('/api/admin', exportLimiter, adminRoutes);
app.use('/api/reports', reportRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: '💘 Romyntra API is running!',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// ── Serve built frontend (single-port mode) ──────────────────────────────────
const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
app.use('/assets', express.static(path.join(frontendDist, 'assets')));
app.get('/', (req, res) => res.sendFile(path.join(frontendDist, 'index.html')));
// Client-side routing: redirect non-API GETs to index.html
app.use((req, res, next) => {
  if (req.method !== 'GET') return next();
  if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) return next();
  res.sendFile(path.join(frontendDist, 'index.html'));
});

// ── Error Handler ─────────────────────────────────────────────────────────────
app.use(errorHandler);

// ── Start Server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  await seedDevUsersIfEmpty();
  httpServer.listen(PORT, () => {
    console.log(`\n💘 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`💘  Romyntra API running on port ${PORT}`);
    console.log(`💘  Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`💘  Health: http://localhost:${PORT}/api/health`);
    console.log(`💘 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
  });
};

start();

export { io };
