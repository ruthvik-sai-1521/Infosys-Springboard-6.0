import React from 'react';
import { Activity, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

const HealthScoreCard = ({ healthDTO }) => {
  if (!healthDTO) return <div className="p-4 bg-slate-800 rounded-lg animate-pulse text-slate-400">Loading Health Data...</div>;

  const { healthScore, healthStatus, overallCondition } = healthDTO;

  // Determine color based on score
  let colorClass = 'text-emerald-400';
  let bgClass = 'bg-emerald-500/10 border-emerald-500/20';
  let Icon = CheckCircle;

  if (healthScore < 50) {
    colorClass = 'text-red-400';
    bgClass = 'bg-red-500/10 border-red-500/20';
    Icon = XCircle;
  } else if (healthScore < 80) {
    colorClass = 'text-amber-400';
    bgClass = 'bg-amber-500/10 border-amber-500/20';
    Icon = AlertTriangle;
  }

  return (
    <div className="bg-slate-900 p-6 rounded-xl shadow-lg border border-slate-800 flex items-center justify-between">
      <div>
        <h3 className="text-lg font-bold text-white">Overall Health Score</h3>
        <p className="text-sm text-slate-400 mt-1">Condition: <span className="font-bold text-white uppercase">{overallCondition || healthStatus}</span></p>
      </div>
      
      <div className={`flex items-center space-x-3 px-4 py-2 rounded-xl border ${bgClass}`}>
        <Icon className={`w-8 h-8 ${colorClass}`} />
        <span className={`text-3xl font-bold ${colorClass}`}>{healthScore}%</span>
      </div>
    </div>
  );
};

export default HealthScoreCard;
