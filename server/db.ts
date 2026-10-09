import fs from 'fs';
import path from 'path';

export interface User {
  id: string;
  email: string;
  username: string;
  passwordHash: string;
  role: 'admin' | 'user';
  isVerified: boolean;
  verificationCode?: string;
  resetToken?: string;
  resetTokenExpires?: number;
  avatar?: string;
  favoriteTeam?: string;
  favoriteBookmaker?: 'Bet9ja' | 'SportyBet' | 'MSport' | 'Football.com' | 'Other';
  bio?: string;
  reputation: number;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  token: string;
  userId: string;
  createdAt: string;
  expiresAt: number;
}

export interface SafePick {
  id: string;
  title: string;
  match: string;
  league: string;
  matchDate: string;
  pick: string; // e.g. "Over 1.5 Goals", "Home Win or Draw (1X)", "Arsenal to Win"
  market: string;
  odds: number;
  bookmaker: 'Bet9ja' | 'SportyBet' | 'MSport' | 'Football.com' | 'Multi';
  confidenceScore: number; // e.g. 95 (percentage)
  analysis: string;
  factors: string[];
  status: 'pending' | 'won' | 'lost' | 'void';
  bookingCodes: {
    bet9ja?: string;
    sportybet?: string;
    msport?: string;
    footballcom?: string;
  };
  authorId: string;
  authorName: string;
  isBanker: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  avatar?: string;
  role: 'admin' | 'user';
  content: string;
  bookmakerTag?: 'Bet9ja' | 'SportyBet' | 'MSport' | 'Football.com';
  timestamp: string;
  reactions: Record<string, number>;
}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  fromUsername: string;
  fromAvatar?: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'chat' | 'friend_request' | 'friend_accepted' | 'safe_pick' | 'market' | 'system';
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

export interface MarketSlip {
  id: string;
  userId: string;
  username: string;
  title: string;
  description: string;
  sourceBookmaker: 'Bet9ja' | 'SportyBet' | 'MSport' | 'Football.com';
  bookingCode: string;
  totalOdds: number;
  selectionsCount: number;
  confidenceRating: number;
  selections: Array<{
    match: string;
    league: string;
    selection: string;
    odds: number;
  }>;
  convertedCodes: {
    bet9ja?: string;
    sportybet?: string;
    msport?: string;
    footballcom?: string;
  };
  verified: boolean;
  upvotes: number;
  upvotedBy: string[];
  createdAt: string;
}

interface DatabaseSchema {
  users: User[];
  sessions: Session[];
  picks: SafePick[];
  messages: ChatMessage[];
  friendRequests: FriendRequest[];
  friendships: Array<{ id: string; user1Id: string; user2Id: string; createdAt: string }>;
  notifications: Notification[];
  marketSlips: MarketSlip[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'arena_db.json');

// Initial in-memory state
let dbData: DatabaseSchema = {
  users: [],
  sessions: [],
  picks: [],
  messages: [],
  friendRequests: [],
  friendships: [],
  notifications: [],
  marketSlips: [],
};

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Load data if file exists
if (fs.existsSync(DB_FILE)) {
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    dbData = { ...dbData, ...JSON.parse(raw) };
  } catch (e) {
    console.error('Error loading database file, starting fresh:', e);
  }
}

// Save debounce
let saveTimeout: NodeJS.Timeout | null = null;
export function persistDatabase(): void {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(dbData, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write arena_db.json:', err);
    }
  }, 250);
}

export const db = {
  users: {
    find: (predicate: (u: User) => boolean) => dbData.users.find(predicate),
    filter: (predicate: (u: User) => boolean) => dbData.users.filter(predicate),
    findById: (id: string) => dbData.users.find((u) => u.id === id),
    findByEmail: (email: string) => dbData.users.find((u) => u.email.toLowerCase() === email.toLowerCase()),
    findByUsername: (name: string) => dbData.users.find((u) => u.username.toLowerCase() === name.toLowerCase()),
    insert: (user: User) => {
      dbData.users.push(user);
      persistDatabase();
      return user;
    },
    update: (id: string, updates: Partial<User>) => {
      const idx = dbData.users.findIndex((u) => u.id === id);
      if (idx !== -1) {
        dbData.users[idx] = { ...dbData.users[idx], ...updates, updatedAt: new Date().toISOString() };
        persistDatabase();
        return dbData.users[idx];
      }
      return null;
    },
    getAll: () => [...dbData.users],
  },

  sessions: {
    find: (token: string) => {
      const s = dbData.sessions.find((sess) => sess.token === token);
      if (!s) return null;
      if (Date.now() > s.expiresAt) {
        // Expired
        dbData.sessions = dbData.sessions.filter((sess) => sess.token !== token);
        persistDatabase();
        return null;
      }
      return s;
    },
    insert: (session: Session) => {
      dbData.sessions.push(session);
      persistDatabase();
      return session;
    },
    delete: (token: string) => {
      dbData.sessions = dbData.sessions.filter((s) => s.token !== token);
      persistDatabase();
    },
    deleteByUserId: (userId: string) => {
      dbData.sessions = dbData.sessions.filter((s) => s.userId !== userId);
      persistDatabase();
    },
  },

  picks: {
    getAll: () => [...dbData.picks].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    findById: (id: string) => dbData.picks.find((p) => p.id === id),
    insert: (pick: SafePick) => {
      dbData.picks.unshift(pick);
      persistDatabase();
      return pick;
    },
    update: (id: string, updates: Partial<SafePick>) => {
      const idx = dbData.picks.findIndex((p) => p.id === id);
      if (idx !== -1) {
        dbData.picks[idx] = { ...dbData.picks[idx], ...updates, updatedAt: new Date().toISOString() };
        persistDatabase();
        return dbData.picks[idx];
      }
      return null;
    },
    delete: (id: string) => {
      const exists = dbData.picks.some((p) => p.id === id);
      dbData.picks = dbData.picks.filter((p) => p.id !== id);
      persistDatabase();
      return exists;
    },
  },

  messages: {
    getRecent: (limit = 100) => dbData.messages.slice(-limit),
    insert: (msg: ChatMessage) => {
      dbData.messages.push(msg);
      // Keep memory bound to 1000 messages
      if (dbData.messages.length > 1000) {
        dbData.messages = dbData.messages.slice(-800);
      }
      persistDatabase();
      return msg;
    },
    addReaction: (id: string, emoji: string) => {
      const msg = dbData.messages.find((m) => m.id === id);
      if (msg) {
        if (!msg.reactions) msg.reactions = {};
        msg.reactions[emoji] = (msg.reactions[emoji] || 0) + 1;
        persistDatabase();
        return msg;
      }
      return null;
    },
  },

  friendRequests: {
    getByUser: (userId: string) => dbData.friendRequests.filter((r) => r.toUserId === userId || r.fromUserId === userId),
    getIncoming: (userId: string) => dbData.friendRequests.filter((r) => r.toUserId === userId && r.status === 'pending'),
    findExisting: (u1: string, u2: string) =>
      dbData.friendRequests.find((r) => (r.fromUserId === u1 && r.toUserId === u2) || (r.fromUserId === u2 && r.toUserId === u1)),
    insert: (req: FriendRequest) => {
      dbData.friendRequests.push(req);
      persistDatabase();
      return req;
    },
    update: (id: string, status: 'accepted' | 'declined') => {
      const req = dbData.friendRequests.find((r) => r.id === id);
      if (req) {
        req.status = status;
        if (status === 'accepted') {
          // Add to friendships
          dbData.friendships.push({
            id: 'fr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
            user1Id: req.fromUserId,
            user2Id: req.toUserId,
            createdAt: new Date().toISOString(),
          });
        }
        persistDatabase();
        return req;
      }
      return null;
    },
  },

  friendships: {
    getFriendsOf: (userId: string) => {
      const friendIds = dbData.friendships.flatMap((f) => {
        if (f.user1Id === userId) return [f.user2Id];
        if (f.user2Id === userId) return [f.user1Id];
        return [];
      });
      return dbData.users
        .filter((u) => friendIds.includes(u.id))
        .map(({ passwordHash, verificationCode, resetToken, ...safeUser }) => safeUser);
    },
    remove: (u1: string, u2: string) => {
      dbData.friendships = dbData.friendships.filter(
        (f) => !( (f.user1Id === u1 && f.user2Id === u2) || (f.user1Id === u2 && f.user2Id === u1) )
      );
      // Also clear friend request
      dbData.friendRequests = dbData.friendRequests.filter(
        (r) => !( (r.fromUserId === u1 && r.toUserId === u2) || (r.fromUserId === u2 && r.toUserId === u1) )
      );
      persistDatabase();
      return true;
    },
    areFriends: (u1: string, u2: string) => {
      return dbData.friendships.some(
        (f) => (f.user1Id === u1 && f.user2Id === u2) || (f.user1Id === u2 && f.user2Id === u1)
      );
    },
  },

  notifications: {
    getByUser: (userId: string) =>
      dbData.notifications
        .filter((n) => n.userId === userId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    insert: (notif: Notification) => {
      dbData.notifications.unshift(notif);
      if (dbData.notifications.length > 2000) {
        dbData.notifications = dbData.notifications.slice(0, 1500);
      }
      persistDatabase();
      return notif;
    },
    markRead: (id: string, userId: string) => {
      const n = dbData.notifications.find((notif) => notif.id === id && notif.userId === userId);
      if (n) {
        n.read = true;
        persistDatabase();
        return n;
      }
      return null;
    },
    markAllRead: (userId: string) => {
      dbData.notifications.forEach((n) => {
        if (n.userId === userId) n.read = true;
      });
      persistDatabase();
      return true;
    },
  },

  marketSlips: {
    getAll: () => [...dbData.marketSlips].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    findById: (id: string) => dbData.marketSlips.find((s) => s.id === id),
    insert: (slip: MarketSlip) => {
      dbData.marketSlips.unshift(slip);
      persistDatabase();
      return slip;
    },
    toggleUpvote: (id: string, userId: string) => {
      const s = dbData.marketSlips.find((slip) => slip.id === id);
      if (s) {
        const hasUpvoted = s.upvotedBy.includes(userId);
        if (hasUpvoted) {
          s.upvotedBy = s.upvotedBy.filter((u) => u !== userId);
          s.upvotes = Math.max(0, s.upvotes - 1);
        } else {
          s.upvotedBy.push(userId);
          s.upvotes += 1;
        }
        persistDatabase();
        return s;
      }
      return null;
    },
  },
};
