import React, { useState } from 'react';
import { FootballMatch, LeagueStanding } from '../types';
import {
  Radio,
  Clock,
  Calendar,
  BarChart3,
  ChevronRight,
  AlertCircle,
  Table,
  RefreshCw,
  Trophy,
} from 'lucide-react';

interface LiveFootballCenterProps {
  matches: FootballMatch[];
  standings: { league: string; standings: LeagueStanding[] } | null;
  selectedLeague: string;
  setSelectedLeague: (league: string) => void;
  onOpenAnalysis: (matchId: string, league?: string) => void;
  isLoading: boolean;
  onRefresh: () => void;
}

export const LiveFootballCenter: React.FC<LiveFootballCenterProps> = ({
  matches,
  standings,
  selectedLeague,
  setSelectedLeague,
  onOpenAnalysis,
  isLoading,
  onRefresh,
}) => {
  const [viewMode, setViewMode] = useState<'matches' | 'standings'>('matches');
  const [filterLiveOnly, setFilterLiveOnly] = useState(false);

  const filteredMatches = matches.filter((m) => {
    if (filterLiveOnly && m.status !== 'IN_PLAY') return false;
    if (selectedLeague !== 'all' && m.leagueId.toLowerCase() !== selectedLeague.toLowerCase()) {
      return false;
    }
    return true;
  });

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Top Header & Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-yellow-400 font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-live-dot" />
              VERIFIED SPORTS-DATA FEED
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-xs text-slate-400 font-semibold">Worldwide Real-Time Fixtures</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
            LIVE FOOTBALL &amp; <span className="text-yellow-400">FIXTURES</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Real match tracking, live events, goal alerts, and comprehensive Poisson probability forecasts.
          </p>
        </div>

        {/* View Switcher & Refresh */}
        <div className="flex items-center gap-3">
          <div className="bg-[#121319] p-1 rounded-xl border border-[#22242d] flex items-center gap-1">
            <button
              onClick={() => setViewMode('matches')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'matches'
                  ? 'bg-yellow-400 text-black shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Fixtures &amp; Scores
            </button>
            <button
              onClick={() => setViewMode('standings')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'standings'
                  ? 'bg-yellow-400 text-black shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              League Tables
            </button>
          </div>

          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2 rounded-xl bg-[#121319] border border-[#22242d] text-slate-300 hover:text-yellow-400 transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh Live Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-yellow-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* League Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none text-xs">
        <button
          onClick={() => {
            setSelectedLeague('all');
            setFilterLiveOnly(false);
          }}
          className={`px-3.5 py-1.5 rounded-xl font-extrabold whitespace-nowrap transition-all cursor-pointer ${
            selectedLeague === 'all' && !filterLiveOnly
              ? 'bg-white text-black'
              : 'bg-[#121319] text-slate-400 border border-[#22242d] hover:text-white'
          }`}
        >
          All Competitions
        </button>

        <button
          onClick={() => {
            setFilterLiveOnly(!filterLiveOnly);
          }}
          className={`px-3.5 py-1.5 rounded-xl font-extrabold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            filterLiveOnly
              ? 'bg-rose-500 text-white shadow-[0_0_12px_rgba(244,63,94,0.4)]'
              : 'bg-[#121319] text-rose-400 border border-rose-500/30 hover:bg-rose-500/10'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-rose-400 animate-live-dot" />
          <span>🔴 In-Play Now</span>
        </button>

        <button
          onClick={() => {
            setSelectedLeague('PL');
            setFilterLiveOnly(false);
          }}
          className={`px-3.5 py-1.5 rounded-xl font-extrabold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            selectedLeague === 'PL'
              ? 'bg-yellow-400 text-black'
              : 'bg-[#121319] text-slate-400 border border-[#22242d] hover:text-white'
          }`}
        >
          <span>🏴󠁧󠁢󠁥󠁮󠁧󠁿</span> Premier League
        </button>

        <button
          onClick={() => {
            setSelectedLeague('CL');
            setFilterLiveOnly(false);
          }}
          className={`px-3.5 py-1.5 rounded-xl font-extrabold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            selectedLeague === 'CL'
              ? 'bg-yellow-400 text-black'
              : 'bg-[#121319] text-slate-400 border border-[#22242d] hover:text-white'
          }`}
        >
          <span>🇪🇺</span> Champions League
        </button>

        <button
          onClick={() => {
            setSelectedLeague('PD');
            setFilterLiveOnly(false);
          }}
          className={`px-3.5 py-1.5 rounded-xl font-extrabold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            selectedLeague === 'PD'
              ? 'bg-yellow-400 text-black'
              : 'bg-[#121319] text-slate-400 border border-[#22242d] hover:text-white'
          }`}
        >
          <span>🇪🇸</span> La Liga
        </button>

        <button
          onClick={() => {
            setSelectedLeague('SA');
            setFilterLiveOnly(false);
          }}
          className={`px-3.5 py-1.5 rounded-xl font-extrabold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            selectedLeague === 'SA'
              ? 'bg-yellow-400 text-black'
              : 'bg-[#121319] text-slate-400 border border-[#22242d] hover:text-white'
          }`}
        >
          <span>🇮🇹</span> Serie A
        </button>

        <button
          onClick={() => {
            setSelectedLeague('BL1');
            setFilterLiveOnly(false);
          }}
          className={`px-3.5 py-1.5 rounded-xl font-extrabold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            selectedLeague === 'BL1'
              ? 'bg-yellow-400 text-black'
              : 'bg-[#121319] text-slate-400 border border-[#22242d] hover:text-white'
          }`}
        >
          <span>🇩🇪</span> Bundesliga
        </button>

        <button
          onClick={() => {
            setSelectedLeague('FL1');
            setFilterLiveOnly(false);
          }}
          className={`px-3.5 py-1.5 rounded-xl font-extrabold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            selectedLeague === 'FL1'
              ? 'bg-yellow-400 text-black'
              : 'bg-[#121319] text-slate-400 border border-[#22242d] hover:text-white'
          }`}
        >
          <span>🇫🇷</span> Ligue 1
        </button>

        <button
          onClick={() => {
            setSelectedLeague('EL');
            setFilterLiveOnly(false);
          }}
          className={`px-3.5 py-1.5 rounded-xl font-extrabold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            selectedLeague === 'EL'
              ? 'bg-yellow-400 text-black'
              : 'bg-[#121319] text-slate-400 border border-[#22242d] hover:text-white'
          }`}
        >
          <span>🇪🇺</span> Europa League
        </button>
      </div>

      {/* Main Content Area */}
      {viewMode === 'matches' ? (
        filteredMatches.length === 0 ? (
          <div className="bg-[#121319] border border-[#22242d] rounded-2xl p-8 text-center">
            <AlertCircle className="w-10 h-10 text-slate-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white">No Matches Found</h3>
            <p className="text-xs text-slate-400 mt-1">
              There are no fixtures currently matching the selected filter. Try selecting &quot;All Competitions&quot;.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredMatches.map((m) => {
              const isLive = m.status === 'IN_PLAY';
              const isFinished = m.status === 'FINISHED';

              return (
                <div
                  key={m.id}
                  className={`bg-[#121319] border ${
                    isLive ? 'border-yellow-400/50 shadow-[0_0_15px_rgba(250,204,21,0.1)]' : 'border-[#22242d]'
                  } rounded-2xl p-4 sm:p-5 transition-all hover:border-slate-600 flex flex-col justify-between`}
                >
                  <div>
                    {/* Header: Competition & Status */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="text-sm">{m.leagueEmblem || '⚽'}</span>
                        <span className="font-extrabold text-white uppercase text-[11px]">
                          {m.leagueName}
                        </span>
                      </div>

                      {/* Status indicator */}
                      <div>
                        {isLive ? (
                          <span className="flex items-center gap-1.5 text-xs font-black font-mono-sport text-rose-400 bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 rounded-md">
                            <span className="w-2 h-2 rounded-full bg-rose-500 animate-live-dot" />
                            LIVE {m.minute ? `${m.minute}'` : 'IN-PLAY'}
                          </span>
                        ) : isFinished ? (
                          <span className="text-[11px] font-bold font-mono-sport text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded-md">
                            FT · FINISHED
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 font-mono-sport">
                            <Clock className="w-3 h-3 text-slate-500" />
                            {new Date(m.utcDate).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Scoreboard line */}
                    <div className="bg-[#090a0e] border border-[#1e202c] rounded-xl p-3.5 mb-3 flex items-center justify-between">
                      {/* Home Team */}
                      <div className="flex-1 flex items-center gap-2.5">
                        <span className="text-xl sm:text-2xl">{m.homeTeam.logo || '⚽'}</span>
                        <div>
                          <div className="text-sm sm:text-base font-extrabold text-white truncate max-w-[130px] sm:max-w-[160px]">
                            {m.homeTeam.name}
                          </div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase">
                            {m.homeTeam.shortName} · Home
                          </div>
                        </div>
                      </div>

                      {/* Score or VS */}
                      <div className="px-3 text-center shrink-0">
                        {m.score.home !== null && m.score.away !== null ? (
                          <div>
                            <div className="text-2xl sm:text-3xl font-black font-mono-sport text-yellow-400 tracking-wider">
                              {m.score.home} - {m.score.away}
                            </div>
                            {m.score.halftime && m.score.halftime.home !== null && m.score.halftime.away !== null && (
                              <div className="text-[10px] text-slate-400 font-mono-sport">
                                HT {m.score.halftime.home} - {m.score.halftime.away}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm font-extrabold text-slate-500 font-mono-sport">
                            VS
                          </div>
                        )}
                      </div>

                      {/* Away Team */}
                      <div className="flex-1 flex items-center justify-end gap-2.5 text-right">
                        <div>
                          <div className="text-sm sm:text-base font-extrabold text-white truncate max-w-[130px] sm:max-w-[160px]">
                            {m.awayTeam.name}
                          </div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase">
                            {m.awayTeam.shortName} · Away
                          </div>
                        </div>
                        <span className="text-xl sm:text-2xl">{m.awayTeam.logo || '⚽'}</span>
                      </div>
                    </div>

                    {/* Match Events (if any) */}
                    {m.events && m.events.length > 0 && (
                      <div className="mb-3 space-y-1">
                        {m.events.slice(-2).map((ev, i) => (
                          <div
                            key={i}
                            className="text-[11px] flex items-center gap-2 text-slate-300 bg-[#0d0e14] px-2.5 py-1 rounded-md"
                          >
                            <span className="font-mono-sport font-bold text-yellow-400">{ev.minute}&apos;</span>
                            <span className="font-semibold text-white">
                              {ev.type === 'GOAL' ? '⚽ Goal!' : ev.type === 'YELLOW_CARD' ? '🟨 Card' : '🔄 Sub'}
                            </span>
                            <span className="text-slate-300 truncate">
                              {ev.player} ({ev.team === 'home' ? m.homeTeam.shortName : m.awayTeam.shortName})
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Market Odds (Consensus live feed if available) */}
                    {m.odds && (m.odds.homeWin || m.odds.details) && (
                      <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                        <div className="bg-[#090a0e] border border-[#1e202c] rounded-lg py-1.5 px-2">
                          <span className="text-[10px] text-slate-400 block font-bold">1 (Home)</span>
                          <span className="text-xs font-black text-white font-mono-sport">
                            {m.odds.homeWin ? m.odds.homeWin.toFixed(2) : (m.odds.details || '-')}
                          </span>
                        </div>
                        <div className="bg-[#090a0e] border border-[#1e202c] rounded-lg py-1.5 px-2">
                          <span className="text-[10px] text-slate-400 block font-bold">X (Draw)</span>
                          <span className="text-xs font-black text-white font-mono-sport">
                            {m.odds.draw ? m.odds.draw.toFixed(2) : '-'}
                          </span>
                        </div>
                        <div className="bg-[#090a0e] border border-[#1e202c] rounded-lg py-1.5 px-2">
                          <span className="text-[10px] text-slate-400 block font-bold">2 (Away)</span>
                          <span className="text-xs font-black text-white font-mono-sport">
                            {m.odds.awayWin ? m.odds.awayWin.toFixed(2) : '-'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Prediction Analysis Trigger */}
                  <div className="pt-2 border-t border-[#1e202c] flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-medium">
                      H2H, Poisson &amp; Form Engine
                    </span>
                    <button
                      onClick={() => onOpenAnalysis(m.id, m.leagueId)}
                      className="inline-flex items-center gap-1.5 bg-yellow-400 hover:bg-yellow-300 text-black font-extrabold text-xs px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      <BarChart3 className="w-3.5 h-3.5" />
                      <span>Deep Analysis</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* Standings View */
        <div className="bg-[#121319] border border-[#22242d] rounded-2xl p-5 overflow-x-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-black text-white uppercase flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-400" />
              <span>{standings?.league || 'League Standings'}</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono-sport">
              Updated Live from Official Records
            </span>
          </div>

          {!standings || standings.standings.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              <AlertCircle className="w-6 h-6 mx-auto mb-2 text-slate-500" />
              Data unavailable for the selected league standings.
            </div>
          ) : (
            <table className="w-full text-left text-xs text-slate-300 font-mono-sport">
              <thead>
                <tr className="border-b border-[#22242d] text-slate-400 uppercase text-[10px] font-sans">
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Club</th>
                  <th className="py-2.5 px-3 text-center">MP</th>
                  <th className="py-2.5 px-3 text-center">W</th>
                  <th className="py-2.5 px-3 text-center">D</th>
                  <th className="py-2.5 px-3 text-center">L</th>
                  <th className="py-2.5 px-3 text-center">GF</th>
                  <th className="py-2.5 px-3 text-center">GA</th>
                  <th className="py-2.5 px-3 text-center">GD</th>
                  <th className="py-2.5 px-3 text-center font-bold text-white">PTS</th>
                  <th className="py-2.5 px-3 text-center hidden md:table-cell">Form</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e202c]">
                {standings.standings.map((team) => (
                  <tr key={team.position} className="hover:bg-white/5 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-white">{team.position}</td>
                    <td className="py-2.5 px-3 font-sans font-bold text-white flex items-center gap-2">
                      <span>{team.team.crest || '⚽'}</span>
                      <span>{team.team.name}</span>
                    </td>
                    <td className="py-2.5 px-3 text-center">{team.playedGames}</td>
                    <td className="py-2.5 px-3 text-center text-emerald-400 font-bold">{team.won}</td>
                    <td className="py-2.5 px-3 text-center text-slate-400">{team.draw}</td>
                    <td className="py-2.5 px-3 text-center text-rose-400">{team.lost}</td>
                    <td className="py-2.5 px-3 text-center">{team.goalsFor}</td>
                    <td className="py-2.5 px-3 text-center">{team.goalsAgainst}</td>
                    <td className="py-2.5 px-3 text-center font-bold">{team.goalDifference > 0 ? `+${team.goalDifference}` : team.goalDifference}</td>
                    <td className="py-2.5 px-3 text-center font-black text-yellow-400 text-sm">
                      {team.points}
                    </td>
                    <td className="py-2.5 px-3 text-center hidden md:table-cell">
                      {team.form ? (
                        <div className="flex items-center justify-center gap-1">
                          {team.form.split(',').map((f, idx) => (
                            <span
                              key={idx}
                              className={`w-4 h-4 rounded text-[9px] font-black flex items-center justify-center ${
                                f === 'W'
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : f === 'D'
                                  ? 'bg-amber-500/20 text-amber-400'
                                  : 'bg-rose-500/20 text-rose-400'
                              }`}
                            >
                              {f}
                            </span>
                          ))}
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </section>
  );
};
