'use client';

import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import TeamLogo from './TeamLogo';
import type { TeamLeaderboard } from '@/types/database';

interface ExpandableBarChartProps {
  data: TeamLeaderboard[];
  title: string;
  dataKey: string;
  unit?: string;
}

export default function ExpandableBarChart({
  data,
  title,
  dataKey,
  unit = ''
}: ExpandableBarChartProps) {
  const [expanded, setExpanded] = useState(false);
  const displayData = expanded ? data : data.slice(0, 10);

  // Calculate dynamic height: 40px per bar for better spacing
  const chartHeight = expanded ? Math.max(displayData.length * 40, 400) : 400;

  console.log(`${title} - Data:`, displayData);
  console.log(`${title} - First item:`, displayData[0]);

  const formatNumber = (num: number) => {
    return num.toLocaleString('en-US');
  };

  const renderLabel = (props: any) => {
    const { x, y, width, height, value } = props;
    const formattedValue = `${formatNumber(value)}${unit}`;
    
    // Estimate label width (rough approximation: 7px per character)
    const labelWidth = formattedValue.length * 7;
    
    // If bar is too narrow (less than label width + padding), display outside
    const isNarrow = width < labelWidth + 20;
    
    if (isNarrow) {
      return (
        <text
          x={x + width + 5}
          y={y + height / 2}
          fill="#374151"
          textAnchor="start"
          dominantBaseline="middle"
          fontSize="12"
          fontWeight="bold"
        >
          {formattedValue}
        </text>
      );
    }
    
    return (
      <text
        x={x + width - 5}
        y={y + height / 2}
        fill="#fff"
        textAnchor="end"
        dominantBaseline="middle"
        fontSize="12"
        fontWeight="bold"
      >
        {formattedValue}
      </text>
    );
  };

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <div className="text-center text-gray-500 py-8">
          No data available for this week
        </div>
      </div>
    );
  }

  const CustomYAxisTick = (props: any) => {
    const { x, y, payload } = props;
    const team = data.find(d => d.team === payload.value);

    if (!team) return null;

    // If logo exists (could be team logo or player headshot), display it
    if (team.team_logo_espn) {
      const isPlayerHeadshot = team.team_name?.includes('(');
      return (
        <g transform={`translate(${x},${y})`}>
          <foreignObject x={-40} y={-16} width={32} height={32}>
            <div style={{ 
              width: '32px', 
              height: '32px', 
              borderRadius: isPlayerHeadshot ? '50%' : '0',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#f3f4f6'
            }}>
              <img
                src={team.team_logo_espn}
                alt={team.team_name || team.team}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
                onError={(e) => {
                  // Fallback to text if image fails
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            </div>
          </foreignObject>
        </g>
      );
    }

    // If no logo (fallback for player mode), just display the name
    if (team.team_name && team.team_name.includes('(')) {
      return (
        <g transform={`translate(${x},${y})`}>
          <text x={-5} y={0} textAnchor="end" fontSize="12" fill="#374151" fontWeight="500">
            {team.team_name}
          </text>
        </g>
      );
    }

    return (
      <g transform={`translate(${x},${y})`}>
        <foreignObject x={-40} y={-16} width={32} height={32}>
          <TeamLogo
            src={team.team_logo_espn}
            alt={team.team_name || team.team}
            teamAbbr={team.team}
            teamColor={team.team_color}
            size={24}
          />
        </foreignObject>
      </g>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        {data.length > 10 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            {expanded ? 'Show Less' : 'View All'}
          </button>
        )}
      </div>

      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart
          data={displayData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: data[0]?.team_logo_espn ? 50 : 150, bottom: 5 }}
          barCategoryGap="20%"
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            type="number"
            domain={[0, 'dataMax']}
          />
          <YAxis 
            dataKey="team" 
            type="category"
            tick={<CustomYAxisTick />}
            width={data[0]?.team_logo_espn ? 50 : 150}
          />
          <Tooltip 
            formatter={(value: number | undefined) => value !== undefined ? [`${formatNumber(value)}${unit}`, dataKey] : ['-', dataKey]}
            labelFormatter={(label) => {
              const team = data.find(d => d.team === label);
              return team?.team_name || label;
            }}
          />
          <Bar 
            dataKey="value"
            fill="#3b82f6"
            isAnimationActive={false}
            minPointSize={5}
            label={renderLabel}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
