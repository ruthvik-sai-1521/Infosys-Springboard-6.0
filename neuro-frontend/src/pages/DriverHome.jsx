import React, { useState } from 'react';
import { Plus, Car, FileText, Calendar, ShieldAlert, ArrowRight, X } from 'lucide-react';
import axios from 'axios';

export default function DriverHome({ user }) {
  const [open, setOpen] = useState(false);
  const [vehicle, setVehicle] = useState({ vehicleNumber: '', kmsDriven: '', nextServiceDate: '' });
  const isVerified = user?.verificationStatus === "APPROVED";

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`http://localhost:8080/api/driver/add-vehicle?email=${user.email}`, vehicle);
      alert("Registration submitted to Admin.");
      setOpen(false);
    } catch (err) { alert(err.response?.data?.message); }
  };

  return (
    <div style={{ padding: '40px' }}>
      <header style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '42px', fontWeight: 900, color: 'white', margin: 0 }}>MY <span style={{ color: '#3b82f6' }}>GARAGE</span></h1>
        <p style={{ color: '#64748b' }}>Manage your fleet telemetry and legal onboarding.</p>
      </header>

      {!open ? (
        <div onClick={() => setOpen(true)} style={{ border: '2px dashed #1e293b', borderRadius: '24px', padding: '80px', textAlign: 'center', cursor: 'pointer' }}>
          <Plus size={48} color="#3b82f6" style={{ marginBottom: '20px' }} />
          <h3 style={{ color: 'white', margin: 0 }}>Onboard New Fleet Vehicle</h3>
          <p style={{ color: '#64748b' }}>Submit documents to enable AI-powered urban trips.</p>
        </div>
      ) : (
        <div className="glass-card" style={{ maxWidth: '700px', borderLeft: '6px solid var(--primary)', position: 'relative' }}>
          <X onClick={() => setOpen(false)} style={{ position: 'absolute', top: '30px', right: '30px', cursor: 'pointer', color: '#64748b' }} />
          <h2 style={{ color: 'white', marginBottom: '30px' }}>Vehicle Registration</h2>
          
          <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '800', color: '#64748b' }}>VEHICLE PLATE NUMBER</label>
              <input type="text" placeholder="e.g. TS 07 AB 1234" className="custom-input" required onChange={e => setVehicle({...vehicle, vehicleNumber: e.target.value})} />
            </div>

            <div style={{ display: 'flex', gap: '20px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '12px', fontWeight: '800', color: '#64748b' }}>ODOMETER (KMs)</label>
                <input type="number" placeholder="Current Reading" className="custom-input" required onChange={e => setVehicle({...vehicle, kmsDriven: e.target.value})} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '12px', fontWeight: '800', color: '#64748b' }}>PLANNED SERVICE DATE</label>
                <input type="date" className="custom-input" required onChange={e => setVehicle({...vehicle, nextServiceDate: e.target.value})} />
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '25px', borderRadius: '15px', border: '1px dashed var(--border)' }}>
              <h4 style={{ margin: '0 0 15px 0', fontSize: '13px', color: '#3b82f6' }}><FileText size={16} /> Legal Documents (PDF Required)</h4>
              <p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '15px' }}>Upload your Registration Certificate (RC) and Current Insurance Policy.</p>
              <input type="file" accept=".pdf" />
            </div>

            <button type="submit" className="btn-primary" disabled={!isVerified} style={{ padding: '16px' }}>
              SUBMIT FOR ADMIN AUDIT <ArrowRight size={18} />
            </button>
            {!isVerified && <p style={{ color: '#f87171', fontSize: '11px', textAlign: 'center' }}><ShieldAlert size={14} /> Profile must be APPROVED by Admin to register vehicles.</p>}
          </form>
        </div>
      )}
    </div>
  );
}