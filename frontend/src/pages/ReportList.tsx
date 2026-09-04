import React, { useEffect, useState } from 'react';
import { 
  Search, 
  Filter, 
  FileDown, 
  FileCode, 
  CheckCircle2, 
  ShieldAlert, 
  Clock, 
  Plus, 
  ArrowUpRight, 
  Sparkles,
  Calendar,
  X
} from 'lucide-react';
import { ADRReport } from '../types';
import { api } from '../services/api';
import { SkeletonTable } from '../components/LoadingSkeleton';

interface ReportListProps {
  onNavigate: (page: string, param?: any) => void;
}

export const ReportList: React.FC<ReportListProps> = ({ onNavigate }) => {
  const [reports, setReports] = useState<ADRReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [seriousFilter, setSeriousFilter] = useState<boolean | undefined>(undefined);
  const [drugFilter, setDrugFilter] = useState('');

  // 300ms Search Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const data = await api.getReports({
        search: debouncedSearch || undefined,
        status: statusFilter || undefined,
        is_serious: seriousFilter,
        drug_name: drugFilter || undefined
      });
      setReports(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [debouncedSearch, statusFilter, seriousFilter, drugFilter]);

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setSeriousFilter(undefined);
    setDrugFilter('');
  };

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
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      
      {/* Page Title & New Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Pharmacovigilance Case Registry</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Search, filter, and audit all adverse drug reaction records, CIOMS forms, and E2B submissions
          </p>
        </div>

        <button
          onClick={() => onNavigate('new-report')}
          className="flex items-center space-x-2 bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md shadow-teal-600/20 transition-all hover:scale-[1.01]"
        >
          <Sparkles className="w-4 h-4 text-teal-200" />
          <span>Report New ADR Case</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* Search Text */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search case #, patient, notes..."
              className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 outline-none"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-teal-500 outline-none bg-white font-medium text-slate-700"
            >
              <option value="">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="AI_EXTRACTED">AI Extracted</option>
              <option value="PENDING_REVIEW">In Review</option>
              <option value="VERIFIED_APPROVED">Verified & Approved</option>
              <option value="SUBMITTED">Submitted</option>
            </select>
          </div>

          {/* Seriousness Filter */}
          <div>
            <select
              value={seriousFilter === undefined ? '' : String(seriousFilter)}
              onChange={(e) => {
                const v = e.target.value;
                setSeriousFilter(v === '' ? undefined : v === 'true');
              }}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-teal-500 outline-none bg-white font-medium text-slate-700"
            >
              <option value="">All Seriousness</option>
              <option value="true">Serious Cases Only</option>
              <option value="false">Non-Serious Only</option>
            </select>
          </div>

          {/* Suspected Drug Filter */}
          <div className="flex space-x-2">
            <input
              type="text"
              value={drugFilter}
              onChange={(e) => setDrugFilter(e.target.value)}
              placeholder="Filter by drug name..."
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-teal-500 outline-none"
            />

            {(searchTerm || statusFilter || seriousFilter !== undefined || drugFilter) && (
              <button
                onClick={clearFilters}
                className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors shrink-0"
                title="Clear Filters"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Case Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-6">Case Reference</th>
                <th className="py-3.5 px-6">Patient</th>
                <th className="py-3.5 px-6">Suspected Drug(s)</th>
                <th className="py-3.5 px-6">Reaction Symptoms</th>
                <th className="py-3.5 px-6">Seriousness</th>
                <th className="py-3.5 px-6">Causality</th>
                <th className="py-3.5 px-6">Quality</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right">Exports & Review</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-6"><div className="h-4 w-24 bg-slate-200 rounded"></div></td>
                    <td className="py-4 px-6"><div className="h-4 w-20 bg-slate-200 rounded"></div></td>
                    <td className="py-4 px-6"><div className="h-4 w-28 bg-slate-200 rounded"></div></td>
                    <td className="py-4 px-6"><div className="h-4 w-32 bg-slate-200 rounded"></div></td>
                    <td className="py-4 px-6"><div className="h-5 w-16 bg-slate-200 rounded-full"></div></td>
                    <td className="py-4 px-6"><div className="h-4 w-16 bg-slate-200 rounded"></div></td>
                    <td className="py-4 px-6"><div className="h-4 w-12 bg-slate-200 rounded"></div></td>
                    <td className="py-4 px-6"><div className="h-5 w-20 bg-slate-200 rounded-full"></div></td>
                    <td className="py-4 px-6 text-right"><div className="h-7 w-20 bg-slate-200 rounded-lg ml-auto"></div></td>
                  </tr>
                ))
              ) : reports.length > 0 ? (
                reports.map((report) => {
                  const drug = report.suspected_medicines?.[0]?.drug_name || 'Unspecified';
                  const rxn = report.reactions?.[0]?.term || 'Unspecified';

                  return (
                    <tr key={report.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6 font-bold text-teal-800">
                        {report.report_number}
                        <span className="block text-[11px] text-slate-400 font-normal">
                          {new Date(report.created_at).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-700">
                        <span className="font-semibold">{report.patient_identifier || 'PT-XX'}</span>
                        <span className="block text-xs text-slate-400">
                          {report.patient_age ? `${report.patient_age}y` : ''} {report.patient_gender || ''}
                        </span>
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
                          <span className="text-[11px] text-purple-600 font-semibold block">
                            +{report.reactions.length - 1} more
                          </span>
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
                        <span className="text-xs font-bold text-slate-800">{report.causality_category || 'Possible'}</span>
                        <span className="block text-[10px] text-slate-400">Score: {report.causality_score}</span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`text-xs font-bold ${
                          report.completeness_score && report.completeness_score >= 80 ? 'text-emerald-700' : 'text-amber-700'
                        }`}>
                          {Math.round(report.completeness_score || 0)}%
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        {getStatusBadge(report.status)}
                      </td>
                      <td className="py-4 px-6 text-right space-x-1.5 whitespace-nowrap">
                        <a
                          href={api.getPdfExportUrl(report.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Download CIOMS I PDF"
                          className="p-1.5 inline-flex items-center text-teal-700 hover:bg-teal-50 rounded-lg border border-teal-200 transition-colors"
                        >
                          <FileDown className="w-3.5 h-3.5" />
                        </a>
                        <a
                          href={api.getE2bExportUrl(report.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Download E2B(R3) JSON"
                          className="p-1.5 inline-flex items-center text-indigo-700 hover:bg-indigo-50 rounded-lg border border-indigo-200 transition-colors"
                        >
                          <FileCode className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={() => onNavigate('report-detail', report.id)}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-sm transition-all"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 text-xs">
                    No matching ADR reports found.
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
