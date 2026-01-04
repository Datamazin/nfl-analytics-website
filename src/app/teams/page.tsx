'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import TeamLogo from '@/components/TeamLogo';
import type { Team } from '@/types/database';

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTeams() {
      try {
        const response = await fetch('/api/teams');
        const data = await response.json();
        setTeams(data.teams);
      } catch (error) {
        console.error('Error fetching teams:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchTeams();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading teams...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">NFL Teams</h1>
          <p className="text-gray-600">Browse all NFL teams</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {teams.map((team) => (
            <Link
              key={team.team_abbr}
              href={`/teams/${team.team_abbr}`}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 flex flex-col items-center justify-center"
            >
              <TeamLogo
                src={team.team_logo_espn}
                alt={team.team_name || team.team_abbr}
                teamAbbr={team.team_abbr}
                teamColor={team.team_color}
                size={64}
                className="mb-4"
              />
              <h3 className="text-lg font-semibold text-center">{team.team_name || team.team_abbr}</h3>
              <p className="text-sm text-gray-500">{team.team_abbr}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
