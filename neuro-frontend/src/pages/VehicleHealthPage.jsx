import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Activity, AlertTriangle } from 'lucide-react';
import healthService from '../services/healthService';
import HealthScoreCard from '../components/HealthComponents/HealthScoreCard';
import ComponentStatusList from '../components/HealthComponents/ComponentStatusList';
import AlertsList from '../components/HealthComponents/AlertsList';
import HealthTrendChart from '../components/HealthComponents/HealthTrendChart';
import MaintenanceModal from '../components/HealthComponents/MaintenanceModal';

const VehicleHealthPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vehicleHealth, setVehicleHealth] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(true);
  const [maintenanceModalOpen, setMaintenanceModalOpen] = useState(false);

  // Fetch all data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [healthData, alertsData, trendData] = await Promise.all([
        healthService.getVehicleHealth(id),
        healthService.getVehicleAlerts(id),
        healthService.getVehicleHealthTrend(id, 30)
      ]);
      
      setVehicleHealth(healthData);
      setAlerts(alertsData);
      setTrends(trendData);
    } catch (err) {
      console.error("Failed to load health data", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleSimulateWear = async () => {
    try {
        await healthService.simulateWear(id, 500); 
        loadData(); 
        alert("Simulated 500km wear.");
    } catch (err) {
        console.error("Simulation failed", err);
    }
  };

  if (loading && !vehicleHealth) {
    return <div className="p-8 text-center bg-slate-950 min-h-screen text-white">Loading vehicle health...</div>;
  }

  return (
    <div className="p-6 bg-slate-950 min-h-screen text-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
            <button onClick={() => navigate(-1)} className="mr-4 p-2 rounded-full hover:bg-slate-800 transition-colors">
                <ArrowLeft className="w-6 h-6 text-slate-400" />
            </button>
            <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Vehicle Health Monitor</h1>
                <p className="text-slate-500">Vehicle #{vehicleHealth?.vehicleNumber || id}</p>
            </div>
        </div>
        <div className="flex space-x-3">
            <button 
                onClick={handleSimulateWear}
                className="px-4 py-2 bg-slate-800 text-slate-300 border border-slate-700 rounded-lg hover:bg-slate-700 font-bold text-sm transition-colors"
            >
                Simulate Wear
            </button>
            <button 
                onClick={() => setMaintenanceModalOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 font-bold text-sm flex items-center shadow-lg shadow-blue-900/40 transition-colors"
            >
                <Activity className="w-4 h-4 mr-2" />
                Perform Maintenance
            </button>
            <button onClick={loadData} className="p-2 bg-slate-800 text-slate-400 border border-slate-700 rounded-lg hover:text-white transition-colors">
                <RefreshCw className="w-5 h-5" />
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Score & Components */}
        <div className="lg:col-span-2 space-y-6">
            <HealthScoreCard healthDTO={vehicleHealth} />
            
            <ComponentStatusList healthDTO={vehicleHealth} />
            
            <HealthTrendChart trendData={trends} />
        </div>

        {/* Right Column: Alerts & Info */}
        <div className="space-y-6">
            <AlertsList alerts={alerts} onAlertUpdated={loadData} />
            
            {/* Quick Stats / Info Widget */}
            <div className="bg-slate-900 p-6 rounded-xl shadow-lg border border-slate-800">
                <h3 className="text-lg font-bold text-white mb-4">Maintenance Stats</h3>
                <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-slate-800">
                        <span className="text-slate-500">Last Service Date</span>
                        <span className="font-bold text-white">{vehicleHealth?.lastServiceDate ? new Date(vehicleHealth.lastServiceDate).toLocaleDateString() : 'Never'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-800">
                        <span className="text-slate-500">Next Service Due</span>
                        <span className={`font-bold ${vehicleHealth?.daysUntilService < 7 ? 'text-red-400' : 'text-white'}`}>
                            {vehicleHealth?.nextServiceDate ? new Date(vehicleHealth.nextServiceDate).toLocaleDateString() : 'N/A'}
                        </span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                         <span className="text-slate-500">Km Since Service</span>
                         <span className="font-bold text-white">{vehicleHealth?.kmsSinceLastService?.toFixed(1) || 0} km</span>
                    </div>
                </div>
            </div>
        </div>
      </div>

      <MaintenanceModal 
        vehicleId={id} 
        isOpen={maintenanceModalOpen} 
        onClose={() => setMaintenanceModalOpen(false)}
        onSuccess={loadData}
      />
    </div>
  );
};

export default VehicleHealthPage;
