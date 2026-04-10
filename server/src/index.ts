import connectPgSimple from 'connect-pg-simple';
import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import { resolveAuth } from './middleware/auth';
import authRoutes from './routes/auth';
import budgetRoutes from './routes/budget';
import directoryRoutes, { handleSeedDirectory } from './routes/directory';
import guestRoutes from './routes/guest';
import guestInviteRoutes from './routes/guest-invites';
import inviteRoutes from './routes/invite';
import notesRoutes, { listNotes } from './routes/notes';
import savedVendorRoutes from './routes/saved-vendors';
import workspaceRoutes from './routes/workspaces';

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// ── Middleware ────────────────────────────────────────────────────────────────

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:8081',
  credentials: true,
  allowedHeaders: ['Content-Type', 'X-Guest-Token'],
}));

app.use(express.json());

// Session store
const PgSession = connectPgSimple(session);
app.use(session({
  store: new PgSession({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
  }),
  secret: process.env.SESSION_SECRET || 'change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  },
}));

// Resolve auth on every request
app.use(resolveAuth);

// ── Routes ───────────────────────────────────────────────────────────────────

// Auth
app.use('/api', authRoutes);

// Guest session
app.use('/api/guest', guestRoutes);

// Workspaces
app.use('/api/workspaces', workspaceRoutes);

// Notes listed under workspaces path (GET /api/workspaces/:id/notes)
app.get('/api/workspaces/:id/notes', ...listNotes);

// Saved vendors (mounted on workspaces path)
app.use('/api/workspaces', savedVendorRoutes);

// Budget (mounted on workspaces path)
app.use('/api/workspaces', budgetRoutes);

// Guest invites (mounted on workspaces path)
app.use('/api/workspaces', guestInviteRoutes);

// Notes CRUD (POST/PUT/DELETE on /api/notes)
app.use('/api/notes', notesRoutes);

// Directory
app.use('/api/directory', directoryRoutes);

// Admin seed
app.post('/api/admin/seed-directory', handleSeedDirectory);

// Invite
app.use('/api/invite', inviteRoutes);

// ── Health check ─────────────────────────────────────────────────────────────

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Global error handler ─────────────────────────────────────────────────────

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Error]', err);
  res.status(err.status || 500).json({
    message: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message || 'Internal server error',
  });
});

// ── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;
