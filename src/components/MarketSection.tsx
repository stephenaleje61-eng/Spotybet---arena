import React, { useState } from 'react';
import { MarketSlip, User } from '../types';
import {
  Flame,
  ArrowRightLeft,
  Copy,
  Check,
  ThumbsUp,
  Share2,
  Sparkles,
  Layers,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';

interface MarketSectionProps {
  slips: MarketSlip[];
  currentUser: User | null;
  onShareSlip: (data: any) => Promise<void>;
  onUpvoteSlip: (id: string) => Promise<void>;
  onConvertCode: (
    source: string,
    target: string,
    code: string
  ) => Promise<{ convertedCode: string; note: string }>;
  onOpenAuth: () => void;
}

export const MarketSection: React.FC<MarketSectionProps> = ({
  slips,
  currentUser,
  onShareSlip,
  onUpvoteSlip,
  onConvertCode,
  onOpenAuth,
}) => {
  // Converter state
  const [sourceBookmaker, setSourceBookmaker] = useState('SportyBet');
  const [targetBookmaker, setTargetBookmaker] = useState('Bet9ja');
  const [inputCode, setInputCode] = useState('');
  const [convertedResult, setConvertedResult] = useState<{
    code: string;
    note: string;
  } | null>(null);
  const [converting, setConverting] = useState(false);

  // Share Slip Modal state
  const [showShareModal, setShowShareModal] = useState(false);
  const [slipTitle, setSlipTitle] = useState('');
  const [slipDesc, setSlipDesc] = useState('');
  const [slipBookmaker, setSlipBookmaker] = useState<'Bet9ja' | 'SportyBet' | 'MSport' | 'Football.com'>('SportyBet');
  const [slipCode, setSlipCode] = useState('');
  const [slipTotalOdds, setSlipTotalOdds] = useState('2.85');
  const [sharing, setSharing] = useState(false);

  // Copy helper
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleRunConversion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;

    setConverting(true);
    try {
      const res = await onConvertCode(sourceBookmaker, targetBookmaker, inputCode.trim());
      setConvertedResult({ code: res.convertedCode, note: res.note });
    } finally {
      setConverting(false);
    }
  };

  const handlePublishSlip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    if (!slipTitle || !slipCode || !slipTotalOdds) return;

    setSharing(true);
    try {
      await onShareSlip({
        title: slipTitle,
        description: slipDesc,
        sourceBookmaker: slipBookmaker,
        bookingCode: slipCode,
        totalOdds: parseFloat(slipTotalOdds) || 2.5,
      });
      setShowShareModal(false);
      setSlipTitle('');
      setSlipDesc('');
      setSlipCode('');
    } finally {
      setSharing(false);
    }
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-yellow-400 font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-400" />
              SLIP MARKETPLACE &amp; CODE CONVERTER
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-xs text-slate-400 font-semibold">100% Free Open Exchange</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
            ARENA <span className="text-yellow-400">MARKET</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Convert booking codes instantly across Bet9ja, SportyBet, MSport, and Football.com, and browse verified community accumulators.
          </p>
        </div>

        <button
          onClick={() => (currentUser ? setShowShareModal(true) : onOpenAuth())}
          className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-black font-extrabold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
        >
          <Share2 className="w-4 h-4" />
          <span>+ Share A Booking Code</span>
        </button>
      </div>

      {/* 1. Cross-Platform Booking Code Converter */}
      <div className="bg-[#121319] border border-yellow-400/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-lg bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 flex items-center justify-center">
            <ArrowRightLeft className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-black text-white uppercase tracking-tight">
              Universal Booking Code Converter
            </h3>
            <p className="text-xs text-slate-400">
              Paste a booking code from any bookmaker to instantly map the selections into another bookmaker&apos;s format.
            </p>
          </div>
        </div>

        <form onSubmit={handleRunConversion} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Source */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                Source Bookmaker
              </label>
              <select
                value={sourceBookmaker}
                onChange={(e) => setSourceBookmaker(e.target.value)}
                className="w-full bg-[#090a0e] border border-[#22242d] rounded-xl px-3 py-2.5 text-xs text-white focus:border-yellow-400 outline-none font-bold"
              >
                <option value="SportyBet">SportyBet</option>
                <option value="Bet9ja">Bet9ja</option>
                <option value="MSport">MSport</option>
                <option value="Football.com">Football.com</option>
              </select>
            </div>

            {/* Target */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                Convert To Bookmaker
              </label>
              <select
                value={targetBookmaker}
                onChange={(e) => setTargetBookmaker(e.target.value)}
                className="w-full bg-[#090a0e] border border-[#22242d] rounded-xl px-3 py-2.5 text-xs text-yellow-400 focus:border-yellow-400 outline-none font-bold"
              >
                <option value="Bet9ja">Bet9ja</option>
                <option value="SportyBet">SportyBet</option>
                <option value="MSport">MSport</option>
                <option value="Football.com">Football.com</option>
              </select>
            </div>

            {/* Code Input */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                Booking Code
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  placeholder="e.g. SB-99382 or B9JA-847291"
                  className="flex-1 bg-[#090a0e] border border-[#22242d] rounded-xl px-3 py-2.5 text-xs font-mono-sport text-white focus:border-yellow-400 outline-none uppercase font-bold"
                  required
                />
                <button
                  type="submit"
                  disabled={converting || !inputCode.trim()}
                  className="bg-yellow-400 hover:bg-yellow-300 disabled:opacity-40 text-black font-black px-4 rounded-xl text-xs flex items-center justify-center cursor-pointer transition-colors"
                >
                  {converting ? '...' : 'Convert'}
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* Converted Output Display */}
        {convertedResult && (
          <div className="mt-4 pt-4 border-t border-[#1e202c] bg-[#090a0e] rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">
                Converted Code for {targetBookmaker}
              </div>
              <div className="text-xl font-black text-yellow-400 font-mono-sport mt-0.5 flex items-center gap-2">
                <span>{convertedResult.code}</span>
                <button
                  onClick={() => handleCopy('conv_res', convertedResult.code)}
                  className="p-1 rounded bg-[#181a24] hover:bg-[#252838] text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="Copy Converted Code"
                >
                  {copiedKey === 'conv_res' ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
              <div className="text-xs text-slate-300 mt-1">{convertedResult.note}</div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[11px] font-mono-sport bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3 py-1 rounded-md font-bold">
                ✓ Ready to Load
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 2. Community Value Slips Marketplace */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-black text-white uppercase tracking-tight">
              Community Verified Slips
            </h3>
            <span className="text-xs text-slate-500 font-mono-sport">
              ({slips.length} Slips Shared)
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {slips.map((slip) => (
            <div
              key={slip.id}
              className="bg-[#121319] border border-[#22242d] hover:border-slate-600 rounded-2xl p-5 flex flex-col justify-between transition-colors shadow-lg"
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-yellow-400 font-bold uppercase">{slip.sourceBookmaker}</span>
                    <span className="text-slate-600">·</span>
                    <span className="text-slate-400 font-medium">By @{slip.username}</span>
                    {slip.verified && (
                      <>
                        <span className="text-slate-600">·</span>
                        <span className="text-emerald-400 font-extrabold text-[10px] uppercase flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> VERIFIED
                        </span>
                      </>
                    )}
                  </div>

                  {/* Upvote button */}
                  <button
                    onClick={() => (currentUser ? onUpvoteSlip(slip.id) : onOpenAuth())}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono-sport font-bold transition-colors cursor-pointer ${
                      currentUser && slip.upvotedBy?.includes(currentUser.id)
                        ? 'bg-yellow-400 text-black'
                        : 'bg-[#181a24] text-slate-300 hover:text-white'
                    }`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>{slip.upvotes}</span>
                  </button>
                </div>

                {/* Title & description */}
                <h4 className="text-base font-extrabold text-white">{slip.title}</h4>
                <p className="text-xs text-slate-400 mt-1 mb-3">{slip.description}</p>

                {/* Metrics */}
                <div className="bg-[#090a0e] rounded-xl p-3 border border-[#1e202c] flex items-center justify-between mb-3 text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] block uppercase font-bold">Total Odds</span>
                    <span className="text-lg font-black text-yellow-400 font-mono-sport">
                      {slip.totalOdds.toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block uppercase font-bold">Selections</span>
                    <span className="text-lg font-black text-white font-mono-sport">
                      {slip.selectionsCount} Games
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block uppercase font-bold">Confidence</span>
                    <span className="text-lg font-black text-emerald-400 font-mono-sport">
                      {slip.confidenceRating}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Codes for all 4 bookmakers */}
              <div className="pt-3 border-t border-[#1e202c]">
                <div className="text-[10px] uppercase font-bold text-slate-400 mb-2">
                  Load On Any Bookmaker (1-Click Copy)
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs font-mono-sport">
                  {/* Bet9ja */}
                  <button
                    onClick={() =>
                      handleCopy(`b9ja_${slip.id}`, slip.convertedCodes?.bet9ja || slip.bookingCode)
                    }
                    className="bg-[#090a0e] hover:bg-[#181a24] border border-[#22242d] p-1.5 rounded text-left transition-colors cursor-pointer"
                  >
                    <div className="text-[9px] font-bold text-emerald-400 uppercase">Bet9ja</div>
                    <div className="font-bold text-white text-[11px] truncate flex items-center justify-between">
                      <span>{slip.convertedCodes?.bet9ja || slip.bookingCode}</span>
                      {copiedKey === `b9ja_${slip.id}` && <Check className="w-3 h-3 text-emerald-400" />}
                    </div>
                  </button>

                  {/* SportyBet */}
                  <button
                    onClick={() =>
                      handleCopy(`sporty_${slip.id}`, slip.convertedCodes?.sportybet || slip.bookingCode)
                    }
                    className="bg-[#090a0e] hover:bg-[#181a24] border border-[#22242d] p-1.5 rounded text-left transition-colors cursor-pointer"
                  >
                    <div className="text-[9px] font-bold text-rose-400 uppercase">SportyBet</div>
                    <div className="font-bold text-white text-[11px] truncate flex items-center justify-between">
                      <span>{slip.convertedCodes?.sportybet || slip.bookingCode}</span>
                      {copiedKey === `sporty_${slip.id}` && <Check className="w-3 h-3 text-emerald-400" />}
                    </div>
                  </button>

                  {/* MSport */}
                  <button
                    onClick={() =>
                      handleCopy(`msport_${slip.id}`, slip.convertedCodes?.msport || slip.bookingCode)
                    }
                    className="bg-[#090a0e] hover:bg-[#181a24] border border-[#22242d] p-1.5 rounded text-left transition-colors cursor-pointer"
                  >
                    <div className="text-[9px] font-bold text-amber-400 uppercase">MSport</div>
                    <div className="font-bold text-white text-[11px] truncate flex items-center justify-between">
                      <span>{slip.convertedCodes?.msport || slip.bookingCode}</span>
                      {copiedKey === `msport_${slip.id}` && <Check className="w-3 h-3 text-emerald-400" />}
                    </div>
                  </button>

                  {/* Football.com */}
                  <button
                    onClick={() =>
                      handleCopy(`fcom_${slip.id}`, slip.convertedCodes?.footballcom || slip.bookingCode)
                    }
                    className="bg-[#090a0e] hover:bg-[#181a24] border border-[#22242d] p-1.5 rounded text-left transition-colors cursor-pointer"
                  >
                    <div className="text-[9px] font-bold text-sky-400 uppercase">Football.com</div>
                    <div className="font-bold text-white text-[11px] truncate flex items-center justify-between">
                      <span>{slip.convertedCodes?.footballcom || slip.bookingCode}</span>
                      {copiedKey === `fcom_${slip.id}` && <Check className="w-3 h-3 text-emerald-400" />}
                    </div>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Share Slip Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#121319] border border-yellow-400/40 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="bg-[#0e0f14] border-b border-[#22242d] px-6 py-4 flex items-center justify-between">
              <h3 className="text-base font-extrabold text-white uppercase">Share Your Accumulator Slip</h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePublishSlip} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Slip Headline *
                </label>
                <input
                  type="text"
                  value={slipTitle}
                  onChange={(e) => setSlipTitle(e.target.value)}
                  placeholder="e.g. 5-Fold Premier League Weekend Special"
                  className="w-full bg-[#090a0e] border border-[#22242d] rounded-lg px-3 py-2 text-sm text-white focus:border-yellow-400 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Bookmaker *
                  </label>
                  <select
                    value={slipBookmaker}
                    onChange={(e) => setSlipBookmaker(e.target.value as any)}
                    className="w-full bg-[#090a0e] border border-[#22242d] rounded-lg px-3 py-2 text-xs text-white focus:border-yellow-400 outline-none"
                  >
                    <option value="SportyBet">SportyBet</option>
                    <option value="Bet9ja">Bet9ja</option>
                    <option value="MSport">MSport</option>
                    <option value="Football.com">Football.com</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Booking Code *
                  </label>
                  <input
                    type="text"
                    value={slipCode}
                    onChange={(e) => setSlipCode(e.target.value)}
                    placeholder="e.g. SB-10928"
                    className="w-full bg-[#090a0e] border border-[#22242d] rounded-lg px-3 py-2 text-sm font-mono-sport text-yellow-400 uppercase font-bold focus:border-yellow-400 outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Total Odds *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={slipTotalOdds}
                  onChange={(e) => setSlipTotalOdds(e.target.value)}
                  placeholder="2.85"
                  className="w-full bg-[#090a0e] border border-[#22242d] rounded-lg px-3 py-2 text-sm font-mono-sport text-white focus:border-yellow-400 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Short Description &amp; Rationale
                </label>
                <textarea
                  rows={2}
                  value={slipDesc}
                  onChange={(e) => setSlipDesc(e.target.value)}
                  placeholder="Why do you back these games? (e.g. High scoring defenses, solid home form)"
                  className="w-full bg-[#090a0e] border border-[#22242d] rounded-lg p-2.5 text-xs text-slate-200 focus:border-yellow-400 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowShareModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sharing}
                  className="bg-yellow-400 hover:bg-yellow-300 text-black font-black px-5 py-2 rounded-lg text-xs cursor-pointer shadow-md"
                >
                  {sharing ? 'Publishing...' : 'Share To Market'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
