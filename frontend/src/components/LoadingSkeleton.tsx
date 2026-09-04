import React from 'react';

export const SkeletonCard: React.FC = () => (
  <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm animate-pulse space-y-3">
    <div className="flex items-center justify-between">
      <div className="h-3 w-24 bg-slate-200 rounded"></div>
      <div className="w-8 h-8 bg-slate-200 rounded-xl"></div>
    </div>
    <div className="h-8 w-16 bg-slate-200 rounded"></div>
    <div className="h-2.5 w-32 bg-slate-100 rounded"></div>
  </div>
);

export const SkeletonTable: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3 animate-pulse">
    <div className="h-10 bg-slate-100 rounded-xl mb-4"></div>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0 gap-4">
        <div className="h-4 w-28 bg-slate-200 rounded"></div>
        <div className="h-4 w-20 bg-slate-200 rounded hidden sm:block"></div>
        <div className="h-4 w-32 bg-slate-200 rounded"></div>
        <div className="h-6 w-20 bg-slate-200 rounded-full"></div>
        <div className="h-8 w-16 bg-slate-200 rounded-lg"></div>
      </div>
    ))}
  </div>
);

export const SkeletonChart: React.FC = () => (
  <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4 animate-pulse">
    <div className="h-4 w-48 bg-slate-200 rounded"></div>
    <div className="space-y-3 pt-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-1.5">
          <div className="flex justify-between">
            <div className="h-3 w-28 bg-slate-200 rounded"></div>
            <div className="h-3 w-12 bg-slate-200 rounded"></div>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2"></div>
        </div>
      ))}
    </div>
  </div>
);
