import React from 'react';
import { 
  LayoutDashboard, 
  FileEdit, 
  Files, 
  TrendingUp, 
  Sparkles,
  ShieldCheck,
  BookOpen,
  HelpCircle
} from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate }) => {
  const navItems = [
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
      badge: 'AI Powered'
    },
    {
      id: 'reports-list',
      label: 'ADR Case Registry',
      icon: Files,
      badge: null
    }
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between hidden md:flex">
      <div className="space-y-6">
        <div>
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Main Navigation</p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-teal-50 text-teal-800 font-semibold shadow-sm'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-teal-600' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-teal-100 text-teal-800 font-bold">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Clinical Guidance Box */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-4 text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-teal-500/20 rounded-full blur-xl pointer-events-none"></div>
          <div className="flex items-center space-x-2 text-teal-400 text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Human-in-the-Loop</span>
          </div>
          <h4 className="text-sm font-semibold text-white mb-1">ICH E2B Quality Assurance</h4>
          <p className="text-xs text-slate-300 leading-relaxed mb-3">
            AI suggestions must be verified by a clinician before official regulatory submission.
          </p>
          <div className="flex items-center space-x-1.5 text-[11px] text-teal-300 font-medium bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-teal-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Assists • Never Replaces</span>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-slate-100 text-xs text-slate-400 space-y-1">
        <div className="flex items-center justify-between">
          <span>ICH E2B(R3) & CIOMS</span>
          <span className="font-semibold text-slate-600">Compliant</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Causality</span>
          <span className="font-semibold text-slate-600">Naranjo Scale</span>
        </div>
      </div>
    </aside>
  );
};
