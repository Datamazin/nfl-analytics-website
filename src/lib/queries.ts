import { supabase } from './supabase';
import type { 
  Team, 
  TeamStats, 
  PlayerStats, 
  Schedule,
  TeamLeaderboard 
} from '@/types/database';

// Get all teams with branding info
export async function getTeams() {
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .order('team_abbr');
  
  if (error) throw error;
  return data as Team[];
}

// Get team by abbreviation
export async function getTeamByAbbr(abbr: string) {
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .eq('team_abbr', abbr)
    .single();
  
  if (error) throw error;
  return data as Team;
}

// Get distinct seasons
export async function getSeasons() {
  const { data, error } = await supabase
    .from('schedules')
    .select('season')
    .order('season', { ascending: false });
  
  if (error) throw error;
  
  const uniqueSeasons = [...new Set(data.map(d => d.season))];
  return uniqueSeasons;
}

// Get weeks for a specific season
export async function getWeeksBySeason(season: number) {
  const { data, error } = await supabase
    .from('schedules')
    .select('week')
    .eq('season', season)
    .not('week', 'is', null)
    .order('week');
  
  if (error) throw error;
  
  const uniqueWeeks = [...new Set(data.map(d => d.week))].filter(w => w !== null) as number[];
  return uniqueWeeks;
}

// Get most recent completed week (games with scores)
export async function getMostRecentCompletedWeek() {
  // First try to get completed games
  const { data: completedData, error: completedError } = await supabase
    .from('schedules')
    .select('season, week')
    .not('home_score', 'is', null)
    .not('away_score', 'is', null)
    .not('week', 'is', null)
    .order('season', { ascending: false })
    .order('week', { ascending: false })
    .limit(1)
    .maybeSingle();
  
  if (!completedError && completedData) {
    return { season: completedData.season, week: completedData.week as number };
  }
  
  // If no completed games, fall back to most recent scheduled week
  const { data: scheduledData, error: scheduledError } = await supabase
    .from('schedules')
    .select('season, week')
    .not('week', 'is', null)
    .order('season', { ascending: false })
    .order('week', { ascending: false })
    .limit(1)
    .maybeSingle();
  
  if (scheduledError) throw scheduledError;
  if (!scheduledData) throw new Error('No schedule data found');
  
  return { season: scheduledData.season, week: scheduledData.week as number };
}

// Get team stats for a specific season and week
export async function getTeamStats(season: number, week: number, limit?: number) {
  let query = supabase
    .from('team_stats')
    .select('*')
    .eq('season', season)
    .eq('week', week)
    .not('team', 'is', null);
  
  if (limit) {
    query = query.limit(limit);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  return data as TeamStats[];
}

// Get team stats with team info joined
export async function getTeamStatsWithInfo(season: number, week: number) {
  const [teamStats, teams] = await Promise.all([
    getTeamStats(season, week),
    getTeams()
  ]);
  
  const teamsMap = new Map(teams.map(t => [t.team_abbr, t]));
  
  return teamStats.map(stat => ({
    ...stat,
    team_info: teamsMap.get(stat.team)
  }));
}

// Get team leaderboard by specific stat
export async function getTeamLeaderboard(
  season: number, 
  week: number, 
  statField: keyof TeamStats,
  limit: number = 10
): Promise<TeamLeaderboard[]> {
  // First try to get from team_stats table
  const teamStatsWithInfo = await getTeamStatsWithInfo(season, week);
  
  // If we have team stats data, use it
  if (teamStatsWithInfo.length > 0) {
    return teamStatsWithInfo
      .map(stat => {
        // Calculate total_yards if it's null
        let value = stat[statField] as number;
        if (statField === 'total_yards' && (value === null || value === undefined)) {
          value = (stat.passing_yards || 0) + (stat.rushing_yards || 0);
        }
        
        return {
          team: stat.team,
          team_name: stat.team_info?.team_name || null,
          team_logo_espn: stat.team_info?.team_logo_espn || null,
          team_color: stat.team_info?.team_color || null,
          value: value || 0
        };
      })
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, limit);
  }
  
  // Fallback: aggregate from player_stats if team_stats is empty
  return await getTeamLeaderboardFromPlayerStats(season, week, statField, limit);
}

// Aggregate team stats from player stats
async function getTeamLeaderboardFromPlayerStats(
  season: number,
  week: number,
  statField: keyof TeamStats,
  limit: number
): Promise<TeamLeaderboard[]> {
  // Get all player stats for this season/week with pagination
  const allPlayerStats: any[] = [];
  const pageSize = 1000;
  let offset = 0;
  
  while (true) {
    const { data: playerStats, error } = await supabase
      .from('player_stats')
      .select('team, passing_yards, rushing_yards, receiving_yards, passing_tds, rushing_tds, receiving_tds, attempts, carries, interceptions')
      .eq('season', season)
      .eq('week', week)
      .not('team', 'is', null)
      .range(offset, offset + pageSize - 1);
    
    if (error) throw error;
    
    if (!playerStats || playerStats.length === 0) break;
    
    allPlayerStats.push(...playerStats);
    
    if (playerStats.length < pageSize) break;
    
    offset += pageSize;
  }
  
  if (allPlayerStats.length === 0) return [];
  
  // Get teams info
  const teams = await getTeams();
  const teamsMap = new Map(teams.map(t => [t.team_abbr, t]));
  
  // Aggregate by team
  const teamTotals = new Map<string, any>();
  
  for (const player of allPlayerStats) {
    const team = player.team;
    if (!teamTotals.has(team)) {
      teamTotals.set(team, {
        team,
        passing_yards: 0,
        rushing_yards: 0,
        receiving_yards: 0,
        passing_tds: 0,
        rushing_tds: 0,
        receiving_tds: 0,
        attempts: 0,
        carries: 0,
        interceptions: 0,
        points: 0
      });
    }
    
    const totals = teamTotals.get(team);
    totals.passing_yards += player.passing_yards || 0;
    totals.rushing_yards += player.rushing_yards || 0;
    totals.receiving_yards += player.receiving_yards || 0;
    totals.passing_tds += player.passing_tds || 0;
    totals.rushing_tds += player.rushing_tds || 0;
    totals.receiving_tds += player.receiving_tds || 0;
    totals.attempts += player.attempts || 0;
    totals.carries += player.carries || 0;
    totals.interceptions += player.interceptions || 0;
    // Approximate points from TDs (6 points per TD, doesn't include FGs/XPs/safeties)
    totals.points += ((player.passing_tds || 0) + (player.rushing_tds || 0) + (player.receiving_tds || 0)) * 6;
  }
  
  // Convert to leaderboard format
  const leaderboard: TeamLeaderboard[] = [];
  
  for (const [team, totals] of teamTotals) {
    let value = 0;
    
    switch (statField) {
      case 'passing_yards':
        value = totals.passing_yards;
        break;
      case 'rushing_yards':
        value = totals.rushing_yards;
        break;
      case 'total_yards':
        value = totals.passing_yards + totals.rushing_yards + totals.receiving_yards;
        break;
      case 'passing_tds':
        value = totals.passing_tds;
        break;
      case 'rushing_tds':
        value = totals.rushing_tds;
        break;
      case 'attempts':
        value = totals.attempts;
        break;
      case 'carries':
        value = totals.carries;
        break;
      case 'interceptions':
        value = totals.interceptions;
        break;
      case 'points':
        value = totals.points;
        break;
      default:
        value = 0;
    }
    
    if (value > 0) {
      const teamInfo = teamsMap.get(team);
      leaderboard.push({
        team,
        team_name: teamInfo?.team_name || null,
        team_logo_espn: teamInfo?.team_logo_espn || null,
        team_color: teamInfo?.team_color || null,
        value
      });
    }
  }
  
  return leaderboard
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

// Get team leaderboard aggregated across all weeks in a season
export async function getTeamLeaderboardAllWeeks(
  season: number,
  statField: keyof TeamStats,
  limit: number
): Promise<TeamLeaderboard[]> {
  // Get all player stats for this season with pagination (all weeks)
  const allPlayerStats: any[] = [];
  const pageSize = 1000;
  let offset = 0;
  
  while (true) {
    const { data: playerStats, error } = await supabase
      .from('player_stats')
      .select('team, passing_yards, rushing_yards, receiving_yards, passing_tds, rushing_tds, receiving_tds, attempts, carries, interceptions')
      .eq('season', season)
      .not('team', 'is', null)
      .range(offset, offset + pageSize - 1);
    
    if (error) throw error;
    
    if (!playerStats || playerStats.length === 0) break;
    
    allPlayerStats.push(...playerStats);
    
    if (playerStats.length < pageSize) break;
    
    offset += pageSize;
  }
  
  if (allPlayerStats.length === 0) return [];
  
  // Get teams info
  const teams = await getTeams();
  const teamsMap = new Map(teams.map(t => [t.team_abbr, t]));
  
  // Aggregate by team
  const teamTotals = new Map<string, any>();
  
  for (const player of allPlayerStats) {
    const team = player.team;
    if (!teamTotals.has(team)) {
      teamTotals.set(team, {
        team,
        passing_yards: 0,
        rushing_yards: 0,
        receiving_yards: 0,
        passing_tds: 0,
        rushing_tds: 0,
        receiving_tds: 0,
        attempts: 0,
        carries: 0,
        interceptions: 0,
        points: 0
      });
    }
    
    const totals = teamTotals.get(team);
    totals.passing_yards += player.passing_yards || 0;
    totals.rushing_yards += player.rushing_yards || 0;
    totals.receiving_yards += player.receiving_yards || 0;
    totals.passing_tds += player.passing_tds || 0;
    totals.rushing_tds += player.rushing_tds || 0;
    totals.receiving_tds += player.receiving_tds || 0;
    totals.attempts += player.attempts || 0;
    totals.carries += player.carries || 0;
    totals.interceptions += player.interceptions || 0;
    totals.points += ((player.passing_tds || 0) + (player.rushing_tds || 0) + (player.receiving_tds || 0)) * 6;
  }
  
  // Convert to leaderboard format
  const leaderboard: TeamLeaderboard[] = [];
  
  for (const [team, totals] of teamTotals) {
    let value = 0;
    
    switch (statField) {
      case 'passing_yards':
        value = totals.passing_yards;
        break;
      case 'rushing_yards':
        value = totals.rushing_yards;
        break;
      case 'total_yards':
        value = totals.passing_yards + totals.rushing_yards + totals.receiving_yards;
        break;
      case 'passing_tds':
        value = totals.passing_tds;
        break;
      case 'rushing_tds':
        value = totals.rushing_tds;
        break;
      case 'attempts':
        value = totals.attempts;
        break;
      case 'carries':
        value = totals.carries;
        break;
      case 'interceptions':
        value = totals.interceptions;
        break;
      case 'points':
        value = totals.points;
        break;
      default:
        value = 0;
    }
    
    if (value > 0) {
      const teamInfo = teamsMap.get(team);
      leaderboard.push({
        team,
        team_name: teamInfo?.team_name || null,
        team_logo_espn: teamInfo?.team_logo_espn || null,
        team_color: teamInfo?.team_color || null,
        value
      });
    }
  }
  
  return leaderboard
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

// Get player stats
export async function getPlayerStats(
  season: number,
  week?: number,
  position?: string,
  team?: string,
  limit?: number
) {
  // If no limit and no week (all season data), use pagination
  if (!limit && !week) {
    const allPlayerStats: any[] = [];
    const pageSize = 1000;
    let offset = 0;
    
    while (true) {
      let query = supabase
        .from('player_stats')
        .select('*')
        .eq('season', season)
        .range(offset, offset + pageSize - 1);
      
      if (position) {
        query = query.eq('position', position);
      }
      
      if (team) {
        query = query.eq('team', team);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      if (!data || data.length === 0) break;
      
      allPlayerStats.push(...data);
      
      if (data.length < pageSize) break;
      
      offset += pageSize;
    }
    
    return allPlayerStats;
  }
  
  // Regular query with optional limit
  let query = supabase
    .from('player_stats')
    .select('*')
    .eq('season', season);
  
  if (week) {
    query = query.eq('week', week);
  }
  
  if (position) {
    query = query.eq('position', position);
  }
  
  if (team) {
    query = query.eq('team', team);
  }
  
  if (limit) {
    query = query.limit(limit);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  return data as PlayerStats[];
}

// Get schedules for a season and week
export async function getSchedules(season: number, week?: number) {
  let query = supabase
    .from('schedules')
    .select('*')
    .eq('season', season)
    .order('game_date');
  
  if (week) {
    query = query.eq('week', week);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  return data as Schedule[];
}

// Get team season trends (all weeks for a season)
export async function getTeamSeasonTrends(team: string, season: number) {
  const { data, error } = await supabase
    .from('team_stats')
    .select('*')
    .eq('team', team)
    .eq('season', season)
    .not('week', 'is', null)
    .order('week');
  
  if (error) throw error;
  return data as TeamStats[];
}

// Get player season trends
export async function getPlayerSeasonTrends(playerId: string, season: number) {
  const { data, error } = await supabase
    .from('player_stats')
    .select('*')
    .eq('player_id', playerId)
    .eq('season', season)
    .not('week', 'is', null)
    .order('week');
  
  if (error) throw error;
  return data as PlayerStats[];
}
