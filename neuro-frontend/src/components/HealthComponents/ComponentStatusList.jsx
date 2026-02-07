import React from 'react';
import { Settings, Battery, Disc, Thermometer, Droplet, Layers } from 'lucide-react';

const ComponentStatusList = ({ healthDTO }) => {
  if (!healthDTO) return null;

  const components = [
    { name: 'Engine', score: healthDTO.engineHealth, icon: Settings },
    { name: 'Battery', score: healthDTO.batteryHealth, icon: Battery },
    { name: 'Brakes', score: healthDTO.brakePadHealth, icon: Disc },
    { name: 'Tires', score: healthDTO.tireHealth, icon: Layers },
    { name: 'Oil Level', score: healthDTO.oilLevel, icon: Droplet },
    { name: 'Coolant', score: healthDTO.coolantLevel, icon: Thermometer },
    { name: 'Transmission', score: healthDTO.transmissionHealth, icon: Settings },
  ];

  const getStatusColor = (score) => {
    if (score < 50) return 'bg-red-500';
    if (score < 80) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  return (
    <div className="space-y-3">
      {components.map((comp, index) => {
          const Icon = comp.icon;
          return (
              <div key={index} className="flex items-center p-3 border border-slate-700 rounded-lg bg-slate-800/30 hover:border-blue-500/30 transition-colors">
                  <div className={`p-2 rounded-lg mr-3 flex-shrink-0 ${comp.score < 50 ? 'bg-red-500/10 text-red-400' : comp.score < 80 ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                      <Icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1.5">
                          <span className="text-sm font-semibold text-slate-200">{comp.name}</span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${comp.score < 50 ? 'bg-red-500/20 text-red-400' : comp.score < 80 ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                              {comp.score ? `${comp.score}%` : 'N/A'}
                          </span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-1.5">
                          <div 
                              className={`h-1.5 rounded-full transition-all ${getStatusColor(comp.score)}`} 
                              style={{ width: `${comp.score || 0}%` }}
                          ></div>
                      </div>
                  </div>
              </div>
          );
      })}
    </div>
  );
};

export default ComponentStatusList;
