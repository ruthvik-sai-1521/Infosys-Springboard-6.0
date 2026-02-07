import React, { useState, useEffect, useCallback } from 'react';
import { X, Activity, AlertTriangle } from 'lucide-react';
import healthService from '../../services/healthService';
import HealthScoreCard from '../../components/HealthComponents/HealthScoreCard';
import ComponentStatusList from '../../components/HealthComponents/ComponentStatusList';
import HealthTrendChart from '../../components/HealthComponents/HealthTrendChart';
import AlertsList from '../../components/HealthComponents/AlertsList';

const DriverVehicleHealthModal = ({ vehicle, onClose, refreshData }) => {
    const [healthData, setHealthData] = useState(null);
    const [trendData, setTrendData] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchHealthDetails = useCallback(async () => {
        setLoading(true);
        try {
            const [healthRes, trendRes, alertsRes] = await Promise.all([
                healthService.getVehicleHealth(vehicle.id),
                healthService.getVehicleHealthTrend(vehicle.id, 30),
                healthService.getVehicleAlerts(vehicle.id)
            ]);

            console.log('Health API Response:', healthRes);
            console.log('Trend API Response:', trendRes);
            console.log('Alerts API Response:', alertsRes);
            
            setHealthData(healthRes);
            setTrendData(trendRes.history || []);
            setAlerts(alertsRes || []);
        } catch (error) {
            console.error("Error fetching health details:", error);
        } finally {
            setLoading(false);
        }
    }, [vehicle.id]);

    useEffect(() => {
        if (vehicle?.id) {
            fetchHealthDetails();
        }
    }, [vehicle?.id, fetchHealthDetails]);



    if (!vehicle) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-slate-900 w-full max-w-5xl rounded-2xl border border-slate-700 shadow-2xl relative flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-slate-800 bg-slate-800/50 rounded-t-2xl">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400">
                            <Activity className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white mb-1">Vehicle Health Report</h2>
                            <p className="text-slate-400 text-sm">{vehicle.vehicleNumber} • {vehicle.model}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Left Column: Score & Status */}
                            <div className="space-y-6">
                                <HealthScoreCard 
                                    healthDTO={healthData}
                                />
                                
                                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
                                    <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                                        <Activity className="w-4 h-4 text-blue-400" /> Component Status
                                    </h3>
                                    <ComponentStatusList 
                                        healthDTO={healthData}
                                    />
                                </div>
                            </div>

                            {/* Middle & Right: Trend & Alerts */}
                            <div className="lg:col-span-2 space-y-6">
                                {/* Trend Chart */}
                                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
                                    <h3 className="font-bold text-white mb-4">30-Day Health Trend</h3>
                                    <HealthTrendChart data={trendData} />
                                </div>

                                {/* Active Alerts */}
                                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-bold text-white flex items-center gap-2">
                                            <AlertTriangle className="w-4 h-4 text-amber-500" /> Active Alerts
                                            <span className="bg-slate-700 text-white text-xs px-2 py-0.5 rounded-full">{alerts.length}</span>
                                        </h3>
                                    </div>
                                    
                                    <AlertsList 
                                        alerts={alerts} 
                                        onAlertUpdated={fetchHealthDetails}
                                        userRole="DRIVER"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DriverVehicleHealthModal;
