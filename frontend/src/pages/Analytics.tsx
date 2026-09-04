import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  BarChart3, 
  ShieldAlert, 
  HeartPulse, 
  Pill, 
  PieChart, 
  Activity,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { DashboardStats } from '../types';
import { api } from '../services/api';
import { SkeletonChart } from '../components/LoadingSkeleton';

export const Analytics: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDashboardAnalytics().then(setStats).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-16">
        <div>
          <div className="h-8 w-64 bg-slate-200 rounded animate-pulse mb-2"></div>
          <div className="h-4 w-96 bg-slate-100 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SkeletonChart />
          <SkeletonChart />
          <SkeletonChart />
          <SkeletonChart />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      
      {/* Title */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Pharmacovigilance Signals & Analytics</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Real-time safety surveillance, disproportionality detection, and reaction patterns
        </p>
      </div>

      {/* Grid 1: Causality Distribution & Seriousness */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Naranjo Causality Breakdown */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <PieChart className="w-5 h-5 text-teal-600" />
            <h3 className="font-bold text-sm text-slate-900">Causality Assessment Distribution (Naranjo)</h3>
          </div>

          <div className="space-y-3">
            {stats?.causality_distribution && Object.entries(stats.causality_distribution).map(([cat, count]) => {
              const pct = stats.total_reports > 0 ? Math.round((count / stats.total_reports) * 100) : 0;
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-700">{cat} Causality</span>
                    <span className="text-slate-500">{count} cases ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full ${
                        cat === 'Definite' ? 'bg-purple-600' :
                        cat === 'Probable' ? 'bg-emerald-500' :
                        cat === 'Possible' ? 'bg-amber-500' : 'bg-slate-400'
                      }`}
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Seriousness Criteria Breakdown */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <ShieldAlert className="w-5 h-5 text-rose-600" />
            <h3 className="font-bold text-sm text-slate-900">Regulatory Seriousness Criteria</h3>
          </div>

          <div className="space-y-3">
            {stats?.seriousness_distribution && Object.entries(stats.seriousness_distribution).map(([crit, count]) => {
              const pct = stats.total_reports > 0 ? Math.round((count / stats.total_reports) * 100) : 0;
              return (
                <div key={crit} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-700">{crit}</span>
                    <span className="text-slate-500">{count} reports ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-rose-500 h-2 rounded-full"
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Grid 2: Suspected Drugs & Reactions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Culprit Medicines */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <Pill className="w-5 h-5 text-teal-600" />
            <h3 className="font-bold text-sm text-slate-900">Most Frequently Implicated Medications</h3>
          </div>

          <div className="space-y-2.5">
            {stats?.top_suspected_drugs && stats.top_suspected_drugs.map((d, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                <span className="font-bold text-slate-800">{d.name}</span>
                <span className="font-bold px-2 py-0.5 rounded-md bg-teal-100 text-teal-800">
                  {d.count} report{d.count > 1 ? 's' : ''}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Reaction Terms */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <HeartPulse className="w-5 h-5 text-purple-600" />
            <h3 className="font-bold text-sm text-slate-900">Reported Reaction Terms (MedDRA)</h3>
          </div>

          <div className="space-y-2.5">
            {stats?.top_reactions && stats.top_reactions.map((r, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                <span className="font-semibold text-slate-800">{r.term}</span>
                <span className="font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-800">
                  {r.count} event{r.count > 1 ? 's' : ''}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
