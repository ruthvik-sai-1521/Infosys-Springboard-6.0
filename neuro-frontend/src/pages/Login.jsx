import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { User, Lock, ArrowRight, UserCircle, Activity, Globe, Zap } from 'lucide-react';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '', role: 'CUSTOMER' });
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const result = await login(formData.email, formData.password, formData.role);
    if (result.success) {
      if (formData.role === 'ADMIN') navigate('/admin');
      else if (formData.role === 'MANAGER') navigate('/manager');
      else if (formData.role === 'DRIVER') navigate('/driver');
      else navigate('/dashboard');
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-950">
      {/* LEFT SIDE - Project Info */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 relative p-12 flex-col justify-between overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
           <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[100px]"></div>
           <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[100px]"></div>
        </div>

        <div className="relative z-10">
            <h1 className="text-5xl font-bold font-sans bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-6">
                NeuroFleetX
            </h1>
            <p className="text-xl text-slate-300 font-light leading-relaxed max-w-lg">
                Next-generation AI-driven platform designed to optimize urban mobility and fleet operations.
            </p>
        </div>

        <div className="relative z-10 space-y-8">
            <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-500/10 rounded-lg">
                    <Globe className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-slate-200">Smart City Integration</h3>
                    <p className="text-slate-400 text-sm">Real-time tracking and intelligent routing for modern cities.</p>
                </div>
            </div>
             <div className="flex items-start gap-4">
                <div className="p-3 bg-purple-500/10 rounded-lg">
                    <Zap className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-slate-200">Dynamic Fleet Allocation</h3>
                    <p className="text-slate-400 text-sm">AI-powered optimization for EV fleets and ride-sharing.</p>
                </div>
            </div>
             <div className="flex items-start gap-4">
                <div className="p-3 bg-emerald-500/10 rounded-lg">
                    <Activity className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-slate-200">Predictive Maintenance</h3>
                    <p className="text-slate-400 text-sm">Monitor vehicle health and prevent downtime before it happens.</p>
                </div>
            </div>
        </div>

        <div className="relative z-10 text-slate-500 text-sm">
            &copy; 2026 NeuroFleetX Inc. All rights reserved.
        </div>
      </div>

      {/* RIGHT SIDE - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative">
        <div className="absolute inset-0 z-0 bg-slate-950">
             <div className="absolute bottom-0 left-0 w-full h-[50%] bg-gradient-to-t from-blue-900/5 to-transparent"></div>
        </div>
        
        <div className="w-full max-w-md z-10">
            <div className="mb-8 pl-1">
                <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
                <p className="text-slate-400">Please access your account based on your role.</p>
            </div>

            {error && (
                <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-red-400 rounded-full"></span>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300 ml-1">Select Role</label>
                    <div className="relative group">
                        <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5 group-focus-within:text-blue-400 transition-colors" />
                        <select 
                            value={formData.role}
                            onChange={(e) => setFormData({...formData, role: e.target.value})}
                            className="w-full bg-slate-900/50 border border-slate-700 text-slate-200 text-sm rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 block pl-10 p-3.5 appearance-none cursor-pointer hover:bg-slate-900/80 transition-all shadow-sm"
                        >
                            <option value="CUSTOMER">Fleet Customer</option>
                            <option value="DRIVER">Fleet Driver</option>
                            <option value="MANAGER">Fleet Manager</option>
                            <option value="ADMIN">Fleet Administrator</option>
                        </select>
                         <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300 ml-1">Email Address</label>
                    <div className="relative group">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5 group-focus-within:text-blue-400 transition-colors" />
                        <input
                            type="email"
                            required
                            className="w-full bg-slate-900/50 border border-slate-700 text-slate-200 text-sm rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 block pl-10 p-3.5 placeholder-slate-600 transition-all shadow-sm focus:bg-slate-900"
                            placeholder="name@company.com"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between items-center ml-1">
                        <label className="text-sm font-medium text-slate-300">Password</label>
                        <button type="button" className="text-xs text-blue-400 hover:text-blue-300 transition-colors bg-transparent border-none cursor-pointer p-0">Forgot Password?</button>
                    </div>
                    <div className="relative group">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5 group-focus-within:text-blue-400 transition-colors" />
                        <input
                            type="password"
                            required
                            className="w-full bg-slate-900/50 border border-slate-700 text-slate-200 text-sm rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 block pl-10 p-3.5 placeholder-slate-600 transition-all shadow-sm focus:bg-slate-900"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    className="w-full text-white bg-blue-600 hover:bg-blue-500 focus:ring-4 focus:outline-none focus:ring-blue-800 font-medium rounded-xl text-sm px-5 py-3.5 text-center flex items-center justify-center gap-2 transform transition-all active:scale-[0.98] shadow-lg shadow-blue-600/25 mt-4 group"
                >
                    Sign In <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
            </form>

            <p className="text-center mt-8 text-slate-400 text-sm">
                Don't have an account yet?{' '}
                <Link to="/register" className="font-medium text-blue-400 hover:text-blue-300 transition-colors hover:underline">
                    Create Account
                </Link>
            </p>
        </div>
      </div>
    </div>
  );
};

export default Login;