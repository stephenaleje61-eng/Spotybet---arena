import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, User } from '../types';
import {
  MessageSquare,
  Send,
  Sparkles,
  Users,
  Smile,
  Shield,
  UserPlus,
  Flame,
  Check,
  AlertCircle,
  Radio,
} from 'lucide-react';

interface WorldwideChatProps {
  currentUser: User | null;
  messages: ChatMessage[];
  onSendMessage: (content: string, bookmakerTag?: string) => Promise<void>;
  onReact: (messageId: string, emoji: string) => Promise<void>;
  onSendFriendRequest: (userId: string, username: string) => void;
  onOpenAuth: () => void;
  onlineCount: number;
}

export const WorldwideChat: React.FC<WorldwideChatProps> = ({
  currentUser,
  messages,
  onSendMessage,
  onReact,
  onSendFriendRequest,
  onOpenAuth,
  onlineCount,
}) => {
  const [inputText, setInputText] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('General');
  const [filterTag, setFilterTag] = useState<string>('All');
  const [sending, setSending] = useState(false);
  const [selectedUserForAction, setSelectedUserForAction] = useState<ChatMessage | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    if (!currentUser) {
      onOpenAuth();
      return;
    }

    setSending(true);
    try {
      const tag = selectedTag === 'General' ? undefined : selectedTag;
      await onSendMessage(inputText.trim(), tag);
      setInputText('');
    } finally {
      setSending(false);
    }
  };

  const handleAddFriendClick = (msg: ChatMessage) => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    if (msg.userId === currentUser.id) return;

    onSendFriendRequest(msg.userId, msg.username);
    setActionFeedback(`Friend request sent to ${msg.username}!`);
    setTimeout(() => {
      setActionFeedback(null);
      setSelectedUserForAction(null);
    }, 2500);
  };

  const filteredMessages = messages.filter((m) => {
    if (filterTag === 'All') return true;
    return m.bookmakerTag === filterTag;
  });

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-yellow-400 font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-live-dot" />
              GLOBAL LIVE CHAT ENGINE
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-xs text-slate-400 font-semibold font-mono-sport">
              Instant SSE Broadcast
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
            WORLDWIDE PUBLIC <span className="text-yellow-400">CHAT</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Connect in real-time with football analysts, discuss match tactics, share slips, and build your friend network.
          </p>
        </div>

        {/* Live Audience Counter */}
        <div className="bg-[#121319] border border-[#22242d] px-4 py-2 rounded-xl flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-emerald-400 animate-live-dot" />
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-bold">Online Worldwide</div>
            <div className="text-sm font-black text-white font-mono-sport">
              {onlineCount > 0 ? `${onlineCount.toLocaleString()} Sports Fans` : '1,420 Active Fans'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Box */}
      <div className="bg-[#121319] border border-[#22242d] rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[640px]">
        {/* Chat Sub-bar (Filter by Bookmaker Tag) */}
        <div className="bg-[#0e0f14] border-b border-[#22242d] px-4 py-2.5 flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase mr-1">Filter:</span>
            {['All', 'Bet9ja', 'SportyBet', 'MSport', 'Football.com'].map((tag) => (
              <button
                key={tag}
                onClick={() => setFilterTag(tag)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  filterTag === tag
                    ? 'bg-yellow-400 text-black'
                    : 'text-slate-400 hover:text-white bg-[#181a24]'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          <div className="text-[11px] text-slate-400 hidden sm:block">
            Tap any username to add friend
          </div>
        </div>

        {/* Feedback banner */}
        {actionFeedback && (
          <div className="bg-emerald-500/20 border-b border-emerald-500/40 text-emerald-400 text-xs px-4 py-2 flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{actionFeedback}</span>
          </div>
        )}

        {/* Messages Stream */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-gradient-to-b from-[#090a0e] to-[#0d0e14]">
          {filteredMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <MessageSquare className="w-10 h-10 text-slate-600 mb-2" />
              <div className="text-sm font-bold text-white">Public Chat is Live</div>
              <div className="text-xs text-slate-500 max-w-sm mt-1">
                Be the first to share your thoughts, match prediction, or booking code for today&apos;s football fixtures!
              </div>
            </div>
          ) : (
            filteredMessages.map((msg) => {
              const isOwn = currentUser && msg.userId === currentUser.id;
              const isAdmin = msg.role === 'admin';

              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 group ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  {/* Avatar */}
                  {!isOwn && (
                    <img
                      src={msg.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${msg.username}`}
                      alt={msg.username}
                      onClick={() => setSelectedUserForAction(msg)}
                      className="w-8 h-8 rounded-full border border-[#2a2c3a] shrink-0 mt-0.5 cursor-pointer hover:border-yellow-400 transition-colors"
                      title="Click to view & add friend"
                    />
                  )}

                  {/* Message Bubble Container */}
                  <div className={`max-w-[85%] sm:max-w-[70%] ${isOwn ? 'text-right' : 'text-left'}`}>
                    {/* Username & Tags */}
                    <div className="flex items-center gap-2 mb-1 text-[11px]">
                      <button
                        onClick={() => setSelectedUserForAction(msg)}
                        className={`font-bold hover:underline cursor-pointer ${
                          isAdmin ? 'text-yellow-400 flex items-center gap-1' : 'text-white'
                        }`}
                      >
                        {isAdmin && <Shield className="w-3 h-3 text-yellow-400 inline" />}
                        <span>{msg.username}</span>
                        {isAdmin && (
                          <span className="bg-yellow-400 text-black text-[9px] px-1 rounded uppercase font-black">
                            ADMIN
                          </span>
                        )}
                      </button>

                      {msg.bookmakerTag && (
                        <span className="text-[10px] font-bold text-yellow-400/90 bg-yellow-400/10 px-1.5 py-0.2 rounded border border-yellow-400/20">
                          {msg.bookmakerTag}
                        </span>
                      )}

                      <span className="text-slate-500 font-mono-sport text-[10px]">
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {/* Content Box */}
                    <div
                      className={`p-3 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                        isOwn
                          ? 'bg-yellow-400 text-black font-semibold rounded-tr-none'
                          : 'bg-[#181a24] text-slate-100 border border-[#262836] rounded-tl-none'
                      }`}
                    >
                      <p className="break-words">{msg.content}</p>
                    </div>

                    {/* Reaction Toolbar */}
                    <div className="flex items-center gap-1 mt-1.5">
                      {/* Existing reactions */}
                      {msg.reactions &&
                        Object.entries(msg.reactions).map(([emoji, count]) => (
                          <button
                            key={emoji}
                            onClick={() => onReact(msg.id, emoji)}
                            className="bg-[#121319] hover:bg-[#1f212f] border border-[#22242d] px-1.5 py-0.5 rounded text-[11px] text-slate-300 font-mono-sport flex items-center gap-1 cursor-pointer"
                          >
                            <span>{emoji}</span>
                            <span>{count}</span>
                          </button>
                        ))}

                      {/* Quick reaction triggers on hover */}
                      <div className="hidden group-hover:flex items-center gap-1 ml-1 bg-[#121319] border border-[#22242d] px-1.5 py-0.5 rounded-lg">
                        {['🔥', '⚽', '🎯', '🚀'].map((em) => (
                          <button
                            key={em}
                            onClick={() => onReact(msg.id, em)}
                            className="hover:scale-125 transition-transform text-xs cursor-pointer"
                          >
                            {em}
                          </button>
                        ))}
                      </div>

                      {/* Add friend button if other user */}
                      {!isOwn && currentUser && (
                        <button
                          onClick={() => handleAddFriendClick(msg)}
                          className="hidden group-hover:inline-flex items-center gap-1 text-[10px] text-yellow-400 hover:text-yellow-300 ml-2 font-bold cursor-pointer"
                          title="Add as Friend"
                        >
                          <UserPlus className="w-3 h-3" />
                          <span>Add Friend</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input Form */}
        <div className="bg-[#0e0f14] border-t border-[#22242d] p-3 sm:p-4">
          {currentUser ? (
            <form onSubmit={handleSend} className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase">Tag Bookmaker:</span>
                  <select
                    value={selectedTag}
                    onChange={(e) => setSelectedTag(e.target.value)}
                    className="bg-[#181a24] text-white border border-[#22242d] rounded px-2 py-0.5 text-xs outline-none"
                  >
                    <option value="General">General Football</option>
                    <option value="Bet9ja">Bet9ja Slip</option>
                    <option value="SportyBet">SportyBet Slip</option>
                    <option value="MSport">MSport Slip</option>
                    <option value="Football.com">Football.com Slip</option>
                  </select>
                </div>

                <div className="text-[11px] font-mono-sport text-slate-500">
                  {500 - inputText.length} chars left
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type a worldwide message, match score, or booking code..."
                  maxLength={500}
                  className="flex-1 bg-[#181a24] border border-[#262836] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-yellow-400 outline-none"
                />

                <button
                  type="submit"
                  disabled={sending || !inputText.trim()}
                  className="bg-yellow-400 hover:bg-yellow-300 disabled:opacity-40 text-black font-black px-4 py-2.5 rounded-xl text-xs sm:text-sm flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">Send</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="flex items-center justify-between p-2.5 bg-[#181a24] rounded-xl border border-[#262836]">
              <div className="text-xs text-slate-300">
                Join <strong className="text-yellow-400">Safe Picks Arena</strong> to message worldwide fans and participate in live football chat.
              </div>
              <button
                onClick={onOpenAuth}
                className="bg-yellow-400 hover:bg-yellow-300 text-black font-extrabold text-xs px-4 py-1.5 rounded-lg shadow-sm cursor-pointer whitespace-nowrap"
              >
                Sign In / Join Free
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
