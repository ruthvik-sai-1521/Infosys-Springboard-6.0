import React from 'react';
import { Truck, LogOut, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Navbar() {
  const navigate = useNavigate();
  const username = localStorage.getItem("username") || "Authorized User";

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <nav style={{
      position: 'fixed', top: 0, width: '100%', display: 'flex', justifyContent: 'space-between',
      alignItems: 'center', padding: '15px 50px', backgroundColor: 'rgba(2, 6, 23, 0.8)',
      backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255,255,255,0.1)', zIndex: 1000, boxSizing: 'border-box'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Truck color="#3b82f6" size={28} />
        <span style={{ fontWeight: 900, fontStyle: 'italic', fontSize: '20px' }}>NEURO<span style={{ color: '#3b82f6' }}>FLEETX</span></span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 15px', background: 'rgba(255,255,255,0.05)', borderRadius: '20px' }}>
          <User size={16} color="#3b82f6" />
          <span style={{ fontSize: '13px', fontWeight: 'bold' }}>{username}</span>
        </div>
        <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <LogOut size={16} /> LOGOUT
        </button>
      </div>
    </nav>
  );
}