import React, { useState } from 'react';
import { User, FriendRequest } from '../types';
import {
  X,
  Users,
  UserPlus,
  UserCheck,
  UserX,
  Search,
  Check,
  Clock,
  Shield,
  Trash2,
} from 'lucide-react';

interface FriendsModalProps {
  isOpen: boolean;
  onClose: () => void;
  friends: User[];
  requests: FriendRequest[];
  onAcceptRequest: (reqId: string) => Promise<void>;
  onDeclineRequest: (reqId: string) => Promise<void>;
  onRemoveFriend: (friendId: string) => Promise<void>;
  onSendRequest: (userId?: string, username?: string) => Promise<void>;
  onSearchUsers: (query: string) => Promise<User[]>;
}

export const FriendsModal: React.FC<FriendsModalProps> = ({
  isOpen,
  onClose,
  friends,
  requests,
  onAcceptRequest,
  onDeclineRequest,
  onRemoveFriend,
  onSendRequest,
  onSearchUsers,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'list' | 'requests' | 'add'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [sentFeedback, setSentFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await onSearchUsers(searchQuery.trim());
      setSearchResults(res);
    } finally {
      setSearching(false);
    }
  };

  const handleSend = async (user: User) => {
    try {
      await onSendRequest(user.id);
      setSentFeedback(`Friend request sent to ${user.username}!`);
      setTimeout(() => setSentFeedback(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to send request');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#121319] border border-yellow-400/40 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-[#0e0f14] border-b border-[#22242d] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-yellow-400 text-black flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white uppercase tracking-tight">
                Arena Friend Network
              </h2>
              <p className="text-[11px] text-slate-400">
                Connect with sports fans, track friend bets &amp; share banker tips.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="bg-[#090a0e] border-b border-[#22242d] px-4 py-2 flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'list'
                ? 'bg-yellow-400 text-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>My Friends ({friends.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('requests')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer relative ${
              activeSubTab === 'requests'
                ? 'bg-yellow-400 text-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Requests ({requests.length})</span>
            {requests.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-live-dot" />
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('add')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'add'
                ? 'bg-yellow-400 text-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Friend</span>
          </button>
        </div>

        {/* Content area */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {sentFeedback && (
            <div className="mb-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs p-3 rounded-lg flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{sentFeedback}</span>
            </div>
          )}

          {/* TAB 1: FRIENDS LIST */}
          {activeSubTab === 'list' && (
            <div>
              {friends.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  <Users className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                  <p className="font-bold text-white">No Friends Added Yet</p>
                  <p className="mt-1 text-slate-500">
                    Use the &quot;Add Friend&quot; tab or click any username in Worldwide Chat to connect.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {friends.map((f) => (
                    <div
                      key={f.id}
                      className="bg-[#090a0e] border border-[#22242d] rounded-xl p-3 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={f.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${f.username}`}
                          alt={f.username}
                          className="w-10 h-10 rounded-full border border-yellow-400/40"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-extrabold text-white">{f.username}</span>
                            {f.role === 'admin' && (
                              <span className="text-[9px] bg-yellow-400 text-black font-black px-1 rounded">
                                ADMIN
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            <span>Club: {f.favoriteTeam || 'Football'}</span>
                            <span className="mx-1">·</span>
                            <span className="text-yellow-400 font-mono-sport">★ {f.reputation} REP</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          if (confirm(`Remove ${f.username} from your friends?`)) {
                            onRemoveFriend(f.id);
                          }
                        }}
                        className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="Remove Friend"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: REQUESTS */}
          {activeSubTab === 'requests' && (
            <div>
              {requests.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  <UserCheck className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                  <p className="font-bold text-white">No Pending Requests</p>
                  <p className="mt-1 text-slate-500">
                    When someone sends you a friend request, it will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {requests.map((r) => (
                    <div
                      key={r.id}
                      className="bg-[#090a0e] border border-[#22242d] rounded-xl p-3 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={r.fromAvatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${r.fromUsername}`}
                          alt={r.fromUsername}
                          className="w-10 h-10 rounded-full border border-[#2a2c3a]"
                        />
                        <div>
                          <div className="text-sm font-extrabold text-white">{r.fromUsername}</div>
                          <div className="text-[11px] text-slate-400">
                            Sent you a friend request
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onAcceptRequest(r.id)}
                          className="bg-yellow-400 hover:bg-yellow-300 text-black font-extrabold text-xs px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => onDeclineRequest(r.id)}
                          className="bg-[#181a24] hover:bg-rose-500 hover:text-white text-slate-400 font-bold text-xs px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SEARCH & ADD */}
          {activeSubTab === 'add' && (
            <div className="space-y-4">
              <form onSubmit={handleSearch} className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by username or email..."
                  className="flex-1 bg-[#090a0e] border border-[#22242d] rounded-xl px-3.5 py-2 text-xs text-white focus:border-yellow-400 outline-none"
                />
                <button
                  type="submit"
                  disabled={searching || !searchQuery.trim()}
                  className="bg-yellow-400 hover:bg-yellow-300 text-black font-bold px-4 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Search</span>
                </button>
              </form>

              {searchResults.length > 0 && (
                <div className="space-y-2 mt-3">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Search Results</div>
                  {searchResults.map((u) => (
                    <div
                      key={u.id}
                      className="bg-[#090a0e] border border-[#22242d] rounded-xl p-3 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={u.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${u.username}`}
                          alt={u.username}
                          className="w-9 h-9 rounded-full border border-[#2a2c3a]"
                        />
                        <div>
                          <div className="text-xs font-bold text-white">{u.username}</div>
                          <div className="text-[11px] text-slate-400">
                            {u.favoriteTeam || 'Sports Fan'} · ★ {u.reputation} REP
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleSend(u)}
                        className="bg-yellow-400 hover:bg-yellow-300 text-black font-extrabold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
