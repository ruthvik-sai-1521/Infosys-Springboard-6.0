import React from 'react';
import { 
  Car, 
  Battery, 
  Disc, 
  Gauge, 
  Droplet, 
  Thermometer, 
  Activity, 
  AlertTriangle, 
  Wrench, 
  ChevronRight,
  Truck
} from 'lucide-react';

const VehicleHealthCard = ({ vehicle, onViewDetails, onMaintenance }) => {
  if (!vehicle) return null;

  // Helper Functions
  const getHealthColor = (value) => {
    if (value >= 90) return 'text-green-500';
    if (value >= 75) return 'text-lime-500';
    if (value >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getHealthBgColor = (value) => {
    if (value >= 90) return 'bg-green-500';
    if (value >= 75) return 'bg-lime-500';
    if (value >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getStatusBadge = (status) => {
    const styles = {
      HEALTHY: 'bg-green-500/10 text-green-500 border-green-500/20',
      GOOD: 'bg-lime-500/10 text-lime-500 border-lime-500/20',
      WARNING: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      DUE: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
      CRITICAL: 'bg-red-500/10 text-red-500 border-red-500/20'
    };
    return styles[status] || styles.WARNING;
  };

  const metrics = [
    { label: 'Engine', value: vehicle.engineHealth, icon: Gauge },
    { label: 'Tires', value: vehicle.tireHealth, icon: Disc },
    { label: 'Battery', value: vehicle.batteryHealth, icon: Battery },
    { label: 'Brakes', value: vehicle.brakePadHealth, icon: Activity },
    { label: 'Oil', value: vehicle.oilLevel, icon: Droplet },
    { label: 'Coolant', value: vehicle.coolantLevel, icon: Thermometer },
  ];

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden hover:border-slate-600 transition-colors shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-slate-700 flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-700 rounded-lg">
            <Truck className="h-6 w-6 text-blue-400" />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg">{vehicle.vehicleNumber}</h3>
            <p className="text-slate-400 text-sm">{vehicle.make} {vehicle.model}</p>
          </div>
        </div>
        <div className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusBadge(vehicle.healthStatus)}`}>
          {vehicle.healthStatus}
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-5">
        
        {/* Overall Health Score */}
        <div>
          <div className="flex justify-between items-end mb-1">
            <span className="text-slate-400 text-sm font-medium">Overall Health</span>
            <span className={`text-xl font-bold ${getHealthColor(vehicle.healthScore)}`}>
              {vehicle.healthScore}%
            </span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div 
              className={`h-full ${getHealthBgColor(vehicle.healthScore)} transition-all duration-500 ease-out`}
              style={{ width: `${vehicle.healthScore}%` }}
            />
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-3">
          {metrics.map((metric, idx) => (
            <div key={idx} className="bg-slate-900/50 p-2 rounded-lg text-center border border-slate-700/50">
              <metric.icon className={`h-4 w-4 mx-auto mb-1 ${getHealthColor(metric.value)}`} />
              <div className="text-white font-bold text-sm">{metric.value}%</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wide">{metric.label}</div>
            </div>
          ))}
        </div>

        {/* Info Rows */}
        <div className="grid grid-cols-2 gap-4 text-sm border-t border-slate-700/50 pt-4">
          <div>
            <span className="block text-slate-500 text-xs">Odometer</span>
            <span className="text-slate-300 font-medium">{vehicle.kmsDriven?.toLocaleString()} km</span>
          </div>
          <div>
            <span className="block text-slate-500 text-xs">Since Service</span>
            <span className={`${vehicle.kmsSinceLastService > 8000 ? 'text-orange-400' : 'text-slate-300'} font-medium`}>
              {vehicle.kmsSinceLastService?.toLocaleString()} / 10k km
            </span>
          </div>
        </div>

        {/* Alert Badge */}
        {vehicle.activeAlerts > 0 && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2.5 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500 animate-pulse" />
            <span className="text-red-400 text-sm font-medium">
              {vehicle.activeAlerts} Active Alert{vehicle.activeAlerts !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-3 bg-slate-900/30 border-t border-slate-700 grid grid-cols-2 gap-3">
        <button
          onClick={() => onMaintenance(vehicle)}
          className="flex items-center justify-center gap-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700 py-2 rounded-lg transition-colors border border-transparent hover:border-slate-600"
        >
          <Wrench className="h-4 w-4" />
          Maintenance
        </button>
        <button
          onClick={() => onViewDetails(vehicle)}
          className="flex items-center justify-center gap-2 text-sm font-medium text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 py-2 rounded-lg transition-colors border border-transparent hover:border-blue-500/20"
        >
          View Details
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default VehicleHealthCard;
