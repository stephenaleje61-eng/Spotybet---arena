import React, { useState, useEffect, useCallback } from 'react';
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
} from './types';
import { api } from './services/api';
import { Header } from './components/Header';
import { FreePlatformBanner } from './components/FreePlatformBanner';
import { AdminSafePicksHero } from './components/AdminSafePicksHero';
import { SafePickModal } from './components/SafePickModal';
import { LiveFootballCenter } from './components/LiveFootballCenter';
import { PredictionAnalysisModal } from './components/PredictionAnalysisModal';
import { WorldwideChat } from './components/WorldwideChat';
import { MarketSection } from './components/MarketSection';
import { BookmakersSection } from './components/BookmakersSection';
import { FriendsModal } from './components/FriendsModal';
import { NotificationsModal } from './components/NotificationsModal';
import { AuthModal } from './components/AuthModal';
import { UserProfileModal } from './components/UserProfileModal';
import {
  ShieldAlert,
  Flame,
  Radio,
  Trophy,
  Users,
  Bell,
  Sparkles,
  CheckCircle,
  HelpCircle,
  Info,
} from 'lucide-react';

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<'picks' | 'live' | 'market' | 'bookmakers' | 'chat'>('picks');

  // Core Data States
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [safePicks, setSafePicks] = useState<SafePick[]>([]);
  const [matches, setMatches] = useState<FootballMatch[]>([]);
  const [selectedLeague, setSelectedLeague] = useState<string>('all');
  const [standings, setStandings] = useState<{ league: string; standings: LeagueStanding[] } | null>(null);
  const [marketSlips, setMarketSlips] = useState<MarketSlip[]>([]);
  const [bookmakers, setBookmakers] = useState<BookmakerInfo[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [friends, setFriends] = useState<User[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [onlineChatCount, setOnlineChatCount] = useState<number>(1420);

  // Modal States
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'register'>('login');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isFriendsOpen, setIsFriendsOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [editingPick, setEditingPick] = useState<SafePick | null>(null);
  const [selectedAnalysis, setSelectedAnalysis] = useState<MatchAnalysis | null>(null);
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);

  // Loading States
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);

  // 1. Initial Data Fetch
  const loadInitialData = useCallback(async () => {
    try {
      // Current user
      const user = await api.getMe();
      setCurrentUser(user);

      // Safe Picks
      const picksRes = await api.getSafePicks();
      setSafePicks(picksRes.picks || []);

      // Matches
      const matchesRes = await api.getAllMatches(selectedLeague);
      setMatches(matchesRes.matches || []);

      // Standings for default PL
      const standingsRes = await api.getStandings('PL');
      setStandings(standingsRes);

      // Market slips
      const slipsRes = await api.getMarketSlips();
      setMarketSlips(slipsRes.slips || []);

      // Bookmakers
      const bmRes = await api.getBookmakersInfo();
      setBookmakers(bmRes.bookmakers || []);

      // Chat messages
      const chatRes = await api.getChatMessages();
      setChatMessages(chatRes.messages || []);

      // Friends and notifications if logged in
      if (user) {
        const [friendsRes, reqRes, notifRes] = await Promise.all([
          api.getFriends().catch(() => ({ friends: [] })),
          api.getFriendRequests().catch(() => ({ requests: [] })),
          api.getNotifications().catch(() => ({ notifications: [] })),
        ]);
        setFriends(friendsRes.friends || []);
        setFriendRequests(reqRes.requests || []);
        setNotifications(notifRes.notifications || []);
      }
    } catch (err) {
      console.error('Error loading initial arena data:', err);
    }
  }, [selectedLeague]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // 2. Real-Time SSE Listener for Worldwide Chat, Safe Picks & Presence
  useEffect(() => {
    const eventSource = new EventSource('/api/chat/stream');

    eventSource.addEventListener('connected', (e: any) => {
      try {
        const data = JSON.parse(e.data);
        if (data.onlineCount) setOnlineChatCount(data.onlineCount);
      } catch (err) {
        // ignore
      }
    });

    eventSource.addEventListener('presence', (e: any) => {
      try {
        const data = JSON.parse(e.data);
        if (data.count) setOnlineChatCount(data.count);
      } catch (err) {
        // ignore
      }
    });

    eventSource.addEventListener('chat_message', (e: any) => {
      try {
        const newMsg: ChatMessage = JSON.parse(e.data);
        setChatMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      } catch (err) {
        // ignore
      }
    });

    eventSource.addEventListener('message_reaction', (e: any) => {
      try {
        const { messageId, reactions } = JSON.parse(e.data);
        setChatMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, reactions } : m))
        );
      } catch (err) {
        // ignore
      }
    });

    eventSource.addEventListener('new_safe_pick', (e: any) => {
      try {
        const newPick: SafePick = JSON.parse(e.data);
        setSafePicks((prev) => [newPick, ...prev.filter((p) => p.id !== newPick.id)]);
      } catch (err) {
        // ignore
      }
    });

    eventSource.addEventListener('update_safe_pick', (e: any) => {
      try {
        const updated: SafePick = JSON.parse(e.data);
        setSafePicks((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      } catch (err) {
        // ignore
      }
    });

    eventSource.addEventListener('delete_safe_pick', (e: any) => {
      try {
        const { id } = JSON.parse(e.data);
        setSafePicks((prev) => prev.filter((p) => p.id !== id));
      } catch (err) {
        // ignore
      }
    });

    eventSource.addEventListener('new_market_slip', (e: any) => {
      try {
        const newSlip: MarketSlip = JSON.parse(e.data);
        setMarketSlips((prev) => [newSlip, ...prev.filter((s) => s.id !== newSlip.id)]);
      } catch (err) {
        // ignore
      }
    });

    return () => {
      eventSource.close();
    };
  }, []);

  // Update matches when selected league changes
  useEffect(() => {
    let isMounted = true;
    setIsLoadingMatches(true);

    api
      .getAllMatches(selectedLeague)
      .then((res) => {
        if (isMounted) setMatches(res.matches || []);
      })
      .catch((err) => console.error(err))
      .finally(() => {
        if (isMounted) setIsLoadingMatches(false);
      });

    const leagueKey = selectedLeague === 'all' ? 'PL' : selectedLeague.toUpperCase();
    api
      .getStandings(leagueKey)
      .then((res) => {
        if (isMounted && res) setStandings(res);
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [selectedLeague]);

  // Periodic auto-refresh for real-time live matches & scores
  useEffect(() => {
    const timer = setInterval(() => {
      api.getAllMatches(selectedLeague).then((res) => {
        setMatches(res.matches || []);
      }).catch(() => {});
    }, 45000);
    return () => clearInterval(timer);
  }, [selectedLeague]);

  // Auth Handlers
  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    // Reload user-related friends & notifs
    api.getFriends().then((res) => setFriends(res.friends || [])).catch(() => {});
    api.getFriendRequests().then((res) => setFriendRequests(res.requests || [])).catch(() => {});
    api.getNotifications().then((res) => setNotifications(res.notifications || [])).catch(() => {});
  };

  const handleLogout = async () => {
    await api.logout();
    setCurrentUser(null);
    setFriends([]);
    setFriendRequests([]);
    setNotifications([]);
  };

  // Safe Picks CRUD
  const handlePublishSafePick = async (pickData: Partial<SafePick>) => {
    if (editingPick) {
      const res = await api.updateSafePick(editingPick.id, pickData);
      setSafePicks((prev) => prev.map((p) => (p.id === editingPick.id ? res.pick : p)));
      setEditingPick(null);
    } else {
      const res = await api.publishSafePick(pickData);
      setSafePicks((prev) => [res.pick, ...prev]);
    }
  };

  const handleDeleteSafePick = async (id: string) => {
    await api.deleteSafePick(id);
    setSafePicks((prev) => prev.filter((p) => p.id !== id));
  };

  // Prediction Analysis Modal Open
  const handleOpenAnalysis = async (matchId: string, league?: string) => {
    try {
      const res = await api.getMatchAnalysis(matchId, league);
      if (res && res.analysis) {
        setSelectedAnalysis(res.analysis);
        setIsAnalysisOpen(true);
      }
    } catch (err: any) {
      alert(err.message || 'Analysis data currently unavailable for this match');
    }
  };

  // Worldwide Chat Handlers
  const handleSendMessage = async (content: string, bookmakerTag?: string) => {
    const res = await api.sendChatMessage(content, bookmakerTag);
    setChatMessages((prev) => {
      if (prev.some((m) => m.id === res.chatMessage.id)) return prev;
      return [...prev, res.chatMessage];
    });
  };

  const handleReactToMessage = async (messageId: string, emoji: string) => {
    const res = await api.reactToMessage(messageId, emoji);
    setChatMessages((prev) =>
      prev.map((m) => (m.id === messageId ? res.chatMessage : m))
    );
  };

  // Friends Handlers
  const handleSendFriendRequest = async (targetUserId?: string, targetUsername?: string) => {
    await api.sendFriendRequest(targetUserId, targetUsername);
  };

  const handleAcceptFriendRequest = async (reqId: string) => {
    await api.acceptFriendRequest(reqId);
    setFriendRequests((prev) => prev.filter((r) => r.id !== reqId));
    // refresh friends
    const fRes = await api.getFriends();
    setFriends(fRes.friends || []);
  };

  const handleDeclineFriendRequest = async (reqId: string) => {
    await api.declineFriendRequest(reqId);
    setFriendRequests((prev) => prev.filter((r) => r.id !== reqId));
  };

  const handleRemoveFriend = async (friendId: string) => {
    await api.removeFriend(friendId);
    setFriends((prev) => prev.filter((f) => f.id !== friendId));
  };

  // Notifications Handlers
  const handleMarkNotificationRead = async (id: string) => {
    await api.markNotificationRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleMarkAllNotificationsRead = async () => {
    await api.markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // Market Handlers
  const handleShareSlip = async (data: any) => {
    const res = await api.shareMarketSlip(data);
    setMarketSlips((prev) => [res.slip, ...prev]);
  };

  const handleUpvoteSlip = async (id: string) => {
    const res = await api.upvoteMarketSlip(id);
    setMarketSlips((prev) => prev.map((s) => (s.id === id ? res.slip : s)));
  };

  const handleConvertCode = async (source: string, target: string, code: string) => {
    return api.convertBookingCode(source, target, code);
  };

  // Refresh match feed
  const handleRefreshMatches = async () => {
    setIsLoadingMatches(true);
    try {
      const res = await api.getAllMatches(selectedLeague);
      setMatches(res.matches || []);
    } finally {
      setIsLoadingMatches(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090a0e] text-slate-100 flex flex-col font-sans selection:bg-yellow-400 selection:text-black">
      {/* 1. Header Navigation */}
      <Header
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        notifications={notifications}
        friendRequests={friendRequests}
        matches={matches}
        onOpenAuth={(mode = 'login') => {
          setAuthInitialMode(mode);
          setIsAuthOpen(true);
        }}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenFriends={() => setIsFriendsOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenAdminPublish={() => {
          setEditingPick(null);
          setIsPublishModalOpen(true);
        }}
        onlineChatCount={onlineChatCount}
      />

      {/* 2. Free Platform Banner */}
      <FreePlatformBanner />

      {/* 3. Main Content Views */}
      <main className="flex-1">
        {/* VIEW: SAFE PICKS (Home) */}
        {activeTab === 'picks' && (
          <div className="space-y-6">
            {/* Highly visible Game/Prediction section AT THE TOP of the home page */}
            <AdminSafePicksHero
              picks={safePicks}
              currentUser={currentUser}
              onOpenPublishModal={() => {
                setEditingPick(null);
                setIsPublishModalOpen(true);
              }}
              onEditPick={(pick) => {
                setEditingPick(pick);
                setIsPublishModalOpen(true);
              }}
              onDeletePick={handleDeleteSafePick}
              onQuickAdminLogin={async () => {
                try {
                  const res = await api.login({
                    emailOrUsername: 'admin@safepicksarena.com',
                    password: 'SafeAdmin2026!',
                  });
                  handleLoginSuccess(res.user);
                } catch (err: any) {
                  alert(err.message || 'Login failed');
                }
              }}
            />

            {/* Live Football Quick View */}
            <LiveFootballCenter
              matches={matches}
              standings={standings}
              selectedLeague={selectedLeague}
              setSelectedLeague={setSelectedLeague}
              onOpenAnalysis={handleOpenAnalysis}
              isLoading={isLoadingMatches}
              onRefresh={handleRefreshMatches}
            />

            {/* Market & Converter Quick View */}
            <MarketSection
              slips={marketSlips}
              currentUser={currentUser}
              onShareSlip={handleShareSlip}
              onUpvoteSlip={handleUpvoteSlip}
              onConvertCode={handleConvertCode}
              onOpenAuth={() => {
                setAuthInitialMode('login');
                setIsAuthOpen(true);
              }}
            />

            {/* Dedicated Bookmaker Spaces */}
            <BookmakersSection
              bookmakers={bookmakers}
              safePicks={safePicks}
            />

            {/* Worldwide Chat */}
            <WorldwideChat
              currentUser={currentUser}
              messages={chatMessages}
              onSendMessage={handleSendMessage}
              onReact={handleReactToMessage}
              onSendFriendRequest={handleSendFriendRequest}
              onOpenAuth={() => {
                setAuthInitialMode('login');
                setIsAuthOpen(true);
              }}
              onlineCount={onlineChatCount}
            />
          </div>
        )}

        {/* VIEW: LIVE FOOTBALL & PREDICTION ANALYSIS */}
        {activeTab === 'live' && (
          <LiveFootballCenter
            matches={matches}
            standings={standings}
            selectedLeague={selectedLeague}
            setSelectedLeague={setSelectedLeague}
            onOpenAnalysis={handleOpenAnalysis}
            isLoading={isLoadingMatches}
            onRefresh={handleRefreshMatches}
          />
        )}

        {/* VIEW: MARKET & CODE CONVERTER */}
        {activeTab === 'market' && (
          <MarketSection
            slips={marketSlips}
            currentUser={currentUser}
            onShareSlip={handleShareSlip}
            onUpvoteSlip={handleUpvoteSlip}
            onConvertCode={handleConvertCode}
            onOpenAuth={() => {
              setAuthInitialMode('login');
              setIsAuthOpen(true);
            }}
          />
        )}

        {/* VIEW: DEDICATED BOOKMAKER SPACES (Bet9ja, SportyBet, MSport, Football.com) */}
        {activeTab === 'bookmakers' && (
          <BookmakersSection
            bookmakers={bookmakers}
            safePicks={safePicks}
          />
        )}

        {/* VIEW: WORLDWIDE CHAT */}
        {activeTab === 'chat' && (
          <WorldwideChat
            currentUser={currentUser}
            messages={chatMessages}
            onSendMessage={handleSendMessage}
            onReact={handleReactToMessage}
            onSendFriendRequest={handleSendFriendRequest}
            onOpenAuth={() => {
              setAuthInitialMode('login');
              setIsAuthOpen(true);
            }}
            onlineCount={onlineChatCount}
          />
        )}
      </main>

      {/* 4. Footer */}
      <footer className="bg-[#07080b] border-t border-[#1e202c] py-10 px-4 sm:px-6 mt-12 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8 pb-8 border-b border-[#181a24]">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-7 h-7 rounded-lg bg-yellow-400 text-black flex items-center justify-center font-black text-sm">
                ⚡
              </span>
              <span className="text-base font-black text-white uppercase tracking-tight">
                SAFE PICKS <span className="text-yellow-400">ARENA</span>
              </span>
            </div>
            <p className="text-slate-400 max-w-md text-xs leading-relaxed">
              Global sports intelligence arena delivering real-data live scores, statistical Poisson prediction models, verified admin banker picks, multi-platform code converters, and worldwide community discussion.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs font-bold text-slate-300">
            <button
              onClick={() => setActiveTab('picks')}
              className="hover:text-yellow-400 cursor-pointer transition-colors"
            >
              Safe Picks
            </button>
            <button
              onClick={() => setActiveTab('live')}
              className="hover:text-yellow-400 cursor-pointer transition-colors"
            >
              Live Scores
            </button>
            <button
              onClick={() => setActiveTab('market')}
              className="hover:text-yellow-400 cursor-pointer transition-colors"
            >
              Code Converter
            </button>
            <button
              onClick={() => setActiveTab('bookmakers')}
              className="hover:text-yellow-400 cursor-pointer transition-colors"
            >
              Bookmaker Spaces
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className="hover:text-yellow-400 cursor-pointer transition-colors"
            >
              Worldwide Chat
            </button>
          </div>
        </div>

        {/* Legal & Responsible Gambling Banner */}
        <div className="max-w-7xl mx-auto pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500 text-center sm:text-left">
          <div>
            <span className="text-yellow-400/90 font-bold">18+ GAMBLE RESPONSIBLY.</span>{' '}
            Predictions are statistical probability estimates derived from historical form and Poisson distributions, and are not guaranteed wins. Safe Picks Arena is 100% free with no VIP subscription fees.
          </div>
          <div className="text-slate-600 font-mono-sport shrink-0">
            © 2026 SAFE PICKS ARENA · Engineered for High Concurrency
          </div>
        </div>
      </footer>

      {/* 5. Modals Container */}
      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        initialMode={authInitialMode}
        onLoginSuccess={handleLoginSuccess}
        onRegister={api.register.bind(api)}
        onLogin={api.login.bind(api)}
        onVerifyEmail={async (code) => {
          const res = await api.verifyEmail(code);
          return res.user;
        }}
        onResendCode={async () => {
          const res = await api.resendVerificationCode();
          return res.verificationCode;
        }}
        onForgotPassword={api.forgotPassword.bind(api)}
        onResetPassword={async (data) => {
          const res = await api.resetPassword(data);
          return res.user;
        }}
      />

      {/* Profile Modal */}
      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        user={currentUser}
        onUpdateProfile={async (updates) => {
          const res = await api.updateProfile(updates);
          setCurrentUser(res.user);
        }}
        onLogout={handleLogout}
        onOpenVerifyEmail={() => {
          setAuthInitialMode('login');
          setIsAuthOpen(true);
        }}
        onClaimAdmin={async (adminKey: string) => {
          const res = await api.claimAdmin(adminKey);
          setCurrentUser(res.user);
        }}
      />

      {/* Friends Modal */}
      <FriendsModal
        isOpen={isFriendsOpen}
        onClose={() => setIsFriendsOpen(false)}
        friends={friends}
        requests={friendRequests}
        onAcceptRequest={handleAcceptFriendRequest}
        onDeclineRequest={handleDeclineFriendRequest}
        onRemoveFriend={handleRemoveFriend}
        onSendRequest={handleSendFriendRequest}
        onSearchUsers={async (q) => {
          const res = await api.searchUsers(q);
          return res.users;
        }}
      />

      {/* Notifications Modal */}
      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onMarkRead={handleMarkNotificationRead}
        onMarkAllRead={handleMarkAllNotificationsRead}
      />

      {/* Admin Safe Pick Modal */}
      <SafePickModal
        isOpen={isPublishModalOpen}
        onClose={() => {
          setIsPublishModalOpen(false);
          setEditingPick(null);
        }}
        onSubmit={handlePublishSafePick}
        editingPick={editingPick}
        upcomingMatches={matches}
      />

      {/* Prediction Analysis Modal */}
      <PredictionAnalysisModal
        analysis={selectedAnalysis}
        isOpen={isAnalysisOpen}
        onClose={() => {
          setIsAnalysisOpen(false);
          setSelectedAnalysis(null);
        }}
      />
    </div>
  );
}
