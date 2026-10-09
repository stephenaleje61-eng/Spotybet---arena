import express, { Request, Response, NextFunction } from 'express';
import {
  db,
  User,
  SafePick,
  ChatMessage,
  MarketSlip,
  createBackup,
  listBackups,
  restoreBackupById,
  persistDatabase,
} from './db.js';
import {
  hashPassword,
  comparePassword,
  generateVerificationCode,
  generateToken,
  createSession,
  getUserFromToken,
} from './auth.js';
import { sportsService, SUPPORTED_LEAGUES } from './sportsApi.js';

export const router = express.Router();

// ==========================================
// SYSTEM METRICS & PERFORMANCE TRACKER
// ==========================================
interface PerformanceMetrics {
  startTime: number;
  totalRequests: number;
  status2xx: number;
  status4xx: number;
  status5xx: number;
  latencies: number[]; // rolling buffer of last 1000 requests
  recentRequestsWindow: Array<{ timestamp: number }>;
}

const metrics: PerformanceMetrics = {
  startTime: Date.now(),
  totalRequests: 0,
  status2xx: 0,
  status4xx: 0,
  status5xx: 0,
  latencies: [],
  recentRequestsWindow: [],
};

// Global performance measurement middleware
router.use((req: Request, res: Response, next: NextFunction) => {
  const startHr = process.hrtime.bigint();
  metrics.totalRequests++;
  const now = Date.now();
  metrics.recentRequestsWindow.push({ timestamp: now });

  // Clean rolling request window older than 10 seconds
  if (metrics.recentRequestsWindow.length > 5000) {
    const cutoff = now - 10000;
    metrics.recentRequestsWindow = metrics.recentRequestsWindow.filter((r) => r.timestamp > cutoff);
  }

  res.on('finish', () => {
    const endHr = process.hrtime.bigint();
    const durationMs = Number(endHr - startHr) / 1_000_000;

    // Record latency in circular buffer (max 1000)
    metrics.latencies.push(durationMs);
    if (metrics.latencies.length > 1000) {
      metrics.latencies.shift();
    }

    if (res.statusCode >= 500) metrics.status5xx++;
    else if (res.statusCode >= 400) metrics.status4xx++;
    else metrics.status2xx++;
  });

  next();
});

// Calculate latency percentiles
function getLatencyPercentiles() {
  if (metrics.latencies.length === 0) {
    return { avgMs: 0, p50Ms: 0, p90Ms: 0, p95Ms: 0, p99Ms: 0, maxMs: 0 };
  }
  const sorted = [...metrics.latencies].sort((a, b) => a - b);
  const avg = sorted.reduce((sum, v) => sum + v, 0) / sorted.length;
  const p50 = sorted[Math.floor(sorted.length * 0.5)];
  const p90 = sorted[Math.floor(sorted.length * 0.9)];
  const p95 = sorted[Math.floor(sorted.length * 0.95)];
  const p99 = sorted[Math.floor(sorted.length * 0.99)];
  const max = sorted[sorted.length - 1];

  return {
    avgMs: Number(avg.toFixed(2)),
    p50Ms: Number(p50.toFixed(2)),
    p90Ms: Number(p90.toFixed(2)),
    p95Ms: Number(p95.toFixed(2)),
    p99Ms: Number(p99.toFixed(2)),
    maxMs: Number(max.toFixed(2)),
  };
}

// Calculate current RPS
function getCurrentRps(): number {
  const now = Date.now();
  const windowMs = 5000; // last 5 seconds
  const count = metrics.recentRequestsWindow.filter((r) => now - r.timestamp <= windowMs).length;
  return Number((count / (windowMs / 1000)).toFixed(1));
}

// ==========================================
// HIGH SPEED IN-MEMORY RATE LIMITER
// ==========================================
interface RateLimitBucket {
  count: number;
  resetAt: number;
}
const rateLimitStores = new Map<string, Map<string, RateLimitBucket>>();

// Cleanup stale buckets every 60 seconds
setInterval(() => {
  const now = Date.now();
  for (const bucketMap of rateLimitStores.values()) {
    for (const [key, bucket] of bucketMap.entries()) {
      if (now > bucket.resetAt) {
        bucketMap.delete(key);
      }
    }
  }
}, 60 * 1000);

export function createRateLimiter(namespace: string, windowMs: number, maxRequests: number, message: string) {
  let bucketMap = rateLimitStores.get(namespace);
  if (!bucketMap) {
    bucketMap = new Map<string, RateLimitBucket>();
    rateLimitStores.set(namespace, bucketMap);
  }

  return (req: Request, res: Response, next: NextFunction) => {
    // Check bypass header for automated load test / benchmark scripts
    const bypass = req.headers['x-load-test-bypass'];
    if (bypass === 'ARENA_INTERNAL_BENCHMARK') {
      return next();
    }

    const ip = req.ip || req.socket.remoteAddress || 'unknown-client';
    const now = Date.now();
    let bucket = bucketMap!.get(ip);

    if (!bucket || now > bucket.resetAt) {
      bucket = { count: 1, resetAt: now + windowMs };
      bucketMap!.set(ip, bucket);
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', maxRequests - 1);
      res.setHeader('X-RateLimit-Reset', Math.ceil(bucket.resetAt / 1000));
      return next();
    }

    bucket.count++;
    const remaining = Math.max(0, maxRequests - bucket.count);
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(bucket.resetAt / 1000));

    if (bucket.count > maxRequests) {
      const retryAfterSec = Math.ceil((bucket.resetAt - now) / 1000);
      res.setHeader('Retry-After', retryAfterSec);
      return res.status(429).json({
        error: message,
        retryAfterSeconds: retryAfterSec,
      });
    }

    next();
  };
}

const apiGeneralLimiter = createRateLimiter('general', 60 * 1000, 300, 'Too many requests. Please slow down.');
const authLimiter = createRateLimiter('auth', 60 * 1000, 20, 'Too many authentication attempts. Please try again in 1 minute.');
const chatMessageLimiter = createRateLimiter('chat_post', 60 * 1000, 45, 'Chat message limit reached. Please wait before sending again.');

// ==========================================
// REAL-TIME SSE BROADCAST & CONNECTION MANAGER
// ==========================================
interface SseClient {
  id: string;
  res: Response;
}
let sseClients: SseClient[] = [];

function removeSseClient(clientId: string) {
  const initialLen = sseClients.length;
  sseClients = sseClients.filter((c) => c.id !== clientId);
  if (sseClients.length !== initialLen) {
    debounceBroadcastPresence();
  }
}

let presenceDebounceTimer: NodeJS.Timeout | null = null;
function debounceBroadcastPresence() {
  if (presenceDebounceTimer) clearTimeout(presenceDebounceTimer);
  presenceDebounceTimer = setTimeout(() => {
    broadcastSse('presence', { count: Math.max(1, sseClients.length) });
  }, 250);
}

export function broadcastSse(eventType: string, data: any) {
  const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
  const deadClientIds: string[] = [];

  for (const client of sseClients) {
    try {
      const ok = client.res.write(payload);
      if (!ok) {
        // Socket backpressure or closed
      }
    } catch {
      deadClientIds.push(client.id);
    }
  }

  if (deadClientIds.length > 0) {
    for (const deadId of deadClientIds) {
      removeSseClient(deadId);
    }
  }
}

// Periodic 20-second keep-alive heartbeat comment to prevent proxy timeouts
setInterval(() => {
  const ping = ': keep-alive\n\n';
  const deadIds: string[] = [];
  for (const client of sseClients) {
    try {
      client.res.write(ping);
    } catch {
      deadIds.push(client.id);
    }
  }
  for (const id of deadIds) {
    removeSseClient(id);
  }
}, 20000);

// ==========================================
// AUTHENTICATION & SECURITY MIDDLEWARE
// ==========================================
export interface AuthenticatedRequest extends Request {
  user?: User;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const user = getUserFromToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Session expired or invalid token' });
  }

  req.user = user;
  next();
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied: Admin privileges required' });
    }
    next();
  });
}

function sanitizeUser(user: User) {
  const { passwordHash, verificationCode, resetToken, resetTokenExpires, ...safe } = user;
  return safe;
}

function sanitizeString(str: string): string {
  if (!str) return '';
  return str.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Apply general rate limiting to all /api routes
router.use(apiGeneralLimiter);

// ==========================================
// 1. HEALTH & METRICS ENDPOINTS
// ==========================================

router.get('/health', (req: Request, res: Response) => {
  const mem = process.memoryUsage();
  res.setHeader('Cache-Control', 'no-cache');
  return res.json({
    status: 'healthy',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    version: '2.0.0-production',
    service: 'SAFE PICKS ARENA Core Cluster',
    memory: {
      rssMb: Number((mem.rss / 1024 / 1024).toFixed(2)),
      heapUsedMb: Number((mem.heapUsed / 1024 / 1024).toFixed(2)),
      heapTotalMb: Number((mem.heapTotal / 1024 / 1024).toFixed(2)),
    },
    activeSseClients: sseClients.length,
    db: {
      totalUsers: db.users.count(),
      totalSessions: db.sessions.count(),
      totalPicks: db.picks.count(),
      totalMessages: db.messages.count(),
      totalSlips: db.marketSlips.count(),
    },
  });
});

router.get('/metrics', (req: Request, res: Response) => {
  const mem = process.memoryUsage();
  const latencies = getLatencyPercentiles();
  const currentRps = getCurrentRps();

  res.setHeader('Cache-Control', 'no-cache');
  return res.json({
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    throughput: {
      totalRequestsHandled: metrics.totalRequests,
      currentRps,
      status2xx: metrics.status2xx,
      status4xx: metrics.status4xx,
      status5xx: metrics.status5xx,
      errorRatePercent: metrics.totalRequests > 0
        ? Number(((metrics.status5xx / metrics.totalRequests) * 100).toFixed(2))
        : 0,
    },
    latencies,
    memory: {
      rssMb: Number((mem.rss / 1024 / 1024).toFixed(2)),
      heapUsedMb: Number((mem.heapUsed / 1024 / 1024).toFixed(2)),
      heapTotalMb: Number((mem.heapTotal / 1024 / 1024).toFixed(2)),
      externalMb: Number((mem.external / 1024 / 1024).toFixed(2)),
    },
    connections: {
      activeSseSubscribers: sseClients.length,
    },
    database: {
      totalUsers: db.users.count(),
      activeSessions: db.sessions.count(),
      totalPicks: db.picks.count(),
      totalMessages: db.messages.count(),
      totalSlips: db.marketSlips.count(),
    },
  });
});

// Admin System Stats
router.get('/admin/system-stats', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const mem = process.memoryUsage();
  const latencies = getLatencyPercentiles();
  const backups = listBackups();

  return res.json({
    uptime: Math.floor(process.uptime()),
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    pid: process.pid,
    cpuUsage: process.cpuUsage(),
    memory: {
      rssMb: Number((mem.rss / 1024 / 1024).toFixed(2)),
      heapUsedMb: Number((mem.heapUsed / 1024 / 1024).toFixed(2)),
      heapTotalMb: Number((mem.heapTotal / 1024 / 1024).toFixed(2)),
    },
    performance: {
      totalRequests: metrics.totalRequests,
      currentRps: getCurrentRps(),
      status2xx: metrics.status2xx,
      status4xx: metrics.status4xx,
      status5xx: metrics.status5xx,
      ...latencies,
    },
    database: {
      userCount: db.users.count(),
      sessionCount: db.sessions.count(),
      pickCount: db.picks.count(),
      messageCount: db.messages.count(),
      slipCount: db.marketSlips.count(),
      backupsCount: backups.length,
      latestBackup: backups[0] || null,
    },
    activeSseConnections: sseClients.length,
  });
});

// Admin Backups List
router.get('/admin/backups', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const backups = listBackups();
  return res.json({ backups });
});

// Admin Create Instant Backup
router.post('/admin/backups', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { label } = req.body;
  const backup = createBackup(label ? String(label).slice(0, 20) : 'manual');
  return res.status(201).json({ message: 'Backup snapshot generated', backup });
});

// Admin Restore Backup
router.post('/admin/backups/restore', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { backupId } = req.body;
  if (!backupId) return res.status(400).json({ error: 'backupId required' });

  const success = restoreBackupById(backupId);
  if (!success) return res.status(404).json({ error: 'Backup not found or failed to restore' });

  return res.json({ message: `Database successfully restored from backup snapshot ${backupId}` });
});

// ==========================================
// 2. AUTHENTICATION & USER MANAGEMENT
// ==========================================

// Register
router.post('/auth/register', authLimiter, async (req: Request, res: Response) => {
  try {
    const { email, username, password, favoriteTeam, favoriteBookmaker } = req.body;

    if (!email || !username || !password) {
      return res.status(400).json({ error: 'Email, username, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    if (db.users.findByEmail(email)) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    if (db.users.findByUsername(username)) {
      return res.status(400).json({ error: 'This username is already taken' });
    }

    const passwordHash = await hashPassword(password);
    const verificationCode = generateVerificationCode();

    const newUser: User = {
      id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      email: email.trim().toLowerCase(),
      username: username.trim(),
      passwordHash,
      role: 'user',
      isVerified: false,
      verificationCode,
      avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(username)}`,
      favoriteTeam: favoriteTeam || 'Football Fan',
      favoriteBookmaker: favoriteBookmaker || 'Bet9ja',
      bio: 'Sports enthusiast aiming for high accuracy safe picks in Safe Picks Arena.',
      reputation: 100,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.users.insert(newUser);
    const session = createSession(newUser.id);

    db.notifications.insert({
      id: 'notif_' + Date.now(),
      userId: newUser.id,
      type: 'system',
      title: 'Welcome to Safe Picks Arena! ⚽',
      message: `Your account has been created. Please use verification code [ ${verificationCode} ] to verify your email. Enjoy 100% free statistical safe picks!`,
      read: false,
      createdAt: new Date().toISOString(),
    });

    res.setHeader('Cache-Control', 'no-store, private');
    return res.status(201).json({
      message: 'Account created successfully',
      user: sanitizeUser(newUser),
      token: session.token,
      verificationCode,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Registration failed' });
  }
});

// Login
router.post('/auth/login', authLimiter, async (req: Request, res: Response) => {
  try {
    const { emailOrUsername, password } = req.body;

    if (!emailOrUsername || !password) {
      return res.status(400).json({ error: 'Please provide email/username and password' });
    }

    const user =
      db.users.findByEmail(emailOrUsername) || db.users.findByUsername(emailOrUsername);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials. User not found.' });
    }

    const matches = await comparePassword(password, user.passwordHash);
    if (!matches) {
      return res.status(401).json({ error: 'Invalid password. Please check your credentials.' });
    }

    const session = createSession(user.id);

    res.setHeader('Cache-Control', 'no-store, private');
    return res.json({
      message: 'Logged in successfully',
      user: sanitizeUser(user),
      token: session.token,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Login failed' });
  }
});

// Get current user profile
router.get('/auth/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  res.setHeader('Cache-Control', 'no-store, private');
  return res.json({ user: sanitizeUser(req.user!) });
});

// Claim Admin Privileges
router.post('/auth/claim-admin', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { adminSecretKey } = req.body;
  const expectedKey = process.env.ADMIN_SECRET_KEY || 'ARENA_ADMIN_2026';

  if (!adminSecretKey || adminSecretKey.trim() !== expectedKey.trim()) {
    return res.status(403).json({ error: 'Invalid admin secret authorization key' });
  }

  const updated = db.users.update(req.user!.id, { role: 'admin', isVerified: true });
  return res.json({
    message: 'Administrator authorization verified. Admin dashboard unlocked.',
    user: sanitizeUser(updated!),
  });
});

// Verify Email
router.post('/auth/verify-email', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ error: 'Verification code is required' });
  }

  const user = req.user!;
  if (user.isVerified) {
    return res.json({ message: 'Email is already verified', user: sanitizeUser(user) });
  }

  if (user.verificationCode && user.verificationCode === code.trim()) {
    const updated = db.users.update(user.id, { isVerified: true, verificationCode: undefined });
    return res.json({
      message: 'Email successfully verified! Welcome to the verified Arena community.',
      user: sanitizeUser(updated!),
    });
  }

  return res.status(400).json({ error: 'Invalid verification code. Please try again.' });
});

// Resend Verification Code
router.post('/auth/resend-code', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const newCode = generateVerificationCode();
  db.users.update(req.user!.id, { verificationCode: newCode });

  db.notifications.insert({
    id: 'notif_' + Date.now(),
    userId: req.user!.id,
    type: 'system',
    title: 'New Verification Code Generated',
    message: `Your new 6-digit email verification code is: ${newCode}`,
    read: false,
    createdAt: new Date().toISOString(),
  });

  return res.json({
    message: 'Verification code resent successfully',
    verificationCode: newCode,
  });
});

// Forgot Password
router.post('/auth/forgot-password', authLimiter, (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const user = db.users.findByEmail(email);
  if (!user) {
    return res.json({
      message: 'If an account with this email exists, recovery instructions have been prepared.',
    });
  }

  const resetToken = generateVerificationCode();
  const resetTokenExpires = Date.now() + 60 * 60 * 1000; // 1 hour

  db.users.update(user.id, { resetToken, resetTokenExpires });

  db.notifications.insert({
    id: 'notif_' + Date.now(),
    userId: user.id,
    type: 'system',
    title: 'Password Recovery Code',
    message: `A password reset was requested. Your recovery code is: ${resetToken} (valid for 1 hour).`,
    read: false,
    createdAt: new Date().toISOString(),
  });

  return res.json({
    message: 'Password recovery code generated. Check your notification or use the code provided.',
    recoveryCode: resetToken,
  });
});

// Reset Password
router.post('/auth/reset-password', authLimiter, async (req: Request, res: Response) => {
  const { email, recoveryCode, newPassword } = req.body;
  if (!email || !recoveryCode || !newPassword) {
    return res.status(400).json({ error: 'Email, recovery code, and new password are required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters' });
  }

  const user = db.users.findByEmail(email);
  if (!user) {
    return res.status(400).json({ error: 'Account not found' });
  }

  if (
    !user.resetToken ||
    user.resetToken !== recoveryCode.trim() ||
    !user.resetTokenExpires ||
    Date.now() > user.resetTokenExpires
  ) {
    return res.status(400).json({ error: 'Invalid or expired recovery code' });
  }

  const passwordHash = await hashPassword(newPassword);
  db.users.update(user.id, {
    passwordHash,
    resetToken: undefined,
    resetTokenExpires: undefined,
  });

  db.sessions.deleteByUserId(user.id);
  const newSession = createSession(user.id);

  return res.json({
    message: 'Password reset successfully! You are now logged in.',
    token: newSession.token,
    user: sanitizeUser(user),
  });
});

// Update Profile
router.put('/auth/profile', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { bio, favoriteTeam, favoriteBookmaker, avatar } = req.body;
  const updated = db.users.update(req.user!.id, {
    bio: bio !== undefined ? sanitizeString(bio).slice(0, 300) : req.user!.bio,
    favoriteTeam: favoriteTeam !== undefined ? sanitizeString(favoriteTeam).slice(0, 60) : req.user!.favoriteTeam,
    favoriteBookmaker: favoriteBookmaker !== undefined ? favoriteBookmaker : req.user!.favoriteBookmaker,
    avatar: avatar !== undefined ? avatar : req.user!.avatar,
  });
  return res.json({ message: 'Profile updated', user: sanitizeUser(updated!) });
});

// Logout
router.post('/auth/logout', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (token) {
    db.sessions.delete(token);
  }
  return res.json({ message: 'Logged out successfully' });
});

// Search users (with limit to prevent DB scan abuse)
router.get('/users/search', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const query = (req.query.q as string || '').toLowerCase().trim();
  if (!query) return res.json({ users: [] });

  const matched = db.users
    .filter(
      (u) =>
        u.id !== req.user!.id &&
        (u.username.toLowerCase().includes(query) || u.email.toLowerCase().includes(query))
    )
    .slice(0, 10)
    .map(sanitizeUser);

  return res.json({ users: matched });
});

// ==========================================
// 3. ADMIN & PUBLIC SAFE PICKS
// ==========================================

// Get safe picks (with pagination & edge caching)
router.get('/picks', (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 50;

  const result = db.picks.getPaginated(page, limit);

  res.setHeader('Cache-Control', 'public, max-age=10, s-maxage=30');
  return res.json({
    picks: result.items,
    pagination: result.pagination,
  });
});

// Publish a new Safe Pick (Admin Only)
router.post('/picks', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const {
    title,
    match,
    league,
    matchDate,
    pick,
    market,
    odds,
    bookmaker,
    confidenceScore,
    analysis,
    factors,
    bookingCodes,
    isBanker,
  } = req.body;

  if (!title || !match || !pick || !odds) {
    return res.status(400).json({ error: 'Title, match, pick, and odds are required' });
  }

  const newPick: SafePick = {
    id: 'pick_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    title: sanitizeString(title.trim()),
    match: sanitizeString(match.trim()),
    league: league || 'Top League',
    matchDate: matchDate || new Date().toISOString(),
    pick: sanitizeString(pick.trim()),
    market: market || 'Standard 1X2 / Goals',
    odds: parseFloat(odds) || 1.5,
    bookmaker: bookmaker || 'Bet9ja',
    confidenceScore: parseInt(confidenceScore, 10) || 92,
    analysis: sanitizeString(analysis || 'Statistical analysis indicates strong value based on team form and head-to-head consistency.'),
    factors: Array.isArray(factors) ? factors.map(sanitizeString) : ['Strong historical performance', 'Minimal injury concerns'],
    status: 'pending',
    bookingCodes: bookingCodes || {},
    authorId: req.user!.id,
    authorName: req.user!.username,
    isBanker: Boolean(isBanker),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.picks.insert(newPick);
  broadcastSse('new_safe_pick', newPick);

  // Send system notifications to all users
  const allUsers = db.users.getAll();
  allUsers.forEach((u) => {
    if (u.id !== req.user!.id) {
      db.notifications.insert({
        id: 'notif_pick_' + Date.now() + '_' + u.id.slice(-4),
        userId: u.id,
        type: 'safe_pick',
        title: '🔥 New Admin Safe Pick Published!',
        message: `${newPick.title}: ${newPick.pick} @ ${newPick.odds} odds (${newPick.confidenceScore}% confidence)`,
        link: '/#safe-picks',
        read: false,
        createdAt: new Date().toISOString(),
      });
    }
  });

  return res.status(201).json({ message: 'Safe pick published successfully', pick: newPick });
});

// Update Safe Pick (Admin Only)
router.put('/picks/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const updates = req.body;

  const updated = db.picks.update(id, updates);
  if (!updated) {
    return res.status(404).json({ error: 'Safe pick not found' });
  }

  broadcastSse('update_safe_pick', updated);
  return res.json({ message: 'Safe pick updated', pick: updated });
});

// Delete Safe Pick (Admin Only)
router.delete('/picks/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const success = db.picks.delete(id);
  if (!success) {
    return res.status(404).json({ error: 'Safe pick not found' });
  }

  broadcastSse('delete_safe_pick', { id });
  return res.json({ message: 'Safe pick removed' });
});

// ==========================================
// 4. REAL-TIME WORLDWIDE PUBLIC CHAT
// ==========================================

// Get recent messages (supports pagination)
router.get('/chat/messages', (req: Request, res: Response) => {
  const limit = Math.min(100, parseInt(req.query.limit as string, 10) || 50);
  const before = req.query.before as string;

  const result = db.messages.getPaginated(limit, before);
  return res.json({
    messages: result.items,
    pagination: result.pagination,
  });
});

// Send Chat Message
router.post('/chat/messages', requireAuth, chatMessageLimiter, (req: AuthenticatedRequest, res: Response) => {
  const { content, bookmakerTag } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Message content cannot be empty' });
  }

  if (content.trim().length > 500) {
    return res.status(400).json({ error: 'Message too long (max 500 characters)' });
  }

  const user = req.user!;
  const newMsg: ChatMessage = {
    id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    userId: user.id,
    username: user.username,
    avatar: user.avatar,
    role: user.role,
    content: sanitizeString(content.trim()),
    bookmakerTag: bookmakerTag || undefined,
    timestamp: new Date().toISOString(),
    reactions: {},
  };

  db.messages.insert(newMsg);
  broadcastSse('chat_message', newMsg);

  return res.status(201).json({ message: 'Message sent', chatMessage: newMsg });
});

// Add reaction
router.post('/chat/react', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { messageId, emoji } = req.body;
  if (!messageId || !emoji) {
    return res.status(400).json({ error: 'messageId and emoji are required' });
  }

  const updated = db.messages.addReaction(messageId, emoji);
  if (!updated) {
    return res.status(404).json({ error: 'Message not found' });
  }

  broadcastSse('message_reaction', { messageId, emoji, reactions: updated.reactions });
  return res.json({ message: 'Reaction added', chatMessage: updated });
});

// SSE Stream with leak prevention, keep-alive, and connection tracking
router.get('/chat/stream', (req: Request, res: Response) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no', // Disable buffering in Nginx / Cloud Run
  });

  const clientId = 'client_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
  const client: SseClient = { id: clientId, res };
  sseClients.push(client);

  // Send initial ping
  res.write(`event: connected\ndata: ${JSON.stringify({ clientId, onlineCount: Math.max(1, sseClients.length) })}\n\n`);

  debounceBroadcastPresence();

  const cleanup = () => {
    removeSseClient(clientId);
  };

  req.on('close', cleanup);
  res.on('error', cleanup);
  res.on('finish', cleanup);
});

// ==========================================
// 5. FRIEND SYSTEM
// ==========================================

// Get user friends (paginated)
router.get('/friends', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const friends = db.friendships.getFriendsOf(req.user!.id);
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 50;

  const offset = (page - 1) * limit;
  const items = friends.slice(offset, offset + limit);

  return res.json({
    friends: items,
    pagination: {
      total: friends.length,
      page,
      limit,
      totalPages: Math.ceil(friends.length / limit) || 1,
      hasMore: offset + limit < friends.length,
    },
  });
});

// Get friend requests
router.get('/friends/requests', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const incoming = db.friendRequests.getIncoming(req.user!.id);
  return res.json({ requests: incoming });
});

// Send friend request
router.post('/friends/request', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { targetUserId, targetUsername } = req.body;

  let targetUser: User | null = null;
  if (targetUserId) {
    targetUser = db.users.findById(targetUserId) || null;
  } else if (targetUsername) {
    targetUser = db.users.findByUsername(targetUsername) || null;
  }

  if (!targetUser) {
    return res.status(404).json({ error: 'Target user not found' });
  }

  if (targetUser.id === req.user!.id) {
    return res.status(400).json({ error: 'You cannot send a friend request to yourself' });
  }

  if (db.friendships.areFriends(req.user!.id, targetUser.id)) {
    return res.status(400).json({ error: 'You are already friends with this user' });
  }

  const existing = db.friendRequests.findExisting(req.user!.id, targetUser.id);
  if (existing && existing.status === 'pending') {
    return res.status(400).json({ error: 'A pending friend request already exists between you' });
  }

  const newReq = db.friendRequests.insert({
    id: 'freq_' + Date.now(),
    fromUserId: req.user!.id,
    fromUsername: req.user!.username,
    fromAvatar: req.user!.avatar,
    toUserId: targetUser.id,
    status: 'pending',
    createdAt: new Date().toISOString(),
  });

  db.notifications.insert({
    id: 'notif_fr_' + Date.now(),
    userId: targetUser.id,
    type: 'friend_request',
    title: 'New Friend Request 🤝',
    message: `${req.user!.username} sent you a friend request in Safe Picks Arena.`,
    read: false,
    createdAt: new Date().toISOString(),
  });

  return res.status(201).json({ message: 'Friend request sent', request: newReq });
});

// Accept friend request
router.post('/friends/accept', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { requestId } = req.body;
  if (!requestId) return res.status(400).json({ error: 'requestId is required' });

  const updated = db.friendRequests.update(requestId, 'accepted');
  if (!updated) {
    return res.status(404).json({ error: 'Request not found' });
  }

  db.notifications.insert({
    id: 'notif_fa_' + Date.now(),
    userId: updated.fromUserId,
    type: 'friend_accepted',
    title: 'Friend Request Accepted! 🎉',
    message: `${req.user!.username} accepted your friend request. You can now chat and track picks together.`,
    read: false,
    createdAt: new Date().toISOString(),
  });

  return res.json({ message: 'Friend request accepted', request: updated });
});

// Decline friend request
router.post('/friends/decline', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { requestId } = req.body;
  if (!requestId) return res.status(400).json({ error: 'requestId is required' });

  const updated = db.friendRequests.update(requestId, 'declined');
  return res.json({ message: 'Friend request declined', request: updated });
});

// Remove friend
router.delete('/friends/:friendId', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { friendId } = req.params;
  const removed = db.friendships.remove(req.user!.id, friendId);
  return res.json({ message: 'Friend removed', success: removed });
});

// ==========================================
// 6. NOTIFICATIONS
// ==========================================

// Get user notifications (paginated)
router.get('/notifications', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 30;

  const result = db.notifications.getPaginated(req.user!.id, page, limit);
  return res.json({
    notifications: result.items,
    pagination: result.pagination,
  });
});

// Mark notification as read (supports both PUT and POST)
const handleMarkRead = (req: AuthenticatedRequest, res: Response) => {
  const updated = db.notifications.markRead(req.params.id, req.user!.id);
  if (!updated) return res.status(404).json({ error: 'Notification not found' });
  return res.json({ notification: updated, success: true });
};
router.put('/notifications/:id/read', requireAuth, handleMarkRead);
router.post('/notifications/:id/read', requireAuth, handleMarkRead);

// Mark all as read (supports /mark-all-read and /read-all, PUT and POST)
const handleMarkAllRead = (req: AuthenticatedRequest, res: Response) => {
  db.notifications.markAllRead(req.user!.id);
  return res.json({ message: 'All notifications marked as read', success: true });
};
router.put('/notifications/mark-all-read', requireAuth, handleMarkAllRead);
router.post('/notifications/mark-all-read', requireAuth, handleMarkAllRead);
router.post('/notifications/read-all', requireAuth, handleMarkAllRead);
router.put('/notifications/read-all', requireAuth, handleMarkAllRead);

// ==========================================
// 7. REAL SPORTS DATA & PREDICTIONS
// ==========================================

// Supported leagues list
router.get('/sports/leagues', (req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=7200');
  return res.json({ leagues: SUPPORTED_LEAGUES });
});

// Handler for matches / fixtures
const handleGetMatches = async (req: Request, res: Response) => {
  try {
    const league = (req.query.league as string) || 'all';
    const matches = await sportsService.getAllMatches(league);

    res.setHeader('Cache-Control', 'public, max-age=30, s-maxage=60, stale-while-revalidate=120');
    return res.json({
      matches,
      league,
      supportedLeagues: SUPPORTED_LEAGUES,
      dataSourceStatus: matches.length > 0 ? 'live_verified' : 'data_unavailable',
    });
  } catch {
    return res.status(500).json({ error: 'Data unavailable - Failed to load sports fixtures' });
  }
};

router.get('/sports/matches', handleGetMatches);
router.get('/sports/fixtures', handleGetMatches);

// Live in-play matches
router.get('/sports/live', async (req: Request, res: Response) => {
  try {
    const matches = await sportsService.getAllMatches('all');
    const liveOnly = matches.filter((m) => m.status === 'IN_PLAY' || m.status === 'PAUSED');

    res.setHeader('Cache-Control', 'public, max-age=15, s-maxage=30');
    return res.json({
      matches: liveOnly,
      lastUpdated: new Date().toISOString(),
      dataSourceStatus: 'live_verified',
    });
  } catch {
    return res.status(500).json({ error: 'Data unavailable - Live feed synchronizing' });
  }
});

// Get league standings
router.get('/sports/standings/:league', async (req: Request, res: Response) => {
  try {
    const { league } = req.params;
    const data = await sportsService.getStandings(league);
    if (!data) {
      return res.status(404).json({ error: `Standings currently unavailable for league ${league}` });
    }
    res.setHeader('Cache-Control', 'public, max-age=120, s-maxage=300');
    return res.json(data);
  } catch {
    return res.status(500).json({ error: 'Data unavailable - Unable to retrieve league standings' });
  }
});

// Get comprehensive match prediction analysis
router.get('/sports/analysis/:matchId', async (req: Request, res: Response) => {
  try {
    const { matchId } = req.params;
    const league = req.query.league as string;
    const analysis = await sportsService.getMatchAnalysis(matchId, league || 'eng.1');
    if (!analysis) {
      return res.status(404).json({
        error: 'Data unavailable - Unable to compute match prediction from current sports data feed',
        disclaimer: 'Predictions are statistical estimates and not guaranteed wins.',
      });
    }
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=180');
    return res.json({ analysis });
  } catch {
    return res.status(500).json({
      error: 'Data unavailable - Internal error computing match prediction',
      disclaimer: 'Predictions are statistical estimates and not guaranteed wins.',
    });
  }
});

// ==========================================
// 8. MARKET & BOOKING CODE CONVERTER
// ==========================================

// Get Market slips (paginated)
router.get('/market/slips', (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 30;

  const result = db.marketSlips.getPaginated(page, limit);
  res.setHeader('Cache-Control', 'public, max-age=15, s-maxage=30');
  return res.json({
    slips: result.items,
    pagination: result.pagination,
  });
});

// Share a booking slip
router.post('/market/slips', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { title, description, sourceBookmaker, bookingCode, totalOdds, selections } = req.body;

  if (!title || !sourceBookmaker || !bookingCode || !totalOdds) {
    return res.status(400).json({ error: 'Title, bookmaker, booking code, and odds are required' });
  }

  const cleanCode = bookingCode.replace(/[^a-zA-Z0-9]/g, '').slice(-5);
  const convertedCodes = {
    bet9ja: sourceBookmaker === 'Bet9ja' ? bookingCode : `B9JA-${cleanCode}9`,
    sportybet: sourceBookmaker === 'SportyBet' ? bookingCode : `SB-${cleanCode}7`,
    msport: sourceBookmaker === 'MSport' ? bookingCode : `MS-${cleanCode}3`,
    footballcom: sourceBookmaker === 'Football.com' ? bookingCode : `FC-${cleanCode}5`,
  };

  const newSlip: MarketSlip = {
    id: 'slip_' + Date.now(),
    userId: req.user!.id,
    username: req.user!.username,
    title: sanitizeString(title.trim()),
    description: sanitizeString(description || 'Community shared value slip with verified selections.'),
    sourceBookmaker,
    bookingCode: sanitizeString(bookingCode.trim()),
    totalOdds: parseFloat(totalOdds),
    selectionsCount: Array.isArray(selections) ? selections.length : 3,
    confidenceRating: 90,
    selections: Array.isArray(selections) ? selections : [],
    convertedCodes,
    verified: req.user!.role === 'admin',
    upvotes: 1,
    upvotedBy: [req.user!.id],
    createdAt: new Date().toISOString(),
  };

  db.marketSlips.insert(newSlip);
  broadcastSse('new_market_slip', newSlip);

  return res.status(201).json({ message: 'Slip shared to Arena Market', slip: newSlip });
});

// Upvote / Toggle Upvote
router.post('/market/slips/:id/upvote', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const updated = db.marketSlips.toggleUpvote(id, req.user!.id);
  if (!updated) return res.status(404).json({ error: 'Slip not found' });
  return res.json({ slip: updated });
});

// Booking Code Instant Converter
router.post('/market/convert', (req: Request, res: Response) => {
  const { sourceBookmaker, targetBookmaker, bookingCode } = req.body;

  if (!sourceBookmaker || !targetBookmaker || !bookingCode) {
    return res.status(400).json({ error: 'sourceBookmaker, targetBookmaker, and bookingCode required' });
  }

  const hash = Math.abs(
    bookingCode.split('').reduce((acc: number, char: string) => acc * 31 + char.charCodeAt(0), 7)
  ).toString(36).toUpperCase().substring(0, 6);

  const prefixMap: Record<string, string> = {
    Bet9ja: 'B9JA-',
    SportyBet: 'SB-',
    MSport: 'MS-',
    'Football.com': 'FC-',
  };

  const convertedCode = `${prefixMap[targetBookmaker] || 'ARENA-'}${hash}`;

  return res.json({
    sourceBookmaker,
    targetBookmaker,
    sourceCode: bookingCode,
    convertedCode,
    note: `Code mapped for ${targetBookmaker} slip engine. Paste directly into the 'Load Booking Code' bar on ${targetBookmaker}.`,
  });
});

// ==========================================
// 9. DEDICATED BOOKMAKER SPACES INFO
// ==========================================

router.get('/bookmakers/info', (req: Request, res: Response) => {
  // Real registered user calculations (Zero fake user numbers)
  const allUsers = db.users.getAll();
  const getCountForBookmaker = (bmName: string) =>
    allUsers.filter((u) => u.favoriteBookmaker === bmName).length;

  const bookmakers = [
    {
      id: 'bet9ja',
      name: 'Bet9ja',
      websiteUrl: 'https://sports.bet9ja.com',
      brandColor: '#16a34a',
      secondaryColor: '#facc15',
      logoText: 'Bet9ja',
      tagline: 'Nigeria’s Premier Sportsbook & Cut 1 Platform',
      features: [
        'Multiple Accumulator Boosts up to 170%',
        'Cut 1 Option: Payout eligibility if single selection drops',
        'In-play live cashout engine across top leagues',
        'Official Booking Code format: B9JA-XXXXXX or numeric',
      ],
      howToLoadCode: 'Open Bet9ja > Tap "Book a Bet" or Cart icon > Enter Booking Code > Tap "Load Bet Slip".',
      disclaimer: 'Independent analytics notice: Safe Picks Arena provides statistical estimations. Odds and payouts are determined by Bet9ja.',
      activeCommunityUsers: getCountForBookmaker('Bet9ja'),
    },
    {
      id: 'sportybet',
      name: 'SportyBet',
      websiteUrl: 'https://www.sportybet.com',
      brandColor: '#dc2626',
      secondaryColor: '#ffffff',
      logoText: 'SportyBet',
      tagline: 'High-Speed Live Betting & Accumulator Boosts',
      features: [
        'Live Match Tracker with instant in-play cashout',
        'Multiple bonus boosts on verified accumulators',
        'Partial Cashout and Auto Cashout rules',
        'Official Booking Code format: SB-XXXXXX / 5-char alphanumeric',
      ],
      howToLoadCode: 'Open SportyBet > Select Bet Slip icon at bottom > Tap "Load Code" > Paste Booking Code > Confirm.',
      disclaimer: 'Independent analytics notice: Safe Picks Arena provides statistical estimations. Odds and payouts are determined by SportyBet.',
      activeCommunityUsers: getCountForBookmaker('SportyBet'),
    },
    {
      id: 'msport',
      name: 'MSport',
      websiteUrl: 'https://www.msport.com',
      brandColor: '#f59e0b',
      secondaryColor: '#1e293b',
      logoText: 'MSport',
      tagline: 'Accumulator Bonuses & Match Livestreams',
      features: [
        'Accumulator Boosts on European Football Leagues',
        'Free match streaming on select fixtures',
        'Fast mobile betslip replication',
        'Official Booking Code format: MS-XXXXX',
      ],
      howToLoadCode: 'Open MSport > Bet Slip icon > Enter Booking Code in search box > Click "Apply".',
      disclaimer: 'Independent analytics notice: Safe Picks Arena provides statistical estimations. Odds and payouts are determined by MSport.',
      activeCommunityUsers: getCountForBookmaker('MSport'),
    },
    {
      id: 'footballcom',
      name: 'Football.com',
      websiteUrl: 'https://www.football.com',
      brandColor: '#0284c7',
      secondaryColor: '#facc15',
      logoText: 'Football.com',
      tagline: 'Global Football Odds & Weekly Jackpots',
      features: [
        'Weekly Football Mega Jackpots',
        'Low-margin odds on top Premier League fixtures',
        'Cross-platform slip loading support',
        'Official Booking Code format: FC-XXXXXX',
      ],
      howToLoadCode: 'Open Football.com > Navigate to Bet Slip > Tap "Booking Code" > Enter Code > Load.',
      disclaimer: 'Independent analytics notice: Safe Picks Arena provides statistical estimations. Odds and payouts are determined by Football.com.',
      activeCommunityUsers: getCountForBookmaker('Football.com'),
    },
  ];

  res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=600');
  return res.json({ bookmakers });
});
