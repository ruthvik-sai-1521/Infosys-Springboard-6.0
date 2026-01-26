import React, { useState } from 'react';
import { User, Phone, CreditCard, ShieldCheck } from 'lucide-react';
import axios from 'axios';

export default function DriverProfile({ user }) {
  const [profile, setProfile] = useState({ ...user });

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:8080/api/driver/update-profile", profile);
      alert("Documents uploaded! Waiting for Admin Approval.");
    } catch (err) { alert("Update failed."); }
  };

  return (
    <div style={{ padding: '40px', display: 'flex', gap: '40px' }}>
      <div className="glass-card" style={{ flex: 1 }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '30px' }}>
          <User color="#3b82f6" /> Profile Information
        </h2>
        <form onSubmit={handleUpdate}>
          <div className="input-group" style={{marginBottom:'20px'}}>
             <label className="input-label">Username</label>
             <input type="text" className="custom-input" value={profile.username} readOnly />
          </div>
          <input type="text" placeholder="Mobile Number" className="custom-input" style={{marginBottom:'15px'}} 
            onChange={e => setProfile({...profile, mobileNumber: e.target.value})} required />
          <input type="text" placeholder="Driving License Number" className="custom-input" style={{marginBottom:'15px'}} 
            onChange={e => setProfile({...profile, drivingLicense: e.target.value})} required />
          <input type="text" placeholder="Aadhaar Card Number" className="custom-input" style={{marginBottom:'15px'}} 
            onChange={e => setProfile({...profile, aadhaarNumber: e.target.value})} required />
          
          <button type="submit" className="btn-primary">SUBMIT DOCUMENTS</button>
        </form>
      </div>
      
      <div style={{ flex: 0.5 }}>
         <div className="glass-card" style={{ textAlign: 'center' }}>
            <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: '#1e293b', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #3b82f6' }}>
               <User size={60} color="#3b82f6" />
            </div>
            <p>Verification: <b>{user?.verificationStatus}</b></p>
         </div>
      </div>
    </div>
  );
}