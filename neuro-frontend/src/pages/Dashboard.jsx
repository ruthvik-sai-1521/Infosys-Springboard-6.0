import React from 'react';
import { useLocation } from 'react-router-dom';
import { Car, Users, Calendar, Activity } from 'lucide-react';
import '../App.css';

export default function Dashboard() {
  const { state } = useLocation();
  const role = state?.role || "ADMIN";

  const tiles = [
    { title: "Active Fleet", val: "1,452", icon: <Car color="#3b82f6" /> },
    { title: "Total Users", val: "8,920", icon: <Users color="#a855f7" /> },
    { title: "Today's Bookings", val: "342", icon: <Calendar color="#10b981" /> },
    { title: "System Health", val: "99.8%", icon: <Activity color="#f59e0b" /> },
  ];

  return (
    <div style={{ padding: '100px 50px' }}>
      <header>
        <h1 style={{ fontSize: '40px', fontWeight: 900, textTransform: 'uppercase', margin: 0 }}>{role} PANEL</h1>
        <p style={{ color: '#64748b', fontWeight: 'bold', letterSpacing: '2px' }}>NEUROFLEETX REAL-TIME STATS</p>
      </header>

      <div className="dashboard-grid">
        {tiles.map((tile, i) => (
          <div key={i} className="tile">
            <div style={{ marginBottom: '15px' }}>{tile.icon}</div>
            <p style={{ color: '#64748b', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>{tile.title}</p>
            <h2 style={{ fontSize: '32px', margin: '5px 0' }}>{tile.val}</h2>
          </div>
        ))}
      </div>
    </div>
  );
}