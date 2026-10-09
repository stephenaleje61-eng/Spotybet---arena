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
  pick: string;
  market: string;
  odds: number;
  bookmaker: 'Bet9ja' | 'SportyBet' | 'MSport' | 'Football.com' | 'Multi';
  confidenceScore: number;
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

export interface BackupRecord {
  id: string;
  timestamp: string;
  filename: string;
  sizeBytes: number;
  userCount: number;
  pickCount: number;
  messageCount: number;
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
const BACKUPS_DIR = path.join(DATA_DIR, 'backups');
const DB_FILE = path.join(DATA_DIR, 'arena_db.json');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(BACKUPS_DIR)) {
  fs.mkdirSync(BACKUPS_DIR, { recursive: true });
}

// -------------------------------------------------------------
// HIGH PERFORMANCE IN-MEMORY INDEXED DATA STORE (O(1) LOOKUPS)
// -------------------------------------------------------------
const indexUsersById = new Map<string, User>();
const indexUsersByEmail = new Map<string, string>(); // lowercased email -> userId
const indexUsersByUsername = new Map<string, string>(); // lowercased username -> userId

const indexSessionsByToken = new Map<string, Session>();
const indexSessionsByUserId = new Map<string, Set<string>>(); // userId -> Set of tokens

const indexPicksById = new Map<string, SafePick>();
let picksChronological: SafePick[] = [];

let chatMessagesList: ChatMessage[] = [];
const indexMessagesById = new Map<string, ChatMessage>();

const friendRequestsList: FriendRequest[] = [];
const friendshipsList: Array<{ id: string; user1Id: string; user2Id: string; createdAt: string }> = [];
const indexFriendshipsByUser = new Map<string, Set<string>>(); // userId -> Set of friend userIds

const indexNotificationsByUser = new Map<string, Notification[]>();
const indexNotificationsById = new Map<string, Notification>();

const indexMarketSlipsById = new Map<string, MarketSlip>();
let marketSlipsChronological: MarketSlip[] = [];

// Rebuild in-memory secondary indexes from raw schema
function rebuildIndexes(data: DatabaseSchema): void {
  // 1. Users
  indexUsersById.clear();
  indexUsersByEmail.clear();
  indexUsersByUsername.clear();
  for (const u of data.users) {
    indexUsersById.set(u.id, u);
    indexUsersByEmail.set(u.email.toLowerCase(), u.id);
    indexUsersByUsername.set(u.username.toLowerCase(), u.id);
  }

  // 2. Sessions
  indexSessionsByToken.clear();
  indexSessionsByUserId.clear();
  const now = Date.now();
  for (const s of data.sessions) {
    if (s.expiresAt > now) {
      indexSessionsByToken.set(s.token, s);
      let set = indexSessionsByUserId.get(s.userId);
      if (!set) {
        set = new Set<string>();
        indexSessionsByUserId.set(s.userId, set);
      }
      set.add(s.token);
    }
  }

  // 3. Picks
  indexPicksById.clear();
  picksChronological = [...data.picks].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  for (const p of data.picks) {
    indexPicksById.set(p.id, p);
  }

  // 4. Messages
  indexMessagesById.clear();
  chatMessagesList = data.messages.slice(-1000);
  for (const m of chatMessagesList) {
    indexMessagesById.set(m.id, m);
  }

  // 5. Friend Requests & Friendships
  friendRequestsList.length = 0;
  friendRequestsList.push(...data.friendRequests);

  friendshipsList.length = 0;
  friendshipsList.push(...data.friendships);
  indexFriendshipsByUser.clear();
  for (const f of data.friendships) {
    let set1 = indexFriendshipsByUser.get(f.user1Id);
    if (!set1) {
      set1 = new Set();
      indexFriendshipsByUser.set(f.user1Id, set1);
    }
    set1.add(f.user2Id);

    let set2 = indexFriendshipsByUser.get(f.user2Id);
    if (!set2) {
      set2 = new Set();
      indexFriendshipsByUser.set(f.user2Id, set2);
    }
    set2.add(f.user1Id);
  }

  // 6. Notifications
  indexNotificationsByUser.clear();
  indexNotificationsById.clear();
  for (const n of data.notifications) {
    indexNotificationsById.set(n.id, n);
    let list = indexNotificationsByUser.get(n.userId);
    if (!list) {
      list = [];
      indexNotificationsByUser.set(n.userId, list);
    }
    list.push(n);
  }
  // Sort user notifications descending
  for (const list of indexNotificationsByUser.values()) {
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // 7. Market Slips
  indexMarketSlipsById.clear();
  marketSlipsChronological = [...data.marketSlips].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  for (const s of data.marketSlips) {
    indexMarketSlipsById.set(s.id, s);
  }
}

// Initial Data Load
function loadDatabase(): void {
  const defaultSchema: DatabaseSchema = {
    users: [],
    sessions: [],
    picks: [],
    messages: [],
    friendRequests: [],
    friendships: [],
    notifications: [],
    marketSlips: [],
  };

  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      rebuildIndexes({ ...defaultSchema, ...parsed });
      console.log(`[SafePicksArena] Database loaded with ${indexUsersById.size} users, ${indexPicksById.size} picks, ${indexMarketSlipsById.size} slips.`);
      return;
    } catch (e) {
      console.error('[SafePicksArena] Error loading arena_db.json, attempting recovery from latest backup:', e);
      // Attempt restore from backup if available
      const recovered = restoreLatestBackup();
      if (recovered) return;
    }
  }

  rebuildIndexes(defaultSchema);
}

// -------------------------------------------------------------
// ATOMIC & ASYNCHRONOUS PERSISTENCE WITH WRITE QUEUE
// -------------------------------------------------------------
let isWriting = false;
let writeQueued = false;
let writeTimeout: NodeJS.Timeout | null = null;

function serializeCurrentState(): DatabaseSchema {
  const allNotifications: Notification[] = [];
  for (const list of indexNotificationsByUser.values()) {
    allNotifications.push(...list);
  }

  return {
    users: Array.from(indexUsersById.values()),
    sessions: Array.from(indexSessionsByToken.values()),
    picks: picksChronological,
    messages: chatMessagesList,
    friendRequests: friendRequestsList,
    friendships: friendshipsList,
    notifications: allNotifications,
    marketSlips: marketSlipsChronological,
  };
}

async function doWriteAtomic(): Promise<void> {
  if (isWriting) {
    writeQueued = true;
    return;
  }
  isWriting = true;
  writeQueued = false;

  const tempFile = path.join(DATA_DIR, `arena_db.tmp.${Date.now()}`);
  try {
    const data = serializeCurrentState();
    const jsonStr = JSON.stringify(data, null, 2);
    await fs.promises.writeFile(tempFile, jsonStr, 'utf-8');
    await fs.promises.rename(tempFile, DB_FILE);
  } catch (err) {
    console.error('[SafePicksArena] Critical error during atomic DB persist:', err);
    try {
      if (fs.existsSync(tempFile)) {
        await fs.promises.unlink(tempFile);
      }
    } catch {
      // ignore
    }
  } finally {
    isWriting = false;
    if (writeQueued) {
      setImmediate(doWriteAtomic);
    }
  }
}

export function persistDatabase(): void {
  if (writeTimeout) clearTimeout(writeTimeout);
  writeTimeout = setTimeout(() => {
    doWriteAtomic().catch((err) => console.error('[SafePicksArena] DB persist error:', err));
  }, 100);
}

// Synchronous force flush (used during shutdown / testing)
export function flushDatabaseSync(): void {
  if (writeTimeout) clearTimeout(writeTimeout);
  try {
    const data = serializeCurrentState();
    const tempFile = path.join(DATA_DIR, `arena_db.sync.${Date.now()}`);
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error('[SafePicksArena] Error in flushDatabaseSync:', err);
  }
}

// -------------------------------------------------------------
// AUTOMATED BACKUP & POINT-IN-TIME RECOVERY
// -------------------------------------------------------------
export function createBackup(label = 'manual'): BackupRecord {
  const timestamp = new Date().toISOString();
  const safeTime = timestamp.replace(/[:.]/g, '-');
  const filename = `arena_backup_${safeTime}_${label}.json`;
  const backupPath = path.join(BACKUPS_DIR, filename);

  const data = serializeCurrentState();
  const jsonStr = JSON.stringify(data, null, 2);
  fs.writeFileSync(backupPath, jsonStr, 'utf-8');

  const stats = fs.statSync(backupPath);
  const record: BackupRecord = {
    id: `bak_${Date.now()}`,
    timestamp,
    filename,
    sizeBytes: stats.size,
    userCount: data.users.length,
    pickCount: data.picks.length,
    messageCount: data.messages.length,
  };

  // Keep only the latest 10 backups to prevent storage bloat
  pruneOldBackups(10);
  return record;
}

export function listBackups(): BackupRecord[] {
  if (!fs.existsSync(BACKUPS_DIR)) return [];
  const files = fs.readdirSync(BACKUPS_DIR).filter((f) => f.startsWith('arena_backup_') && f.endsWith('.json'));

  return files
    .map((filename) => {
      try {
        const fullPath = path.join(BACKUPS_DIR, filename);
        const stats = fs.statSync(fullPath);
        return {
          id: filename.replace('.json', ''),
          timestamp: stats.mtime.toISOString(),
          filename,
          sizeBytes: stats.size,
          userCount: indexUsersById.size,
          pickCount: indexPicksById.size,
          messageCount: chatMessagesList.length,
        };
      } catch {
        return null;
      }
    })
    .filter((b): b is BackupRecord => b !== null)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

function pruneOldBackups(maxKeep = 10): void {
  const backups = listBackups();
  if (backups.length > maxKeep) {
    const toDelete = backups.slice(maxKeep);
    for (const b of toDelete) {
      try {
        fs.unlinkSync(path.join(BACKUPS_DIR, b.filename));
      } catch {
        // ignore
      }
    }
  }
}

function restoreLatestBackup(): boolean {
  const backups = listBackups();
  if (backups.length === 0) return false;
  const latest = backups[0];
  try {
    const raw = fs.readFileSync(path.join(BACKUPS_DIR, latest.filename), 'utf-8');
    const parsed = JSON.parse(raw);
    rebuildIndexes(parsed);
    console.log(`[SafePicksArena] Successfully restored database from backup: ${latest.filename}`);
    return true;
  } catch (err) {
    console.error('[SafePicksArena] Failed to restore from backup:', err);
    return false;
  }
}

export function restoreBackupById(backupId: string): boolean {
  const filename = backupId.endsWith('.json') ? backupId : `${backupId}.json`;
  const backupPath = path.join(BACKUPS_DIR, filename);
  if (!fs.existsSync(backupPath)) return false;

  try {
    const raw = fs.readFileSync(backupPath, 'utf-8');
    const parsed = JSON.parse(raw);
    rebuildIndexes(parsed);
    persistDatabase();
    return true;
  } catch (err) {
    console.error(`[SafePicksArena] Failed to restore backup ${backupId}:`, err);
    return false;
  }
}

// -------------------------------------------------------------
// PERIODIC EXPIRY PRUNING (SESSIONS & LOGS)
// -------------------------------------------------------------
const pruningTimer = setInterval(() => {
  const now = Date.now();
  let expiredFound = false;
  for (const [token, session] of indexSessionsByToken.entries()) {
    if (session.expiresAt <= now) {
      indexSessionsByToken.delete(token);
      const userTokens = indexSessionsByUserId.get(session.userId);
      if (userTokens) {
        userTokens.delete(token);
        if (userTokens.size === 0) indexSessionsByUserId.delete(session.userId);
      }
      expiredFound = true;
    }
  }
  if (expiredFound) {
    persistDatabase();
  }
}, 5 * 60 * 1000); // every 5 minutes
if (pruningTimer.unref) {
  pruningTimer.unref();
}

// -------------------------------------------------------------
// PUBLIC DATABASE API (INDEXED & PAGINATED)
// -------------------------------------------------------------
export const db = {
  users: {
    find: (predicate: (u: User) => boolean) => {
      for (const u of indexUsersById.values()) {
        if (predicate(u)) return u;
      }
      return undefined;
    },
    filter: (predicate: (u: User) => boolean) => {
      const res: User[] = [];
      for (const u of indexUsersById.values()) {
        if (predicate(u)) res.push(u);
      }
      return res;
    },
    findById: (id: string): User | undefined => indexUsersById.get(id),
    findByEmail: (email: string): User | undefined => {
      if (!email) return undefined;
      const id = indexUsersByEmail.get(email.trim().toLowerCase());
      return id ? indexUsersById.get(id) : undefined;
    },
    findByUsername: (name: string): User | undefined => {
      if (!name) return undefined;
      const id = indexUsersByUsername.get(name.trim().toLowerCase());
      return id ? indexUsersById.get(id) : undefined;
    },
    insert: (user: User): User => {
      indexUsersById.set(user.id, user);
      indexUsersByEmail.set(user.email.toLowerCase(), user.id);
      indexUsersByUsername.set(user.username.toLowerCase(), user.id);
      persistDatabase();
      return user;
    },
    update: (id: string, updates: Partial<User>): User | null => {
      const existing = indexUsersById.get(id);
      if (!existing) return null;

      // Check if email changed
      if (updates.email && updates.email.toLowerCase() !== existing.email.toLowerCase()) {
        indexUsersByEmail.delete(existing.email.toLowerCase());
        indexUsersByEmail.set(updates.email.toLowerCase(), id);
      }
      // Check if username changed
      if (updates.username && updates.username.toLowerCase() !== existing.username.toLowerCase()) {
        indexUsersByUsername.delete(existing.username.toLowerCase());
        indexUsersByUsername.set(updates.username.toLowerCase(), id);
      }

      const updated = {
        ...existing,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      indexUsersById.set(id, updated);
      persistDatabase();
      return updated;
    },
    getAll: (): User[] => Array.from(indexUsersById.values()),
    count: (): number => indexUsersById.size,
    getPaginated: (page = 1, limit = 20) => {
      const all = Array.from(indexUsersById.values());
      const total = all.length;
      const offset = Math.max(0, (page - 1) * limit);
      const items = all.slice(offset, offset + limit);
      return {
        items,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit) || 1,
          hasMore: offset + limit < total,
        },
      };
    },
  },

  sessions: {
    find: (token: string): Session | null => {
      const s = indexSessionsByToken.get(token);
      if (!s) return null;
      if (Date.now() > s.expiresAt) {
        indexSessionsByToken.delete(token);
        const set = indexSessionsByUserId.get(s.userId);
        if (set) {
          set.delete(token);
          if (set.size === 0) indexSessionsByUserId.delete(s.userId);
        }
        persistDatabase();
        return null;
      }
      return s;
    },
    insert: (session: Session): Session => {
      indexSessionsByToken.set(session.token, session);
      let set = indexSessionsByUserId.get(session.userId);
      if (!set) {
        set = new Set();
        indexSessionsByUserId.set(session.userId, set);
      }
      set.add(session.token);
      persistDatabase();
      return session;
    },
    delete: (token: string): void => {
      const s = indexSessionsByToken.get(token);
      if (s) {
        indexSessionsByToken.delete(token);
        const set = indexSessionsByUserId.get(s.userId);
        if (set) {
          set.delete(token);
          if (set.size === 0) indexSessionsByUserId.delete(s.userId);
        }
        persistDatabase();
      }
    },
    deleteByUserId: (userId: string): void => {
      const tokens = indexSessionsByUserId.get(userId);
      if (tokens) {
        for (const token of tokens) {
          indexSessionsByToken.delete(token);
        }
        indexSessionsByUserId.delete(userId);
        persistDatabase();
      }
    },
    count: (): number => indexSessionsByToken.size,
  },

  picks: {
    getAll: (): SafePick[] => [...picksChronological],
    getPaginated: (page = 1, limit = 20) => {
      const total = picksChronological.length;
      const offset = Math.max(0, (page - 1) * limit);
      const items = picksChronological.slice(offset, offset + limit);
      return {
        items,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit) || 1,
          hasMore: offset + limit < total,
        },
      };
    },
    findById: (id: string): SafePick | undefined => indexPicksById.get(id),
    insert: (pick: SafePick): SafePick => {
      indexPicksById.set(pick.id, pick);
      picksChronological.unshift(pick);
      persistDatabase();
      return pick;
    },
    update: (id: string, updates: Partial<SafePick>): SafePick | null => {
      const existing = indexPicksById.get(id);
      if (!existing) return null;

      const updated = {
        ...existing,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      indexPicksById.set(id, updated);
      const idx = picksChronological.findIndex((p) => p.id === id);
      if (idx !== -1) picksChronological[idx] = updated;
      persistDatabase();
      return updated;
    },
    delete: (id: string): boolean => {
      const exists = indexPicksById.has(id);
      if (exists) {
        indexPicksById.delete(id);
        picksChronological = picksChronological.filter((p) => p.id !== id);
        persistDatabase();
        return true;
      }
      return false;
    },
    count: (): number => indexPicksById.size,
  },

  messages: {
    getRecent: (limit = 100): ChatMessage[] => chatMessagesList.slice(-limit),
    getPaginated: (limit = 50, beforeTimestamp?: string) => {
      let filtered = chatMessagesList;
      if (beforeTimestamp) {
        const time = new Date(beforeTimestamp).getTime();
        filtered = filtered.filter((m) => new Date(m.timestamp).getTime() < time);
      }
      const items = filtered.slice(-limit);
      const hasMore = filtered.length > limit;
      return {
        items,
        pagination: {
          limit,
          hasMore,
          oldestTimestamp: items.length > 0 ? items[0].timestamp : null,
        },
      };
    },
    insert: (msg: ChatMessage): ChatMessage => {
      chatMessagesList.push(msg);
      indexMessagesById.set(msg.id, msg);
      // Keep memory bound to 1000 messages
      if (chatMessagesList.length > 1000) {
        const removed = chatMessagesList.splice(0, chatMessagesList.length - 800);
        for (const rm of removed) {
          indexMessagesById.delete(rm.id);
        }
      }
      persistDatabase();
      return msg;
    },
    addReaction: (id: string, emoji: string): ChatMessage | null => {
      const msg = indexMessagesById.get(id);
      if (msg) {
        if (!msg.reactions) msg.reactions = {};
        msg.reactions[emoji] = (msg.reactions[emoji] || 0) + 1;
        persistDatabase();
        return msg;
      }
      return null;
    },
    count: (): number => chatMessagesList.length,
  },

  friendRequests: {
    getByUser: (userId: string): FriendRequest[] =>
      friendRequestsList.filter((r) => r.toUserId === userId || r.fromUserId === userId),
    getIncoming: (userId: string): FriendRequest[] =>
      friendRequestsList.filter((r) => r.toUserId === userId && r.status === 'pending'),
    findExisting: (u1: string, u2: string): FriendRequest | undefined =>
      friendRequestsList.find(
        (r) => (r.fromUserId === u1 && r.toUserId === u2) || (r.fromUserId === u2 && r.toUserId === u1)
      ),
    insert: (req: FriendRequest): FriendRequest => {
      friendRequestsList.push(req);
      persistDatabase();
      return req;
    },
    update: (id: string, status: 'accepted' | 'declined'): FriendRequest | null => {
      const req = friendRequestsList.find((r) => r.id === id);
      if (req) {
        req.status = status;
        if (status === 'accepted') {
          const newFriendship = {
            id: 'fr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
            user1Id: req.fromUserId,
            user2Id: req.toUserId,
            createdAt: new Date().toISOString(),
          };
          friendshipsList.push(newFriendship);

          let set1 = indexFriendshipsByUser.get(req.fromUserId);
          if (!set1) {
            set1 = new Set();
            indexFriendshipsByUser.set(req.fromUserId, set1);
          }
          set1.add(req.toUserId);

          let set2 = indexFriendshipsByUser.get(req.toUserId);
          if (!set2) {
            set2 = new Set();
            indexFriendshipsByUser.set(req.toUserId, set2);
          }
          set2.add(req.fromUserId);
        }
        persistDatabase();
        return req;
      }
      return null;
    },
  },

  friendships: {
    getFriendsOf: (userId: string): Partial<User>[] => {
      const friendIds = indexFriendshipsByUser.get(userId);
      if (!friendIds || friendIds.size === 0) return [];

      const res: Partial<User>[] = [];
      for (const fid of friendIds) {
        const u = indexUsersById.get(fid);
        if (u) {
          const { passwordHash, verificationCode, resetToken, resetTokenExpires, ...safe } = u;
          res.push(safe);
        }
      }
      return res;
    },
    remove: (u1: string, u2: string): boolean => {
      // Remove from friendshipsList
      const initialLen = friendshipsList.length;
      const filtered = friendshipsList.filter(
        (f) => !((f.user1Id === u1 && f.user2Id === u2) || (f.user1Id === u2 && f.user2Id === u1))
      );
      friendshipsList.length = 0;
      friendshipsList.push(...filtered);

      indexFriendshipsByUser.get(u1)?.delete(u2);
      indexFriendshipsByUser.get(u2)?.delete(u1);

      // Clean pending requests between them
      const filteredReqs = friendRequestsList.filter(
        (r) => !((r.fromUserId === u1 && r.toUserId === u2) || (r.fromUserId === u2 && r.toUserId === u1))
      );
      friendRequestsList.length = 0;
      friendRequestsList.push(...filteredReqs);

      persistDatabase();
      return friendshipsList.length < initialLen;
    },
    areFriends: (u1: string, u2: string): boolean => {
      return indexFriendshipsByUser.get(u1)?.has(u2) || false;
    },
  },

  notifications: {
    getByUser: (userId: string): Notification[] => {
      return indexNotificationsByUser.get(userId) || [];
    },
    getPaginated: (userId: string, page = 1, limit = 20) => {
      const list = indexNotificationsByUser.get(userId) || [];
      const total = list.length;
      const offset = Math.max(0, (page - 1) * limit);
      const items = list.slice(offset, offset + limit);
      return {
        items,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit) || 1,
          hasMore: offset + limit < total,
        },
      };
    },
    insert: (notif: Notification): Notification => {
      indexNotificationsById.set(notif.id, notif);
      let list = indexNotificationsByUser.get(notif.userId);
      if (!list) {
        list = [];
        indexNotificationsByUser.set(notif.userId, list);
      }
      list.unshift(notif);
      if (list.length > 200) {
        const removed = list.splice(200);
        for (const rm of removed) {
          indexNotificationsById.delete(rm.id);
        }
      }
      persistDatabase();
      return notif;
    },
    markRead: (id: string, userId: string): Notification | null => {
      const n = indexNotificationsById.get(id);
      if (n && n.userId === userId) {
        n.read = true;
        persistDatabase();
        return n;
      }
      return null;
    },
    markAllRead: (userId: string): boolean => {
      const list = indexNotificationsByUser.get(userId);
      if (list) {
        for (const n of list) {
          n.read = true;
        }
        persistDatabase();
        return true;
      }
      return false;
    },
  },

  marketSlips: {
    getAll: (): MarketSlip[] => [...marketSlipsChronological],
    getPaginated: (page = 1, limit = 20) => {
      const total = marketSlipsChronological.length;
      const offset = Math.max(0, (page - 1) * limit);
      const items = marketSlipsChronological.slice(offset, offset + limit);
      return {
        items,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit) || 1,
          hasMore: offset + limit < total,
        },
      };
    },
    findById: (id: string): MarketSlip | undefined => indexMarketSlipsById.get(id),
    insert: (slip: MarketSlip): MarketSlip => {
      indexMarketSlipsById.set(slip.id, slip);
      marketSlipsChronological.unshift(slip);
      persistDatabase();
      return slip;
    },
    toggleUpvote: (id: string, userId: string): MarketSlip | null => {
      const s = indexMarketSlipsById.get(id);
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
    count: (): number => marketSlipsChronological.length,
  },
};

// Initialize DB on module load
loadDatabase();
