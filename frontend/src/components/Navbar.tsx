import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Activity, 
  UserCheck, 
  ChevronDown, 
  LogOut, 
  Sparkles,
  FilePlus,
  Building2,
  Stethoscope
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { DemoAccount } from '../types';

interface NavbarProps {
  onNavigate: (page: string) => void;
  currentPage: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigate, currentPage }) => {
  const { user, logout, loginWithDemo } = useAuth();
  const [demoAccounts, setDemoAccounts] = useState<DemoAccount[]>([]);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setApiKey(val);
    if (val) {
      localStorage.setItem('gemini_api_key', val);
    } else {
      localStorage.removeItem('gemini_api_key');
    }
  };

  useEffect(() => {
    api.getDemoAccounts().then(setDemoAccounts).catch(() => {});
  }, []);

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'Physician':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'Clinical Pharmacist':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Pharmacovigilance Officer':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo & Title */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onNavigate('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-teal-500/20">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-900 text-lg tracking-tight">ADR-Sentinel AI</span>
                <span className="bg-teal-100 text-teal-800 text-xs px-2 py-0.5 rounded-full font-semibold border border-teal-300">
                  v1.0
                </span>
              </div>
              <p className="text-xs text-slate-500">AI-Assisted Pharmacovigilance & Clinical Reporting</p>
            </div>
          </div>

          {/* Quick Actions & Role Switcher */}
          <div className="flex items-center space-x-4">
            

            {/* Quick New ADR Report Button */}
            <button
              onClick={() => onNavigate('new-report')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm ${
                currentPage === 'new-report'
                  ? 'bg-teal-700 text-white ring-2 ring-teal-500/30'
                  : 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-600/20 hover:shadow-md'
              }`}
            >
              <Sparkles className="w-4 h-4 text-teal-200 animate-pulse" />
              <span>Report Suspected ADR</span>
            </button>

            {/* Role / User Switcher Dropdown */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                  className="flex items-center space-x-3 p-1.5 pr-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-700 font-semibold text-xs">
                    {user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="text-left hidden md:block">
                    <p className="text-xs font-semibold text-slate-900 leading-none">{user.full_name}</p>
                    <span className={`inline-block mt-0.5 text-[10px] px-1.5 py-0.2 rounded border font-medium ${getRoleBadgeColor(user.role)}`}>
                      {user.role}
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {showRoleDropdown && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Current User</p>
                      <p className="text-sm font-bold text-slate-800">{user.full_name}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3 h-3" /> {user.institution || 'Medical Center'}
                      </p>
                    </div>

                    <div className="px-3 py-2">
                      <p className="text-[11px] font-semibold text-slate-400 uppercase px-2 mb-1">Switch Clinical Persona</p>
                      {demoAccounts.map((demo) => (
                        <button
                          key={demo.username}
                          onClick={() => {
                            loginWithDemo(demo);
                            setShowRoleDropdown(false);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                            user.username === demo.username ? 'bg-teal-50 text-teal-800 font-medium' : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div>
                            <div className="font-semibold">{demo.name}</div>
                            <div className="text-[10px] text-slate-500">{demo.role}</div>
                          </div>
                          {user.username === demo.username && (
                            <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                          )}
                        </button>
                      ))}
                    </div>

                    <div className="border-t border-slate-100 pt-1">
                      <button
                        onClick={() => {
                          logout();
                          setShowRoleDropdown(false);
                          onNavigate('login');
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center space-x-2 font-medium"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>

        </div>
      </div>
    </header>
  );
};
