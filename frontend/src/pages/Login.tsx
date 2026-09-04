import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  ShieldCheck, 
  Sparkles, 
  User, 
  Lock, 
  ArrowRight, 
  Stethoscope, 
  Building2,
  Mail,
  UserPlus,
  LogIn,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { DemoAccount, RegisterPayload } from '../types';

interface LoginProps {
  onSuccess: () => void;
}

export const Login: React.FC<LoginProps> = ({ onSuccess }) => {
  const { login, register, loginWithDemo } = useAuth();
  
  // Tab state: 'login' | 'signup'
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');

  // Login form state
  const [username, setUsername] = useState('dr_sharma');
  const [password, setPassword] = useState('password123');

  // Signup form state
  const [signupForm, setSignupForm] = useState<RegisterPayload>({
    full_name: '',
    username: '',
    email: '',
    role: 'Physician',
    department: 'Internal Medicine',
    institution: 'University Teaching Hospital',
    password: ''
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [demoAccounts, setDemoAccounts] = useState<DemoAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    api.getDemoAccounts().then(setDemoAccounts).catch(() => {});
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      await login(username, password);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Invalid username or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const validateSignup = (): boolean => {
    const errors: Record<string, string> = {};

    if (!signupForm.full_name.trim()) {
      errors.full_name = 'Full name is required.';
    }

    if (!signupForm.username.trim() || signupForm.username.length < 3) {
      errors.username = 'Username must be at least 3 characters.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!signupForm.email.trim() || !emailRegex.test(signupForm.email)) {
      errors.email = 'Please provide a valid professional email address.';
    }

    if (!signupForm.password || signupForm.password.length < 6) {
      errors.password = 'Password must be at least 6 characters.';
    }

    if (signupForm.password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateSignup()) return;

    try {
      setLoading(true);
      setError('');
      setSuccessMessage('');
      await register(signupForm);
      setSuccessMessage('Account created successfully! Redirecting to clinical dashboard...');
      setTimeout(() => {
        onSuccess();
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Username or email may already be in use.');
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      
      {/* Background ambient glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden relative z-10 p-6 sm:p-8 space-y-6">
        
        {/* Brand & Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-600 to-cyan-500 flex items-center justify-center text-white mx-auto shadow-lg shadow-teal-600/30">
            <Activity className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">ADR-Sentinel AI</h2>
          <p className="text-xs text-slate-500">Clinical Pharmacovigilance & Adverse Reaction System</p>
        </div>

        {/* Tab Selector: Login vs Signup */}
        <div className="flex p-1 bg-slate-100 rounded-2xl">
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setError('');
              setFieldErrors({});
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
              activeTab === 'login'
                ? 'bg-white text-teal-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('signup');
              setError('');
              setFieldErrors({});
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
              activeTab === 'signup'
                ? 'bg-white text-teal-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Create Account</span>
          </button>
        </div>

        {/* Error / Success Feedback Banners */}
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center space-x-2 animate-pulse">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* 1. SIGN IN TAB FORM */}
        {activeTab === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Username / Clinical ID</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. dr_sharma"
                  required
                  className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
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
                  placeholder="••••••••"
                  required
                  className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs shadow-md shadow-teal-600/20 transition-all hover:scale-[1.01]"
            >
              {loading ? 'Authenticating Clinical Session...' : 'Sign In to Workspace'}
            </button>
          </form>
        )}

        {/* 2. SIGN UP TAB FORM */}
        {activeTab === 'signup' && (
          <form onSubmit={handleSignupSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-0.5">Full Name & Title</label>
              <input
                type="text"
                value={signupForm.full_name}
                onChange={(e) => setSignupForm({ ...signupForm, full_name: e.target.value })}
                placeholder="e.g. Dr. Priya Sen, MD"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-teal-500 outline-none"
              />
              {fieldErrors.full_name && <p className="text-[10px] text-rose-600 mt-0.5">{fieldErrors.full_name}</p>}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-0.5">Username</label>
                <input
                  type="text"
                  value={signupForm.username}
                  onChange={(e) => setSignupForm({ ...signupForm, username: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                  placeholder="dr_priya"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-teal-500 outline-none"
                />
                {fieldErrors.username && <p className="text-[10px] text-rose-600 mt-0.5">{fieldErrors.username}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-0.5">Clinical Role</label>
                <select
                  value={signupForm.role}
                  onChange={(e) => setSignupForm({ ...signupForm, role: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-teal-500 outline-none bg-white font-medium text-slate-700"
                >
                  <option value="Physician">Physician (MD)</option>
                  <option value="Clinical Pharmacist">Clinical Pharmacist</option>
                  <option value="Pharmacovigilance Officer">PV Officer</option>
                  <option value="Nurse Specialist">Nurse Specialist</option>
                  <option value="Clinical Researcher">Clinical Researcher</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-0.5">Work / Institutional Email</label>
              <input
                type="email"
                value={signupForm.email}
                onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                placeholder="priya.sen@hospital.org"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-teal-500 outline-none"
              />
              {fieldErrors.email && <p className="text-[10px] text-rose-600 mt-0.5">{fieldErrors.email}</p>}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-0.5">Institution</label>
                <input
                  type="text"
                  value={signupForm.institution}
                  onChange={(e) => setSignupForm({ ...signupForm, institution: e.target.value })}
                  placeholder="Hospital Name"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-teal-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-0.5">Department</label>
                <input
                  type="text"
                  value={signupForm.department}
                  onChange={(e) => setSignupForm({ ...signupForm, department: e.target.value })}
                  placeholder="Cardiology / PV"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-teal-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-0.5">Password</label>
                <input
                  type="password"
                  value={signupForm.password}
                  onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                  placeholder="min 6 chars"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-teal-500 outline-none"
                />
                {fieldErrors.password && <p className="text-[10px] text-rose-600 mt-0.5">{fieldErrors.password}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-0.5">Confirm</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="re-enter password"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-teal-500 outline-none"
                />
                {fieldErrors.confirmPassword && <p className="text-[10px] text-rose-600 mt-0.5">{fieldErrors.confirmPassword}</p>}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-2 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs shadow-md shadow-teal-600/20 transition-all hover:scale-[1.01]"
            >
              {loading ? 'Creating Clinical Account...' : 'Register & Access System'}
            </button>
          </form>
        )}

        {/* 1-Click Demo Personas */}
        <div className="pt-3 border-t border-slate-100 space-y-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">
            Or Click to Sign In Instantly As Demo Persona:
          </p>

          <div className="space-y-1.5">
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

        {/* Credits with Pushkar Madan first, Priyansh Sharma last */}
        <div className="pt-2 text-center border-t border-slate-100">
          <p className="text-[11px] text-slate-500 font-medium">
            Built by <span className="text-teal-800 font-bold">Pushkar Madan</span> and <span className="text-teal-800 font-bold">Priyansh Sharma</span>
          </p>
        </div>

      </div>
    </div>
  );
};
