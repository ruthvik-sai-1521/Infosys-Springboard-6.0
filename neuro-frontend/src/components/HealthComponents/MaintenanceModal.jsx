import React, { useState } from 'react';
import { Wrench } from 'lucide-react';
import healthService from '../../services/healthService';

const MaintenanceModal = ({ vehicleId, isOpen, onClose, onSuccess }) => {
  const [selectedComponents, setSelectedComponents] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const components = [
    { id: 'ENGINE', label: 'Engine Service' },
    { id: 'TIRES', label: 'Tire Replacement/Rotation' },
    { id: 'BATTERY', label: 'Battery Replacement' },
    { id: 'OIL', label: 'Oil Change' },
    { id: 'BRAKES', label: 'Brake Pad Replacement' },
    { id: 'COOLANT', label: 'Coolant Refill' },
    { id: 'TRANSMISSION', label: 'Transmission Service' },
    { id: 'FULL_SERVICE', label: 'Full Service Checkup', description: 'Resets all components' },
  ];

  const toggleComponent = (id) => {
    let newSelection = [...selectedComponents];
    
    if (id === 'FULL_SERVICE') {
        if (newSelection.includes('FULL_SERVICE')) {
            newSelection = [];
        } else {
            newSelection = ['FULL_SERVICE'];
        }
    } else {
        if (newSelection.includes('FULL_SERVICE')) {
            newSelection = [];
        }

        if (newSelection.includes(id)) {
            newSelection = newSelection.filter(c => c !== id);
        } else {
            newSelection.push(id);
        }
    }
    
    setSelectedComponents(newSelection);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedComponents.length === 0) return;

    setSubmitting(true);
    try {
        console.log('Performing maintenance:', vehicleId, selectedComponents);
        await healthService.performMaintenance(vehicleId, selectedComponents);
        console.log('Maintenance successful');
        alert('Maintenance performed successfully!');
        if (onSuccess) onSuccess();
        onClose();
    } catch (err) {
        console.error("Maintenance failed", err);
        console.error("Error details:", err.response?.data || err.message);
        alert(`Maintenance failed: ${err.response?.data?.message || err.message}`);
    } finally {
        setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity" aria-hidden="true" onClick={onClose}></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-slate-900 rounded-2xl text-left overflow-hidden shadow-2xl border border-slate-700 transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-500/20 sm:mx-0 sm:h-10 sm:w-10">
                <Wrench className="h-6 w-6 text-blue-400" />
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3 className="text-lg leading-6 font-bold text-white" id="modal-title">
                  Perform Maintenance
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-slate-400 mb-4">
                    Select the maintenance tasks performed.
                  </p>
                  
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {components.map((comp) => (
                        <div 
                            key={comp.id}
                            className={`flex items-center p-3 border rounded-xl cursor-pointer transition-colors ${selectedComponents.includes(comp.id) ? 'bg-blue-600/20 border-blue-500' : 'bg-slate-800 border-slate-700 hover:border-slate-600'}`}
                            onClick={() => toggleComponent(comp.id)}
                        >
                            <input 
                                type="checkbox" 
                                className="h-4 w-4 bg-slate-900 border-slate-600 rounded"
                                checked={selectedComponents.includes(comp.id)}
                                readOnly
                            />
                            <div className="ml-3">
                                <span className="block text-sm font-bold text-white">{comp.label}</span>
                                {comp.description && <span className="block text-xs text-slate-500">{comp.description}</span>}
                            </div>
                        </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-slate-800/50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-slate-800">
            <button 
                type="button" 
                className="w-full inline-flex justify-center rounded-xl border border-transparent shadow-lg shadow-blue-900/40 px-4 py-2 bg-blue-600 text-base font-bold text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                onClick={handleSubmit}
                disabled={submitting || selectedComponents.length === 0}
            >
              {submitting ? 'Updating...' : 'Confirm'}
            </button>
            <button 
                type="button" 
                className="mt-3 w-full inline-flex justify-center rounded-xl border border-slate-600 shadow-sm px-4 py-2 bg-transparent text-base font-medium text-slate-300 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                onClick={onClose}
                disabled={submitting}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceModal;
