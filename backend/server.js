import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
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

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
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

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100,
  message: { success: false, message: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// Auth routes — stricter rate limit
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many login attempts, please try again later.' }
});

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/swipe', swipeRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/admin', adminRoutes);
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
