// Database types matching Supabase schema

export interface PlayByPlay {
  play_id: string;
  game_id: string;
  season: number;
  week: number | null;
  game_date: string | null;
  posteam: string | null;
  defteam: string | null;
  quarter: number | null;
  time: string | null;
  down: number | null;
  ydstogo: number | null;
  yardline_100: number | null;
  play_type: string | null;
  yards_gained: number | null;
  epa: number | null;
  wp: number | null;
  wpa: number | null;
  passer_player_name: string | null;
  receiver_player_name: string | null;
  rusher_player_name: string | null;
  desc: string | null;
  score_differential: number | null;
  created_at: string;
  updated_at: string;
}

export interface PlayerStats {
  player_id: string;
  player_name: string | null;
  season: number;
  week: number | null;
  team: string | null;
  position: string | null;
  completions: number | null;
  attempts: number | null;
  passing_yards: number | null;
  passing_tds: number | null;
  interceptions: number | null;
  carries: number | null;
  rushing_yards: number | null;
  rushing_tds: number | null;
  receptions: number | null;
  receiving_yards: number | null;
  receiving_tds: number | null;
  targets: number | null;
  fantasy_points: number | null;
  fantasy_points_ppr: number | null;
  created_at: string;
  updated_at: string;
}

export interface TeamStats {
  team: string;
  season: number;
  week: number | null;
  opponent: string | null;
  completions: number | null;
  attempts: number | null;
  passing_yards: number | null;
  passing_tds: number | null;
  interceptions: number | null;
  carries: number | null;
  rushing_yards: number | null;
  rushing_tds: number | null;
  total_yards: number | null;
  turnovers: number | null;
  points: number | null;
  created_at: string;
  updated_at: string;
}

export interface Roster {
  player_id: string;
  player_name: string | null;
  season: number;
  team: string | null;
  position: string | null;
  depth_chart_position: string | null;
  jersey_number: number | null;
  status: string | null;
  height: string | null;
  weight: number | null;
  birth_date: string | null;
  college: string | null;
  created_at: string;
  updated_at: string;
}

export interface Schedule {
  game_id: string;
  season: number;
  week: number | null;
  game_type: string | null;
  game_date: string | null;
  home_team: string | null;
  away_team: string | null;
  home_score: number | null;
  away_score: number | null;
  stadium: string | null;
  location: string | null;
  roof: string | null;
  surface: string | null;
  temp: number | null;
  wind: number | null;
  created_at: string;
  updated_at: string;
}

export interface Player {
  player_id: string;
  player_name: string | null;
  position: string | null;
  height: string | null;
  weight: number | null;
  college: string | null;
  birth_date: string | null;
  draft_year: number | null;
  draft_round: number | null;
  draft_pick: number | null;
  draft_team: string | null;
  gsis_id: string | null;
  espn_id: string | null;
  yahoo_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Team {
  team_abbr: string;
  team_name: string | null;
  team_nick: string | null;
  team_color: string | null;
  team_color2: string | null;
  team_logo_espn: string | null;
  team_logo_wikipedia: string | null;
  team_conference: string | null;
  team_division: string | null;
  created_at: string;
  updated_at: string;
}

// Extended types for API responses with team data
export interface TeamStatsWithTeamInfo extends TeamStats {
  team_info?: Team;
}

export interface TeamLeaderboard {
  team: string;
  team_name: string | null;
  team_logo_espn: string | null;
  team_color: string | null;
  value: number;
}
