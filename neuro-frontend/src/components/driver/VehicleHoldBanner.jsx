import React from 'react';
import { AlertTriangle, Wrench } from 'lucide-react';
import './VehicleHoldBanner.css';

const VehicleHoldBanner = ({ vehicle, onSubmitMaintenance }) => {
  if (!vehicle || vehicle.holdStatus !== 'ON_HOLD') {
    return null;
  }

  return (
    <div className="hold-banner">
      <div className="hold-banner-icon">
        <AlertTriangle size={32} />
      </div>
      <div className="hold-banner-content">
        <h3 className="hold-banner-title">
          <Wrench size={20} />
          Vehicle On Hold - Maintenance Required
        </h3>
        <p className="hold-banner-reason">{vehicle.holdReason}</p>
        <p className="hold-banner-info">
          You cannot create trips until maintenance is completed and approved by management.
        </p>
        {vehicle.holdStatus === 'ON_HOLD' && (
          <button 
            className="submit-maintenance-btn"
            onClick={onSubmitMaintenance}
          >
            <Wrench size={16} />
            Submit Maintenance Completion
          </button>
        )}
        {vehicle.holdStatus === 'PENDING_RELEASE' && (
          <div className="pending-release-notice">
            <span className="status-badge pending">Pending Manager Approval</span>
            <p>Your maintenance submission is under review.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VehicleHoldBanner;
