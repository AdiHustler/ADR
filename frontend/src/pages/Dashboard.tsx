import React, { useEffect, useState } from 'react';
import { 
  ShieldAlert, 
  FileCheck2, 
  Clock, 
  Activity, 
  Sparkles, 
  ArrowUpRight, 
  Plus, 
  Search, 
  Filter, 
  FileText,
  AlertTriangle,
  HeartPulse,
  Pill,
  BarChart3,
  Download
} from 'lucide-react';
import { DashboardStats, ADRReport } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface DashboardProps {
  onNavigate: (page: string, param?: any) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await api.getDashboardAnalytics();
      setStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'VERIFIED_APPROVED':
        return <span className="px-2.5 py-1 text-xs rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">Verified & Approved</span>;
      case 'SUBMITTED':
        return <span className="px-2.5 py-1 text-xs rounded-full font-bold bg-blue-100 text-blue-800 border border-blue-300">Submitted</span>;
      case 'PENDING_REVIEW':
        return <span className="px-2.5 py-1 text-xs rounded-full font-bold bg-amber-100 text-amber-800 border border-amber-300">In Review</span>;
      default:
        return <span className="px-2.5 py-1 text-xs rounded-full font-bold bg-slate-100 text-slate-700 border border-slate-300">Draft</span>;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Welcome Banner */}
      <div className="bg-gradient-to-r from-teal-800 via-teal-700 to-cyan-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center space-x-2 text-teal-200 text-xs font-bold uppercase tracking-wider mb-2">
              <Activity className="w-4 h-4" />
              <span>Pharmacovigilance Intelligence Hub</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {user?.full_name || 'Clinician'}
            </h1>
            <p className="text-sm text-teal-100/90 mt-1 max-w-2xl">
              AI-assisted extraction, completeness audits, and clinical verification for adverse drug reactions.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => onNavigate('new-report')}
              className="flex items-center space-x-2 bg-white hover:bg-teal-50 text-teal-900 px-5 py-3 rounded-2xl font-bold text-sm shadow-lg shadow-teal-950/20 hover:scale-[1.02] transition-all"
            >
              <Sparkles className="w-4 h-4 text-teal-600" />
              <span>New AI-Assisted ADR Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Reports */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total ADR Cases</span>
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-slate-900">{stats?.total_reports ?? '--'}</span>
            <span className="text-xs text-slate-500 font-medium">registered cases</span>
          </div>
          <div className="mt-2 text-xs text-teal-700 font-medium flex items-center">
            <span>Avg. Quality Score: {stats?.avg_completeness_score ?? '--'}%</span>
          </div>
        </div>

        {/* Serious Cases */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Serious Events</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center font-bold">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-rose-600">{stats?.serious_reports ?? '--'}</span>
            <span className="text-xs text-slate-500 font-medium">expedited attention</span>
          </div>
          <div className="mt-2 text-xs text-rose-600 font-medium flex items-center">
            <AlertTriangle className="w-3.5 h-3.5 mr-1" />
            <span>Requires prompt ICH regulatory review</span>
          </div>
        </div>

        {/* Pending Clinical Review */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Awaiting Review</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-amber-600">{stats?.pending_review ?? '--'}</span>
            <span className="text-xs text-slate-500 font-medium">pending verification</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 font-medium">
            <span>Human sign-off required</span>
          </div>
        </div>

        {/* Verified & Approved */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Clinically Verified</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <FileCheck2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-emerald-600">{stats?.verified_approved ?? '--'}</span>
            <span className="text-xs text-slate-500 font-medium">approved reports</span>
          </div>
          <div className="mt-2 text-xs text-emerald-700 font-medium">
            <span>Ready for CIOMS / E2B transmission</span>
          </div>
        </div>

      </div>

      {/* Signal Distribution & Top Drugs Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Top Suspected Culprit Drugs */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Pill className="w-5 h-5 text-teal-600" />
              <h3 className="font-bold text-slate-900 text-sm">Top Suspected Medicines</h3>
            </div>
            <span className="text-xs text-slate-400">Signals</span>
          </div>

          <div className="space-y-3">
            {stats?.top_suspected_drugs && stats.top_suspected_drugs.length > 0 ? (
              stats.top_suspected_drugs.map((drug, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100/70 transition-colors">
                  <div className="flex items-center space-x-3">
                    <span className="w-6 h-6 rounded-lg bg-teal-100 text-teal-800 text-xs font-bold flex items-center justify-center">
                      {index + 1}
                    </span>
                    <span className="text-sm font-bold text-slate-800">{drug.name}</span>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 bg-white rounded-lg border border-slate-200 text-slate-700">
                    {drug.count} case{drug.count > 1 ? 's' : ''}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">No drug signals recorded yet</p>
            )}
          </div>
        </div>

        {/* Top Reactions MedDRA */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <HeartPulse className="w-5 h-5 text-rose-600" />
              <h3 className="font-bold text-slate-900 text-sm">Frequent Adverse Reactions</h3>
            </div>
            <span className="text-xs text-slate-400">MedDRA PT</span>
          </div>

          <div className="space-y-3">
            {stats?.top_reactions && stats.top_reactions.length > 0 ? (
              stats.top_reactions.map((rxn, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100/70 transition-colors">
                  <div className="flex items-center space-x-3">
                    <span className="w-6 h-6 rounded-lg bg-rose-100 text-rose-800 text-xs font-bold flex items-center justify-center">
                      {index + 1}
                    </span>
                    <span className="text-sm font-semibold text-slate-800 line-clamp-1">{rxn.term}</span>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 bg-white rounded-lg border border-slate-200 text-slate-700 shrink-0">
                    {rxn.count} event{rxn.count > 1 ? 's' : ''}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">No reaction signals recorded yet</p>
            )}
          </div>
        </div>

        {/* Seriousness & Causality Breakdown */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">Seriousness Distribution</h3>
              </div>
            </div>

            <div className="space-y-2.5">
              {stats?.seriousness_distribution && Object.entries(stats.seriousness_distribution).map(([crit, count]) => {
                if (count === 0 && crit !== 'Life Threatening' && crit !== 'Hospitalization') return null;
                return (
                  <div key={crit} className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-medium">{crit}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-teal-600 h-1.5 rounded-full"
                          style={{ width: `${Math.min(100, (count / (stats.total_reports || 1)) * 100)}%` }}
                        ></div>
                      </div>
                      <span className="font-bold text-slate-800 w-4 text-right">{count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <button
              onClick={() => onNavigate('analytics')}
              className="w-full py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 transition-colors flex items-center justify-center space-x-1.5"
            >
              <span>Explore Advanced Signals & Causality</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* Recent Case Registry Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Recent Adverse Drug Reaction Reports</h3>
            <p className="text-xs text-slate-500">Live stream of suspected ADR entries and clinical verification status</p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => onNavigate('reports-list')}
              className="text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-3.5 py-2 rounded-xl transition-colors flex items-center space-x-1"
            >
              <span>View Full Registry ({stats?.total_reports || 0})</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-6">Case Number</th>
                <th className="py-3.5 px-6">Patient</th>
                <th className="py-3.5 px-6">Suspected Drug</th>
                <th className="py-3.5 px-6">Reaction</th>
                <th className="py-3.5 px-6">Seriousness</th>
                <th className="py-3.5 px-6">Quality</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {stats?.recent_reports && stats.recent_reports.length > 0 ? (
                stats.recent_reports.map((report) => {
                  const drug = report.suspected_medicines?.[0]?.drug_name || 'Unspecified';
                  const rxn = report.reactions?.[0]?.term || 'Unspecified';

                  return (
                    <tr key={report.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6 font-bold text-teal-800">
                        {report.report_number}
                      </td>
                      <td className="py-4 px-6 text-slate-700">
                        <span className="font-semibold">{report.patient_identifier || 'PT-XX'}</span>
                        <span className="block text-xs text-slate-400">{report.patient_age ? `${report.patient_age}y` : ''} {report.patient_gender || ''}</span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-bold text-slate-900">{drug}</span>
                        {report.suspected_medicines?.[0]?.dose && (
                          <span className="block text-xs text-slate-500">{report.suspected_medicines[0].dose}</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-medium text-slate-800">{rxn}</span>
                        {report.reactions && report.reactions.length > 1 && (
                          <span className="text-[11px] text-teal-600 font-semibold block">+{report.reactions.length - 1} more symptom(s)</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        {report.is_serious ? (
                          <span className="inline-flex items-center space-x-1 text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                            <ShieldAlert className="w-3 h-3" />
                            <span>Serious</span>
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500 font-medium">Non-serious</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-xs font-bold text-slate-700">{Math.round(report.completeness_score || 0)}%</span>
                      </td>
                      <td className="py-4 px-6">
                        {getStatusBadge(report.status)}
                      </td>
                      <td className="py-4 px-6 text-right space-x-2">
                        <button
                          onClick={() => onNavigate('report-detail', report.id)}
                          className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 rounded-lg shadow-sm transition-all"
                        >
                          Inspect & Review
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                    No ADR reports recorded yet. Click "New AI-Assisted ADR Report" above to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
