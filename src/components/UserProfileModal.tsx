import React, { useState } from 'react';
import { User } from '../types';
import {
  X,
  User as UserIcon,
  ShieldCheck,
  Trophy,
  LogOut,
  Save,
  Check,
  Mail,
  Flame,
} from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onUpdateProfile: (updates: Partial<User>) => Promise<void>;
  onLogout: () => Promise<void>;
  onOpenVerifyEmail: () => void;
  onClaimAdmin?: (adminKey: string) => Promise<void>;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpdateProfile,
  onLogout,
  onOpenVerifyEmail,
  onClaimAdmin,
}) => {
  const [bio, setBio] = useState(user?.bio || '');
  const [favoriteTeam, setFavoriteTeam] = useState(user?.favoriteTeam || '');
  const [favoriteBookmaker, setFavoriteBookmaker] = useState(user?.favoriteBookmaker || 'Bet9ja');
  const [adminSecretKey, setAdminSecretKey] = useState('');
  const [claimingAdmin, setClaimingAdmin] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!isOpen || !user) return null;

  const handleClaimAdmin = async () => {
    if (!adminSecretKey.trim() || !onClaimAdmin) return;
    setClaimingAdmin(true);
    try {
      await onClaimAdmin(adminSecretKey.trim());
      setFeedback('Administrator privileges verified! Admin dashboard activated.');
      setAdminSecretKey('');
    } catch (err: any) {
      alert(err.message || 'Invalid admin secret authorization key');
    } finally {
      setClaimingAdmin(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onUpdateProfile({
        bio,
        favoriteTeam,
        favoriteBookmaker: favoriteBookmaker as any,
      });
      setFeedback('Profile updated successfully!');
      setTimeout(() => setFeedback(null), 2500);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#121319] border border-yellow-400/40 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-[#0e0f14] border-b border-[#22242d] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-yellow-400 text-black flex items-center justify-center font-bold">
              <UserIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white uppercase tracking-tight">
                Arena Member Profile
              </h2>
              <p className="text-[11px] text-slate-400">
                Manage your credentials, bio, and sports preferences.
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

        {feedback && (
          <div className="bg-emerald-500/10 border-b border-emerald-500/30 text-emerald-400 text-xs p-3 flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        <div className="p-6 space-y-5">
          {/* Top user badge */}
          <div className="bg-[#090a0e] border border-[#22242d] rounded-xl p-4 flex items-center gap-4">
            <img
              src={user.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${user.username}`}
              alt={user.username}
              className="w-14 h-14 rounded-full border-2 border-yellow-400/60"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-base font-black text-white">{user.username}</span>
                {user.role === 'admin' ? (
                  <span className="bg-yellow-400 text-black text-[9px] font-black px-1.5 py-0.5 rounded uppercase">
                    ARENA ADMIN
                  </span>
                ) : (
                  <span className="bg-[#1e202c] text-slate-300 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">
                    PRO BETTOR
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                <Mail className="w-3 h-3 text-slate-500" />
                <span className="truncate">{user.email}</span>
              </div>
              <div className="mt-2 flex items-center gap-2 text-[11px]">
                {user.isVerified ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Email Verified
                  </span>
                ) : (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenVerifyEmail();
                    }}
                    className="text-yellow-400 hover:underline font-bold text-[11px]"
                  >
                    ⚠ Verify Email Now
                  </button>
                )}
                <span className="text-slate-600">·</span>
                <span className="text-yellow-400 font-mono-sport font-bold">
                  ★ {user.reputation} REP
                </span>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                Favorite Football Club
              </label>
              <input
                type="text"
                value={favoriteTeam}
                onChange={(e) => setFavoriteTeam(e.target.value)}
                placeholder="e.g. Arsenal, Real Madrid, Enyimba"
                className="w-full bg-[#090a0e] border border-[#22242d] rounded-xl px-3.5 py-2 text-xs text-white focus:border-yellow-400 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                Preferred Bookmaker
              </label>
              <select
                value={favoriteBookmaker}
                onChange={(e) => setFavoriteBookmaker(e.target.value as any)}
                className="w-full bg-[#090a0e] border border-[#22242d] rounded-xl px-3.5 py-2 text-xs text-white focus:border-yellow-400 outline-none"
              >
                <option value="Bet9ja">Bet9ja</option>
                <option value="SportyBet">SportyBet</option>
                <option value="MSport">MSport</option>
                <option value="Football.com">Football.com</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                Bettor Bio / Strategy
              </label>
              <textarea
                rows={2}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Share your betting philosophy or favorite betting markets..."
                className="w-full bg-[#090a0e] border border-[#22242d] rounded-xl p-3 text-xs text-slate-200 focus:border-yellow-400 outline-none"
              />
            </div>

            {/* Administrator Authorization Claim */}
            {user.role !== 'admin' && onClaimAdmin && (
              <div className="bg-[#090a0e] border border-yellow-400/30 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-yellow-400 uppercase flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Administrator Authorization</span>
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Authorized Arena staff can enter the Admin Secret Key to manage verified game and prediction posts.
                </p>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={adminSecretKey}
                    onChange={(e) => setAdminSecretKey(e.target.value)}
                    placeholder="Enter Admin Secret Key"
                    className="flex-1 bg-[#121319] border border-[#22242d] rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-yellow-400 outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleClaimAdmin}
                    disabled={claimingAdmin || !adminSecretKey.trim()}
                    className="bg-yellow-400 hover:bg-yellow-300 text-black font-extrabold text-xs px-3.5 py-1.5 rounded-lg cursor-pointer disabled:opacity-50 transition-colors"
                  >
                    {claimingAdmin ? '...' : 'Verify Admin'}
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-[#22242d]">
              <button
                type="button"
                onClick={async () => {
                  await onLogout();
                  onClose();
                }}
                className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1.5 font-bold cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>

              <button
                type="submit"
                disabled={saving}
                className="bg-yellow-400 hover:bg-yellow-300 text-black font-black px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'Saving...' : 'Save Profile'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
