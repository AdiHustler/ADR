import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-200/80 py-4 px-4 sm:px-6 lg:px-8 mt-auto text-xs text-slate-500">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-teal-500"></div>
          <span className="font-semibold text-slate-700">ADR-Sentinel AI</span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-500">ICH E2B(R3) & CIOMS I Pharmacovigilance System</span>
        </div>
        
        <div className="flex items-center space-x-1.5 text-slate-600">
          <span>Built by</span>
          <span className="font-bold text-teal-800 bg-teal-50 border border-teal-200/60 px-2 py-0.5 rounded-md">
            Priyansh Sharma
          </span>
          <span className="text-slate-400 font-medium">&</span>
          <span className="font-bold text-teal-800 bg-teal-50 border border-teal-200/60 px-2 py-0.5 rounded-md">
            Pushkar Madan
          </span>
        </div>
      </div>
    </footer>
  );
};
