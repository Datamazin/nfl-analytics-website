'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import TeamLogo from './TeamLogo';
import type { TeamLeaderboard } from '@/types/database';
import './ExpandableBarChart.css';

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
  const [isMobile, setIsMobile] = useState(false);
  const displayData = expanded ? data : data.slice(0, 10);

  // Detect mobile viewport on mount and window resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Calculate dynamic height: 40px per bar for better spacing on desktop, 35px on mobile
  const barHeight = isMobile ? 35 : 40;
  const minHeight = isMobile ? 300 : 400;
  const chartHeight = expanded ? Math.max(displayData.length * barHeight, minHeight) : minHeight;

  console.log(`${title} - Data:`, displayData);
  console.log(`${title} - First item:`, displayData[0]);

  const formatNumber = (num: number) => {
    return num.toLocaleString('en-US');
  };

  const renderLabel = (props: any) => {
    const { x, y, width, height, value } = props;
    const formattedValue = `${formatNumber(value)}${unit}`;
    
    // Responsive font size
    const fontSize = isMobile ? 10 : 12;
    
    // Estimate label width (rough approximation: 7px per character on desktop, 5.5px on mobile)
    const charWidth = isMobile ? 5.5 : 7;
    const labelWidth = formattedValue.length * charWidth;
    
    // If bar is too narrow (less than label width + padding), display outside
    const isNarrow = width < labelWidth + (isMobile ? 10 : 20);
    
    if (isNarrow) {
      return (
        <text
          x={x + width + 5}
          y={y + height / 2}
          fill="#374151"
          textAnchor="start"
          dominantBaseline="middle"
          fontSize={fontSize}
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
        fontSize={fontSize}
        fontWeight="bold"
      >
        {formattedValue}
      </text>
    );
  };

  // Custom Y-Axis Tick component
  // Note: We can't extract this outside because it needs access to data and isMobile
  // But Recharts expects a component/function reference, not JSX
  const renderCustomYAxisTick = (props: any) => {
    const { x, y, payload } = props;
    const team = data.find(d => d.team === payload.value);

    if (!team) return null;

    // Responsive logo size
    const logoSize = isMobile ? 24 : 32;
    const logoOffset = isMobile ? -32 : -40;

    // If logo exists (could be team logo or player headshot), display it
    if (team.team_logo_espn) {
      const isPlayerHeadshot = team.team_name?.includes('(');
      return (
        <g transform={`translate(${x},${y})`}>
          <foreignObject x={logoOffset} y={-logoSize / 2} width={logoSize} height={logoSize}>
            <div className={`logo-container ${isPlayerHeadshot ? 'logo-container-rounded' : ''}`}>
              <img
                src={team.team_logo_espn}
                alt={team.team_name || team.team}
                className="logo-image"
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
          <text x={-5} y={0} textAnchor="end" fontSize={isMobile ? 10 : 12} fill="#374151" fontWeight="500">
            {team.team_name}
          </text>
        </g>
      );
    }

    return (
      <g transform={`translate(${x},${y})`}>
        <foreignObject x={logoOffset} y={-logoSize / 2} width={logoSize} height={logoSize}>
          <TeamLogo
            src={team.team_logo_espn}
            alt={team.team_name || team.team}
            teamAbbr={team.team}
            teamColor={team.team_color}
            size={isMobile ? 20 : 24}
          />
        </foreignObject>
      </g>
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
          margin={{
            top: 5,
            right: isMobile ? 10 : 30,
            left: data[0]?.team_logo_espn ? (isMobile ? 40 : 50) : (isMobile ? 80 : 150),
            bottom: 5
          }}
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
            tick={renderCustomYAxisTick}
            width={data[0]?.team_logo_espn ? (isMobile ? 40 : 50) : (isMobile ? 80 : 150)}
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
