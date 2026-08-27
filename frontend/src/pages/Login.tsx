import React, { useState, useEffect } from 'react';
import { Activity, ShieldCheck, Sparkles, User, Lock, ArrowRight, Stethoscope, Building2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { DemoAccount } from '../types';

interface LoginProps {
  onSuccess: () => void;
}

export const Login: React.FC<LoginProps> = ({ onSuccess }) => {
  const { login, loginWithDemo } = useAuth();
  const [username, setUsername] = useState('dr_sharma');
  const [password, setPassword] = useState('password123');
  const [demoAccounts, setDemoAccounts] = useState<DemoAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getDemoAccounts().then(setDemoAccounts).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      await login(username, password);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoClick = async (demo: DemoAccount) => {
    try {
      setLoading(true);
      setError('');
      await loginWithDemo(demo);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden relative z-10 p-8 space-y-6">
        
        {/* Brand & Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-600 to-cyan-500 flex items-center justify-center text-white mx-auto shadow-lg shadow-teal-600/30">
            <Activity className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">ADR-Sentinel AI</h2>
          <p className="text-xs text-slate-500">AI-Assisted Adverse Drug Reaction Reporting System</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Username / Clinical ID</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs shadow-md shadow-teal-600/20 transition-all hover:scale-[1.01]"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        {/* 1-Click Demo Personas */}
        <div className="pt-4 border-t border-slate-100 space-y-2">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">
            Quick Evaluation Demo Logins
          </p>

          <div className="space-y-2">
            {demoAccounts.map((demo) => (
              <button
                key={demo.username}
                type="button"
                onClick={() => handleDemoClick(demo)}
                className="w-full p-2.5 rounded-xl bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-300 text-left transition-all group flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-slate-800 group-hover:text-teal-900">{demo.name}</div>
                  <div className="text-[10px] text-slate-500">{demo.role} • {demo.department}</div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-0.5 transition-transform" />
              </button>
            ))}
          </div>
        </div>

        {/* Credits */}
        <div className="pt-2 text-center border-t border-slate-100">
          <p className="text-[11px] text-slate-500 font-medium">
            Built by <span className="text-teal-800 font-bold">Priyansh Sharma</span> and <span className="text-teal-800 font-bold">Pushkar Madan</span>
          </p>
        </div>

      </div>
    </div>
  );
};
