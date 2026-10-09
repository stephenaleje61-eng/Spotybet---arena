import React from 'react';
import { MatchAnalysis } from '../types';
import {
  X,
  TrendingUp,
  ShieldAlert,
  Percent,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  ArrowRight,
  BarChart3,
} from 'lucide-react';

interface PredictionAnalysisModalProps {
  analysis: MatchAnalysis | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PredictionAnalysisModal: React.FC<PredictionAnalysisModalProps> = ({
  analysis,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !analysis) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#121319] border border-yellow-400/40 rounded-2xl w-full max-w-3xl my-8 overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-[#0e0f14] border-b border-[#22242d] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-yellow-400 text-black flex items-center justify-center font-bold">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-yellow-400 tracking-wider">
                {analysis.league} · Real Statistical Engine
              </div>
              <h2 className="text-lg font-black text-white tracking-tight">
                {analysis.homeTeam} vs {analysis.awayTeam}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[82vh] overflow-y-auto">
          {/* CRITICAL STATISTICAL DISCLAIMER BANNER */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-200/90 leading-relaxed">
              <strong className="text-amber-300 font-extrabold uppercase">STATISTICAL DISCLAIMER:</strong>{' '}
              Predictions are purely mathematical probability estimates derived from historical goal distribution, home/away splits, and Poisson regression models. They are <strong>NOT guaranteed wins</strong>. Sports events are subject to variance, injuries, and unexpected outcomes. Gamble responsibly (18+).
            </div>
          </div>

          {/* 1. Win/Draw/Loss Probabilities */}
          <div>
            <div className="text-xs font-extrabold text-white uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Estimated Match Outcome Probabilities</span>
              <span className="text-[11px] text-yellow-400 font-mono-sport">POISSON MODEL</span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {/* Home */}
              <div className="bg-[#090a0e] border border-[#22242d] rounded-xl p-3.5 text-center">
                <div className="text-xs font-bold text-slate-300 truncate">{analysis.homeTeam} Win</div>
                <div className="text-2xl font-black text-yellow-400 font-mono-sport my-1">
                  {analysis.probabilities.homeWin}%
                </div>
                <div className="w-full bg-[#1e202c] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-yellow-400 h-full rounded-full"
                    style={{ width: `${analysis.probabilities.homeWin}%` }}
                  />
                </div>
              </div>

              {/* Draw */}
              <div className="bg-[#090a0e] border border-[#22242d] rounded-xl p-3.5 text-center">
                <div className="text-xs font-bold text-slate-300">Draw (X)</div>
                <div className="text-2xl font-black text-slate-200 font-mono-sport my-1">
                  {analysis.probabilities.draw}%
                </div>
                <div className="w-full bg-[#1e202c] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-slate-400 h-full rounded-full"
                    style={{ width: `${analysis.probabilities.draw}%` }}
                  />
                </div>
              </div>

              {/* Away */}
              <div className="bg-[#090a0e] border border-[#22242d] rounded-xl p-3.5 text-center">
                <div className="text-xs font-bold text-slate-300 truncate">{analysis.awayTeam} Win</div>
                <div className="text-2xl font-black text-white font-mono-sport my-1">
                  {analysis.probabilities.awayWin}%
                </div>
                <div className="w-full bg-[#1e202c] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-400 h-full rounded-full"
                    style={{ width: `${analysis.probabilities.awayWin}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Goal Market Probabilities */}
            <div className="grid grid-cols-3 gap-3 mt-3">
              <div className="bg-[#0e0f15] border border-[#1f212b] rounded-lg p-2.5 flex items-center justify-between">
                <span className="text-xs text-slate-400">Over 1.5 Goals</span>
                <span className="text-sm font-black text-emerald-400 font-mono-sport">
                  {analysis.probabilities.over15}%
                </span>
              </div>
              <div className="bg-[#0e0f15] border border-[#1f212b] rounded-lg p-2.5 flex items-center justify-between">
                <span className="text-xs text-slate-400">Over 2.5 Goals</span>
                <span className="text-sm font-black text-emerald-400 font-mono-sport">
                  {analysis.probabilities.over25}%
                </span>
              </div>
              <div className="bg-[#0e0f15] border border-[#1f212b] rounded-lg p-2.5 flex items-center justify-between">
                <span className="text-xs text-slate-400">Both Teams Score</span>
                <span className="text-sm font-black text-emerald-400 font-mono-sport">
                  {analysis.probabilities.bothTeamsToScore}%
                </span>
              </div>
            </div>
          </div>

          {/* 2. Recent Performance & Form Guides */}
          <div>
            <div className="text-xs font-extrabold text-white uppercase tracking-wider mb-2">
              Recent Team Performance (Last 5 Fixtures)
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Home Team Form */}
              <div className="bg-[#090a0e] border border-[#22242d] rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-black text-white">{analysis.homeTeam}</span>
                  <div className="flex items-center gap-1">
                    {analysis.recentForm.home.form.map((res, i) => (
                      <span
                        key={i}
                        className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-black ${
                          res === 'W'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : res === 'D'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                        }`}
                      >
                        {res}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs mb-3">
                  <div className="bg-[#121319] p-2 rounded">
                    <div className="text-slate-400 text-[10px]">Avg Goals</div>
                    <div className="font-bold text-white font-mono-sport">
                      {analysis.recentForm.home.goalsScoredAvg}
                    </div>
                  </div>
                  <div className="bg-[#121319] p-2 rounded">
                    <div className="text-slate-400 text-[10px]">Conceded</div>
                    <div className="font-bold text-white font-mono-sport">
                      {analysis.recentForm.home.goalsConcededAvg}
                    </div>
                  </div>
                  <div className="bg-[#121319] p-2 rounded">
                    <div className="text-slate-400 text-[10px]">Clean Sheet</div>
                    <div className="font-bold text-emerald-400 font-mono-sport">
                      {Math.round(analysis.recentForm.home.cleanSheetRate * 100)}%
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  {analysis.recentForm.home.lastMatches.map((m, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-xs py-1 border-b border-[#181a24] last:border-none text-slate-300"
                    >
                      <span>
                        vs {m.opponent} {m.venue ? `(${m.venue})` : ''}
                      </span>
                      <span className="font-mono-sport font-bold">{m.score}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Away Team Form */}
              <div className="bg-[#090a0e] border border-[#22242d] rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-black text-white">{analysis.awayTeam}</span>
                  <div className="flex items-center gap-1">
                    {analysis.recentForm.away.form.map((res, i) => (
                      <span
                        key={i}
                        className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-black ${
                          res === 'W'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : res === 'D'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                        }`}
                      >
                        {res}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs mb-3">
                  <div className="bg-[#121319] p-2 rounded">
                    <div className="text-slate-400 text-[10px]">Avg Goals</div>
                    <div className="font-bold text-white font-mono-sport">
                      {analysis.recentForm.away.goalsScoredAvg}
                    </div>
                  </div>
                  <div className="bg-[#121319] p-2 rounded">
                    <div className="text-slate-400 text-[10px]">Conceded</div>
                    <div className="font-bold text-white font-mono-sport">
                      {analysis.recentForm.away.goalsConcededAvg}
                    </div>
                  </div>
                  <div className="bg-[#121319] p-2 rounded">
                    <div className="text-slate-400 text-[10px]">Clean Sheet</div>
                    <div className="font-bold text-emerald-400 font-mono-sport">
                      {Math.round(analysis.recentForm.away.cleanSheetRate * 100)}%
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  {analysis.recentForm.away.lastMatches.map((m, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-xs py-1 border-b border-[#181a24] last:border-none text-slate-300"
                    >
                      <span>
                        vs {m.opponent} {m.venue ? `(${m.venue})` : ''}
                      </span>
                      <span className="font-mono-sport font-bold">{m.score}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 3. Head-to-Head & Home/Away Form Split */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* H2H */}
            <div className="bg-[#090a0e] border border-[#22242d] rounded-xl p-4">
              <div className="text-xs font-extrabold text-white uppercase tracking-wider mb-2">
                Head-to-Head (Last 5 Meetings)
              </div>
              <div className="flex items-center justify-around py-2 bg-[#121319] rounded-lg text-center mb-3">
                <div>
                  <div className="text-sm font-black text-yellow-400 font-mono-sport">
                    {analysis.headToHead.homeWins}
                  </div>
                  <div className="text-[10px] text-slate-400">{analysis.homeTeam}</div>
                </div>
                <div>
                  <div className="text-sm font-black text-slate-300 font-mono-sport">
                    {analysis.headToHead.draws}
                  </div>
                  <div className="text-[10px] text-slate-400">Draws</div>
                </div>
                <div>
                  <div className="text-sm font-black text-blue-400 font-mono-sport">
                    {analysis.headToHead.awayWins}
                  </div>
                  <div className="text-[10px] text-slate-400">{analysis.awayTeam}</div>
                </div>
              </div>

              <div className="space-y-1 text-xs text-slate-300">
                {analysis.headToHead.lastMeetings.map((mt, i) => (
                  <div key={i} className="flex items-center justify-between py-1 border-b border-[#181a24] last:border-none">
                    <span className="text-slate-400 text-[11px]">{mt.date}</span>
                    <span className="font-mono-sport font-bold text-white">{mt.score}</span>
                    <span className="text-[11px] text-yellow-400 font-semibold">{mt.winner}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Home/Away Venue Splits */}
            <div className="bg-[#090a0e] border border-[#22242d] rounded-xl p-4">
              <div className="text-xs font-extrabold text-white uppercase tracking-wider mb-2">
                Venue Performance Splits
              </div>
              <div className="space-y-3 mt-3">
                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>{analysis.homeTeam} Home Win Rate</span>
                    <span className="font-bold text-yellow-400 font-mono-sport">
                      {analysis.homeAwayPerformance.homeAtHomeWinPct}%
                    </span>
                  </div>
                  <div className="w-full bg-[#1e202c] h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-yellow-400 h-full rounded-full"
                      style={{ width: `${analysis.homeAwayPerformance.homeAtHomeWinPct}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>{analysis.awayTeam} Away Win Rate</span>
                    <span className="font-bold text-blue-400 font-mono-sport">
                      {analysis.homeAwayPerformance.awayAtAwayWinPct}%
                    </span>
                  </div>
                  <div className="w-full bg-[#1e202c] h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-400 h-full rounded-full"
                      style={{ width: `${analysis.homeAwayPerformance.awayAtAwayWinPct}%` }}
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-[#181a24] grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="bg-[#121319] p-2 rounded">
                    <span className="text-[10px] text-slate-400 block">Home Goals/90</span>
                    <strong className="text-white font-mono-sport">{analysis.homeAwayPerformance.avgHomeGoalsScored}</strong>
                  </div>
                  <div className="bg-[#121319] p-2 rounded">
                    <span className="text-[10px] text-slate-400 block">Away Goals/90</span>
                    <strong className="text-white font-mono-sport">{analysis.homeAwayPerformance.avgAwayGoalsScored}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Key Factors Influencing Prediction */}
          <div>
            <div className="text-xs font-extrabold text-white uppercase tracking-wider mb-2">
              Key Statistical Factors Influencing Model
            </div>
            <div className="bg-[#090a0e] border border-[#22242d] rounded-xl p-4 space-y-2">
              {analysis.keyFactors.map((factor, i) => (
                <div key={i} className="flex items-start gap-2.5 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                  <span>{factor}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 5. Recommended Safe Markets */}
          <div>
            <div className="text-xs font-extrabold text-white uppercase tracking-wider mb-2">
              Recommended Safe Markets
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {analysis.recommendedSafeMarkets.map((sm, i) => (
                <div key={i} className="bg-[#090a0e] border border-yellow-400/30 rounded-xl p-3 flex flex-col justify-between">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">{sm.market}</div>
                    <div className="text-sm font-extrabold text-yellow-400 mt-0.5">{sm.selection}</div>
                    <div className="text-[11px] text-slate-300 mt-1 leading-snug">{sm.rationale}</div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-[#1e202c] flex items-center justify-between text-xs font-mono-sport">
                    <span className="text-slate-400 text-[10px]">Confidence</span>
                    <span className="text-emerald-400 font-bold">{sm.estimatedConfidence}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#0e0f14] border-t border-[#22242d] px-6 py-3 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Source: Official League Match Record &amp; Verified Data
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-yellow-400 text-black font-extrabold text-xs hover:bg-yellow-300 cursor-pointer"
          >
            Close Analysis
          </button>
        </div>
      </div>
    </div>
  );
};
