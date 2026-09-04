import React, { useEffect, useState } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  FileText, 
  Send, 
  ArrowRight, 
  Sparkles, 
  Filter, 
  Download, 
  ExternalLink, 
  ChevronRight, 
  MessageSquare, 
  ShieldAlert, 
  Award, 
  Stethoscope, 
  RefreshCw,
  Building2,
  FileCode,
  FileDown,
  Check,
  Search
} from 'lucide-react';
import { ADRReport, DashboardStats } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { CompletenessBadge } from '../components/CompletenessBadge';

interface AdminConsoleProps {
  onNavigate: (page: string, param?: any) => void;
}

export const AdminConsole: React.FC<AdminConsoleProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const isAdmin = !!(user?.is_admin || user?.username === 'dr_sharma' || user?.role?.includes('Admin') || user?.role?.includes('Chief Medical Officer'));

  const [reports, setReports] = useState<ADRReport[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'ALL_PENDING' | 'SERIOUS_ONLY' | 'REVISIONS_REQUESTED' | 'ALL'>('ALL_PENDING');
  const [searchTerm, setSearchTerm] = useState('');

  // Fast Review Modal State
  const [selectedReport, setSelectedReport] = useState<ADRReport | null>(null);
  const [actionType, setActionType] = useState<'APPROVE' | 'REQUEST_CHANGES' | 'REJECT'>('APPROVE');
  const [feedbackNotes, setFeedbackNotes] = useState('');
  const [submittingDecision, setSubmittingDecision] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [reportsData, analyticsData] = await Promise.all([
        api.getReports(),
        api.getDashboardAnalytics()
      ]);
      setReports(reportsData);
      setStats(analyticsData);
    } catch (err) {
      console.error('Failed to load Admin Console data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openFastReview = (report: ADRReport, defaultAction: 'APPROVE' | 'REQUEST_CHANGES' | 'REJECT' = 'APPROVE') => {
    setSelectedReport(report);
    setActionType(defaultAction);
    setFeedbackNotes(report.admin_feedback || report.verification_notes || '');
  };

  const handleDecisionSubmit = async () => {
    if (!selectedReport) return;
    try {
      setSubmittingDecision(true);
      const updated = await api.verifyReport(selectedReport.id, {
        approved: actionType === 'APPROVE',
        action: actionType,
        verification_notes: feedbackNotes,
        admin_feedback: feedbackNotes
      });

      // Update local reports state
      setReports(prev => prev.map(r => r.id === updated.id ? updated : r));
      setSelectedReport(null);
      await loadData();
    } catch (err: any) {
      alert('Error recording decision: ' + (err.message || 'Server error'));
    } finally {
      setSubmittingDecision(false);
    }
  };

  // Filter reports according to selection
  const filteredReports = reports.filter(rep => {
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchNum = rep.report_number.toLowerCase().includes(q);
      const matchPatient = (rep.patient_identifier || '').toLowerCase().includes(q);
      const matchDrug = rep.suspected_medicines.some(m => m.drug_name.toLowerCase().includes(q));
      if (!matchNum && !matchPatient && !matchDrug) return false;
    }

    if (activeFilter === 'ALL_PENDING') {
      return rep.status === 'PENDING_REVIEW' || rep.status === 'AI_EXTRACTED' || rep.status === 'DRAFT';
    }
    if (activeFilter === 'SERIOUS_ONLY') {
      return rep.is_serious;
    }
    if (activeFilter === 'REVISIONS_REQUESTED') {
      return rep.status === 'CHANGES_REQUESTED';
    }
    return true;
  });

  const pendingCount = reports.filter(r => r.status === 'PENDING_REVIEW' || r.status === 'AI_EXTRACTED' || r.status === 'DRAFT').length;
  const seriousCount = reports.filter(r => r.is_serious && r.status !== 'SUBMITTED').length;
  const revisionsCount = reports.filter(r => r.status === 'CHANGES_REQUESTED').length;
  const verifiedCount = reports.filter(r => r.status === 'VERIFIED_APPROVED' || r.status === 'SUBMITTED').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20 animate-in fade-in duration-200">
      
      {/* Executive Command Header */}
      <div className="bg-gradient-to-r from-slate-950 via-purple-950 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-2xl border border-purple-800/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2.5">
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center space-x-1.5">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span>Executive Medical Governance</span>
              </span>
              <span className="text-xs text-purple-300 font-bold">•</span>
              <span className="text-xs text-purple-200 font-semibold">Institutional ADR Sign-Off Authority</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center space-x-3">
              <span>Chief Medical Officer Command Center</span>
            </h1>

            <p className="text-xs sm:text-sm text-purple-200/90 max-w-2xl leading-relaxed">
              Logged in under authority of <strong className="text-white">Dr. Rajesh Sharma, MD</strong>. Direct case approvals, return clinical revision directives, and enforce ICH E2B(R3) compliance across the healthcare network.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={loadData}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-purple-900/60 hover:bg-purple-800 text-purple-200 text-xs font-bold border border-purple-700/50 shadow-sm transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Queue</span>
            </button>

            <button
              onClick={() => onNavigate('compliance')}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02]"
            >
              <ShieldCheck className="w-4 h-4 text-slate-950" />
              <span>ICH Regulatory Audit</span>
            </button>
          </div>
        </div>
      </div>

      {/* Chief Medical Officer KPI Command Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Pending Triage Card */}
        <div 
          onClick={() => setActiveFilter('ALL_PENDING')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer shadow-sm ${
            activeFilter === 'ALL_PENDING'
              ? 'bg-purple-900 text-white border-purple-700 ring-2 ring-purple-500/30'
              : 'bg-white hover:bg-purple-50/50 border-slate-200 text-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${activeFilter === 'ALL_PENDING' ? 'text-purple-200' : 'text-slate-500'}`}>
              Pending Decision
            </span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${activeFilter === 'ALL_PENDING' ? 'bg-purple-800 text-purple-100' : 'bg-purple-100 text-purple-800'}`}>
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-black">{pendingCount}</span>
            <span className={`text-xs font-semibold ${activeFilter === 'ALL_PENDING' ? 'text-purple-200' : 'text-slate-500'}`}>cases awaiting CMO</span>
          </div>
          <p className="text-[11px] mt-2 font-medium opacity-80">Primary verification queue</p>
        </div>

        {/* Serious Expedited Cases */}
        <div 
          onClick={() => setActiveFilter('SERIOUS_ONLY')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer shadow-sm ${
            activeFilter === 'SERIOUS_ONLY'
              ? 'bg-rose-900 text-white border-rose-700 ring-2 ring-rose-500/30'
              : 'bg-white hover:bg-rose-50/50 border-slate-200 text-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${activeFilter === 'SERIOUS_ONLY' ? 'text-rose-200' : 'text-slate-500'}`}>
              Urgent / Serious
            </span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${activeFilter === 'SERIOUS_ONLY' ? 'bg-rose-800 text-rose-100' : 'bg-rose-100 text-rose-800'}`}>
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className={`text-3xl font-black ${activeFilter === 'SERIOUS_ONLY' ? 'text-white' : 'text-rose-600'}`}>{seriousCount}</span>
            <span className={`text-xs font-semibold ${activeFilter === 'SERIOUS_ONLY' ? 'text-rose-200' : 'text-slate-500'}`}>15-day expedited</span>
          </div>
          <p className="text-[11px] mt-2 font-medium opacity-80">Requires immediate medical review</p>
        </div>

        {/* Revisions Requested */}
        <div 
          onClick={() => setActiveFilter('REVISIONS_REQUESTED')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer shadow-sm ${
            activeFilter === 'REVISIONS_REQUESTED'
              ? 'bg-amber-900 text-white border-amber-700 ring-2 ring-amber-500/30'
              : 'bg-white hover:bg-amber-50/50 border-slate-200 text-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${activeFilter === 'REVISIONS_REQUESTED' ? 'text-amber-200' : 'text-slate-500'}`}>
              Awaiting Clinician Edit
            </span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${activeFilter === 'REVISIONS_REQUESTED' ? 'bg-amber-800 text-amber-100' : 'bg-amber-100 text-amber-800'}`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-black">{revisionsCount}</span>
            <span className={`text-xs font-semibold ${activeFilter === 'REVISIONS_REQUESTED' ? 'text-amber-200' : 'text-slate-500'}`}>directives issued</span>
          </div>
          <p className="text-[11px] mt-2 font-medium opacity-80">Feedback sent to submitters</p>
        </div>

        {/* Verified & Transmitted */}
        <div 
          onClick={() => setActiveFilter('ALL')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer shadow-sm ${
            activeFilter === 'ALL'
              ? 'bg-emerald-900 text-white border-emerald-700 ring-2 ring-emerald-500/30'
              : 'bg-white hover:bg-emerald-50/50 border-slate-200 text-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${activeFilter === 'ALL' ? 'text-emerald-200' : 'text-slate-500'}`}>
              Total Verified
            </span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${activeFilter === 'ALL' ? 'bg-emerald-800 text-emerald-100' : 'bg-emerald-100 text-emerald-800'}`}>
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-black">{verifiedCount}</span>
            <span className={`text-xs font-semibold ${activeFilter === 'ALL' ? 'text-emerald-200' : 'text-slate-500'}`}>cleared cases</span>
          </div>
          <p className="text-[11px] mt-2 font-medium opacity-80">Audit approved records</p>
        </div>

      </div>

      {/* Main Triage Section */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
        
        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
              <Filter className="w-4 h-4 text-purple-700" />
              <span>Triage Queue Filter:</span>
            </span>
            
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setActiveFilter('ALL_PENDING')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors ${
                  activeFilter === 'ALL_PENDING' ? 'bg-purple-700 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Needs Review ({pendingCount})
              </button>
              <button
                onClick={() => setActiveFilter('SERIOUS_ONLY')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors ${
                  activeFilter === 'SERIOUS_ONLY' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Expedited Serious ({seriousCount})
              </button>
              <button
                onClick={() => setActiveFilter('REVISIONS_REQUESTED')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors ${
                  activeFilter === 'REVISIONS_REQUESTED' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Revisions ({revisionsCount})
              </button>
              <button
                onClick={() => setActiveFilter('ALL')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors ${
                  activeFilter === 'ALL' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                All Records ({reports.length})
              </button>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter by drug, patient, case #..."
              className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-200 outline-none"
            />
          </div>
        </div>

        {/* Cases List */}
        {loading ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-10 h-10 border-4 border-purple-700 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-slate-500 font-semibold">Loading Chief Medical Officer Verification Queue...</p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="py-16 text-center space-y-2 bg-slate-50 rounded-2xl border border-slate-100">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h4 className="text-sm font-bold text-slate-800">All Cases In This Category Are Cleared</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No reports currently match the selected filter. You have reviewed all pending clinical cases in this queue.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredReports.map((report) => {
              const isPending = report.status === 'PENDING_REVIEW' || report.status === 'AI_EXTRACTED' || report.status === 'DRAFT';
              const isApproved = report.status === 'VERIFIED_APPROVED' || report.status === 'SUBMITTED';
              const isRevisions = report.status === 'CHANGES_REQUESTED';
              const isRejected = report.status === 'REJECTED';

              return (
                <div 
                  key={report.id}
                  className={`p-4 rounded-2xl border transition-all hover:shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                    report.is_serious 
                      ? 'bg-rose-50/30 border-rose-200/80 hover:border-rose-300' 
                      : isPending 
                      ? 'bg-purple-50/20 border-purple-200/80 hover:border-purple-300' 
                      : isRevisions
                      ? 'bg-amber-50/20 border-amber-200/80'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  {/* Left Info */}
                  <div className="space-y-2 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => onNavigate('report-detail', report.id)}
                        className="font-extrabold text-sm text-purple-950 hover:text-purple-700 hover:underline flex items-center space-x-1"
                      >
                        <span>{report.report_number}</span>
                        <ExternalLink className="w-3.5 h-3.5 text-purple-500" />
                      </button>

                      {report.is_serious ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                          Serious ADR (15-Day)
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          Standard
                        </span>
                      )}

                      {/* Status Badges */}
                      {isApproved && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center space-x-1">
                          <Check className="w-3 h-3" />
                          <span>Approved & Verified</span>
                        </span>
                      )}
                      {isPending && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-300 animate-pulse">
                          Awaiting CMO Decision
                        </span>
                      )}
                      {isRevisions && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          Revisions Requested
                        </span>
                      )}
                      {isRejected && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                          Case Rejected
                        </span>
                      )}

                      <span className="text-[11px] text-slate-400 font-medium">
                        Score: <strong>{report.completeness_score || 0}%</strong>
                      </span>
                    </div>

                    {/* Suspected Drug & Reactions */}
                    <div className="text-xs text-slate-700 flex flex-wrap items-center gap-x-4 gap-y-1">
                      <div>
                        <span className="text-slate-400 font-medium">Drug: </span>
                        <strong className="text-slate-900">
                          {report.suspected_medicines.map(m => m.drug_name).join(', ') || 'Unspecified'}
                        </strong>
                        {report.suspected_medicines[0]?.dose && ` (${report.suspected_medicines[0].dose})`}
                      </div>

                      <div>
                        <span className="text-slate-400 font-medium">Reaction: </span>
                        <span className="font-semibold text-rose-900">
                          {report.reactions.map(r => r.term).join(', ') || 'Adverse Event'}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 font-medium">Causality: </span>
                        <span className="font-semibold text-teal-800">
                          {report.causality_category || 'Possible'} ({report.causality_score || 0})
                        </span>
                      </div>
                    </div>

                    {/* Clinical Narrative snippet or Feedback */}
                    {report.admin_feedback ? (
                      <p className="text-[11px] text-purple-900 bg-purple-50 p-2 rounded-xl border border-purple-200/70 font-medium">
                        <strong>CMO Directive:</strong> "{report.admin_feedback}"
                      </p>
                    ) : report.clinical_narrative ? (
                      <p className="text-[11px] text-slate-500 line-clamp-1 italic">
                        "{report.clinical_narrative}"
                      </p>
                    ) : null}
                  </div>

                  {/* Fast Action Buttons */}
                  <div className="flex items-center space-x-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    
                    {/* View Details */}
                    <button
                      onClick={() => onNavigate('report-detail', report.id)}
                      className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                      title="Open Full Clinical Case File"
                    >
                      Case File
                    </button>

                    {/* Quick Approve Action */}
                    <button
                      onClick={() => openFastReview(report, 'APPROVE')}
                      className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition-all ${
                        isApproved
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isApproved ? 'Approved' : 'Approve'}</span>
                    </button>

                    {/* Quick Request Revision Action */}
                    <button
                      onClick={() => openFastReview(report, 'REQUEST_CHANGES')}
                      className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                        isRevisions
                          ? 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                          : 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs'
                      }`}
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Directives</span>
                    </button>

                    {/* Quick Reject Action */}
                    <button
                      onClick={() => openFastReview(report, 'REJECT')}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-rose-100 text-slate-400 hover:text-rose-700 transition-colors"
                      title="Reject Case"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>

                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Chief Medical Officer Fast Decision Drawer / Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-100 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-900 flex items-center justify-center font-bold">
                  <Stethoscope className="w-5 h-5 text-purple-800" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Chief Medical Officer Fast Decision: {selectedReport.report_number}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Patient: {selectedReport.patient_age ? `${selectedReport.patient_age} yo ${selectedReport.patient_gender || ''}` : 'Age unknown'} • Drug: {selectedReport.suspected_medicines.map(m => m.drug_name).join(', ') || 'N/A'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedReport(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Action Buttons: Approve, Changes, Reject */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Executive Action:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setActionType('APPROVE')}
                  className={`p-3 rounded-2xl border text-center transition-all ${
                    actionType === 'APPROVE'
                      ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-bold ring-2 ring-emerald-500/20'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                  <span className="text-xs">Approve & Sign-Off</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActionType('REQUEST_CHANGES')}
                  className={`p-3 rounded-2xl border text-center transition-all ${
                    actionType === 'REQUEST_CHANGES'
                      ? 'bg-amber-50 border-amber-400 text-amber-950 font-bold ring-2 ring-amber-500/20'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4 text-amber-600 mx-auto mb-1" />
                  <span className="text-xs">Request Revisions</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActionType('REJECT')}
                  className={`p-3 rounded-2xl border text-center transition-all ${
                    actionType === 'REJECT'
                      ? 'bg-rose-50 border-rose-400 text-rose-950 font-bold ring-2 ring-rose-500/20'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  <XCircle className="w-4 h-4 text-rose-600 mx-auto mb-1" />
                  <span className="text-xs">Reject Case</span>
                </button>
              </div>
            </div>

            {/* Quick Templates */}
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Clinical Template Directives:
              </p>
              <div className="flex flex-wrap gap-1">
                {[
                  "Causality verified via Naranjo score. Chronology confirms drug relationship. Approved for registry.",
                  "Please clarify dechallenge timeline and confirm whether patient had concomitant antibiotics.",
                  "Recommend monitoring liver function enzymes and obtaining follow-up serum creatinine.",
                  "Insufficient evidence of drug-induced etiology; symptoms are consistent with viral exanthem."
                ].map((template, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setFeedbackNotes(template)}
                    className="text-[10px] text-slate-700 bg-slate-100 hover:bg-purple-100 hover:text-purple-900 px-2 py-1 rounded-lg border border-slate-200 transition-colors text-left"
                  >
                    + {template.slice(0, 42)}...
                  </button>
                ))}
              </div>
            </div>

            {/* Directive Text Area */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Clinical Directives & Feedback:
              </label>
              <textarea
                rows={3}
                value={feedbackNotes}
                onChange={(e) => setFeedbackNotes(e.target.value)}
                placeholder="Enter clinical assessment notes or instructions for the reporting clinician..."
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:border-purple-500 outline-none"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={submittingDecision}
                onClick={handleDecisionSubmit}
                className={`flex items-center space-x-1.5 px-6 py-2.5 rounded-xl text-white text-xs font-bold shadow-md transition-all ${
                  actionType === 'APPROVE'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : actionType === 'REQUEST_CHANGES'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>
                  {submittingDecision 
                    ? 'Recording...' 
                    : actionType === 'APPROVE' 
                    ? 'Confirm Sign-Off & Approve' 
                    : actionType === 'REQUEST_CHANGES'
                    ? 'Send Revision Directives'
                    : 'Confirm Rejection'}
                </span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
