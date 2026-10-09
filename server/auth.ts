import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { db, User, Session } from './db.js';

const SALT_ROUNDS = 10;
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function hashPassword(plainText: string): Promise<string> {
  return bcrypt.hash(plainText, SALT_ROUNDS);
}

export function comparePassword(plainText: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(plainText, hashed);
}

// Ensure default verified Admin exists if no admin is registered
export async function seedInitialAdmin(): Promise<void> {
  const existingAdmin = db.users.find((u) => u.role === 'admin');
  if (!existingAdmin) {
    const adminKey = process.env.ADMIN_DEFAULT_PASSWORD || 'SafeAdmin2026!';
    const passwordHash = await hashPassword(adminKey);
    const adminUser: User = {
      id: 'usr_admin_arena',
      email: 'admin@safepicksarena.com',
      username: 'ArenaChiefAdmin',
      passwordHash,
      role: 'admin',
      isVerified: true,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      favoriteTeam: 'Arsenal',
      favoriteBookmaker: 'Bet9ja',
      bio: 'Official Administrator & Verified Sports Analyst at Safe Picks Arena.',
      reputation: 999,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.users.insert(adminUser);
    console.log('[SafePicksArena] Admin initialized: admin@safepicksarena.com');
  }
}

export function createSession(userId: string): Session {
  const session: Session = {
    token: generateToken(),
    userId,
    createdAt: new Date().toISOString(),
    expiresAt: Date.now() + SESSION_DURATION_MS,
  };
  return db.sessions.insert(session);
}

export function getUserFromToken(token: string): User | null {
  if (!token) return null;
  const session = db.sessions.find(token);
  if (!session) return null;
  const user = db.users.findById(session.userId);
  return user || null;
}
