import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const STATUS_COLORS = {
  HEALTHY: '#22c55e', // green-500
  GOOD: '#84cc16',    // lime-500
  WARNING: '#eab308', // yellow-500
  DUE: '#f97316',     // orange-500
  CRITICAL: '#ef4444' // red-500
};

const MaintenancePieChart = ({ statusDistribution }) => {
  // Transform data for Recharts
  const data = Object.entries(statusDistribution || {}).map(([name, value]) => ({
    name,
    value
  })).filter(item => item.value > 0);

  // Calculate total for percentages
  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (!data || data.length === 0) {
    return (
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 h-[300px] flex items-center justify-center text-slate-400">
        No data available
      </div>
    );
  }

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

    return (
      <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-700 p-2 rounded shadow-lg">
          <p className="text-white font-medium">{dataPoint.name}</p>
          <p className="text-slate-300">Count: {dataPoint.value}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 flex flex-col h-[400px]">
      <h3 className="text-lg font-semibold text-white mb-4">Fleet Condition</h3>
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || '#94a3b8'} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="bottom" height={36} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default MaintenancePieChart;
