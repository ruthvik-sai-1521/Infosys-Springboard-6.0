import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import healthService from '../../services/healthService';
import { useAuth } from '../../context/AuthContext';

const AlertsList = ({ alerts, onAlertUpdated }) => {
  const { user } = useAuth();
  const [processingId, setProcessingId] = useState(null);

  if (!alerts || alerts.length === 0) {
    return (
      <div className="bg-slate-900 p-6 rounded-xl shadow-lg border border-slate-800 text-center">
        <CheckCircle className="mx-auto h-12 w-12 text-emerald-500/50 mb-3" />
        <h3 className="text-lg font-bold text-white">No Active Alerts</h3>
        <p className="text-slate-500">All systems are running normally.</p>
      </div>
    );
  }

  const handleAcknowledge = async (alertId) => {
    if (!user) {
      alert('Please log in to acknowledge alerts');
      return;
    }
    
    console.log('Acknowledging alert:', alertId, 'User:', user.id);
    setProcessingId(alertId);
    
    try {
      const response = await healthService.acknowledgeAlert(alertId, user.id);
      console.log('Acknowledge response:', response);
      
      alert('Alert acknowledged successfully!');
      
      if (onAlertUpdated) {
        onAlertUpdated();
      }
    } catch (err) {
      console.error("Failed to acknowledge alert:", err);
      console.error("Error details:", err.response?.data || err.message);
      alert(`Failed to acknowledge alert: ${err.response?.data?.message || err.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleResolve = async (alertId) => {
    if (!user) {
      alert('Please log in to resolve alerts');
      return;
    }
    
    console.log('Resolving alert:', alertId, 'User:', user.id);
    setProcessingId(alertId);
    
    try {
      const response = await healthService.resolveAlert(alertId, user.id);
      console.log('Resolve response:', response);
      
      alert('Alert resolved successfully!');
      
      if (onAlertUpdated) {
        onAlertUpdated();
      }
    } catch (err) {
      console.error("Failed to resolve alert:", err);
      console.error("Error details:", err.response?.data || err.message);
      alert(`Failed to resolve alert: ${err.response?.data?.message || err.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="bg-slate-900 rounded-xl shadow-lg border border-slate-800 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-800 bg-slate-900">
        <h3 className="text-lg font-bold text-white flex items-center">
          <AlertTriangle className="w-5 h-5 text-amber-500 mr-2" />
          Active Alerts ({alerts.length})
        </h3>
      </div>
      <div className="divide-y divide-slate-800">
        {alerts.map((alert) => (
          <div key={alert.id} className="p-6 hover:bg-slate-800/30 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold mr-2 bg-slate-800 border`}
                    style={{ borderColor: alert.severityColor, color: alert.severityColor }}
                  >
                    {alert.severity}
                  </span>
                  <span className="text-xs text-slate-500 flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {alert.timeAgo}
                  </span>
                </div>
                <h4 className="text-base font-bold text-white mb-1">{alert.title}</h4>
                <p className="text-sm text-slate-400 mb-3">{alert.description}</p>
                
                {alert.recommendedAction && (
                  <div className="bg-blue-500/10 p-3 rounded-lg border border-blue-500/20 mb-3">
                    <p className="text-sm text-blue-400">
                      <strong>Action:</strong> {alert.recommendedAction}
                    </p>
                  </div>
                )}
                
                <div className="flex items-center space-x-4 text-xs text-slate-500">
                   <span>Current: <strong className="text-slate-300">{alert.currentValue}</strong></span>
                   <span>Threshold: <strong className="text-slate-300">{alert.thresholdValue}</strong></span>
                </div>
              </div>
              
              <div className="ml-4 flex flex-col space-y-2">
                {alert.status === 'ACTIVE' && (
                    <button
                        onClick={() => handleAcknowledge(alert.id)}
                        disabled={processingId === alert.id}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-bold rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                        {processingId === alert.id ? '...' : 'Ack'}
                    </button>
                )}
                <button
                    onClick={() => handleResolve(alert.id)}
                    disabled={processingId === alert.id}
                    className="inline-flex items-center px-3 py-1.5 border border-slate-600 text-xs font-bold rounded-lg text-slate-300 bg-transparent hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                     {processingId === alert.id ? '...' : 'Resolve'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AlertsList;
