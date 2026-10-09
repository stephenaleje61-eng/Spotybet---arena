import React, { useState } from 'react';
import { BookmakerInfo, SafePick } from '../types';
import {
  Trophy,
  ExternalLink,
  Copy,
  Check,
  Zap,
  HelpCircle,
  TrendingUp,
  ShieldCheck,
  Gift,
} from 'lucide-react';

interface BookmakersSectionProps {
  bookmakers: BookmakerInfo[];
  safePicks: SafePick[];
}

export const BookmakersSection: React.FC<BookmakersSectionProps> = ({
  bookmakers,
  safePicks,
}) => {
  const [selectedBookmakerId, setSelectedBookmakerId] = useState<string>('bet9ja');
  const [testBookingCode, setTestBookingCode] = useState<string>('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const activeBookmaker =
    bookmakers.find((b) => b.id === selectedBookmakerId) || bookmakers[0];

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (!activeBookmaker) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
      {/* Section Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-yellow-400 font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-yellow-400" />
            OFFICIAL PLATFORM SPACES
          </span>
          <span className="text-slate-600">·</span>
          <span className="text-xs text-slate-400 font-semibold">4 Major Sportsbooks</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
          DEDICATED <span className="text-yellow-400">BOOKMAKER SPACES</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
          Dedicated interactive environments tailored for Bet9ja, SportyBet, MSport, and Football.com with boost breakdowns, slip loaders, and exclusive promo codes.
        </p>
      </div>

      {/* Bookmaker Selector Tabs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {bookmakers.map((b) => {
          const isSelected = b.id === selectedBookmakerId;
          return (
            <button
              key={b.id}
              onClick={() => setSelectedBookmakerId(b.id)}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                isSelected
                  ? 'bg-[#181a24] border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.2)]'
                  : 'bg-[#121319] border-[#22242d] hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-base sm:text-lg font-black text-white uppercase tracking-tight">
                  {b.name}
                </span>
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: b.brandColor }}
                />
              </div>
              <div className="text-[11px] text-slate-400 line-clamp-1">{b.tagline}</div>
              <div className="mt-3 flex items-center justify-between text-xs font-mono-sport">
                <span className="text-slate-500 text-[10px]">Platform</span>
                <span className="text-yellow-400 font-bold">Official Site</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Bookmaker Space View */}
      <div className="bg-[#121319] border border-[#22242d] rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Brand Accent Bar */}
        <div
          className="absolute top-0 left-0 right-0 h-1.5"
          style={{ backgroundColor: activeBookmaker.brandColor }}
        />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-[#22242d]">
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
                {activeBookmaker.name} <span className="text-yellow-400">Hub</span>
              </h3>
              <span
                className="text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full text-black font-mono-sport"
                style={{ backgroundColor: activeBookmaker.brandColor }}
              >
                Verified Space
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              {activeBookmaker.tagline}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <a
              href={activeBookmaker.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-black font-black text-xs px-4 py-2.5 rounded-xl transition-all shadow-md cursor-pointer"
            >
              <span>Visit Official {activeBookmaker.name}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <div className="bg-[#090a0e] px-3.5 py-2 rounded-xl border border-[#22242d] text-right">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Community Bettors</div>
              <div className="text-sm font-black text-white font-mono-sport">
                {activeBookmaker.activeCommunityUsers.toLocaleString()} Members
              </div>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="my-4 bg-[#090a0e] border border-[#22242d] p-3 rounded-xl text-xs text-slate-400 flex items-center justify-between">
          <span>{activeBookmaker.disclaimer || 'Safe Picks Arena provides independent mathematical analysis. Odds and promotions are determined exclusively by the respective sportsbook.'}</span>
          <span className="text-[10px] uppercase font-bold text-yellow-400 shrink-0 ml-2">Independent Hub</span>
        </div>

        {/* Feature Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
          {/* Key Advantages */}
          <div className="bg-[#090a0e] border border-[#22242d] rounded-xl p-5">
            <h4 className="text-xs font-black text-yellow-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              <span>Platform Advantages &amp; Features</span>
            </h4>
            <ul className="space-y-2 text-xs text-slate-200">
              {activeBookmaker.features.map((feat, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* How to load booking code */}
          <div className="bg-[#090a0e] border border-[#22242d] rounded-xl p-5">
            <h4 className="text-xs font-black text-yellow-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <HelpCircle className="w-4 h-4" />
              <span>How To Load Booking Codes</span>
            </h4>
            <div className="text-xs text-slate-200 leading-relaxed bg-[#121319] p-3.5 rounded-lg border border-[#1e202c]">
              {activeBookmaker.howToLoadCode}
            </div>

            {/* Quick Test Code Loader */}
            <div className="mt-4 pt-3 border-t border-[#1e202c]">
              <div className="text-[11px] font-bold text-slate-400 uppercase mb-1.5">
                Quick Slip Loader Simulator
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={testBookingCode}
                  onChange={(e) => setTestBookingCode(e.target.value)}
                  placeholder={`Enter 6-char ${activeBookmaker.name} Code`}
                  className="flex-1 bg-[#121319] border border-[#22242d] rounded-lg px-3 py-1.5 text-xs font-mono-sport text-white uppercase focus:border-yellow-400 outline-none"
                />
                <button
                  onClick={() => {
                    if (testBookingCode.trim()) {
                      alert(`Code "${testBookingCode.toUpperCase()}" validated for ${activeBookmaker.name}. In live production, open ${activeBookmaker.name} app and paste into "Load Code".`);
                    }
                  }}
                  className="bg-yellow-400 hover:bg-yellow-300 text-black font-extrabold text-xs px-3.5 py-1.5 rounded-lg cursor-pointer transition-colors"
                >
                  Verify Code
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Current Active Safe Picks for this Bookmaker */}
        <div className="pt-6 border-t border-[#22242d]">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-black text-white uppercase flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Verified Arena Safe Picks for {activeBookmaker.name}</span>
            </h4>
            <span className="text-xs text-slate-400">100% Free Banker Slips</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {safePicks.map((pick) => {
              const code =
                activeBookmaker.id === 'bet9ja'
                  ? pick.bookingCodes?.bet9ja
                  : activeBookmaker.id === 'sportybet'
                  ? pick.bookingCodes?.sportybet
                  : activeBookmaker.id === 'msport'
                  ? pick.bookingCodes?.msport
                  : pick.bookingCodes?.footballcom;

              return (
                <div
                  key={pick.id}
                  className="bg-[#090a0e] border border-[#22242d] rounded-xl p-4 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                      <span className="text-yellow-400 font-extrabold">{pick.league}</span>
                      <span className="font-mono-sport">{pick.odds.toFixed(2)} Odds</span>
                    </div>
                    <div className="text-sm font-extrabold text-white">{pick.match}</div>
                    <div className="text-xs font-bold text-yellow-400 mt-1">
                      Pick: {pick.pick}
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-[#1e202c] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">
                        {activeBookmaker.name} Code
                      </span>
                      <span className="font-mono-sport text-xs font-bold text-white">
                        {code || 'AVAILABLE'}
                      </span>
                    </div>

                    {code && (
                      <button
                        onClick={() => handleCopy(`b_code_${pick.id}`, code)}
                        className="flex items-center gap-1.5 bg-[#181a24] hover:bg-[#252838] border border-[#2a2c3a] text-slate-200 text-xs px-2.5 py-1 rounded-md transition-colors cursor-pointer"
                      >
                        {copiedKey === `b_code_${pick.id}` ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
