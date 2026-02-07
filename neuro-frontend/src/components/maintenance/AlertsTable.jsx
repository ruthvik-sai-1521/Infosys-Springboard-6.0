import React, { useState } from 'react';
import axios from 'axios';
import { 
  AlertTriangle, 
  XCircle, 
  Info, 
  CheckCircle, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  User, 
  Truck,
  Activity,
  Filter
} from 'lucide-react';

const SEVERITY_CONFIG = {
  CRITICAL: { color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: XCircle },
  HIGH: { color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20', icon: AlertTriangle },
  MEDIUM: { color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', icon: Info },
  LOW: { color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: Info },
};

const AlertsTable = ({ alerts = [], onAlertUpdate, userId }) => {
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [processingId, setProcessingId] = useState(null);

  const toggleRow = (id) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const handleAction = async (alertId, action, e) => {
    e.stopPropagation(); // Prevent row toggle
    if (processingId) return;

    if (!userId) {
      alert('User ID not found. Please log in again.');
      return;
    }

    console.log(`${action} alert:`, alertId, 'User ID:', userId);
    setProcessingId(alertId);
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `http://localhost:8080/api/health/alerts/${alertId}/${action}?userId=${userId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      console.log(`${action} response:`, response.data);
      alert(`Alert ${action}d successfully!`);
      
      if (onAlertUpdate) {
        onAlertUpdate();
      }
    } catch (error) {
      console.error(`Failed to ${action} alert:`, error);
      console.error('Error details:', error.response?.data || error.message);
      alert(`Failed to ${action} alert: ${error.response?.data?.message || error.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  const filteredAlerts = alerts.filter(alert => 
    filterSeverity === 'ALL' || alert.severity === filterSeverity
  );

  if (!alerts || alerts.length === 0) {
    return (
      <div className="bg-slate-800 rounded-xl p-8 border border-slate-700 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mb-4">
          <CheckCircle className="h-8 w-8 text-green-500" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">All Systems Healthy!</h3>
        <p className="text-slate-400">No active maintenance alerts at this time.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
      {/* Header & Filter */}
      <div className="p-4 border-b border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Activity className="h-5 w-5 text-indigo-400" />
          Active Alerts 
          <span className="text-sm font-normal text-slate-400 ml-2">({filteredAlerts.length})</span>
        </h3>
        
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="bg-slate-900 border border-slate-600 text-slate-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-300">
          <thead className="text-xs text-slate-400 uppercase bg-slate-700/50">
            <tr>
              <th className="px-6 py-3">Severity</th>
              <th className="px-6 py-3">Vehicle</th>
              <th className="px-6 py-3">Issue</th>
              <th className="px-6 py-3">Component</th>
              <th className="px-6 py-3">Time</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAlerts.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-slate-500">
                  No alerts match the selected filter.
                </td>
              </tr>
            ) : (
              filteredAlerts.map((alert) => {
                const config = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.MEDIUM;
                const Icon = config.icon;
                const isExpanded = expandedRows.has(alert.id);

                return (
                  <React.Fragment key={alert.id}>
                    <tr 
                      onClick={() => toggleRow(alert.id)}
                      className={`
                        border-b border-slate-700 hover:bg-slate-700/30 cursor-pointer transition-colors
                        ${isExpanded ? 'bg-slate-700/30' : ''}
                      `}
                    >
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color} border ${config.border}`}>
                          <Icon className="h-3 w-3" />
                          {alert.severity}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-white font-medium">
                        <div className="flex items-center gap-2">
                          <Truck className="h-4 w-4 text-slate-400" />
                          {alert.vehicleNumber}
                        </div>
                        {alert.driverName && (
                          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                            <User className="h-3 w-3" />
                            {alert.driverName}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 font-medium text-white">
                        {alert.title}
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 inline ml-2 text-slate-400" />
                        ) : (
                          <ChevronDown className="h-4 w-4 inline ml-2 text-slate-400" />
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <code className="bg-slate-900 px-2 py-1 rounded text-xs font-mono text-cyan-400">
                          {alert.component}
                        </code>
                      </td>
                      <td className="px-6 py-4 text-slate-400 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          {alert.timeAgo}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {alert.status !== 'ACKNOWLEDGED' && (
                            <button
                              onClick={(e) => handleAction(alert.id, 'acknowledge', e)}
                              disabled={processingId === alert.id}
                              className="px-3 py-1.5 text-xs font-medium text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 rounded-lg hover:bg-yellow-400/20 disabled:opacity-50 transition-colors"
                            >
                              Acknowledge
                            </button>
                          )}
                          <button
                            onClick={(e) => handleAction(alert.id, 'resolve', e)}
                            disabled={processingId === alert.id}
                            className="px-3 py-1.5 text-xs font-medium text-green-400 bg-green-400/10 border border-green-400/20 rounded-lg hover:bg-green-400/20 disabled:opacity-50 transition-colors"
                          >
                            Resolve
                          </button>
                        </div>
                      </td>
                    </tr>
                    
                    {/* Expanded Details */}
                    {isExpanded && (
                      <tr className="bg-slate-700/20 border-b border-slate-700">
                        <td colSpan="6" className="px-6 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Description</h4>
                              <p className="text-sm text-slate-300 bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                                {alert.description || "No description provided."}
                              </p>
                            </div>
                            
                            <div className="space-y-4">
                              {alert.recommendedAction && (
                                <div>
                                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Recommended Action</h4>
                                  <div className="flex items-start gap-2 text-sm text-blue-300 bg-blue-500/10 p-3 rounded-lg border border-blue-500/20">
                                    <Info className="h-4 w-4 mt-0.5 shrink-0" />
                                    {alert.recommendedAction}
                                  </div>
                                </div>
                              )}
                              
                              <div className="grid grid-cols-2 gap-4">
                                {alert.currentValue && (
                                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-700">
                                    <span className="block text-xs text-slate-500">Current Value</span>
                                    <span className={`text-lg font-bold ${config.color}`}>{alert.currentValue}</span>
                                  </div>
                                )}
                                {alert.thresholdValue && (
                                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-700">
                                    <span className="block text-xs text-slate-500">Threshold</span>
                                    <span className="text-lg font-bold text-slate-300">{alert.thresholdValue}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AlertsTable;
