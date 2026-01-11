'use client';

import { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface TrendLineChartProps {
  data: any[];
  title: string;
  lines: {
    dataKey: string;
    name: string;
    color: string;
  }[];
  xAxisKey: string;
}

export default function TrendLineChart({
  data,
  title,
  lines,
  xAxisKey
}: TrendLineChartProps) {
  const [isMobile, setIsMobile] = useState(false);
  const timeoutIdRef = useRef<NodeJS.Timeout>();
  
  // Detect mobile viewport on mount and window resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Debounce resize handler to improve performance
    const debouncedCheckMobile = () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
      timeoutIdRef.current = setTimeout(checkMobile, 150);
    };
    
    checkMobile();
    window.addEventListener('resize', debouncedCheckMobile);
    
    return () => {
      window.removeEventListener('resize', debouncedCheckMobile);
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
    };
  }, []);

  const chartHeight = isMobile ? 300 : 400;
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      
      <ResponsiveContainer width="100%" height={chartHeight}>
        <LineChart
          data={data}
          margin={{
            top: 5,
            right: isMobile ? 10 : 30,
            left: isMobile ? 0 : 20,
            bottom: 5
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey={xAxisKey}
            tick={{ fontSize: isMobile ? 10 : 12 }}
          />
          <YAxis 
            tick={{ fontSize: isMobile ? 10 : 12 }}
          />
          <Tooltip />
          <Legend 
            wrapperStyle={{ fontSize: isMobile ? '12px' : '14px' }}
          />
          {lines.map((line) => (
            <Line
              key={line.dataKey}
              type="monotone"
              dataKey={line.dataKey}
              name={line.name}
              stroke={line.color}
              strokeWidth={isMobile ? 1.5 : 2}
              dot={{ r: isMobile ? 3 : 4 }}
              activeDot={{ r: isMobile ? 5 : 6 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
