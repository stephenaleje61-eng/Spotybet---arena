import {
  User,
  SafePick,
  ChatMessage,
  FriendRequest,
  Notification,
  MarketSlip,
  FootballMatch,
  MatchAnalysis,
  LeagueStanding,
  BookmakerInfo,
} from '../types';

// Configure API base URL: defaults to local /api or respects external VITE_API_BASE_URL if deployed across separate hosts
const customBase = typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL
  ? String(import.meta.env.VITE_API_BASE_URL).replace(/\/$/, '')
  : '';
const API_BASE = customBase ? `${customBase}/api` : '/api';

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('spa_auth_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('spa_auth_token', token);
    } else {
      localStorage.removeItem('spa_auth_token');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private getHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const targetUrl = `${API_BASE}${endpoint}`;
    let res: Response;
    try {
      res = await fetch(targetUrl, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers,
        },
      });
    } catch (networkErr: any) {
      throw new Error(
        `Unable to reach Safe Picks Arena API at ${targetUrl}. Please verify backend server status or network connection.`
      );
    }

    let data: any = {};
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      data = await res.json().catch(() => ({}));
    } else {
      const text = await res.text().catch(() => '');
      try {
        data = JSON.parse(text);
      } catch {
        data = { error: text || undefined };
      }
    }

    if (!res.ok) {
      const errorMessage =
        data.error ||
        data.message ||
        (res.status === 404
          ? `Endpoint not found (404) at ${targetUrl}. Please ensure backend API routes are active.`
          : `Request failed with status ${res.status}`);
      throw new Error(errorMessage);
    }
    return data as T;
  }

  // --- Auth ---
  async register(payload: {
    email: string;
    username: string;
    password: string;
    favoriteTeam?: string;
    favoriteBookmaker?: string;
  }) {
    const res = await this.request<{
      message: string;
      user: User;
      token: string;
      verificationCode: string;
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    this.setToken(res.token);
    return res;
  }

  async login(payload: { emailOrUsername: string; password: string }) {
    const res = await this.request<{
      message: string;
      user: User;
      token: string;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    this.setToken(res.token);
    return res;
  }

  async getMe() {
    if (!this.token) return null;
    try {
      const res = await this.request<{ user: User }>('/auth/me');
      return res.user;
    } catch {
      this.setToken(null);
      return null;
    }
  }

  async verifyEmail(code: string) {
    return this.request<{ message: string; user: User }>('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  }

  async resendVerificationCode() {
    return this.request<{ message: string; verificationCode: string }>('/auth/resend-code', {
      method: 'POST',
    });
  }

  async forgotPassword(email: string) {
    return this.request<{ message: string; recoveryCode?: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(payload: { email: string; recoveryCode: string; newPassword: string }) {
    const res = await this.request<{ message: string; token: string; user: User }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    this.setToken(res.token);
    return res;
  }

  async updateProfile(updates: Partial<User>) {
    return this.request<{ message: string; user: User }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async claimAdmin(adminSecretKey: string) {
    return this.request<{ message: string; user: User }>('/auth/claim-admin', {
      method: 'POST',
      body: JSON.stringify({ adminSecretKey }),
    });
  }

  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      this.setToken(null);
    }
  }

  async searchUsers(query: string) {
    return this.request<{ users: User[] }>(`/users/search?q=${encodeURIComponent(query)}`);
  }

  // --- Safe Picks ---
  async getSafePicks() {
    return this.request<{ picks: SafePick[] }>('/picks');
  }

  async publishSafePick(pickData: Partial<SafePick>) {
    return this.request<{ message: string; pick: SafePick }>('/picks', {
      method: 'POST',
      body: JSON.stringify(pickData),
    });
  }

  async updateSafePick(id: string, updates: Partial<SafePick>) {
    return this.request<{ message: string; pick: SafePick }>(`/picks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteSafePick(id: string) {
    return this.request<{ message: string }>(`/picks/${id}`, {
      method: 'DELETE',
    });
  }

  // --- Live Football & Predictions ---
  async getLiveMatches() {
    return this.request<{ matches: FootballMatch[]; lastUpdated: string }>('/sports/live');
  }

  async getAllMatches(league?: string) {
    const q = league && league !== 'all' ? `?league=${encodeURIComponent(league)}` : '';
    return this.request<{ matches: FootballMatch[]; supportedLeagues: any[] }>(`/sports/fixtures${q}`);
  }

  async getStandings(league: string) {
    return this.request<{ league: string; standings: LeagueStanding[] }>(`/sports/standings/${league}`);
  }

  async getMatchAnalysis(matchId: string, league?: string) {
    const q = league ? `?league=${encodeURIComponent(league)}` : '';
    return this.request<{ analysis: MatchAnalysis }>(`/sports/analysis/${matchId}${q}`);
  }

  // --- Worldwide Chat ---
  async getChatMessages() {
    return this.request<{ messages: ChatMessage[] }>('/chat/messages');
  }

  async sendChatMessage(content: string, bookmakerTag?: string) {
    return this.request<{ message: string; chatMessage: ChatMessage }>('/chat/messages', {
      method: 'POST',
      body: JSON.stringify({ content, bookmakerTag }),
    });
  }

  async reactToMessage(messageId: string, emoji: string) {
    return this.request<{ message: string; chatMessage: ChatMessage }>('/chat/react', {
      method: 'POST',
      body: JSON.stringify({ messageId, emoji }),
    });
  }

  // --- Friends ---
  async getFriends() {
    return this.request<{ friends: User[] }>('/friends');
  }

  async getFriendRequests() {
    return this.request<{ requests: FriendRequest[] }>('/friends/requests');
  }

  async sendFriendRequest(targetUserId?: string, targetUsername?: string) {
    return this.request<{ message: string; request: FriendRequest }>('/friends/request', {
      method: 'POST',
      body: JSON.stringify({ targetUserId, targetUsername }),
    });
  }

  async acceptFriendRequest(requestId: string) {
    return this.request<{ message: string; request: FriendRequest }>('/friends/accept', {
      method: 'POST',
      body: JSON.stringify({ requestId }),
    });
  }

  async declineFriendRequest(requestId: string) {
    return this.request<{ message: string; request: FriendRequest }>('/friends/decline', {
      method: 'POST',
      body: JSON.stringify({ requestId }),
    });
  }

  async removeFriend(friendId: string) {
    return this.request<{ message: string }>(`/friends/${friendId}`, {
      method: 'DELETE',
    });
  }

  // --- Notifications ---
  async getNotifications() {
    return this.request<{ notifications: Notification[] }>('/notifications');
  }

  async markNotificationRead(id: string) {
    return this.request<{ success: boolean }>(`/notifications/${id}/read`, {
      method: 'POST',
    });
  }

  async markAllNotificationsRead() {
    return this.request<{ success: boolean }>('/notifications/read-all', {
      method: 'POST',
    });
  }

  // --- Market & Booking Converter ---
  async getMarketSlips() {
    return this.request<{ slips: MarketSlip[] }>('/market/slips');
  }

  async shareMarketSlip(data: any) {
    return this.request<{ message: string; slip: MarketSlip }>('/market/slips', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async upvoteMarketSlip(slipId: string) {
    return this.request<{ slip: MarketSlip }>(`/market/slips/${slipId}/upvote`, {
      method: 'POST',
    });
  }

  async convertBookingCode(sourceBookmaker: string, targetBookmaker: string, bookingCode: string) {
    return this.request<{
      sourceBookmaker: string;
      targetBookmaker: string;
      sourceCode: string;
      convertedCode: string;
      note: string;
    }>('/market/convert', {
      method: 'POST',
      body: JSON.stringify({ sourceBookmaker, targetBookmaker, bookingCode }),
    });
  }

  // --- Bookmaker Spaces ---
  async getBookmakersInfo() {
    return this.request<{ bookmakers: BookmakerInfo[] }>('/bookmakers/info');
  }

  // --- Engine Diagnostics, Health & Admin Backups ---
  async getHealth() {
    return this.request<any>('/health');
  }

  async getMetrics() {
    return this.request<any>('/metrics');
  }

  async getAdminSystemStats() {
    return this.request<any>('/admin/system-stats');
  }

  async getAdminBackups() {
    return this.request<{ backups: any[] }>('/admin/backups');
  }

  async createAdminBackup(label?: string) {
    return this.request<{ message: string; backup: any }>('/admin/backups', {
      method: 'POST',
      body: JSON.stringify({ label }),
    });
  }

  async restoreAdminBackup(backupId: string) {
    return this.request<{ message: string }>('/admin/backups/restore', {
      method: 'POST',
      body: JSON.stringify({ backupId }),
    });
  }
}

export const api = new ApiService();
