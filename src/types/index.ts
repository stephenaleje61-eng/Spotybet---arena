export interface User {
  id: string;
  email: string;
  username: string;
  role: 'admin' | 'user';
  isVerified: boolean;
  avatar?: string;
  favoriteTeam?: string;
  favoriteBookmaker?: 'Bet9ja' | 'SportyBet' | 'MSport' | 'Football.com' | 'Other';
  bio?: string;
  reputation: number;
  createdAt: string;
  updatedAt: string;
}

export interface SafePick {
  id: string;
  title: string;
  match: string;
  league: string;
  matchDate: string;
  pick: string;
  market: string;
  odds: number;
  bookmaker: 'Bet9ja' | 'SportyBet' | 'MSport' | 'Football.com' | 'Multi';
  confidenceScore: number;
  analysis: string;
  factors: string[];
  status: 'pending' | 'won' | 'lost' | 'void';
  bookingCodes: {
    bet9ja?: string;
    sportybet?: string;
    msport?: string;
    footballcom?: string;
  };
  authorId: string;
  authorName: string;
  isBanker: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  avatar?: string;
  role: 'admin' | 'user';
  content: string;
  bookmakerTag?: 'Bet9ja' | 'SportyBet' | 'MSport' | 'Football.com';
  timestamp: string;
  reactions: Record<string, number>;
}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  fromUsername: string;
  fromAvatar?: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'chat' | 'friend_request' | 'friend_accepted' | 'safe_pick' | 'market' | 'system';
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

export interface MarketSlip {
  id: string;
  userId: string;
  username: string;
  title: string;
  description: string;
  sourceBookmaker: 'Bet9ja' | 'SportyBet' | 'MSport' | 'Football.com';
  bookingCode: string;
  totalOdds: number;
  selectionsCount: number;
  confidenceRating: number;
  selections: Array<{
    match: string;
    league: string;
    selection: string;
    odds: number;
  }>;
  convertedCodes: {
    bet9ja?: string;
    sportybet?: string;
    msport?: string;
    footballcom?: string;
  };
  verified: boolean;
  upvotes: number;
  upvotedBy: string[];
  createdAt: string;
}

export interface FootballMatch {
  id: string;
  leagueId: string;
  leagueName: string;
  leagueCountry: string;
  leagueEmblem?: string;
  homeTeam: {
    id: string;
    name: string;
    shortName: string;
    logo?: string;
  };
  awayTeam: {
    id: string;
    name: string;
    shortName: string;
    logo?: string;
  };
  score: {
    home: number | null;
    away: number | null;
    halftime?: { home: number | null; away: number | null };
  };
  status: 'IN_PLAY' | 'PAUSED' | 'FINISHED' | 'TIMED' | 'SCHEDULED' | 'POSTPONED' | 'CANCELLED';
  minute?: number | string;
  statusDetail?: string;
  venue?: string;
  utcDate: string;
  matchday?: number;
  events?: Array<{
    minute: number | string;
    type: 'GOAL' | 'YELLOW_CARD' | 'RED_CARD' | 'SUBSTITUTION' | 'VAR';
    team: 'home' | 'away';
    player: string;
    detail?: string;
  }>;
  odds?: {
    homeWin?: number;
    draw?: number;
    awayWin?: number;
    over15?: number;
    over25?: number;
    btts?: number;
    provider?: string;
    details?: string;
    bookmaker?: string;
  };
}

export interface MatchAnalysis {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  date: string;
  venue?: string;
  dataSourceStatus: 'live_verified' | 'data_unavailable';
  disclaimer: string;
  probabilities: {
    homeWin: number;
    draw: number;
    awayWin: number;
    over15: number;
    over25: number;
    bothTeamsToScore: number;
  };
  recentForm: {
    home: {
      form: string[];
      lastMatches: Array<{ opponent: string; score: string; result: 'W' | 'D' | 'L'; venue?: string }>;
      goalsScoredAvg: number;
      goalsConcededAvg: number;
      cleanSheetRate: number;
    };
    away: {
      form: string[];
      lastMatches: Array<{ opponent: string; score: string; result: 'W' | 'D' | 'L'; venue?: string }>;
      goalsScoredAvg: number;
      goalsConcededAvg: number;
      cleanSheetRate: number;
    };
  };
  headToHead: {
    totalMatches: number;
    homeWins: number;
    draws: number;
    awayWins: number;
    lastMeetings: Array<{ date: string; score: string; winner: string }>;
  };
  homeAwayPerformance: {
    homeAtHomeWinPct: number;
    awayAtAwayWinPct: number;
    avgHomeGoalsScored: number;
    avgAwayGoalsScored: number;
  };
  keyFactors: string[];
  recommendedSafeMarkets: Array<{
    market: string;
    selection: string;
    estimatedConfidence: number;
    rationale: string;
  }>;
}

export interface LeagueStanding {
  position: number;
  team: {
    id: string;
    name: string;
    shortName: string;
    crest?: string;
  };
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  form?: string;
}

export interface BookmakerInfo {
  id: string;
  name: string;
  websiteUrl: string;
  brandColor: string;
  secondaryColor: string;
  logoText: string;
  tagline: string;
  features: string[];
  howToLoadCode: string;
  disclaimer?: string;
  dailyBoostOdds?: number;
  activeCommunityUsers: number;
}
