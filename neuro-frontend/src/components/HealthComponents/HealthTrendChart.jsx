import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const HealthTrendChart = ({ trendData }) => {
  if (!trendData || !trendData.dataPoints || trendData.dataPoints.length === 0) {
    return (
      <div className="bg-slate-900 p-6 rounded-xl shadow-lg border border-slate-800 flex items-center justify-center h-64 text-slate-500">
        No trend data available
      </div>
    );
  }

  return (
    <div className="bg-slate-900 p-6 rounded-xl shadow-lg border border-slate-800">
      <h3 className="text-lg font-bold text-white mb-4">Health Trend (Last 30 Days)</h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={trendData.dataPoints}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
            <XAxis 
                dataKey="date" 
                tick={{fontSize: 12, fill: '#94a3b8'}} 
                axisLine={false}
                tickLine={false}
            />
            <YAxis 
                domain={[0, 100]} 
                tick={{fontSize: 12, fill: '#94a3b8'}}
                axisLine={false}
                tickLine={false}
            />
            <Tooltip 
                contentStyle={{backgroundColor: '#0f172a', borderRadius: '8px', border: '1px solid #1e293b', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)', color: '#fff'}}
                itemStyle={{color: '#e2e8f0'}}
                labelStyle={{color: '#94a3b8'}}
            />
            <Legend wrapperStyle={{paddingTop: '10px'}} />
            <Line type="monotone" dataKey="healthScore" name="Overall Health" stroke="#3B82F6" strokeWidth={2} dot={{r: 4}} activeDot={{r: 6}} />
            <Line type="monotone" dataKey="batteryHealth" name="Battery" stroke="#10B981" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="tireHealth" name="Tires" stroke="#F59E0B" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="engineHealth" name="Engine" stroke="#EF4444" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default HealthTrendChart;
