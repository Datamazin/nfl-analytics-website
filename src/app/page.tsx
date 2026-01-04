'use client';

import { useEffect, useState } from 'react';
import ExpandableBarChart from '@/components/ExpandableBarChart';
import ChartSkeleton from '@/components/ChartSkeleton';
import type { TeamLeaderboard } from '@/types/database';

export default function Home() {
  const [seasons, setSeasons] = useState<number[]>([]);
  const [weeks, setWeeks] = useState<number[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<number | 'ALL' | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'team' | 'player'>('team');
  const [category, setCategory] = useState<string>('passing');

  const [chart1Data, setChart1Data] = useState<TeamLeaderboard[]>([]);
  const [chart2Data, setChart2Data] = useState<TeamLeaderboard[]>([]);
  const [chart3Data, setChart3Data] = useState<TeamLeaderboard[]>([]);
  const [chart4Data, setChart4Data] = useState<TeamLeaderboard[]>([]);
  const [chartsLoading, setChartsLoading] = useState(false);

  // Initialize: fetch seasons and most recent completed week
  useEffect(() => {
    async function initializeData() {
      try {
        const response = await fetch('/api/seasons');
        const data = await response.json();
        
        console.log('Seasons API response:', data);
        
        if (!response.ok || !data.seasons) {
          console.error('Failed to fetch seasons:', data);
          setLoading(false);
          return;
        }
        
        setSeasons(data.seasons);
        console.log('Available seasons:', data.seasons);
        
        if (data.mostRecentCompleted) {
          console.log('Most recent completed:', data.mostRecentCompleted);
          setSelectedSeason(data.mostRecentCompleted.season);
          setSelectedWeek(data.mostRecentCompleted.week);
          
          // Fetch weeks for the most recent season
          const weeksResponse = await fetch(`/api/seasons?season=${data.mostRecentCompleted.season}`);
          const weeksData = await weeksResponse.json();
          setWeeks(weeksData.weeks || []);
        } else if (data.seasons && data.seasons.length > 0) {
          // Fallback to first available season if no completed games
          const firstSeason = data.seasons[0];
          setSelectedSeason(firstSeason);
          
          const weeksResponse = await fetch(`/api/seasons?season=${firstSeason}`);
          const weeksData = await weeksResponse.json();
          setWeeks(weeksData.weeks || []);
          
          if (weeksData.weeks && weeksData.weeks.length > 0) {
            setSelectedWeek(weeksData.weeks[0]);
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error initializing data:', error);
        setLoading(false);
      }
    }
    
    initializeData();
  }, []);

  // Fetch weeks when season changes
  useEffect(() => {
    if (selectedSeason) {
      async function fetchWeeks() {
        try {
          const response = await fetch(`/api/seasons?season=${selectedSeason}`);
          const data = await response.json();
          setWeeks(data.weeks);
          
          // Reset week to first available if current selection not in new season
          if (selectedWeek && !data.weeks.includes(selectedWeek)) {
            setSelectedWeek(data.weeks[data.weeks.length - 1] || null);
          }
        } catch (error) {
          console.error('Error fetching weeks:', error);
        }
      }
      
      fetchWeeks();
    }
  }, [selectedSeason]);

  // Fetch chart data when season/week changes
  useEffect(() => {
    if (selectedSeason && selectedWeek) {
      async function fetchChartData() {
        setChartsLoading(true);
        try {
          if (viewMode === 'team') {
            const weekParam = selectedWeek === 'ALL' ? '' : `&week=${selectedWeek}`;
            
            if (category === 'passing') {
              const [passingYards, attempts, touchdowns, interceptions] = await Promise.all([
                fetch(`/api/team-stats?season=${selectedSeason}${weekParam}&stat=passing_yards&limit=32`).then(r => r.json()),
                fetch(`/api/team-stats?season=${selectedSeason}${weekParam}&stat=attempts&limit=32`).then(r => r.json()),
                fetch(`/api/team-stats?season=${selectedSeason}${weekParam}&stat=passing_tds&limit=32`).then(r => r.json()),
                fetch(`/api/team-stats?season=${selectedSeason}${weekParam}&stat=interceptions&limit=32`).then(r => r.json())
              ]);

              setChart1Data(passingYards.leaderboard || []);
              setChart2Data(attempts.leaderboard || []);
              setChart3Data(touchdowns.leaderboard || []);
              setChart4Data(interceptions.leaderboard || []);
            } else if (category === 'rushing') {
              const [rushingYards, carries, touchdowns, turnovers] = await Promise.all([
                fetch(`/api/team-stats?season=${selectedSeason}${weekParam}&stat=rushing_yards&limit=32`).then(r => r.json()),
                fetch(`/api/team-stats?season=${selectedSeason}${weekParam}&stat=carries&limit=32`).then(r => r.json()),
                fetch(`/api/team-stats?season=${selectedSeason}${weekParam}&stat=rushing_tds&limit=32`).then(r => r.json()),
                fetch(`/api/team-stats?season=${selectedSeason}${weekParam}&stat=turnovers&limit=32`).then(r => r.json())
              ]);

              setChart1Data(rushingYards.leaderboard || []);
              setChart2Data(carries.leaderboard || []);
              setChart3Data(touchdowns.leaderboard || []);
              setChart4Data(turnovers.leaderboard || []);
            } else if (category === 'receiving') {
              // Receiving category is aggregated from player stats
              const weekParam2 = selectedWeek === 'ALL' ? '' : `&week=${selectedWeek}`;
              const playerResponse = await fetch(`/api/player-stats?season=${selectedSeason}${weekParam2}`);
              const { stats: playerStats } = await playerResponse.json();

              // Aggregate receiving stats by team
              const teamReceiving = new Map<string, { receiving_yards: number; receptions: number; receiving_tds: number; targets: number }>();
              
              for (const stat of playerStats || []) {
                if (!stat.team) continue;
                if (!teamReceiving.has(stat.team)) {
                  teamReceiving.set(stat.team, { receiving_yards: 0, receptions: 0, receiving_tds: 0, targets: 0 });
                }
                const team = teamReceiving.get(stat.team)!;
                team.receiving_yards += stat.receiving_yards || 0;
                team.receptions += stat.receptions || 0;
                team.receiving_tds += stat.receiving_tds || 0;
                team.targets += stat.targets || 0;
              }

              // Fetch team info for branding
              const teamsResponse = await fetch('/api/teams');
              const { teams } = await teamsResponse.json();
              const teamsMap = new Map(teams?.map((t: any) => [t.team_abbr, t]) || []);

              const receivingYards = Array.from(teamReceiving.entries())
                .filter(([_, stats]) => stats.receiving_yards > 0)
                .sort((a, b) => b[1].receiving_yards - a[1].receiving_yards)
                .map(([team, stats]) => {
                  const teamInfo = teamsMap.get(team);
                  return {
                    team,
                    team_name: teamInfo?.team_name || team,
                    team_logo_espn: teamInfo?.team_logo_espn,
                    team_color: teamInfo?.team_color,
                    value: stats.receiving_yards
                  };
                });

              const receptions = Array.from(teamReceiving.entries())
                .filter(([_, stats]) => stats.receptions > 0)
                .sort((a, b) => b[1].receptions - a[1].receptions)
                .map(([team, stats]) => {
                  const teamInfo = teamsMap.get(team);
                  return {
                    team,
                    team_name: teamInfo?.team_name || team,
                    team_logo_espn: teamInfo?.team_logo_espn,
                    team_color: teamInfo?.team_color,
                    value: stats.receptions
                  };
                });

              const receivingTds = Array.from(teamReceiving.entries())
                .filter(([_, stats]) => stats.receiving_tds > 0)
                .sort((a, b) => b[1].receiving_tds - a[1].receiving_tds)
                .map(([team, stats]) => {
                  const teamInfo = teamsMap.get(team);
                  return {
                    team,
                    team_name: teamInfo?.team_name || team,
                    team_logo_espn: teamInfo?.team_logo_espn,
                    team_color: teamInfo?.team_color,
                    value: stats.receiving_tds
                  };
                });

              const targets = Array.from(teamReceiving.entries())
                .filter(([_, stats]) => stats.targets > 0)
                .sort((a, b) => b[1].targets - a[1].targets)
                .map(([team, stats]) => {
                  const teamInfo = teamsMap.get(team);
                  return {
                    team,
                    team_name: teamInfo?.team_name || team,
                    team_logo_espn: teamInfo?.team_logo_espn,
                    team_color: teamInfo?.team_color,
                    value: stats.targets
                  };
                });

              setChart1Data(receivingYards);
              setChart2Data(receptions);
              setChart3Data(receivingTds);
              setChart4Data(targets);
            } else {
              // Default/other categories - show original stats
              const [totalYards, points, passingYards, rushingYards] = await Promise.all([
                fetch(`/api/team-stats?season=${selectedSeason}${weekParam}&stat=total_yards&limit=32`).then(r => r.json()),
                fetch(`/api/team-stats?season=${selectedSeason}${weekParam}&stat=points&limit=32`).then(r => r.json()),
                fetch(`/api/team-stats?season=${selectedSeason}${weekParam}&stat=passing_yards&limit=32`).then(r => r.json()),
                fetch(`/api/team-stats?season=${selectedSeason}${weekParam}&stat=rushing_yards&limit=32`).then(r => r.json())
              ]);

              setChart1Data(totalYards.leaderboard || []);
              setChart2Data(points.leaderboard || []);
              setChart3Data(passingYards.leaderboard || []);
              setChart4Data(rushingYards.leaderboard || []);
            }
          } else {
            // Player mode
            const weekParam = selectedWeek === 'ALL' ? '' : `&week=${selectedWeek}`;
            const response = await fetch(`/api/player-stats?season=${selectedSeason}${weekParam}`);
            const { playerStats } = await response.json();

            // Fetch player details to get ESPN IDs for headshots
            console.log('Fetching players for headshots...');
            const playersResponse = await fetch('/api/players');
            const { players } = await playersResponse.json();
            console.log('Players response:', players?.length, 'players');
            console.log('Sample player:', players?.[0]);
            const playersMap = new Map(players?.map((p: any) => [p.player_name, p]) || []);
            console.log('Players map size:', playersMap.size);

            // If ALL weeks, aggregate stats by player
            let processedStats = playerStats || [];
            if (selectedWeek === 'ALL') {
              const playerTotals = new Map<string, any>();
              
              for (const stat of processedStats) {
                const key = `${stat.player_name}-${stat.team}`;
                if (!playerTotals.has(key)) {
                  playerTotals.set(key, {
                    player_id: stat.player_id,
                    player_name: stat.player_name,
                    team: stat.team,
                    passing_yards: 0,
                    rushing_yards: 0,
                    receiving_yards: 0,
                    attempts: 0,
                    carries: 0,
                    passing_tds: 0,
                    rushing_tds: 0,
                    receiving_tds: 0,
                    interceptions: 0,
                    receptions: 0,
                    targets: 0
                  });
                }
                
                const totals = playerTotals.get(key);
                totals.passing_yards += stat.passing_yards || 0;
                totals.rushing_yards += stat.rushing_yards || 0;
                totals.receiving_yards += stat.receiving_yards || 0;
                totals.attempts += stat.attempts || 0;
                totals.carries += stat.carries || 0;
                totals.passing_tds += stat.passing_tds || 0;
                totals.rushing_tds += stat.rushing_tds || 0;
                totals.receiving_tds += stat.receiving_tds || 0;
                totals.interceptions += stat.interceptions || 0;
                totals.receptions += stat.receptions || 0;
                totals.targets += stat.targets || 0;
              }
              
              processedStats = Array.from(playerTotals.values());
            }

            // Helper function to get player headshot URL
            const getHeadshot = (playerName: string) => {
              const player = playersMap.get(playerName) as any;
              console.log(`Looking for headshot for ${playerName}:`, player);
              if (player?.espn_id) {
                const url = `https://a.espncdn.com/i/headshots/nfl/players/full/${player.espn_id}.png`;
                console.log('Headshot URL:', url);
                return url;
              }
              console.log(`No ESPN ID found for ${playerName}`);
              return null;
            };

            // Process player stats for charts
            if (category === 'passing') {
              const passingYards = processedStats
                .filter((p: any) => p.passing_yards && p.passing_yards > 0)
                .sort((a: any, b: any) => (b.passing_yards || 0) - (a.passing_yards || 0))
                .map((p: any) => ({
                  team: p.player_name,
                  team_name: `${p.player_name} (${p.team})`,
                  team_logo_espn: getHeadshot(p.player_name),
                  team_color: null,
                  value: p.passing_yards
                }));

              const attempts = processedStats
                .filter((p: any) => p.attempts && p.attempts > 0)
                .sort((a: any, b: any) => (b.attempts || 0) - (a.attempts || 0))
                .map((p: any) => ({
                  team: p.player_name,
                  team_name: `${p.player_name} (${p.team})`,
                  team_logo_espn: getHeadshot(p.player_name),
                  team_color: null,
                  value: p.attempts
                }));

              const touchdowns = processedStats
                .filter((p: any) => p.passing_tds && p.passing_tds > 0)
                .sort((a: any, b: any) => (b.passing_tds || 0) - (a.passing_tds || 0))
                .map((p: any) => ({
                  team: p.player_name,
                  team_name: `${p.player_name} (${p.team})`,
                  team_logo_espn: getHeadshot(p.player_name),
                  team_color: null,
                  value: p.passing_tds
                }));

              const interceptions = processedStats
                .filter((p: any) => p.interceptions && p.interceptions > 0)
                .sort((a: any, b: any) => (b.interceptions || 0) - (a.interceptions || 0))
                .map((p: any) => ({
                  team: p.player_name,
                  team_name: `${p.player_name} (${p.team})`,
                  team_logo_espn: getHeadshot(p.player_name),
                  team_color: null,
                  value: p.interceptions
                }));

              setChart1Data(passingYards);
              setChart2Data(attempts);
              setChart3Data(touchdowns);
              setChart4Data(interceptions);
            } else if (category === 'rushing') {
              const rushingYards = processedStats
                .filter((p: any) => p.rushing_yards && p.rushing_yards > 0)
                .sort((a: any, b: any) => (b.rushing_yards || 0) - (a.rushing_yards || 0))
                .map((p: any) => ({
                  team: p.player_name,
                  team_name: `${p.player_name} (${p.team})`,
                  team_logo_espn: getHeadshot(p.player_name),
                  team_color: null,
                  value: p.rushing_yards
                }));

              const carries = processedStats
                .filter((p: any) => p.carries && p.carries > 0)
                .sort((a: any, b: any) => (b.carries || 0) - (a.carries || 0))
                .map((p: any) => ({
                  team: p.player_name,
                  team_name: `${p.player_name} (${p.team})`,
                  team_logo_espn: getHeadshot(p.player_name),
                  team_color: null,
                  value: p.carries
                }));

              const touchdowns = processedStats
                .filter((p: any) => p.rushing_tds && p.rushing_tds > 0)
                .sort((a: any, b: any) => (b.rushing_tds || 0) - (a.rushing_tds || 0))
                .map((p: any) => ({
                  team: p.player_name,
                  team_name: `${p.player_name} (${p.team})`,
                  team_logo_espn: getHeadshot(p.player_name),
                  team_color: null,
                  value: p.rushing_tds
                }));

              // Note: Turnovers are team-level stats, not available per player
              // Showing empty for player mode
              setChart1Data(rushingYards);
              setChart2Data(carries);
              setChart3Data(touchdowns);
              setChart4Data([]);
            } else if (category === 'receiving') {
              const receivingYards = processedStats
                .filter((p: any) => p.receiving_yards && p.receiving_yards > 0)
                .sort((a: any, b: any) => (b.receiving_yards || 0) - (a.receiving_yards || 0))
                .map((p: any) => ({
                  team: p.player_name,
                  team_name: `${p.player_name} (${p.team})`,
                  team_logo_espn: getHeadshot(p.player_name),
                  team_color: null,
                  value: p.receiving_yards
                }));

              const receptions = processedStats
                .filter((p: any) => p.receptions && p.receptions > 0)
                .sort((a: any, b: any) => (b.receptions || 0) - (a.receptions || 0))
                .map((p: any) => ({
                  team: p.player_name,
                  team_name: `${p.player_name} (${p.team})`,
                  team_logo_espn: getHeadshot(p.player_name),
                  team_color: null,
                  value: p.receptions
                }));

              const touchdowns = processedStats
                .filter((p: any) => p.receiving_tds && p.receiving_tds > 0)
                .sort((a: any, b: any) => (b.receiving_tds || 0) - (a.receiving_tds || 0))
                .map((p: any) => ({
                  team: p.player_name,
                  team_name: `${p.player_name} (${p.team})`,
                  team_logo_espn: getHeadshot(p.player_name),
                  team_color: null,
                  value: p.receiving_tds
                }));

              const targets = processedStats
                .filter((p: any) => p.targets && p.targets > 0)
                .sort((a: any, b: any) => (b.targets || 0) - (a.targets || 0))
                .map((p: any) => ({
                  team: p.player_name,
                  team_name: `${p.player_name} (${p.team})`,
                  team_logo_espn: getHeadshot(p.player_name),
                  team_color: null,
                  value: p.targets
                }));

              setChart1Data(receivingYards);
              setChart2Data(receptions);
              setChart3Data(touchdowns);
              setChart4Data(targets);
            } else {
              // Default - other categories
              const passingLeaders = processedStats
                .filter((p: any) => p.passing_yards && p.passing_yards > 0)
                .sort((a: any, b: any) => (b.passing_yards || 0) - (a.passing_yards || 0))
                .map((p: any) => ({
                  team: p.player_name,
                  team_name: `${p.player_name} (${p.team})`,
                  team_logo_espn: getHeadshot(p.player_name),
                  team_color: null,
                  value: p.passing_yards
                }));

              const rushingLeaders = processedStats
                .filter((p: any) => p.rushing_yards && p.rushing_yards > 0)
                .sort((a: any, b: any) => (b.rushing_yards || 0) - (a.rushing_yards || 0))
                .map((p: any) => ({
                  team: p.player_name,
                  team_name: `${p.player_name} (${p.team})`,
                  team_logo_espn: getHeadshot(p.player_name),
                  team_color: null,
                  value: p.rushing_yards
                }));

              const receivingLeaders = processedStats
                .filter((p: any) => p.receiving_yards && p.receiving_yards > 0)
                .sort((a: any, b: any) => (b.receiving_yards || 0) - (a.receiving_yards || 0))
                .map((p: any) => ({
                  team: p.player_name,
                  team_name: `${p.player_name} (${p.team})`,
                  team_logo_espn: getHeadshot(p.player_name),
                  team_color: null,
                  value: p.receiving_yards
                }));

              setChart1Data(receivingLeaders);
              setChart2Data([]);
              setChart3Data(passingLeaders);
              setChart4Data(rushingLeaders);
            }
          }
        } catch (error) {
          console.error('Error fetching chart data:', error);
        } finally {
          setChartsLoading(false);
        }
      }
      
      fetchChartData();
    }
  }, [selectedSeason, selectedWeek, viewMode, category]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  // Get chart configurations based on category
  const getChartConfigs = () => {
    if (category === 'passing') {
      return [
        { data: chart1Data, title: 'Passing Yards Leaders', dataKey: 'Passing Yards', unit: ' yds' },
        { data: chart2Data, title: 'Pass Attempts Leaders', dataKey: 'Pass Attempts', unit: '' },
        { data: chart3Data, title: 'Passing Touchdowns Leaders', dataKey: 'Passing TDs', unit: '' },
        { data: chart4Data, title: 'Interceptions Leaders', dataKey: 'Interceptions', unit: '' },
      ];
    } else if (category === 'rushing') {
      return [
        { data: chart1Data, title: 'Rushing Yards Leaders', dataKey: 'Rushing Yards', unit: ' yds' },
        { data: chart2Data, title: 'Rushing Attempts Leaders', dataKey: 'Rushing Attempts', unit: '' },
        { data: chart3Data, title: 'Rushing Touchdowns Leaders', dataKey: 'Rushing TDs', unit: '' },
        { data: chart4Data, title: 'Turnovers Leaders', dataKey: 'Turnovers', unit: '' },
      ];
    } else if (category === 'receiving') {
      return [
        { data: chart1Data, title: 'Receiving Yards Leaders', dataKey: 'Receiving Yards', unit: ' yds' },
        { data: chart2Data, title: 'Receptions Leaders', dataKey: 'Receptions', unit: '' },
        { data: chart3Data, title: 'Receiving Touchdowns Leaders', dataKey: 'Receiving TDs', unit: '' },
        { data: chart4Data, title: 'Targets Leaders', dataKey: 'Targets', unit: '' },
      ];
    } else {
      // Default/other categories
      return [
        { data: chart1Data, title: 'Total Yards Leaders', dataKey: 'Total Yards', unit: ' yds' },
        { data: chart2Data, title: 'Points Scored Leaders', dataKey: 'Points', unit: ' pts' },
        { data: chart3Data, title: 'Passing Yards Leaders', dataKey: 'Passing Yards', unit: ' yds' },
        { data: chart4Data, title: 'Rushing Yards Leaders', dataKey: 'Rushing Yards', unit: ' yds' },
      ];
    }
  };

  const chartConfigs = getChartConfigs();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">NFL Analytics Dashboard</h1>
          <p className="text-gray-600">Weekly team performance and statistics</p>
        </div>

        {/* Category Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px overflow-x-auto">
              {[
                { id: 'passing', label: 'Passing' },
                { id: 'rushing', label: 'Rushing' },
                { id: 'receiving', label: 'Receiving' },
                { id: 'scoring', label: 'Scoring' },
                { id: 'defense', label: 'Defense' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    category === cat.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Season and Week Selectors */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label htmlFor="season" className="block text-sm font-medium text-gray-700 mb-2">
                Season
              </label>
              <select
                id="season"
                value={selectedSeason || ''}
                onChange={(e) => setSelectedSeason(parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                {seasons.map((season) => (
                  <option key={season} value={season}>
                    {season}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <label htmlFor="week" className="block text-sm font-medium text-gray-700 mb-2">
                Week
              </label>
              <select
                id="week"
                value={selectedWeek || ''}
                onChange={(e) => setSelectedWeek(e.target.value === 'ALL' ? 'ALL' : parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="ALL">All Weeks</option>
                {weeks.map((week) => (
                  <option key={week} value={week}>
                    Week {week}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <label htmlFor="viewMode" className="block text-sm font-medium text-gray-700 mb-2">
                View By
              </label>
              <select
                id="viewMode"
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value as 'team' | 'player')}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="team">Team</option>
                <option value="player">Player</option>
              </select>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {chartsLoading ? (
            <>
              <ChartSkeleton />
              <ChartSkeleton />
              <ChartSkeleton />
              {chartConfigs.length > 3 && <ChartSkeleton />}
            </>
          ) : (
            <>
              {chartConfigs.map((config, index) => (
                <ExpandableBarChart
                  key={index}
                  data={config.data}
                  title={config.title}
                  dataKey={config.dataKey}
                  unit={config.unit}
                />
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
