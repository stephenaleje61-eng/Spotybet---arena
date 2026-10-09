import React from 'react';
import { Notification } from '../types';
import {
  X,
  Bell,
  CheckCheck,
  Sparkles,
  Users,
  Flame,
  MessageSquare,
  ShieldAlert,
} from 'lucide-react';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onMarkRead: (id: string) => Promise<void>;
  onMarkAllRead: () => Promise<void>;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkRead,
  onMarkAllRead,
}) => {
  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'safe_pick':
        return <Sparkles className="w-4 h-4 text-yellow-400" />;
      case 'friend_request':
      case 'friend_accepted':
        return <Users className="w-4 h-4 text-blue-400" />;
      case 'market':
        return <Flame className="w-4 h-4 text-amber-400" />;
      case 'chat':
        return <MessageSquare className="w-4 h-4 text-emerald-400" />;
      default:
        return <Bell className="w-4 h-4 text-yellow-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#121319] border border-yellow-400/40 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-[#0e0f14] border-b border-[#22242d] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-yellow-400 text-black flex items-center justify-center font-bold">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white uppercase tracking-tight">
                Activity Notifications
              </h2>
              <p className="text-[11px] text-slate-400">
                {unreadCount > 0 ? `${unreadCount} unread alerts` : 'All alerts up to date'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllRead}
                className="text-[11px] font-bold text-yellow-400 hover:text-yellow-300 flex items-center gap-1 cursor-pointer"
                title="Mark all as read"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark All Read</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="p-4 max-h-[60vh] overflow-y-auto space-y-2">
          {notifications.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">
              <Bell className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="font-bold text-white">No Notifications</p>
              <p className="mt-1 text-slate-500">
                You will receive alerts when safe picks are published, friend requests arrive, or chat mentions occur.
              </p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => {
                  if (!n.read) onMarkRead(n.id);
                }}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  n.read
                    ? 'bg-[#090a0e] border-[#1e202c] text-slate-400'
                    : 'bg-[#181a24] border-yellow-400/30 text-white shadow-sm'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-[#0e0f15] border border-[#22242d] shrink-0 mt-0.5">
                    {getIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-bold text-white truncate">{n.title}</h4>
                      <span className="text-[10px] text-slate-500 font-mono-sport shrink-0">
                        {new Date(n.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">{n.message}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
