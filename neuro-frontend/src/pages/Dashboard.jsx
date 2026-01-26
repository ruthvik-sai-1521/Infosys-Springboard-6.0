import React, { useState } from 'react';
import DriverHome from './DriverHome'; // Fix: Points to same folder
import DriverProfile from './DriverProfile';
import '../App.css';

export default function Dashboard() {
  const role = localStorage.getItem("role");
  const [view, setView] = useState("HOME");
  const userData = {
     email: localStorage.getItem("email"),
     username: localStorage.getItem("username"),
     verificationStatus: "PENDING"
  };

  return (
    <div style={{ padding: '100px 50px' }}>
      {role === 'DRIVER' && (
        <div className="driver-container">
          <div style={{ display: 'flex', gap: '20px', marginBottom: '40px' }}>
            <button onClick={() => setView("HOME")} className={`view-btn ${view === "HOME" ? "active" : ""}`}>Garage</button>
            <button onClick={() => setView("PROFILE")} className={`view-btn ${view === "PROFILE" ? "active" : ""}`}>Verification</button>
          </div>
          {view === "HOME" ? <DriverHome user={userData} /> : <DriverProfile user={userData} />}
        </div>
      )}
    </div>
  );
}