import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Truck, ShieldAlert, ArrowRight } from 'lucide-react';
import '../App.css';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ 
    username: '', 
    email: '', 
    password: '', 
    confirmPassword: '', 
    role: 'ADMIN' 
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!isLogin && form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
    
    // Login payload: role, email, password. Register payload: adds username.
    const payload = isLogin 
      ? { email: form.email, password: form.password, role: form.role }
      : { username: form.username, email: form.email, password: form.password, role: form.role };

    try {
      const res = await axios.post(`http://localhost:8080${endpoint}`, payload);
      
      if (isLogin) {
        localStorage.setItem("username", res.data.username);
        localStorage.setItem("role", res.data.role);
        navigate("/dashboard", { state: { role: res.data.role } });
      } else {
        alert(res.data.message);
        setIsLogin(true);
        setForm({ ...form, password: '', confirmPassword: '' });
      }
    } catch (err) {
      setError(err.response?.data?.message || "Authentication failed. Please check your credentials.");
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="bg-glow"></div>
      <div className="glass-card" style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <Truck size={50} color="#3b82f6" style={{ marginBottom: '10px', display: 'inline-block' }} />
          <h1 style={{ margin: 0, fontStyle: 'italic', fontWeight: 900, color: 'white' }}>NEURO<span style={{ color: '#3b82f6' }}>FLEETX</span></h1>
        </div>

        {error && (
          <div className="error-box">
            <ShieldAlert size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">Workspace Role</label>
            <select className="custom-select" value={form.role} onChange={(e) => setForm({...form, role: e.target.value})}>
              <option value="ADMIN">Administrator</option>
              <option value="MANAGER">Fleet Manager</option>
              <option value="DRIVER">Driver</option>
              <option value="CUSTOMER">Customer</option>
            </select>
          </div>
          
          <div className="input-group">
            <input type="email" placeholder="Corporate Email" className="custom-input" required 
              value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} />
          </div>

          {!isLogin && (
            <div className="input-group">
              <input type="text" placeholder="Desired Username" className="custom-input" required 
                value={form.username} onChange={(e) => setForm({...form, username: e.target.value})} />
            </div>
          )}

          <div className="input-group">
            <input type="password" placeholder="Access Key" className="custom-input" required 
              value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} />
          </div>

          {!isLogin && (
            <div className="input-group">
              <input type="password" placeholder="Confirm Access Key" className="custom-input" required 
                value={form.confirmPassword} onChange={(e) => setForm({...form, confirmPassword: e.target.value})} />
            </div>
          )}

          <button type="submit" className="btn-primary">
            {isLogin ? "SECURE ACCESS" : "CREATE ACCOUNT"} <ArrowRight size={18} style={{ verticalAlign: 'middle', marginLeft: '5px' }} />
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '25px', color: '#94a3b8', fontSize: '12px' }}>
          {isLogin ? "New user request?" : "Already have access?"} 
          <span onClick={() => { setIsLogin(!isLogin); setError(""); }} style={{ color: '#3b82f6', fontWeight: 'bold', marginLeft: '5px', cursor: 'pointer' }}>
            {isLogin ? "Register Now" : "Login Now"}
          </span>
        </p>
      </div>
    </div>
  );
}