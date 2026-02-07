import React from 'react';
import { 
  Car, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Wrench, 
  Gauge, 
  Disc, 
  Battery, 
  Activity,
  AlertOctagon,
  AlertCircle,
  Info
} from 'lucide-react';

const FleetHealthOverview = ({ summary }) => {
  if (!summary) return null;

  // Helper for health color
  const getHealthColor = (score) => {
    if (score >= 85) return 'text-green-500';
    if (score >= 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getHealthBg = (score) => {
    if (score >= 85) return 'bg-green-500/10 border-green-500/20';
    if (score >= 70) return 'bg-yellow-500/10 border-yellow-500/20';
    return 'bg-red-500/10 border-red-500/20';
  };

  return (
    <div className="space-y-6">
      {/* 1. Status Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatusCard 
          title="Total Vehicles" 
          count={summary.totalVehicles} 
          icon={Car} 
          color="blue" 
        />
        <StatusCard 
          title="Healthy" 
          count={summary.healthyVehicles} 
          icon={CheckCircle} 
          color="green" 
        />
        <StatusCard 
          title="Warning" 
          count={summary.warningVehicles} 
          icon={AlertTriangle} 
          color="yellow" 
        />
        <StatusCard 
          title="Critical" 
          count={summary.criticalVehicles} 
          icon={XCircle} 
          color="red" 
        />
        <StatusCard 
          title="Service Due" 
          count={summary.dueForServiceVehicles} 
          icon={Wrench} 
          color="purple" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 2. Fleet Health Averages */}
        <div className="lg:col-span-2 bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-400" />
            Fleet Health Averages
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <AverageCard 
              label="Overall Health" 
              value={summary.avgOverallHealth} 
              icon={Activity} 
              getHealthColor={getHealthColor}
              getHealthBg={getHealthBg}
            />
            <AverageCard 
              label="Engine Health" 
              value={summary.avgEngineHealth} 
              icon={Gauge} 
              getHealthColor={getHealthColor}
              getHealthBg={getHealthBg}
            />
            <AverageCard 
              label="Tire Health" 
              value={summary.avgTireHealth} 
              icon={Disc} 
              getHealthColor={getHealthColor}
              getHealthBg={getHealthBg}
            />
            <AverageCard 
              label="Battery Health" 
              value={summary.avgBatteryHealth} 
              icon={Battery} 
              getHealthColor={getHealthColor}
              getHealthBg={getHealthBg}
            />
          </div>
        </div>

        {/* 3. Alert Summary */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <AlertOctagon className="h-5 w-5 text-orange-400" />
            Active Alerts
          </h3>
          <div className="space-y-3">
            <AlertRow label="Critical" count={summary.criticalAlerts} color="text-red-500" bg="bg-red-500/10" icon={XCircle} />
            <AlertRow label="High" count={summary.highAlerts} color="text-orange-500" bg="bg-orange-500/10" icon={AlertTriangle} />
            <AlertRow label="Medium" count={summary.mediumAlerts} color="text-yellow-500" bg="bg-yellow-500/10" icon={AlertCircle} />
            <AlertRow label="Low" count={summary.lowAlerts} color="text-blue-500" bg="bg-blue-500/10" icon={Info} />
          </div>
        </div>
      </div>
    </div>
  );
};

const StatusCard = ({ title, count, icon: Icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    green: 'bg-green-500/10 text-green-400 border-green-500/20',
    yellow: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    red: 'bg-red-500/10 text-red-400 border-red-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  };

  return (
    <div className={`p-4 rounded-xl border ${colorClasses[color]} flex flex-col items-center justify-center text-center`}>
      <Icon className="h-6 w-6 mb-2" />
      <span className="text-2xl font-bold text-white">{count}</span>
      <span className="text-xs text-slate-400 uppercase tracking-wider">{title}</span>
    </div>
  );
};

const AverageCard = ({ label, value, icon: Icon, getHealthColor, getHealthBg }) => {
  const roundedValue = Math.round(value || 0);
  return (
    <div className={`p-4 rounded-xl border ${getHealthBg(roundedValue)} flex flex-col items-center text-center`}>
      <div className="flex items-center gap-2 mb-2 text-slate-300 text-sm font-medium">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <div className={`text-3xl font-bold ${getHealthColor(roundedValue)}`}>
        {roundedValue}%
      </div>
    </div>
  );
};

const AlertRow = ({ label, count, color, bg, icon: Icon }) => (
  <div className={`flex items-center justify-between p-3 rounded-lg ${bg}`}>
    <div className="flex items-center gap-2">
      <Icon className={`h-4 w-4 ${color}`} />
      <span className="text-slate-300 font-medium">{label}</span>
    </div>
    <span className={`font-bold ${color}`}>{count}</span>
  </div>
);

export default FleetHealthOverview;
