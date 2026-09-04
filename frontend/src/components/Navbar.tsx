import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  ChevronDown, 
  LogOut, 
  Sparkles, 
  Building2, 
  Menu,
  X,
  LayoutDashboard,
  Files,
  TrendingUp,
  BookOpen,
  ShieldCheck,
  Users,
  Bot
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { DemoAccount } from '../types';

interface NavbarProps {
  onNavigate: (page: string) => void;
  currentPage: string;
  onOpenChat?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigate, currentPage, onOpenChat }) => {
  const { user, logout, loginWithDemo } = useAuth();
  const [demoAccounts, setDemoAccounts] = useState<DemoAccount[]>([]);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const navLinks = [
    { id: 'dashboard', label: 'PV Dashboard', icon: LayoutDashboard },
    { id: 'new-report', label: 'New ADR Case', icon: Sparkles, highlight: true },
    { id: 'reports-list', label: 'Case Registry', icon: Files },
    { id: 'analytics', label: 'Signals & Analytics', icon: TrendingUp },
    { id: 'knowledge-base', label: 'Safety Reference', icon: BookOpen },
    { id: 'compliance', label: 'Compliance Hub', icon: ShieldCheck },
    { id: 'about', label: 'About & Team', icon: Users }
  ];

  const handleMobileNav = (page: string) => {
    onNavigate(page);
    setMobileMenuOpen(false);
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo & Title */}
          <div className="flex items-center space-x-2.5 sm:space-x-3 cursor-pointer" onClick={() => onNavigate('dashboard')}>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-teal-500/20 shrink-0">
              <Activity className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <span className="font-extrabold text-slate-900 text-base sm:text-lg tracking-tight">ADR-Sentinel AI</span>
                <span className="bg-teal-100 text-teal-800 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full font-bold border border-teal-300">
                  v2.0
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-500 hidden sm:block">ICH E2B(R3) & CIOMS Pharmacovigilance</p>
            </div>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-3">
            
            {/* AI Assistant Copilot Trigger */}
            {onOpenChat && (
              <button
                onClick={onOpenChat}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition-colors shadow-xs"
              >
                <Bot className="w-4 h-4 text-teal-600 animate-pulse" />
                <span>AI Clinical Copilot</span>
              </button>
            )}

            {/* Quick New ADR Report Button */}
            <button
              onClick={() => onNavigate('new-report')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                currentPage === 'new-report'
                  ? 'bg-teal-700 text-white ring-2 ring-teal-500/30'
                  : 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-600/20 hover:scale-[1.01]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-200" />
              <span>Report Suspected ADR</span>
            </button>

            {/* Role / User Switcher Dropdown */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                  className="flex items-center space-x-2.5 p-1.5 pr-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-teal-100 border border-teal-200 flex items-center justify-center text-teal-800 font-bold text-xs">
                    {user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-slate-900 leading-none">{user.full_name.split(',')[0]}</p>
                    <span className={`inline-block mt-0.5 text-[9px] px-1.5 py-0.2 rounded border font-semibold ${getRoleBadgeColor(user.role)}`}>
                      {user.role}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {showRoleDropdown && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Signed In User</p>
                      <p className="text-xs font-bold text-slate-900 mt-0.5">{user.full_name}</p>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3 h-3" /> {user.institution || 'Medical Center'}
                      </p>
                    </div>

                    <div className="px-3 py-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase px-2 mb-1">Switch Clinical Persona</p>
                      {demoAccounts.map((demo) => (
                        <button
                          key={demo.username}
                          onClick={() => {
                            loginWithDemo(demo);
                            setShowRoleDropdown(false);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                            user.username === demo.username ? 'bg-teal-50 text-teal-800 font-bold' : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div>
                            <div className="font-semibold">{demo.name}</div>
                            <div className="text-[10px] text-slate-400">{demo.role}</div>
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
                        className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center space-x-2 font-bold"
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

          {/* Mobile Right Controls: AI Bot & Hamburger Menu */}
          <div className="flex md:hidden items-center space-x-2">
            {onOpenChat && (
              <button
                onClick={onOpenChat}
                className="p-2 rounded-xl text-teal-700 bg-teal-50 border border-teal-200"
                title="Open AI Copilot"
              >
                <Bot className="w-5 h-5" />
              </button>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-16 z-50 bg-slate-900/40 backdrop-blur-xs flex flex-col">
          <div className="bg-white border-b border-slate-200 p-4 space-y-4 shadow-xl max-h-[85vh] overflow-y-auto">
            
            {/* Quick Report CTA */}
            <button
              onClick={() => handleMobileNav('new-report')}
              className="w-full flex items-center justify-center space-x-2 bg-teal-600 text-white py-3 rounded-xl font-bold text-xs shadow-md shadow-teal-600/20"
            >
              <Sparkles className="w-4 h-4" />
              <span>Report Suspected ADR</span>
            </button>

            {/* Navigation Links */}
            <div className="space-y-1 pt-2">
              <p className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Navigation Menu</p>
              {navLinks.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleMobileNav(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                      isActive
                        ? 'bg-teal-50 text-teal-800 font-bold border border-teal-200'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-teal-600' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Clinical Persona Switcher on Mobile */}
            {user && (
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <div className="px-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Signed In As</p>
                  <p className="text-xs font-bold text-slate-900">{user.full_name}</p>
                  <span className={`inline-block mt-0.5 text-[9px] px-1.5 py-0.2 rounded border font-semibold ${getRoleBadgeColor(user.role)}`}>
                    {user.role} • {user.institution || 'Medical Center'}
                  </span>
                </div>

                <div className="pt-2">
                  <p className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Switch Persona</p>
                  <div className="grid grid-cols-1 gap-1">
                    {demoAccounts.map((demo) => (
                      <button
                        key={demo.username}
                        onClick={() => {
                          loginWithDemo(demo);
                          setMobileMenuOpen(false);
                        }}
                        className={`text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between ${
                          user.username === demo.username ? 'bg-teal-50 text-teal-800 font-bold' : 'hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        <span>{demo.name} ({demo.role.split(' ')[0]})</span>
                        {user.username === demo.username && <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                    onNavigate('login');
                  }}
                  className="w-full mt-2 py-2 px-3 text-left text-xs text-rose-600 hover:bg-rose-50 rounded-xl flex items-center space-x-2 font-bold"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}

          </div>
          
          <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}
    </header>
  );
};
