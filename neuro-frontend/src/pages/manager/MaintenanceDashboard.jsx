import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext'; // Verify path
import { 
  Activity, 
  AlertTriangle, 
  RefreshCw, 
  Truck, 
  TrendingUp, 
  LayoutDashboard,
  Wrench,
  CheckCircle,
  X,
  Search
} from 'lucide-react';

// Components
import FleetHealthOverview from '../../components/maintenance/FleetHealthOverview';
import MaintenancePieChart from '../../components/maintenance/MaintenancePieChart';
import HealthTrendChart from '../../components/maintenance/HealthTrendChart';
import AlertsTable from '../../components/maintenance/AlertsTable';
import VehicleHealthCard from '../../components/maintenance/VehicleHealthCard';

const MaintenanceDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('OVERVIEW'); // OVERVIEW, VEHICLES, ALERTS, TRENDS
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [vehicleSearch, setVehicleSearch] = useState("");

  // Data States
  const [fleetSummary, setFleetSummary] = useState(null);
  const [trendData, setTrendData] = useState(null); // Will need separate endpoint or logic
  const [allAlerts, setAllAlerts] = useState([]);
  
  // Modal States
  const [selectedVehicle, setSelectedVehicle] = useState(null); // For View Details
  const [maintenanceVehicle, setMaintenanceVehicle] = useState(null); // For Maintenance Modal
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  
  // Maintenance Modal Logic
  const [maintenanceComponents, setMaintenanceComponents] = useState({
    Engine: false,
    Tires: false,
    Brakes: false,
    Battery: false,
    Oil: false,
    Coolant: false
  });

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [summaryRes, alertsRes, trendRes] = await Promise.all([
        axios.get('http://localhost:8080/api/health/fleet/summary', config),
        axios.get('http://localhost:8080/api/health/alerts', config),
        axios.get('http://localhost:8080/api/health/fleet/trend?days=30', config).catch(() => ({ data: [] })) // Handle if not implemented
      ]);

      setFleetSummary(summaryRes.data);
      setAllAlerts(alertsRes.data);
      
      // Handle trend data mock if empty (endpoint returns map with message currently)
      if (trendRes.data && !trendRes.data.message) {
         setTrendData(trendRes.data);
      } else {
         // Fallback or empty
         setTrendData(null); 
      }

    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData, refreshKey]);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleMaintenanceClick = (vehicle) => {
    setMaintenanceVehicle(vehicle);
    setMaintenanceComponents({
      Engine: false, Tires: false, Brakes: false, Battery: false, Oil: false, Coolant: false
    });
  };

  const submitMaintenance = async () => {
    if (!maintenanceVehicle) return;

    // Debug: Log the vehicle object to see what fields it has
    console.log('Maintenance vehicle object:', maintenanceVehicle);
    console.log('Vehicle ID:', maintenanceVehicle.id || maintenanceVehicle.vehicleId);

    const selectedComponents = Object.keys(maintenanceComponents)
      .filter(k => maintenanceComponents[k])
      .map(comp => comp.toUpperCase()); // Convert to uppercase for backend
      
    if (selectedComponents.length === 0) {
      alert("Please select at least one component to maintain.");
      return;
    }

    // Use vehicleId or id, whichever exists
    const vehicleId = maintenanceVehicle.vehicleId || maintenanceVehicle.id;
    
    if (!vehicleId) {
      console.error('No vehicle ID found in:', maintenanceVehicle);
      alert('Error: Vehicle ID not found. Please try again.');
      return;
    }

    console.log('Performing maintenance:', vehicleId, selectedComponents);
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `http://localhost:8080/api/health/vehicle/${vehicleId}/maintenance`,
        { components: selectedComponents },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log('Maintenance response:', response.data);
      alert("Maintenance performed successfully!");
      setMaintenanceVehicle(null);
      handleRefresh(); // Refresh data to show improved health
    } catch (err) {
      console.error("Maintenance failed:", err);
      console.error("Error details:", err.response?.data || err.message);
      alert(`Failed to perform maintenance: ${err.response?.data?.message || err.message}`);
    }
  };

  // --- Render Helpers ---

  const renderTabs = () => (
    <div className="flex space-x-1 bg-slate-800/50 p-1 rounded-xl mb-6 border border-slate-700 w-fit">
        {[
            { id: 'OVERVIEW', icon: LayoutDashboard, label: 'Overview' },
            { id: 'VEHICLES', icon: Truck, label: 'Vehicles' },
            { id: 'ALERTS', icon: AlertTriangle, label: 'Alerts' },
            { id: 'TRENDS', icon: TrendingUp, label: 'Trends' }
        ].map(tab => (
            <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                    ${activeTab === tab.id 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}
                `}
            >
                <tab.icon className="h-4 w-4" />
                {tab.label}
            </button>
        ))}
    </div>
  );

  const renderOverviewTab = () => (
    <div className="space-y-6 animate-fade-in">
        <FleetHealthOverview summary={fleetSummary} />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
                <AlertsTable 
                    alerts={allAlerts.slice(0, 5)} // Show top 5
                    userId={user?.id || 1}
                    onAlertUpdate={handleRefresh}
                />
            </div>
            <div>
                <MaintenancePieChart data={fleetSummary?.statusDistribution} />
            </div>
        </div>
    </div>
  );

  const renderVehiclesTab = () => {
      const vehicles = fleetSummary?.allVehiclesHealth || [];
      
      const filteredVehicles = vehicles.filter(v => 
          v.vehicleNumber.toLowerCase().includes(vehicleSearch.toLowerCase()) || 
          v.make.toLowerCase().includes(vehicleSearch.toLowerCase()) ||
          v.model.toLowerCase().includes(vehicleSearch.toLowerCase())
      );

      return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center mb-4">
                 <h3 className="text-xl font-bold text-white flex items-center gap-2">
                     <Truck className="h-5 w-5 text-blue-400" /> 
                     All Vehicles ({filteredVehicles.length})
                 </h3>
                 <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                        type="text" 
                        placeholder="Search vehicles..." 
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:border-blue-500 outline-none"
                        value={vehicleSearch}
                        onChange={e => setVehicleSearch(e.target.value)}
                    />
                 </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredVehicles.map(v => (
                    <VehicleHealthCard 
                        key={v.id} 
                        vehicle={v}
                        onViewDetails={(veh) => { setSelectedVehicle(veh); setDetailModalOpen(true); }}
                        onMaintenance={handleMaintenanceClick}
                    />
                ))}
                {filteredVehicles.length === 0 && (
                    <div className="col-span-full text-center py-12 text-slate-500">
                        No vehicles found matching your search.
                    </div>
                )}
            </div>
        </div>
      );
  };

  const renderAlertsTab = () => (
    <div className="animate-fade-in">
        <AlertsTable 
            alerts={allAlerts} 
            userId={user?.id || 1}
            onAlertUpdate={handleRefresh}
        />
    </div>
  );

  const renderTrendsTab = () => {
      if (!trendData) {
          return (
              <div className="p-12 text-center bg-slate-800/50 rounded-xl border border-slate-700">
                  <TrendingUp className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-white">Trend Data Not Available</h3>
                  <p className="text-slate-400">Not enough historical data collected yet.</p>
              </div>
          );
      }
      return (
        <div className="animate-fade-in">
            <HealthTrendChart data={trendData} />
        </div>
      );
  };

  // --- Main Render ---

  if (loading && !fleetSummary) {
      return (
          <div className="flex items-center justify-center min-h-[400px]">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
      );
  }

  if (error && !fleetSummary) {
      return (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-red-500">
              <AlertTriangle className="h-12 w-12 mb-4" />
              <p className="text-lg font-bold">{error}</p>
              <button onClick={handleRefresh} className="mt-4 px-4 py-2 bg-slate-800 rounded-lg text-white hover:bg-slate-700">
                  Try Again
              </button>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-slate-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Activity className="h-6 w-6 text-blue-500" />
            Maintenance Dashboard
          </h1>
          <p className="text-slate-400 mt-1">Monitor fleet health, manage alerts, and schedule maintenance.</p>
        </div>
        <button 
          onClick={handleRefresh} 
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-slate-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </button>
      </div>

      {/* Tabs */}
      {renderTabs()}

      {/* Content */}
      <div className="min-h-[500px]">
        {activeTab === 'OVERVIEW' && renderOverviewTab()}
        {activeTab === 'VEHICLES' && renderVehiclesTab()}
        {activeTab === 'ALERTS' && renderAlertsTab()}
        {activeTab === 'TRENDS' && renderTrendsTab()}
      </div>

      {/* --- MODALS --- */}

      {/* Maintenance Modal */}
      {maintenanceVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-slate-900 w-full max-w-lg rounded-2xl border border-slate-700 shadow-2xl overflow-hidden">
                <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Wrench className="h-5 w-5 text-orange-400" />
                        Perform Maintenance
                    </h3>
                    <button onClick={() => setMaintenanceVehicle(null)} className="text-slate-400 hover:text-white">
                        <X className="h-6 w-6" />
                    </button>
                </div>
                
                <div className="p-6">
                    <div className="mb-6 flex items-center gap-4 p-4 bg-slate-800 rounded-xl border border-slate-700">
                        <div className="p-3 bg-slate-900 rounded-lg">
                            <Truck className="h-8 w-8 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-400">Vehicle</p>
                            <p className="text-xl font-bold text-white">{maintenanceVehicle.vehicleNumber}</p>
                            <p className="text-xs text-slate-500">{maintenanceVehicle.make} {maintenanceVehicle.model}</p>
                        </div>
                    </div>

                    <p className="text-sm font-bold text-slate-300 mb-3 uppercase tracking-wide">Select Components to Service:</p>
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        {Object.keys(maintenanceComponents).map(comp => (
                            <label 
                                key={comp}
                                className={`
                                    flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all
                                    ${maintenanceComponents[comp] 
                                        ? 'bg-blue-600/20 border-blue-500/50 text-white' 
                                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}
                                `}
                            >
                                <input 
                                    type="checkbox"
                                    checked={maintenanceComponents[comp]}
                                    onChange={(e) => setMaintenanceComponents(prev => ({ ...prev, [comp]: e.target.checked }))}
                                    className="accent-blue-500 w-4 h-4"
                                />
                                <span className="font-medium">{comp}</span>
                            </label>
                        ))}
                    </div>

                    <button 
                        onClick={submitMaintenance}
                        className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-blue-900/40 transition-all flex items-center justify-center gap-2"
                    >
                        <CheckCircle className="h-5 w-5" />
                        Confirm Maintenance
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* View Details Modal (Vehicle Detail) */}
      {detailModalOpen && selectedVehicle && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-slate-900 w-full max-w-4xl rounded-2xl border border-slate-700 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                  <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/50 sticky top-0">
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                          <Activity className="h-5 w-5 text-emerald-400" />
                          Vehicle Health Report
                      </h3>
                      <button onClick={() => setDetailModalOpen(false)} className="text-slate-400 hover:text-white">
                          <X className="h-6 w-6" />
                      </button>
                  </div>
                  
                  <div className="p-6 overflow-y-auto">
                     {/* Reuse VehicleHealthCard logic or create a more detailed view here */}
                     {/* For now, simplified detail view reusing what we know */}
                     <div className="flex items-center gap-6 mb-8">
                         <div className="h-24 w-24 bg-slate-800 rounded-full flex items-center justify-center border-4 border-slate-700">
                             <span className={`text-3xl font-bold ${selectedVehicle.healthScore > 80 ? 'text-green-500' : 'text-red-500'}`}>
                                 {selectedVehicle.healthScore}%
                             </span>
                         </div>
                         <div>
                             <h2 className="text-3xl font-bold text-white mb-1">{selectedVehicle.vehicleNumber}</h2>
                             <div className="flex items-center gap-3 text-slate-400">
                                 <span>{selectedVehicle.make} {selectedVehicle.model}</span>
                                 <span>•</span>
                                 <span>{selectedVehicle.year}</span>
                                 <span>•</span>
                                 <span className="text-blue-400">{selectedVehicle.fuelType}</span>
                             </div>
                         </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <div>
                             <h4 className="text-sm font-bold text-slate-500 uppercase mb-4">Detailed Metrics</h4>
                             <div className="space-y-4">
                                 {[
                                     { label: 'Engine Health', value: selectedVehicle.engineHealth },
                                     { label: 'Tire Health', value: selectedVehicle.tireHealth },
                                     { label: 'Battery Health', value: selectedVehicle.batteryHealth },
                                     { label: 'Brake Health', value: selectedVehicle.brakePadHealth },
                                     { label: 'Oil Level', value: selectedVehicle.oilLevel },
                                     { label: 'Coolant Level', value: selectedVehicle.coolantLevel },
                                     { label: 'Transmission', value: selectedVehicle.transmissionHealth }
                                 ].map((item, i) => (
                                     <div key={i}>
                                         <div className="flex justify-between text-sm mb-1">
                                             <span className="text-slate-300">{item.label}</span>
                                             <span className="text-white font-bold">{item.value}%</span>
                                         </div>
                                         <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                             <div 
                                                 className={`h-full rounded-full ${item.value > 80 ? 'bg-emerald-500' : item.value > 50 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                                                 style={{ width: `${item.value}%` }} 
                                             />
                                         </div>
                                     </div>
                                 ))}
                             </div>
                         </div>

                         <div className="space-y-6">
                              <div className="bg-slate-800/50 p-5 rounded-xl border border-slate-700">
                                  <h4 className="text-sm font-bold text-slate-500 uppercase mb-3">Service Details</h4>
                                  <div className="space-y-3">
                                      <div className="flex justify-between">
                                          <span className="text-slate-400">Odometer</span>
                                          <span className="text-white font-mono">{selectedVehicle.kmsDriven?.toLocaleString()} km</span>
                                      </div>
                                      <div className="flex justify-between">
                                          <span className="text-slate-400">Last Service</span>
                                          <span className="text-white font-mono">{selectedVehicle.lastServiceDate ? new Date(selectedVehicle.lastServiceDate).toLocaleDateString() : 'Never'}</span>
                                      </div>
                                      <div className="flex justify-between">
                                          <span className="text-slate-400">Since Last Service</span>
                                          <span className="text-orange-400 font-mono">{selectedVehicle.kmsSinceLastService?.toLocaleString()} km</span>
                                      </div>
                                  </div>
                              </div>
                         </div>
                     </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default MaintenanceDashboard;
