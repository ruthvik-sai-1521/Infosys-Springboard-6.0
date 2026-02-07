import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, AlertTriangle, CheckCircle, Truck, Wrench } from 'lucide-react';
import healthService from '../services/healthService';
import AlertsList from '../components/HealthComponents/AlertsList';

const FleetHealthPage = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [summaryData, alertsData] = await Promise.all([
          healthService.getFleetHealthSummary(),
          healthService.getAllActiveAlerts()
        ]);
        setSummary(summaryData);
        setAlerts(alertsData);
      } catch (err) {
        console.error("Failed to load fleet health data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="p-8 text-center text-slate-400">Loading fleet health...</div>;

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold text-white mb-6 flex items-center">
        <Activity className="w-8 h-8 text-blue-500 mr-3" />
        Fleet Health Dashboard
      </h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-slate-900 p-6 rounded-xl shadow-lg border border-slate-800 flex items-center group hover:border-blue-500/30 transition-colors">
          <div className="p-3 bg-blue-500/10 rounded-xl mr-4 group-hover:bg-blue-500/20 transition-colors">
            <Truck className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-bold uppercase">Total Vehicles</p>
            <p className="text-2xl font-bold text-white">{summary?.totalVehicles || 0}</p>
          </div>
        </div>

        <div className="bg-slate-900 p-6 rounded-xl shadow-lg border border-slate-800 flex items-center group hover:border-emerald-500/30 transition-colors">
          <div className={`p-3 rounded-xl mr-4 ${summary?.averageHealthScore < 70 ? 'bg-amber-500/10' : 'bg-emerald-500/10'}`}>
            <Activity className={`w-6 h-6 ${summary?.averageHealthScore < 70 ? 'text-amber-400' : 'text-emerald-400'}`} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-bold uppercase">Avg Health Score</p>
            <p className={`text-2xl font-bold ${summary?.averageHealthScore < 70 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {summary?.averageHealthScore?.toFixed(1) || 0}%
            </p>
          </div>
        </div>

        <div className="bg-slate-900 p-6 rounded-xl shadow-lg border border-slate-800 flex items-center group hover:border-red-500/30 transition-colors">
          <div className="p-3 bg-red-500/10 rounded-xl mr-4">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-bold uppercase">Critical Issues</p>
            <p className="text-2xl font-bold text-white">{summary?.criticalVehicles || 0}</p>
          </div>
        </div>

        <div className="bg-slate-900 p-6 rounded-xl shadow-lg border border-slate-800 flex items-center group hover:border-orange-500/30 transition-colors">
          <div className="p-3 bg-orange-500/10 rounded-xl mr-4">
            <Wrench className="w-6 h-6 text-orange-500" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-bold uppercase">Maintenance Due</p>
            <p className="text-2xl font-bold text-white">{summary?.maintenanceOverdue || 0}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alerts Column */}
        <div className="lg:col-span-2">
           <AlertsList alerts={alerts} onAlertUpdated={() => window.location.reload()} />
        </div>

        {/* Condition Breakdown */}
        <div className="lg:col-span-1">
           <div className="bg-slate-900 rounded-xl shadow-lg border border-slate-800 overflow-hidden h-full">
             <div className="px-6 py-4 border-b border-slate-800">
               <h3 className="text-lg font-bold text-white">Condition Breakdown</h3>
             </div>
             
             <div className="p-6 space-y-6">
                 {summary?.healthDistribution && Object.entries(summary.healthDistribution).map(([status, count]) => {
                    const total = summary.totalVehicles || 1;
                    const percentage = (count / total) * 100;
                    
                    let color = 'bg-slate-600';
                    let labelColor = 'text-slate-400';
                    if (status === 'CRITICAL') { color = 'bg-red-500'; labelColor = 'text-red-400'; }
                    else if (status === 'NEEDS_ATTENTION') { color = 'bg-amber-500'; labelColor = 'text-amber-400'; }
                    else if (status === 'HEALTHY') { color = 'bg-emerald-500'; labelColor = 'text-emerald-400'; }
                    else if (status === 'MAINTENANCE_DUE') { color = 'bg-blue-500'; labelColor = 'text-blue-400'; }

                    return (
                        <div key={status}>
                            <div className="flex justify-between items-center mb-2">
                                <span className={`text-sm font-bold capitalize ${labelColor}`}>{status.replace(/_/g, ' ')}</span>
                                <span className="text-sm text-white font-bold">{count} vehicles</span>
                            </div>
                            <div className="w-full bg-slate-800 rounded-full h-3">
                                <div 
                                    className={`h-3 rounded-full ${color}`}
                                    style={{ width: `${percentage}%` }}
                                ></div>
                            </div>
                        </div>
                    );
                 })}
                 
                 {(!summary?.healthDistribution || Object.keys(summary.healthDistribution).length === 0) && (
                     <p className="text-slate-500 text-center">No data available.</p>
                 )}
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default FleetHealthPage;
