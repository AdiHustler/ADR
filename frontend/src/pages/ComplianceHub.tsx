import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  FileCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  Activity, 
  Building2, 
  Clock, 
  Lock, 
  FileCode, 
  FileDown,
  RefreshCw,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { api } from '../services/api';
import { ADRReport, DashboardStats } from '../types';

interface ComplianceHubProps {
  onNavigate?: (page: string, param?: any) => void;
}

export const ComplianceHub: React.FC<ComplianceHubProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [reports, setReports] = useState<ADRReport[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchComplianceData = async () => {
    try {
      setLoading(true);
      const [analyticsData, reportsData] = await Promise.all([
        api.getDashboardAnalytics(),
        api.getReports({ status: 'VERIFIED_APPROVED' })
      ]);
      setStats(analyticsData);
      setReports(reportsData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplianceData();
  }, []);

  const totalReports = stats?.total_reports || 0;
  const avgQuality = stats?.avg_completeness_score || 0;
  const approvedCount = stats?.verified_approved || 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-teal-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10">
          <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-4 h-4" />
            <span>ICH E2B(R3) & CIOMS I Compliance Gateway</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Regulatory Compliance & Audit Hub
          </h1>
          <p className="text-sm text-teal-100/90 mt-1 max-w-2xl">
            Live compliance monitoring, electronic safety report audit logs, 21 CFR Part 11 sign-off status, and automated CIOMS/E2B exports.
          </p>
        </div>
      </div>

      {/* Compliance Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Overall Quality Index</span>
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-slate-900">{avgQuality}%</span>
            <span className="text-xs text-emerald-600 font-bold">ICH Target: &gt;75%</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Average report completeness</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Transmission Ready</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <FileCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-emerald-600">{approvedCount}</span>
            <span className="text-xs text-slate-500">cases signed off</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Validated for electronic transfer</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gateway Status</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <Lock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-xl font-black text-blue-600">Online & Secure</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">ICH E2B(R3) AS2 / XML / JSON</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Audit Security</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-xl font-black text-purple-700">21 CFR Part 11</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Immutable cryptographic logs</p>
        </div>

      </div>

      {/* ICH 4-Minimum Criteria Verification Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-teal-600" />
            <h3 className="font-bold text-sm text-slate-900">ICH E2B 4 Minimum Reporting Criteria Status</h3>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
            100% Monitored
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">1. Identifiable Patient</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-xs text-slate-500">Patient initials, age, gender, or confidential identifier.</p>
            <span className="inline-block text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
              Mandatory ICH Element
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">2. Identifiable Reporter</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-xs text-slate-500">Healthcare professional name, clinical role, institution, contact.</p>
            <span className="inline-block text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
              Mandatory ICH Element
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">3. Suspected Medicine</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-xs text-slate-500">Brand or generic INN drug name, dose, route, start/stop dates.</p>
            <span className="inline-block text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
              Mandatory ICH Element
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">4. Adverse Reaction</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-xs text-slate-500">Clinical signs/symptoms mapped to MedDRA Preferred Terms (PT).</p>
            <span className="inline-block text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
              Mandatory ICH Element
            </span>
          </div>

        </div>
      </div>

      {/* Verified Cases Ready for Regulatory Transmission */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-sm text-slate-900">Verified Cases Ready for Transmission</h3>
            <p className="text-xs text-slate-500">Official CIOMS Form I and ICH E2B(R3) export packages</p>
          </div>

          <button
            onClick={fetchComplianceData}
            className="p-2 text-slate-500 hover:text-teal-600 hover:bg-slate-50 rounded-xl transition-colors"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {reports.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            No approved reports pending transmission. Review cases in the Case Registry to approve.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
                <tr>
                  <th className="py-2.5 px-3">Case ID</th>
                  <th className="py-2.5 px-3">Patient</th>
                  <th className="py-2.5 px-3">Suspect Medication</th>
                  <th className="py-2.5 px-3">Seriousness</th>
                  <th className="py-2.5 px-3">Completeness</th>
                  <th className="py-2.5 px-3 text-right">Regulatory Downloads</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-bold text-slate-900">{r.report_number}</td>
                    <td className="py-3 px-3 text-slate-600">{r.patient_identifier || 'PT-XX'}</td>
                    <td className="py-3 px-3 font-medium text-slate-800">
                      {r.suspected_medicines?.[0]?.drug_name || 'Unspecified'}
                    </td>
                    <td className="py-3 px-3">
                      {r.is_serious ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                          Serious
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                          Non-Serious
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-bold text-teal-700">{r.completeness_score}%</td>
                    <td className="py-3 px-3 text-right space-x-1.5">
                      <a
                        href={api.getPdfExportUrl(r.id)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 font-bold hover:bg-teal-100 transition-colors"
                      >
                        <FileDown className="w-3.5 h-3.5" />
                        <span>CIOMS I PDF</span>
                      </a>
                      <a
                        href={api.getE2bExportUrl(r.id)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-bold hover:bg-slate-200 transition-colors"
                      >
                        <FileCode className="w-3.5 h-3.5" />
                        <span>E2B(R3) JSON</span>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

    </div>
  );
};
