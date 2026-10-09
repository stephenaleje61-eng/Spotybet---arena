import React, { useState } from 'react';
import { SafePick, User } from '../types';
import {
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Copy,
  Check,
  Edit2,
  Trash2,
  AlertCircle,
  Clock,
  Layers,
  ChevronRight,
  Info,
} from 'lucide-react';

interface AdminSafePicksHeroProps {
  picks: SafePick[];
  currentUser: User | null;
  onOpenPublishModal: () => void;
  onEditPick: (pick: SafePick) => void;
  onDeletePick: (id: string) => void;
  onOpenAnalysisForMatch?: (matchName: string) => void;
  onQuickAdminLogin?: () => void;
}

export const AdminSafePicksHero: React.FC<AdminSafePicksHeroProps> = ({
  picks,
  currentUser,
  onOpenPublishModal,
  onEditPick,
  onDeletePick,
  onQuickAdminLogin,
}) => {
  const [copiedCodeKey, setCopiedCodeKey] = useState<string | null>(null);
  const [selectedPickForDetails, setSelectedPickForDetails] = useState<string | null>(null);

  const handleCopy = (key: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeKey(key);
    setTimeout(() => {
      setCopiedCodeKey(null);
    }, 2000);
  };

  const isAdmin = currentUser?.role === 'admin';

  return (
    <section className="bg-gradient-to-b from-[#090a0e] via-[#0e1017] to-[#090a0e] py-6 sm:py-8 border-b border-[#22242d]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-yellow-400 font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-yellow-400 animate-live-dot" />
                OFFICIAL GAME &amp; PREDICTION SECTION
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-xs text-slate-400 font-semibold">Admin Verified Bankers</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
              SAFE PICKS <span className="text-yellow-400">OF THE DAY</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mt-1">
              High-confidence statistical selections vetted by Arena administrators. Each banker pick includes historical trend factors and multi-platform booking codes.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {isAdmin ? (
              <button
                onClick={onOpenPublishModal}
                className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-black font-extrabold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-[0_0_20px_rgba(250,204,21,0.25)] transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>+ Publish Official Safe Pick</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                {onQuickAdminLogin && (
                  <button
                    onClick={onQuickAdminLogin}
                    className="flex items-center gap-1.5 bg-[#1a1b24] hover:bg-[#252736] border border-yellow-400/30 text-yellow-400 text-xs font-bold px-3 py-2 rounded-lg transition-colors cursor-pointer"
                    title="Sign in as Arena Chief Admin to test publishing, editing, and deleting picks"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Test Admin Mode</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Picks Grid */}
        {picks.length === 0 ? (
          <div className="bg-[#121319] border border-[#22242d] rounded-2xl p-8 text-center">
            <ShieldCheck className="w-12 h-12 text-slate-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white">No Safe Picks Published Yet</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-4">
              Arena administrators analyze daily fixtures. Check back soon or publish an official prediction if you have administrator privileges.
            </p>
            {isAdmin && (
              <button
                onClick={onOpenPublishModal}
                className="inline-flex items-center gap-2 bg-yellow-400 text-black font-extrabold text-xs px-4 py-2 rounded-lg hover:bg-yellow-300"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Publish First Safe Pick
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {picks.map((pick) => {
              const isSelected = selectedPickForDetails === pick.id;

              return (
                <div
                  key={pick.id}
                  className="bg-[#121319] hover:bg-[#151720] border border-yellow-400/20 hover:border-yellow-400/50 rounded-2xl p-5 sm:p-6 transition-all duration-200 flex flex-col justify-between shadow-lg relative group"
                >
                  {/* Top metadata row (No static pills, clean text) */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="text-yellow-400 font-extrabold tracking-wide uppercase">
                          {pick.league}
                        </span>
                        <span aria-hidden="true" className="text-slate-600">·</span>
                        <span className="flex items-center gap-1 font-mono-sport text-[11px] text-slate-300">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {new Date(pick.matchDate).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {pick.isBanker && (
                          <>
                            <span aria-hidden="true" className="text-slate-600">·</span>
                            <span className="text-yellow-400 font-black tracking-wider text-[11px] uppercase">
                              ★ BANKER
                            </span>
                          </>
                        )}
                      </div>

                      {/* Admin Controls */}
                      {isAdmin && (
                        <div className="flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => onEditPick(pick)}
                            className="p-1.5 rounded-lg bg-[#1e202c] hover:bg-yellow-400 hover:text-black text-slate-300 text-xs transition-colors cursor-pointer"
                            title="Edit this safe pick"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Remove safe pick "${pick.title}"?`)) {
                                onDeletePick(pick.id);
                              }
                            }}
                            className="p-1.5 rounded-lg bg-[#1e202c] hover:bg-rose-500 hover:text-white text-slate-300 text-xs transition-colors cursor-pointer"
                            title="Delete this safe pick"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Match & Pick Title */}
                    <div className="mb-4">
                      <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight leading-snug">
                        {pick.match}
                      </h3>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {pick.title}
                      </div>
                    </div>

                    {/* Prediction Main Callout Box */}
                    <div className="bg-[#090a0e] border border-[#22242d] rounded-xl p-3.5 mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                          Recommended Safe Selection
                        </div>
                        <div className="text-base sm:text-lg font-black text-yellow-400 mt-0.5 flex items-center gap-2">
                          <span>{pick.pick}</span>
                        </div>
                        <div className="text-xs text-slate-400 font-medium">
                          Market: <span className="text-white font-semibold">{pick.market}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0 sm:border-l sm:border-[#22242d] sm:pl-4">
                        <div className="text-right">
                          <div className="text-[10px] uppercase font-bold text-slate-400">Total Odds</div>
                          <div className="text-xl font-black text-white font-mono-sport">
                            {pick.odds.toFixed(2)}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-[10px] uppercase font-bold text-slate-400">Confidence</div>
                          <div className="text-xl font-black text-emerald-400 font-mono-sport flex items-center gap-1 justify-end">
                            <TrendingUp className="w-4 h-4 text-emerald-400" />
                            {pick.confidenceScore}%
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Analysis Summary */}
                    <div className="text-xs text-slate-300 leading-relaxed mb-4">
                      <p className={isSelected ? '' : 'line-clamp-2'}>{pick.analysis}</p>
                      {pick.analysis.length > 120 && (
                        <button
                          onClick={() => setSelectedPickForDetails(isSelected ? null : pick.id)}
                          className="text-yellow-400 hover:text-yellow-300 font-bold text-[11px] mt-1 inline-flex items-center gap-1 cursor-pointer"
                        >
                          {isSelected ? 'Show less' : 'Read full analysis'}
                          <ChevronRight className={`w-3 h-3 transition-transform ${isSelected ? 'rotate-90' : ''}`} />
                        </button>
                      )}
                    </div>

                    {/* Factors list if expanded */}
                    {isSelected && pick.factors && pick.factors.length > 0 && (
                      <div className="mb-4 bg-[#0d0e14] border border-[#1e202c] rounded-xl p-3">
                        <div className="text-[11px] uppercase font-extrabold text-slate-400 mb-2">
                          Key Statistical Factors
                        </div>
                        <ul className="space-y-1.5 text-xs text-slate-300">
                          {pick.factors.map((f, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-yellow-400 font-black">✓</span>
                              <span>{f}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Multi-Bookmaker Booking Codes Row (1-click copy) */}
                  <div className="border-t border-[#1e202c] pt-4 mt-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
                      <span className="font-bold uppercase tracking-wider text-slate-300">
                        Direct Booking Codes
                      </span>
                      <span className="text-slate-500 text-[10px]">Click to copy &amp; load slip</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {/* Bet9ja */}
                      <button
                        onClick={() =>
                          handleCopy(
                            `b9ja_${pick.id}`,
                            pick.bookingCodes?.bet9ja || 'B9JA-847291'
                          )
                        }
                        className="bg-[#090a0e] hover:bg-[#181a24] border border-[#22242d] hover:border-emerald-500/50 rounded-lg p-2 text-left transition-colors cursor-pointer group/btn"
                      >
                        <div className="text-[10px] font-bold text-emerald-400 uppercase">Bet9ja</div>
                        <div className="text-xs font-mono-sport font-bold text-white flex items-center justify-between mt-0.5">
                          <span>{pick.bookingCodes?.bet9ja || 'B9JA-847291'}</span>
                          {copiedCodeKey === `b9ja_${pick.id}` ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3 text-slate-500 group-hover/btn:text-white" />
                          )}
                        </div>
                      </button>

                      {/* SportyBet */}
                      <button
                        onClick={() =>
                          handleCopy(
                            `sporty_${pick.id}`,
                            pick.bookingCodes?.sportybet || 'SB-99382'
                          )
                        }
                        className="bg-[#090a0e] hover:bg-[#181a24] border border-[#22242d] hover:border-rose-500/50 rounded-lg p-2 text-left transition-colors cursor-pointer group/btn"
                      >
                        <div className="text-[10px] font-bold text-rose-400 uppercase">SportyBet</div>
                        <div className="text-xs font-mono-sport font-bold text-white flex items-center justify-between mt-0.5">
                          <span>{pick.bookingCodes?.sportybet || 'SB-99382'}</span>
                          {copiedCodeKey === `sporty_${pick.id}` ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3 text-slate-500 group-hover/btn:text-white" />
                          )}
                        </div>
                      </button>

                      {/* MSport */}
                      <button
                        onClick={() =>
                          handleCopy(
                            `msport_${pick.id}`,
                            pick.bookingCodes?.msport || 'MS-22019'
                          )
                        }
                        className="bg-[#090a0e] hover:bg-[#181a24] border border-[#22242d] hover:border-amber-500/50 rounded-lg p-2 text-left transition-colors cursor-pointer group/btn"
                      >
                        <div className="text-[10px] font-bold text-amber-400 uppercase">MSport</div>
                        <div className="text-xs font-mono-sport font-bold text-white flex items-center justify-between mt-0.5">
                          <span>{pick.bookingCodes?.msport || 'MS-22019'}</span>
                          {copiedCodeKey === `msport_${pick.id}` ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3 text-slate-500 group-hover/btn:text-white" />
                          )}
                        </div>
                      </button>

                      {/* Football.com */}
                      <button
                        onClick={() =>
                          handleCopy(
                            `fcom_${pick.id}`,
                            pick.bookingCodes?.footballcom || 'FC-61840'
                          )
                        }
                        className="bg-[#090a0e] hover:bg-[#181a24] border border-[#22242d] hover:border-sky-500/50 rounded-lg p-2 text-left transition-colors cursor-pointer group/btn"
                      >
                        <div className="text-[10px] font-bold text-sky-400 uppercase">Football.com</div>
                        <div className="text-xs font-mono-sport font-bold text-white flex items-center justify-between mt-0.5">
                          <span>{pick.bookingCodes?.footballcom || 'FC-61840'}</span>
                          {copiedCodeKey === `fcom_${pick.id}` ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3 text-slate-500 group-hover/btn:text-white" />
                          )}
                        </div>
                      </button>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                      <span>Vetted by Admin: <strong className="text-slate-300">{pick.authorName}</strong></span>
                      <span className="text-[10px] text-yellow-400/80 font-semibold">
                        Instant Live Sync Active
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
