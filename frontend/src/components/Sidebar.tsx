import React from 'react';
import { 
  LayoutDashboard, 
  FileEdit, 
  Files, 
  TrendingUp, 
  Sparkles,
  ShieldCheck,
  BookOpen,
  HelpCircle,
  Users
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { Award } from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate }) => {
  const { user } = useAuth();
  const isAdmin = !!(user?.is_admin || user?.username === 'dr_sharma' || user?.role?.includes('Admin') || user?.role?.includes('Chief Medical Officer'));

  const navItems = [
    ...(isAdmin ? [
      {
        id: 'admin-console',
        label: 'CMO Command Center',
        icon: Award,
        badge: 'ADMIN ONLY',
        isAdminExclusive: true
      }
    ] : []),
    {
      id: 'dashboard',
      label: 'PV Dashboard',
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'new-report',
      label: 'New ADR Case Entry',
      icon: FileEdit,
      badge: 'AI Assisted'
    },
    {
      id: 'reports-list',
      label: 'ADR Case Registry',
      icon: Files,
      badge: null
    },
    {
      id: 'analytics',
      label: 'Signals & Analytics',
      icon: TrendingUp,
      badge: null
    },
    {
      id: 'knowledge-base',
      label: 'Safety Reference',
      icon: BookOpen,
      badge: 'MedDRA'
    },
    {
      id: 'compliance',
      label: 'Compliance Hub',
      icon: ShieldCheck,
      badge: 'ICH E2B'
    },
    {
      id: 'about',
      label: 'About & Team',
      icon: Users,
      badge: null
    }
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between hidden md:flex shrink-0">
      <div className="space-y-6">
        <div>
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Main Navigation</p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              const isAdminItem = (item as any).isAdminExclusive;

              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isAdminItem
                      ? isActive
                        ? 'bg-gradient-to-r from-purple-950 to-indigo-950 text-amber-300 font-extrabold border border-purple-700 shadow-md ring-1 ring-amber-400/40'
                        : 'bg-purple-50/80 hover:bg-purple-100 text-purple-950 border border-purple-200/80 font-bold shadow-xs'
                      : isActive
                      ? 'bg-teal-50 text-teal-800 font-bold border border-teal-200 shadow-xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Icon className={`w-4 h-4 ${
                      isAdminItem ? (isActive ? 'text-amber-300' : 'text-purple-700') : (isActive ? 'text-teal-600' : 'text-slate-400')
                    }`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-extrabold ${
                      isAdminItem
                        ? 'bg-amber-400 text-slate-950 shadow-xs'
                        : isActive
                        ? 'bg-teal-200 text-teal-900'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Executive Medical Officer Authority Seal Box OR Standard Guidance Box */}
        {isAdmin ? (
          <div className="bg-gradient-to-br from-slate-950 via-purple-950 to-indigo-950 rounded-2xl p-4 text-white shadow-lg border border-purple-800/60 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-purple-500/20 rounded-full blur-xl pointer-events-none"></div>
            <div className="flex items-center space-x-2 text-amber-400 text-xs font-black uppercase tracking-wider mb-1">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Medical Authority</span>
            </div>
            <h4 className="text-xs font-bold text-white mb-0.5">Dr. Rajesh Sharma, MD</h4>
            <p className="text-[10px] text-purple-300 font-semibold mb-2">Chief Medical Officer & Verifier</p>
            <p className="text-[11px] text-purple-100/80 leading-relaxed mb-3">
              Direct case approvals, issue clinical revision directives, and validate ICH safety reports.
            </p>
            <div className="flex items-center space-x-1.5 text-[10px] text-amber-300 font-bold bg-purple-900/60 px-2.5 py-1.5 rounded-lg border border-amber-400/30">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Executive Verifier Active</span>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-4 text-white shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-teal-500/20 rounded-full blur-xl pointer-events-none"></div>
            <div className="flex items-center space-x-2 text-teal-400 text-xs font-bold uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Human-in-the-Loop</span>
            </div>
            <h4 className="text-xs font-bold text-white mb-1">ICH E2B Quality Assurance</h4>
            <p className="text-[11px] text-slate-300 leading-relaxed mb-3">
              AI suggestions must be verified by a clinician before official regulatory submission.
            </p>
            <div className="flex items-center space-x-1.5 text-[10px] text-teal-300 font-semibold bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-teal-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Assists • Never Replaces</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-slate-100 text-xs text-slate-400 space-y-1.5">
        <div className="flex items-center justify-between text-[11px]">
          <span>ICH E2B(R3) & CIOMS</span>
          <span className="font-semibold text-slate-600">Compliant</span>
        </div>
        <div className="flex items-center justify-between text-[11px]">
          <span>Causality Scale</span>
          <span className="font-semibold text-slate-600">Naranjo</span>
        </div>
        <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 text-center font-medium">
          Built by <span className="font-bold text-teal-800">Pushkar Madan</span> & <span className="font-bold text-teal-800">Priyansh Sharma</span>
        </div>
      </div>
    </aside>
  );
};
