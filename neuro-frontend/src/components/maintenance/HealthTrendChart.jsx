import React, { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Activity, Disc, Battery, Gauge } from 'lucide-react';

const COLORS = {
  Overall: '#a855f7', // purple-500
  Engine: '#ef4444',  // red-500
  Tires: '#3b82f6',   // blue-500
  Battery: '#22c55e'  // green-500
};

const ICONS = {
  Overall: Activity,
  Engine: Gauge,
  Tires: Disc,
  Battery: Battery
};

const HealthTrendChart = ({ trendData, title = "Health Trends" }) => {
  const [visibleLines, setVisibleLines] = useState({
    Overall: true,
    Engine: true,
    Tires: true,
    Battery: true
  });

  // Merge and format data
  const chartData = useMemo(() => {
    if (!trendData) return [];

    // Case 1: Already an array of unified objects
    if (Array.isArray(trendData)) {
      return trendData;
    }

    // Case 2: DTO structure with separate arrays
    const mergedData = {};
    
    // Helper to process a specific trend list
    const processTrendList = (list, key) => {
      if (!list) return;
      list.forEach(point => {
        const date = point.date || point.recordDate; // Handle potential naming diffs
        if (!date) return;
        
        if (!mergedData[date]) {
          mergedData[date] = { date };
        }
        mergedData[date][key] = point.value;
      });
    };

    processTrendList(trendData.overallHealthTrend, 'Overall');
    processTrendList(trendData.engineHealthTrend, 'Engine');
    processTrendList(trendData.tireHealthTrend, 'Tires');
    processTrendList(trendData.batteryHealthTrend, 'Battery');

    return Object.values(mergedData).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [trendData]);

  const toggleLine = (key) => {
    setVisibleLines(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded shadow-lg">
          <p className="text-slate-300 font-medium mb-2">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <span 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-slate-400 w-16">{entry.name}:</span>
              <span className="text-white font-bold">{entry.value}%</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) {
    return (
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 h-[400px] flex items-center justify-center text-slate-400">
        No trend data available
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        
        {/* Toggle Buttons */}
        <div className="flex flex-wrap gap-2">
          {Object.keys(COLORS).map(key => {
            const Icon = ICONS[key];
            const isVisible = visibleLines[key];
            return (
              <button
                key={key}
                onClick={() => toggleLine(key)}
                className={`
                  flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                  ${isVisible 
                    ? `bg-[${COLORS[key]}]/10 text-white border border-[${COLORS[key]}]/30` 
                    : 'bg-slate-700/50 text-slate-500 border border-transparent hover:bg-slate-700'}
                `}
                style={{ 
                  backgroundColor: isVisible ? `${COLORS[key]}20` : undefined,
                  borderColor: isVisible ? `${COLORS[key]}50` : undefined,
                  color: isVisible ? COLORS[key] : undefined
                }}
              >
                <Icon className="h-3.5 w-3.5" />
                {key}
              </button>
            );
          })}
        </div>
      </div>

      <div className="h-[350px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: -10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
            <XAxis 
              dataKey="date" 
              stroke="#94a3b8" 
              tickFormatter={formatDate}
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              stroke="#94a3b8" 
              domain={[0, 100]} 
              tickFormatter={(v) => `${v}%`}
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {visibleLines.Overall && (
              <Line 
                type="monotone" 
                dataKey="Overall" 
                stroke={COLORS.Overall} 
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6 }}
              />
            )}
            {visibleLines.Engine && (
              <Line 
                type="monotone" 
                dataKey="Engine" 
                stroke={COLORS.Engine} 
                strokeWidth={2}
                dot={false}
              />
            )}
            {visibleLines.Tires && (
              <Line 
                type="monotone" 
                dataKey="Tires" 
                stroke={COLORS.Tires} 
                strokeWidth={2}
                dot={false}
              />
            )}
            {visibleLines.Battery && (
              <Line 
                type="monotone" 
                dataKey="Battery" 
                stroke={COLORS.Battery} 
                strokeWidth={2}
                dot={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default HealthTrendChart;
