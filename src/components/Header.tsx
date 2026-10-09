import React from 'react';
import { User, Notification, FriendRequest, FootballMatch } from '../types';
import {
  ShieldAlert,
  Flame,
  Radio,
  Trophy,
  Users,
  Bell,
  MessageSquare,
  ShieldCheck,
  LogIn,
  User as UserIcon,
  ChevronDown,
  Sparkles,
  Activity,
} from 'lucide-react';

interface HeaderProps {
  currentUser: User | null;
  activeTab: 'picks' | 'live' | 'market' | 'bookmakers' | 'chat';
  setActiveTab: (tab: 'picks' | 'live' | 'market' | 'bookmakers' | 'chat') => void;
  notifications: Notification[];
  friendRequests: FriendRequest[];
  matches?: FootballMatch[];
  onOpenAuth: (initialMode?: 'login' | 'register') => void;
  onOpenNotifications: () => void;
  onOpenFriends: () => void;
  onOpenProfile: () => void;
  onOpenAdminPublish: () => void;
  onOpenSystemHealth: () => void;
  onlineChatCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  activeTab,
  setActiveTab,
  notifications,
  friendRequests,
  matches = [],
  onOpenAuth,
  onOpenNotifications,
  onOpenFriends,
  onOpenProfile,
  onOpenAdminPublish,
  onOpenSystemHealth,
  onlineChatCount,
}) => {
  const unreadNotifications = notifications.filter((n) => !n.read).length;
  const pendingFriendRequests = friendRequests.length;

  const liveMatches = matches.filter((m) => m.status === 'IN_PLAY');
  const upcomingMatches = matches.filter((m) => m.status === 'SCHEDULED').slice(0, 3);

  return (
    <header className="sticky top-0 z-40 bg-[#090a0e]/95 backdrop-blur-md border-b border-[#22242d]">
      {/* Top micro ticker with genuine live API data */}
      <div className="bg-[#121319] border-b border-[#1c1e27] text-xs text-slate-300 py-1.5 px-4 hidden md:block">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-yellow-400 font-bold tracking-wider uppercase text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-live-dot" />
              Live Sports Feed
            </span>
            <span className="text-slate-600">|</span>
            <div className="flex items-center gap-4 text-xs font-mono-sport text-slate-300">
              {liveMatches.length > 0 ? (
                liveMatches.slice(0, 3).map((m, idx) => (
                  <React.Fragment key={m.id}>
                    {idx > 0 && <span className="text-slate-700">·</span>}
                    <span
                      onClick={() => setActiveTab('live')}
                      className="hover:text-yellow-400 cursor-pointer transition-colors"
                      title={`${m.homeTeam.name} vs ${m.awayTeam.name}`}
                    >
                      {m.homeTeam.shortName} <strong className="text-yellow-400">{m.score.home ?? 0} - {m.score.away ?? 0}</strong> {m.awayTeam.shortName} <span className="text-emerald-400 font-bold">{m.minute || 'LIVE'}</span>
                    </span>
                  </React.Fragment>
                ))
              ) : upcomingMatches.length > 0 ? (
                upcomingMatches.map((m, idx) => (
                  <React.Fragment key={m.id}>
                    {idx > 0 && <span className="text-slate-700">·</span>}
                    <span
                      onClick={() => setActiveTab('live')}
                      className="hover:text-yellow-400 cursor-pointer transition-colors"
                      title={`${m.homeTeam.name} vs ${m.awayTeam.name}`}
                    >
                      {m.homeTeam.shortName} vs {m.awayTeam.shortName} <span className="text-yellow-400/90 font-sans text-[11px]">{new Date(m.utcDate).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </span>
                  </React.Fragment>
                ))
              ) : (
                <span className="text-slate-400">
                  Real Football API Active · Synchronizing Live European Fixtures
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span className="text-yellow-400/90 font-semibold tracking-wide">
              ⚡ 100% FREE SPORTS ARENA
            </span>
            <span className="text-slate-700">·</span>
            <span className="flex items-center gap-1 text-slate-300 font-mono-sport">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              {onlineChatCount > 0 ? `${onlineChatCount} Fans Connected` : 'Worldwide Active'}
            </span>
          </div>
        </div>
      </div>

      {/* Main navigation bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('picks')}>
          <div className="w-10 h-10 rounded-lg bg-yellow-400 flex items-center justify-center text-black font-black text-xl shadow-[0_0_15px_rgba(250,204,21,0.35)]">
            ⚡
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white uppercase">
                SAFE PICKS <span className="text-yellow-400">ARENA</span>
              </span>
            </div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              Verified Statistical Sports Hub
            </div>
          </div>
        </div>

        {/* Center Navigation Tabs */}
        <nav className="hidden lg:flex items-center gap-1 bg-[#121319] p-1 rounded-xl border border-[#22242d]">
          <button
            onClick={() => setActiveTab('picks')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'picks'
                ? 'bg-yellow-400 text-black shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Safe Picks</span>
          </button>

          <button
            onClick={() => setActiveTab('live')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'live'
                ? 'bg-yellow-400 text-black shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-rose-500" />
            <span>Live Football</span>
          </button>

          <button
            onClick={() => setActiveTab('market')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'market'
                ? 'bg-yellow-400 text-black shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Market & Converter</span>
          </button>

          <button
            onClick={() => setActiveTab('bookmakers')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'bookmakers'
                ? 'bg-yellow-400 text-black shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Bookmakers</span>
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'chat'
                ? 'bg-yellow-400 text-black shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
            <span>Worldwide Chat</span>
          </button>
        </nav>

        {/* Right Action Icons & User Menu */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Admin Publish Quick Button */}
          {currentUser?.role === 'admin' && (
            <button
              onClick={onOpenAdminPublish}
              className="hidden sm:flex items-center gap-1.5 bg-yellow-400 hover:bg-yellow-300 text-black text-xs font-extrabold px-3 py-1.5 rounded-lg shadow-sm transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Publish Banker</span>
            </button>
          )}

          {/* Notifications Bell */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 rounded-lg bg-[#121319] hover:bg-[#1a1b24] border border-[#22242d] text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifications > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center">
                {unreadNotifications}
              </span>
            )}
          </button>

          {/* Friends Trigger */}
          <button
            onClick={onOpenFriends}
            className="relative p-2 rounded-lg bg-[#121319] hover:bg-[#1a1b24] border border-[#22242d] text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Friend Network"
          >
            <Users className="w-4 h-4" />
            {pendingFriendRequests > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-yellow-400 text-[10px] font-black text-black flex items-center justify-center">
                {pendingFriendRequests}
              </span>
            )}
          </button>

          {/* Engine & Scalability Diagnostics */}
          <button
            onClick={onOpenSystemHealth}
            className="relative p-2 rounded-lg bg-[#121319] hover:bg-[#1a1b24] border border-[#22242d] hover:border-yellow-400/40 text-slate-300 hover:text-yellow-400 transition-colors cursor-pointer"
            title="Engine Telemetry & 5M Scalability Diagnostics"
          >
            <Activity className="w-4 h-4 text-yellow-400" />
          </button>

          {/* User Profile or Login */}
          {currentUser ? (
            <button
              onClick={onOpenProfile}
              className="flex items-center gap-2 bg-[#121319] hover:bg-[#1a1b24] border border-[#22242d] py-1.5 px-3 rounded-lg transition-colors cursor-pointer"
            >
              <img
                src={currentUser.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${currentUser.username}`}
                alt={currentUser.username}
                className="w-6 h-6 rounded-full border border-yellow-400/50"
              />
              <div className="text-left hidden sm:block">
                <div className="flex items-center gap-1.5 leading-none">
                  <span className="text-xs font-bold text-white">{currentUser.username}</span>
                  {currentUser.role === 'admin' && (
                    <span className="text-[9px] uppercase font-black bg-yellow-400 text-black px-1 rounded">
                      ADMIN
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-yellow-400 font-mono-sport mt-0.5">
                  ★ {currentUser.reputation} REP
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenAuth('login')}
                className="text-xs font-bold text-white hover:text-yellow-400 px-2.5 py-1.5 transition-colors cursor-pointer"
              >
                Sign In
              </button>
              <button
                onClick={() => onOpenAuth('register')}
                className="flex items-center gap-1.5 bg-yellow-400 hover:bg-yellow-300 text-black font-extrabold text-xs px-3.5 py-1.5 rounded-lg shadow-sm transition-all cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Join Free</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile subnavigation bar */}
      <div className="lg:hidden flex items-center justify-around border-t border-[#1c1e27] bg-[#0c0d12] px-2 py-2">
        <button
          onClick={() => setActiveTab('picks')}
          className={`flex flex-col items-center gap-1 text-[11px] font-bold ${
            activeTab === 'picks' ? 'text-yellow-400' : 'text-slate-400'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Safe Picks</span>
        </button>
        <button
          onClick={() => setActiveTab('live')}
          className={`flex flex-col items-center gap-1 text-[11px] font-bold ${
            activeTab === 'live' ? 'text-yellow-400' : 'text-slate-400'
          }`}
        >
          <Radio className="w-4 h-4" />
          <span>Live Scores</span>
        </button>
        <button
          onClick={() => setActiveTab('market')}
          className={`flex flex-col items-center gap-1 text-[11px] font-bold ${
            activeTab === 'market' ? 'text-yellow-400' : 'text-slate-400'
          }`}
        >
          <Flame className="w-4 h-4" />
          <span>Market</span>
        </button>
        <button
          onClick={() => setActiveTab('bookmakers')}
          className={`flex flex-col items-center gap-1 text-[11px] font-bold ${
            activeTab === 'bookmakers' ? 'text-yellow-400' : 'text-slate-400'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>Bookies</span>
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex flex-col items-center gap-1 text-[11px] font-bold ${
            activeTab === 'chat' ? 'text-yellow-400' : 'text-slate-400'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Chat</span>
        </button>
      </div>
    </header>
  );
};
