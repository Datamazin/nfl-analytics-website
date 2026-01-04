'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import TeamLogo from '@/components/TeamLogo';
import TrendLineChart from '@/components/TrendLineChart';
import ChartSkeleton from '@/components/ChartSkeleton';
import type { Team, TeamStats } from '@/types/database';

export default function TeamDetailPage() {
  const params = useParams();
  const teamAbbr = params.team as string;

  const [team, setTeam] = useState<Team | null>(null);
  const [seasonTrends, setSeasonTrends] = useState<TeamStats[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<number>(2024);
  const [seasons, setSeasons] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch team info
        const teamsResponse = await fetch('/api/teams');
        const teamsData = await teamsResponse.json();
        const teamData = teamsData.teams.find((t: Team) => t.team_abbr === teamAbbr);
        setTeam(teamData);

        // Fetch available seasons
        const seasonsResponse = await fetch('/api/seasons');
        const seasonsData = await seasonsResponse.json();
        setSeasons(seasonsData.seasons);
        setSelectedSeason(seasonsData.mostRecentCompleted.season);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [teamAbbr]);

  useEffect(() => {
    if (selectedSeason && teamAbbr) {
      async function fetchSeasonTrends() {
        try {
          const response = await fetch(`/api/team-stats?season=${selectedSeason}&team=${teamAbbr}`);
          const data = await response.json();
          setSeasonTrends(data.teamStats || []);
        } catch (error) {
          console.error('Error fetching season trends:', error);
        }
      }

      fetchSeasonTrends();
    }
  }, [selectedSeason, teamAbbr]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading team data...</div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Team not found</div>
      </div>
    );
  }

  // Prepare chart data
  const yardsChartData = seasonTrends.map((stat) => ({
    week: `Week ${stat.week}`,
    'Passing Yards': stat.passing_yards || 0,
    'Rushing Yards': stat.rushing_yards || 0,
    'Total Yards': stat.total_yards || 0
  }));

  const scoringChartData = seasonTrends.map((stat) => ({
    week: `Week ${stat.week}`,
    'Points': stat.points || 0
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/teams" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
          ← Back to Teams
        </Link>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center gap-4">
            <TeamLogo
              src={team.team_logo_espn}
              alt={team.team_name || team.team_abbr}
              teamAbbr={team.team_abbr}
              teamColor={team.team_color}
              size={80}
            />
            <div>
              <h1 className="text-4xl font-bold text-gray-900">{team.team_name || team.team_abbr}</h1>
              <p className="text-gray-600">
                {team.team_conference} - {team.team_division}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <label htmlFor="season" className="block text-sm font-medium text-gray-700 mb-2">
            Select Season
          </label>
          <select
            id="season"
            value={selectedSeason}
            onChange={(e) => setSelectedSeason(parseInt(e.target.value))}
            className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            {seasons.map((season) => (
              <option key={season} value={season}>
                {season}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-8">
          {seasonTrends.length > 0 ? (
            <>
              <TrendLineChart
                data={yardsChartData}
                title="Yards Per Game Trends"
                xAxisKey="week"
                lines={[
                  { dataKey: 'Total Yards', name: 'Total Yards', color: '#3b82f6' },
                  { dataKey: 'Passing Yards', name: 'Passing Yards', color: '#10b981' },
                  { dataKey: 'Rushing Yards', name: 'Rushing Yards', color: '#f59e0b' }
                ]}
              />
              <TrendLineChart
                data={scoringChartData}
                title="Points Per Game Trends"
                xAxisKey="week"
                lines={[
                  { dataKey: 'Points', name: 'Points', color: '#ef4444' }
                ]}
              />
            </>
          ) : (
            <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
              No data available for this season
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
