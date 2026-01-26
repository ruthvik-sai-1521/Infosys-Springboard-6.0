import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { User, Lock, Mail, ArrowRight, UserCircle, CheckCircle2 } from 'lucide-react';

const Register = () => {
    const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'CUSTOMER' });
    const [error, setError] = useState('');
    const { register } = useAuth();
    const navigate = useNavigate();
  
    const handleSubmit = async (e) => {
      e.preventDefault();
      setError('');
      const result = await register(formData.name, formData.email, formData.password, formData.role);
      if (result.success) {
        navigate('/login');
      } else {
        setError(result.message);
      }
    };

    // Dynamic info based on selected role
    const getRoleInfo = () => {
        switch(formData.role) {
            case 'DRIVER':
                return {
                    title: "For Fleet Drivers",
                    desc: "Join our network effectively.",
                    points: [
                        "Add and manage your vehicle information clearly.",
                        "Receive real-time route optimization.",
                        "Track your performance and earning analytics."
                    ]
                };
            case 'MANAGER':
                return {
                    title: "For Fleet Managers",
                    desc: "Control your operations.",
                    points: [
                        "Monitor fleet health and maintenance alerts.",
                        "Push notifications to drivers and customers.",
                        "Analyze service details and booking times."
                    ]
                };
            default: // CUSTOMER
                return {
                    title: "For Customers",
                    desc: "Experience seamless mobility.",
                    points: [
                        "Book vehicles with ease across the city.",
                        "Get AI-driven personalized recommendations.",
                        "Track rides and manage payment history."
                    ]
                };
        }
    };

    const roleInfo = getRoleInfo();

  return (
    <div className="min-h-screen flex bg-slate-950">
      {/* LEFT SIDE - Project Info */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 relative p-12 flex-col justify-between overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
           <div className="absolute top-[-20%] right-[10%] w-[60%] h-[60%] bg-emerald-600/10 rounded-full blur-[100px]"></div>
           <div className="absolute bottom-[10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[100px]"></div>
        </div>

        <div className="relative z-10">
            <h1 className="text-4xl font-bold font-sans text-white mb-2">
                Join <span className="text-emerald-400">NeuroFleetX</span>
            </h1>
            <p className="text-slate-400 text-lg">
                Create your account to access the future of urban mobility.
            </p>
        </div>

        {/* Dynamic Role Info Card */}
        <div className="relative z-10 bg-slate-800/50 backdrop-blur-md p-8 rounded-2xl border border-slate-700/50 transition-all duration-300">
            <div className="inline-block px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-full mb-4">
                {formData.role} ACCOUNT
            </div>
            <h3 className="text-2xl font-semibold text-white mb-2">{roleInfo.title}</h3>
            <p className="text-slate-400 mb-6">{roleInfo.desc}</p>
            
            <ul className="space-y-4">
                {roleInfo.points.map((point, index) => (
                    <li key={index} className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span className="text-slate-300 text-sm leading-relaxed">{point}</span>
                    </li>
                ))}
            </ul>
        </div>

        <div className="relative z-10 flex gap-6 text-slate-500 text-sm">
            <span className="hover:text-slate-300 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-slate-300 cursor-pointer">Terms of Service</span>
            <span className="hover:text-slate-300 cursor-pointer">Contact Support</span>
        </div>
      </div>

      {/* RIGHT SIDE - Register Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative">
        <div className="absolute inset-0 z-0 bg-slate-950">
             <div className="absolute top-0 right-0 w-full h-[50%] bg-gradient-to-b from-emerald-900/5 to-transparent"></div>
        </div>
        
        <div className="w-full max-w-md z-10">
            <div className="mb-8 pl-1">
                <h2 className="text-3xl font-bold text-white mb-2">Create Account</h2>
                <p className="text-slate-400">Fill in your details to get started.</p>
            </div>

            {error && (
                <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-red-400 rounded-full"></span>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                 <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300 ml-1">Account Type</label>
                    <div className="relative group">
                        <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5 group-focus-within:text-emerald-400 transition-colors" />
                        <select 
                            value={formData.role}
                            onChange={(e) => setFormData({...formData, role: e.target.value})}
                            className="w-full bg-slate-900/50 border border-slate-700 text-slate-200 text-sm rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 block pl-10 p-3.5 appearance-none cursor-pointer hover:bg-slate-900/80 transition-all shadow-sm"
                        >
                            <option value="CUSTOMER">Commuter / Customer</option>
                            <option value="DRIVER">Fleet Driver</option>
                            <option value="MANAGER">Fleet Manager</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300 ml-1">Full Name</label>
                    <div className="relative group">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5 group-focus-within:text-emerald-400 transition-colors" />
                        <input
                            type="text"
                            required
                            className="w-full bg-slate-900/50 border border-slate-700 text-slate-200 text-sm rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 block pl-10 p-3.5 placeholder-slate-600 transition-all shadow-sm focus:bg-slate-900"
                            placeholder="John Doe"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300 ml-1">Email Address</label>
                    <div className="relative group">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5 group-focus-within:text-emerald-400 transition-colors" />
                        <input
                            type="email"
                            required
                            className="w-full bg-slate-900/50 border border-slate-700 text-slate-200 text-sm rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 block pl-10 p-3.5 placeholder-slate-600 transition-all shadow-sm focus:bg-slate-900"
                            placeholder="name@company.com"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300 ml-1">Password</label>
                    <div className="relative group">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5 group-focus-within:text-emerald-400 transition-colors" />
                        <input
                            type="password"
                            required
                            className="w-full bg-slate-900/50 border border-slate-700 text-slate-200 text-sm rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 block pl-10 p-3.5 placeholder-slate-600 transition-all shadow-sm focus:bg-slate-900"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    className="w-full text-white bg-emerald-600 hover:bg-emerald-500 focus:ring-4 focus:outline-none focus:ring-emerald-800 font-medium rounded-xl text-sm px-5 py-3.5 text-center flex items-center justify-center gap-2 transform transition-all active:scale-[0.98] shadow-lg shadow-emerald-600/25 mt-4 group"
                >
                    Create Account <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
            </form>

            <p className="text-center mt-8 text-slate-400 text-sm">
                Already have an account?{' '}
                <Link to="/login" className="font-medium text-emerald-400 hover:text-emerald-300 transition-colors hover:underline">
                    Sign In
                </Link>
            </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
