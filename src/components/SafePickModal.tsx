import React, { useState, useEffect } from 'react';
import { SafePick, FootballMatch } from '../types';
import { X, Sparkles, Check, AlertCircle } from 'lucide-react';

interface SafePickModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (pickData: Partial<SafePick>) => Promise<void>;
  editingPick?: SafePick | null;
  upcomingMatches?: FootballMatch[];
}

export const SafePickModal: React.FC<SafePickModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingPick,
  upcomingMatches = [],
}) => {
  const [title, setTitle] = useState('');
  const [match, setMatch] = useState('');
  const [league, setLeague] = useState('Premier League');
  const [matchDate, setMatchDate] = useState('');
  const [pick, setPick] = useState('');
  const [market, setMarket] = useState('Double Chance & Over/Under');
  const [odds, setOdds] = useState('1.50');
  const [bookmaker, setBookmaker] = useState<'Bet9ja' | 'SportyBet' | 'MSport' | 'Football.com' | 'Multi'>('Bet9ja');
  const [confidenceScore, setConfidenceScore] = useState('94');
  const [analysis, setAnalysis] = useState('');
  const [factor1, setFactor1] = useState('');
  const [factor2, setFactor2] = useState('');
  const [factor3, setFactor3] = useState('');
  const [bet9jaCode, setBet9jaCode] = useState('');
  const [sportybetCode, setSportybetCode] = useState('');
  const [msportCode, setMsportCode] = useState('');
  const [footballcomCode, setFootballcomCode] = useState('');
  const [isBanker, setIsBanker] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingPick) {
      setTitle(editingPick.title);
      setMatch(editingPick.match);
      setLeague(editingPick.league);
      setMatchDate(editingPick.matchDate ? editingPick.matchDate.slice(0, 16) : '');
      setPick(editingPick.pick);
      setMarket(editingPick.market);
      setOdds(editingPick.odds.toString());
      setBookmaker(editingPick.bookmaker);
      setConfidenceScore(editingPick.confidenceScore.toString());
      setAnalysis(editingPick.analysis);
      setFactor1(editingPick.factors[0] || '');
      setFactor2(editingPick.factors[1] || '');
      setFactor3(editingPick.factors[2] || '');
      setBet9jaCode(editingPick.bookingCodes?.bet9ja || '');
      setSportybetCode(editingPick.bookingCodes?.sportybet || '');
      setMsportCode(editingPick.bookingCodes?.msport || '');
      setFootballcomCode(editingPick.bookingCodes?.footballcom || '');
      setIsBanker(editingPick.isBanker);
    } else {
      setTitle('');
      setMatch('');
      setLeague('Premier League');
      setMatchDate(new Date(Date.now() + 3600 * 1000 * 4).toISOString().slice(0, 16));
      setPick('');
      setMarket('Double Chance & Over/Under');
      setOdds('1.50');
      setBookmaker('Bet9ja');
      setConfidenceScore('94');
      setAnalysis('');
      setFactor1('');
      setFactor2('');
      setFactor3('');
      setBet9jaCode('');
      setSportybetCode('');
      setMsportCode('');
      setFootballcomCode('');
      setIsBanker(true);
    }
    setError(null);
  }, [editingPick, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!match.trim() || !pick.trim() || !odds) {
      setError('Please fill in the Match, Pick selection, and Odds.');
      return;
    }

    setLoading(true);
    setError(null);

    const factors = [factor1, factor2, factor3].map((f) => f.trim()).filter(Boolean);

    try {
      await onSubmit({
        title: title.trim() || `${match.trim().toUpperCase()} - ARENA BANKER`,
        match: match.trim(),
        league,
        matchDate: matchDate ? new Date(matchDate).toISOString() : new Date().toISOString(),
        pick: pick.trim(),
        market: market.trim(),
        odds: parseFloat(odds) || 1.5,
        bookmaker,
        confidenceScore: parseInt(confidenceScore, 10) || 92,
        analysis: analysis.trim() || 'Statistical analysis confirms high historical win rate and defensive resilience.',
        factors: factors.length > 0 ? factors : ['Unbeaten home run', 'High xG frequency'],
        bookingCodes: {
          bet9ja: bet9jaCode.trim() || undefined,
          sportybet: sportybetCode.trim() || undefined,
          msport: msportCode.trim() || undefined,
          footballcom: footballcomCode.trim() || undefined,
        },
        isBanker,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to publish safe pick');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#121319] border border-yellow-400/40 rounded-2xl w-full max-w-2xl my-8 overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-[#0e0f14] border-b border-[#22242d] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-yellow-400 text-black flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white uppercase tracking-tight">
                {editingPick ? 'Edit Safe Pick' : 'Publish Official Safe Pick'}
              </h2>
              <p className="text-[11px] text-slate-400">
                Admin game &amp; prediction control. Published picks appear instantly worldwide.
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs p-3 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Select from Real Upcoming Fixtures */}
          {upcomingMatches && upcomingMatches.length > 0 && (
            <div className="bg-[#090a0e] border border-yellow-400/30 rounded-xl p-3">
              <label className="block text-[11px] font-bold text-yellow-400 uppercase mb-1">
                ⚡ Select from Real Upcoming Fixtures
              </label>
              <select
                onChange={(e) => {
                  const found = upcomingMatches.find((m) => m.id === e.target.value);
                  if (found) {
                    setMatch(`${found.homeTeam.name} vs ${found.awayTeam.name}`);
                    setLeague(found.leagueName);
                    setMatchDate(found.utcDate ? found.utcDate.slice(0, 16) : '');
                    setTitle(`${found.homeTeam.shortName} VS ${found.awayTeam.shortName} - VERIFIED BANKER`);
                  }
                }}
                className="w-full bg-[#121319] border border-[#22242d] rounded-lg px-3 py-2 text-xs text-white focus:border-yellow-400 outline-none"
              >
                <option value="">-- Choose from genuine league schedule --</option>
                {upcomingMatches.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.homeTeam.name} vs {m.awayTeam.name} ({m.leagueName} · {new Date(m.utcDate).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                Match Teams *
              </label>
              <input
                type="text"
                value={match}
                onChange={(e) => setMatch(e.target.value)}
                placeholder="e.g. Real Madrid vs Barcelona"
                className="w-full bg-[#090a0e] border border-[#22242d] rounded-lg px-3 py-2 text-sm text-white focus:border-yellow-400 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                League
              </label>
              <select
                value={league}
                onChange={(e) => setLeague(e.target.value)}
                className="w-full bg-[#090a0e] border border-[#22242d] rounded-lg px-3 py-2 text-sm text-white focus:border-yellow-400 outline-none"
              >
                <option value="Premier League">Premier League (England)</option>
                <option value="UEFA Champions League">UEFA Champions League</option>
                <option value="La Liga">La Liga (Spain)</option>
                <option value="Serie A">Serie A (Italy)</option>
                <option value="Bundesliga">Bundesliga (Germany)</option>
                <option value="Ligue 1">Ligue 1 (France)</option>
                <option value="Nigeria Premier Football League">NPFL (Nigeria)</option>
                <option value="Other European / World">Other International</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                Recommended Pick *
              </label>
              <input
                type="text"
                value={pick}
                onChange={(e) => setPick(e.target.value)}
                placeholder="e.g. 1X & Over 1.5 Goals"
                className="w-full bg-[#090a0e] border border-[#22242d] rounded-lg px-3 py-2 text-sm text-yellow-400 font-bold focus:border-yellow-400 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                Odds *
              </label>
              <input
                type="number"
                step="0.01"
                min="1.01"
                value={odds}
                onChange={(e) => setOdds(e.target.value)}
                placeholder="1.50"
                className="w-full bg-[#090a0e] border border-[#22242d] rounded-lg px-3 py-2 text-sm font-mono-sport text-white focus:border-yellow-400 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                Confidence %
              </label>
              <input
                type="number"
                min="50"
                max="99"
                value={confidenceScore}
                onChange={(e) => setConfidenceScore(e.target.value)}
                className="w-full bg-[#090a0e] border border-[#22242d] rounded-lg px-3 py-2 text-sm font-mono-sport text-emerald-400 font-bold focus:border-yellow-400 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
              Custom Headline Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. HIGH ACCURACY BANKER OF THE NIGHT"
              className="w-full bg-[#090a0e] border border-[#22242d] rounded-lg px-3 py-2 text-sm text-white focus:border-yellow-400 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
              Statistical Analysis &amp; Reasoning
            </label>
            <textarea
              rows={3}
              value={analysis}
              onChange={(e) => setAnalysis(e.target.value)}
              placeholder="Explain the mathematical/historical reasons: home record, xG, scoring trends, injury news, head-to-head consistency..."
              className="w-full bg-[#090a0e] border border-[#22242d] rounded-lg p-3 text-sm text-slate-200 focus:border-yellow-400 outline-none"
            />
          </div>

          {/* Key factors */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
              Key Statistical Factors (Bullet points)
            </label>
            <div className="space-y-2">
              <input
                type="text"
                value={factor1}
                onChange={(e) => setFactor1(e.target.value)}
                placeholder="Factor 1 (e.g. Unbeaten in 8 consecutive home matches)"
                className="w-full bg-[#090a0e] border border-[#22242d] rounded-lg px-3 py-1.5 text-xs text-white focus:border-yellow-400 outline-none"
              />
              <input
                type="text"
                value={factor2}
                onChange={(e) => setFactor2(e.target.value)}
                placeholder="Factor 2 (e.g. Opponent conceded 1.8 away goals per match)"
                className="w-full bg-[#090a0e] border border-[#22242d] rounded-lg px-3 py-1.5 text-xs text-white focus:border-yellow-400 outline-none"
              />
              <input
                type="text"
                value={factor3}
                onChange={(e) => setFactor3(e.target.value)}
                placeholder="Factor 3 (e.g. Head-to-head 4 of last 5 landed Over 1.5 Goals)"
                className="w-full bg-[#090a0e] border border-[#22242d] rounded-lg px-3 py-1.5 text-xs text-white focus:border-yellow-400 outline-none"
              />
            </div>
          </div>

          {/* Booking Codes */}
          <div className="bg-[#090a0e] border border-[#22242d] rounded-xl p-3.5">
            <div className="text-xs font-bold text-yellow-400 uppercase mb-2">
              Multi-Platform Booking Codes (For Users)
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-emerald-400 mb-0.5">Bet9ja Code</label>
                <input
                  type="text"
                  value={bet9jaCode}
                  onChange={(e) => setBet9jaCode(e.target.value)}
                  placeholder="B9JA-XXXXXX"
                  className="w-full bg-[#121319] border border-[#22242d] rounded px-2 py-1.5 text-xs font-mono-sport text-white focus:border-emerald-400 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-rose-400 mb-0.5">SportyBet Code</label>
                <input
                  type="text"
                  value={sportybetCode}
                  onChange={(e) => setSportybetCode(e.target.value)}
                  placeholder="SB-XXXXX"
                  className="w-full bg-[#121319] border border-[#22242d] rounded px-2 py-1.5 text-xs font-mono-sport text-white focus:border-rose-400 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-amber-400 mb-0.5">MSport Code</label>
                <input
                  type="text"
                  value={msportCode}
                  onChange={(e) => setMsportCode(e.target.value)}
                  placeholder="MS-XXXXX"
                  className="w-full bg-[#121319] border border-[#22242d] rounded px-2 py-1.5 text-xs font-mono-sport text-white focus:border-amber-400 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-sky-400 mb-0.5">Football.com Code</label>
                <input
                  type="text"
                  value={footballcomCode}
                  onChange={(e) => setFootballcomCode(e.target.value)}
                  placeholder="FC-XXXXX"
                  className="w-full bg-[#121319] border border-[#22242d] rounded px-2 py-1.5 text-xs font-mono-sport text-white focus:border-sky-400 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Banker toggle */}
          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="isBankerCheck"
              checked={isBanker}
              onChange={(e) => setIsBanker(e.target.checked)}
              className="w-4 h-4 accent-yellow-400 rounded cursor-pointer"
            />
            <label htmlFor="isBankerCheck" className="text-xs text-white font-bold cursor-pointer">
              Mark as Top Verified Banker of the Day (Gold highlight)
            </label>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#22242d]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-yellow-400 hover:bg-yellow-300 text-black font-black text-xs px-5 py-2.5 rounded-lg shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{loading ? 'Publishing...' : editingPick ? 'Save Changes' : 'Publish Instant Pick'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
