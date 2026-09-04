import React, { useEffect, useState } from 'react';
import { 
  FileText, 
  ArrowLeft, 
  CheckCircle2, 
  Download, 
  Clock, 
  ShieldAlert, 
  ShieldCheck, 
  User, 
  Pill, 
  Activity, 
  AlertTriangle, 
  Share2, 
  Send, 
  Edit3,
  Calendar,
  Sparkles,
  Building2,
  FileCode,
  FileDown,
  XCircle,
  MessageSquare,
  Shield,
  Award
} from 'lucide-react';
import { ADRReport } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { CompletenessBadge } from '../components/CompletenessBadge';

interface ReportDetailProps {
  reportId: number;
  onNavigate: (page: string, param?: any) => void;
}

export const ReportDetail: React.FC<ReportDetailProps> = ({ reportId, onNavigate }) => {
  const { user } = useAuth();
  const isAdmin = !!(user?.is_admin || user?.username === 'dr_sharma' || user?.role?.includes('Admin') || user?.role?.includes('Chief Medical Officer'));

  const [report, setReport] = useState<ADRReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [verificationAction, setVerificationAction] = useState<'APPROVE' | 'REQUEST_CHANGES' | 'REJECT'>('APPROVE');
  const [verificationNotes, setVerificationNotes] = useState('');
  const [showVerifyModal, setShowVerifyModal] = useState(false);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const data = await api.getReportById(reportId);
      setReport(data);
      if (data.admin_feedback) {
        setVerificationNotes(data.admin_feedback);
      } else if (data.verification_notes) {
        setVerificationNotes(data.verification_notes);
      }
    } catch (err: any) {
      alert('Failed to load report: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportId]);

  const handleVerify = async (action: 'APPROVE' | 'REQUEST_CHANGES' | 'REJECT') => {
    try {
      setVerifying(true);
      const updated = await api.verifyReport(reportId, {
        approved: action === 'APPROVE',
        action,
        verification_notes: verificationNotes,
        admin_feedback: verificationNotes
      });
      setReport(updated);
      setShowVerifyModal(false);
    } catch (err: any) {
      alert('Verification error: ' + err.message);
    } finally {
      setVerifying(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const updated = await api.submitReport(reportId);
      setReport(updated);
      alert('ADR Report successfully transmitted to the National Pharmacovigilance Centre!');
    } catch (err: any) {
      alert('Submission error: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-500 font-semibold">Loading ADR Case File #{reportId}...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-slate-600">Report not found.</p>
        <button onClick={() => onNavigate('dashboard')} className="mt-3 text-xs text-teal-600 font-bold">
          Return to Dashboard
        </button>
      </div>
    );
  }

  const isVerified = report.status === 'VERIFIED_APPROVED' || report.status === 'SUBMITTED';

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      
      {/* Executive Chief Medical Officer Sign-Off & Action Bar */}
      {isAdmin && (
        <div className="bg-gradient-to-r from-slate-950 via-purple-950 to-indigo-950 p-4 sm:p-5 rounded-3xl border border-purple-700/60 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 font-bold shrink-0 shadow-inner">
              <Award className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 bg-purple-900/80 px-2 py-0.5 rounded border border-amber-400/30">
                  CMO Executive Review Console
                </span>
                <span className="text-purple-400 text-xs">•</span>
                <span className="text-xs text-slate-200 font-bold">Dr. Rajesh Sharma, MD</span>
              </div>
              <p className="text-xs text-purple-200 mt-0.5">
                Current Case Status: <strong className="text-white uppercase tracking-wider">{report.status.replace('_', ' ')}</strong>
                {report.verified_at && ` • Signed off on ${new Date(report.verified_at).toLocaleDateString()}`}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => {
                setVerificationAction('APPROVE');
                setShowVerifyModal(true);
              }}
              className={`flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                report.status === 'VERIFIED_APPROVED' || report.status === 'SUBMITTED'
                  ? 'bg-emerald-800 text-emerald-100 border border-emerald-500/40'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30 hover:scale-[1.02]'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{report.status === 'VERIFIED_APPROVED' ? 'Approved ✓' : 'Approve & Sign-Off'}</span>
            </button>

            <button
              onClick={() => {
                setVerificationAction('REQUEST_CHANGES');
                setShowVerifyModal(true);
              }}
              className={`flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                report.status === 'CHANGES_REQUESTED'
                  ? 'bg-amber-800 text-amber-100 border border-amber-500/40'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-900/30 hover:scale-[1.02]'
              }`}
            >
              <AlertTriangle className="w-4 h-4 text-slate-950" />
              <span>Request Revisions</span>
            </button>

            <button
              onClick={() => {
                setVerificationAction('REJECT');
                setShowVerifyModal(true);
              }}
              className="flex items-center space-x-1.5 px-3 py-2.5 rounded-xl bg-purple-900/60 hover:bg-rose-900/80 text-purple-200 hover:text-rose-200 border border-purple-700/50 text-xs font-bold transition-colors"
            >
              <XCircle className="w-4 h-4" />
              <span>Reject</span>
            </button>
          </div>
        </div>
      )}

      {/* Top Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => onNavigate('reports-list')}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-xl font-extrabold text-slate-900">{report.report_number}</h1>
              {report.is_serious ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                  Serious ADR
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
                  Non-Serious
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Registered on {new Date(report.created_at).toLocaleDateString()} by {report.reporter_name || 'Healthcare Professional'}
            </p>
          </div>
        </div>

        {/* Action Buttons: CIOMS PDF & E2B JSON Export */}
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={api.getPdfExportUrl(report.id)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200 shadow-sm transition-all"
          >
            <FileDown className="w-4 h-4 text-teal-600" />
            <span>Export CIOMS I (PDF)</span>
          </a>

          <a
            href={api.getE2bExportUrl(report.id)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200 shadow-sm transition-all"
          >
            <FileCode className="w-4 h-4 text-indigo-600" />
            <span>Export E2B(R3) JSON</span>
          </a>

          {isAdmin ? (
            <button
              onClick={() => {
                setVerificationAction(report.status === 'CHANGES_REQUESTED' ? 'REQUEST_CHANGES' : 'APPROVE');
                setShowVerifyModal(true);
              }}
              className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shadow-md shadow-purple-700/20 transition-all hover:scale-[1.01]"
            >
              <ShieldCheck className="w-4 h-4 text-purple-200" />
              <span>{isVerified ? 'Update CMO Sign-Off' : 'Review & Verify (Admin)'}</span>
            </button>
          ) : (
            <div className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold">
              <Shield className="w-3.5 h-3.5 text-purple-600" />
              <span>{isVerified ? 'Clinically Approved by CMO' : 'Awaiting CMO Review'}</span>
            </div>
          )}

          {isVerified && report.status !== 'SUBMITTED' && (
            <button
              disabled={submitting}
              onClick={handleSubmit}
              className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all hover:scale-[1.01]"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'Transmitting...' : 'Submit to National PV Centre'}</span>
            </button>
          )}

          {report.status === 'SUBMITTED' && (
            <span className="px-4 py-2 rounded-xl bg-blue-50 text-blue-800 text-xs font-bold border border-blue-200 flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Transmitted to National Registry</span>
            </span>
          )}
        </div>
      </div>

      {/* Completeness Checklist Indicator */}
      <CompletenessBadge
        score={report.completeness_score || 0}
        missingFields={report.ai_missing_fields || []}
        ichCriteriaMet={report.ich_criteria_met || false}
      />

      {/* Verification Sign-Off Status Banner */}
      <div className={`rounded-2xl p-5 border shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
        report.status === 'VERIFIED_APPROVED' || report.status === 'SUBMITTED'
          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
          : report.status === 'CHANGES_REQUESTED'
          ? 'bg-amber-50/70 border-amber-200 text-amber-950'
          : report.status === 'REJECTED'
          ? 'bg-rose-50/70 border-rose-200 text-rose-950'
          : 'bg-indigo-50/70 border-indigo-200 text-indigo-950'
      }`}>
        <div className="flex items-start space-x-3">
          {report.status === 'VERIFIED_APPROVED' || report.status === 'SUBMITTED' ? (
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
          ) : report.status === 'CHANGES_REQUESTED' ? (
            <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
          ) : report.status === 'REJECTED' ? (
            <XCircle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
          ) : (
            <Clock className="w-6 h-6 text-indigo-600 shrink-0 mt-0.5" />
          )}
          <div>
            <h4 className="text-sm font-bold">
              {report.status === 'VERIFIED_APPROVED' || report.status === 'SUBMITTED'
                ? 'Clinical Verification Confirmed by CMO'
                : report.status === 'CHANGES_REQUESTED'
                ? 'Clinical Revisions Requested by CMO (Dr. Rajesh Sharma, MD)'
                : report.status === 'REJECTED'
                ? 'Case Rejected by Chief Medical Officer'
                : 'Pending Chief Medical Officer Verification (Dr. Rajesh Sharma, MD)'}
            </h4>
            <p className="text-xs mt-0.5 opacity-90">
              {report.status === 'VERIFIED_APPROVED' || report.status === 'SUBMITTED'
                ? `Officially signed off by ${report.verified_by?.full_name || 'Dr. Rajesh Sharma, MD (CMO)'} on ${report.verified_at ? new Date(report.verified_at).toLocaleString() : 'N/A'}. Clinical note: "${report.admin_feedback || report.verification_notes || 'All entities clinically verified.'}"`
                : report.status === 'CHANGES_REQUESTED'
                ? `Dr. Rajesh Sharma requested modifications: "${report.admin_feedback || report.verification_notes}". Please review clinical feedback below.`
                : report.status === 'REJECTED'
                ? `Case closed with clinical rationale: "${report.admin_feedback || report.verification_notes}".`
                : 'This case was extracted with AI assistance and is currently awaiting human-in-the-loop review and approval by the Chief Medical Officer.'}
            </p>
          </div>
        </div>

        {isAdmin && !isVerified && (
          <button
            onClick={() => {
              setVerificationAction('APPROVE');
              setShowVerifyModal(true);
            }}
            className="text-xs font-bold px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white shadow-sm transition-colors whitespace-nowrap"
          >
            Review & Verify
          </button>
        )}
      </div>

      {/* Dedicated Chief Medical Officer Review & Clinical Feedback Card */}
      {(report.admin_feedback || report.verification_notes) && (
        <div className="rounded-2xl p-5 border bg-white shadow-sm border-purple-200/80 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-xs border border-purple-200">
                RS
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="text-xs font-bold text-slate-900">
                    {report.verified_by?.full_name || 'Dr. Rajesh Sharma, MD'}
                  </h4>
                  <span className="text-[9px] px-1.5 py-0.2 rounded font-extrabold bg-purple-600 text-white uppercase tracking-wider">
                    Chief Medical Officer
                  </span>
                </div>
                <p className="text-[10px] text-slate-500">
                  {report.verified_at ? `Reviewed on ${new Date(report.verified_at).toLocaleString()}` : 'Official Clinical Assessment'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {report.status === 'VERIFIED_APPROVED' && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Approved for Submission</span>
                </span>
              )}
              {report.status === 'CHANGES_REQUESTED' && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center space-x-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Revisions Required</span>
                </span>
              )}
              {report.status === 'REJECTED' && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 flex items-center space-x-1">
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Case Rejected</span>
                </span>
              )}
              {isAdmin && (
                <button
                  onClick={() => setShowVerifyModal(true)}
                  className="text-[11px] font-bold text-purple-700 hover:text-purple-900 underline ml-2"
                >
                  Edit Assessment
                </button>
              )}
            </div>
          </div>

          <div className="bg-purple-50/60 p-3.5 rounded-xl border border-purple-100 text-xs text-slate-800 leading-relaxed font-medium">
            <p className="text-[10px] font-bold text-purple-900 uppercase tracking-wider mb-1 flex items-center space-x-1.5">
              <MessageSquare className="w-3 h-3 text-purple-700" />
              <span>Official Reviewer Clinical Feedback & Directives:</span>
            </p>
            <p className="italic text-slate-900 font-semibold pl-4 border-l-2 border-purple-400 my-1">
              "{report.admin_feedback || report.verification_notes}"
            </p>
          </div>
        </div>
      )}

      {/* Main Grid: Structured Clinical Record */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2 Cols): Clinical Form Data */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* 1. Patient Demographics */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 text-slate-900 border-b border-slate-100 pb-3">
              <User className="w-5 h-5 text-teal-600" />
              <h3 className="font-bold text-sm">I. Patient Identification & Demographics</h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Identifier / Initials</span>
                <span className="font-bold text-slate-800 text-sm">{report.patient_identifier || 'PT-UNSPECIFIED'}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Age</span>
                <span className="font-bold text-slate-800 text-sm">
                  {report.patient_age ? `${report.patient_age} ${report.patient_age_unit}` : 'Unrecorded'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Sex / Gender</span>
                <span className="font-bold text-slate-800 text-sm">{report.patient_gender || 'Unrecorded'}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Weight</span>
                <span className="font-bold text-slate-800 text-sm">
                  {report.patient_weight_kg ? `${report.patient_weight_kg} kg` : 'Unrecorded'}
                </span>
              </div>
            </div>

            <div className="pt-2 text-xs space-y-2">
              <div>
                <span className="text-slate-500 font-bold block">Medical History & Baseline Comorbidities:</span>
                <p className="text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100 mt-1">
                  {report.medical_history || 'No significant prior medical history documented.'}
                </p>
              </div>
              <div>
                <span className="text-slate-500 font-bold block">Known Drug Allergies:</span>
                <p className="text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100 mt-1">
                  {report.known_allergies || 'None documented.'}
                </p>
              </div>
            </div>
          </div>

          {/* 2. Suspected Medicines */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 text-slate-900 border-b border-slate-100 pb-3">
              <Pill className="w-5 h-5 text-rose-600" />
              <h3 className="font-bold text-sm">II. Suspected & Concomitant Medications</h3>
            </div>

            <div className="space-y-3">
              {report.suspected_medicines && report.suspected_medicines.length > 0 ? (
                report.suspected_medicines.map((med, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-rose-50/40 border border-rose-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-rose-600 text-white">
                          Suspected Drug
                        </span>
                        <span className="font-bold text-slate-900 text-sm">{med.drug_name}</span>
                      </div>
                      <span className="text-xs text-slate-600 font-semibold">{med.dose || 'Dose unrecorded'} ({med.route || 'Oral'})</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-slate-600 pt-1">
                      <div><span className="text-slate-400">Frequency:</span> {med.frequency || 'N/A'}</div>
                      <div><span className="text-slate-400">Indication:</span> {med.indication || 'N/A'}</div>
                      <div><span className="text-slate-400">Batch / Lot:</span> {med.batch_no || 'N/A'}</div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400">No suspected medicines recorded.</p>
              )}
            </div>

            {report.concomitant_medicines && report.concomitant_medicines.length > 0 && (
              <div className="pt-2">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-2">Concomitant Drugs</span>
                <div className="space-y-2">
                  {report.concomitant_medicines.map((cMed, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-800">{cMed.drug_name}</span>
                        <span className="text-slate-500 ml-2">{cMed.dose} ({cMed.route || 'Oral'})</span>
                      </div>
                      <span className="text-slate-500">{cMed.indication || 'Concomitant'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 3. Adverse Reactions */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 text-slate-900 border-b border-slate-100 pb-3">
              <Activity className="w-5 h-5 text-purple-600" />
              <h3 className="font-bold text-sm">III. Adverse Reaction Details & Chronology</h3>
            </div>

            <div className="space-y-3">
              {report.reactions && report.reactions.length > 0 ? (
                report.reactions.map((rxn, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-purple-50/40 border border-purple-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-sm">{rxn.term}</span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-white border border-purple-200 text-purple-800">
                        {rxn.outcome || report.reaction_outcome || 'Recovering'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                      <div><span className="text-slate-400">MedDRA PT:</span> <span className="font-semibold text-slate-800">{rxn.meddra_pt || 'N/A'}</span></div>
                      <div><span className="text-slate-400">Latency / Onset:</span> <span className="font-semibold text-slate-800">{rxn.time_to_onset || report.reaction_onset_date || 'N/A'}</span></div>
                    </div>

                    {rxn.description && (
                      <p className="text-xs text-slate-600 bg-white/70 p-2 rounded-lg border border-purple-100">
                        {rxn.description}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400">No reactions specified.</p>
              )}
            </div>
          </div>

          {/* 4. Original Clinical Narrative */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center space-x-2 text-slate-900 border-b border-slate-100 pb-3">
              <FileText className="w-5 h-5 text-teal-600" />
              <h3 className="font-bold text-sm">IV. Entered Clinical Case Narrative</h3>
            </div>
            <p className="text-xs text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-200 leading-relaxed italic">
              "{report.clinical_narrative || 'No raw narrative stored.'}"
            </p>
          </div>

        </div>

        {/* Right Column (1 Col): Causality, Seriousness, Dechallenge, Reporter */}
        <div className="space-y-6">
          
          {/* Causality Assessment Score Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900">Causality Assessment</h3>
              <span className="text-xs font-semibold text-teal-700">{report.causality_method}</span>
            </div>

            <div className="text-center py-2">
              <span className="text-4xl font-black text-slate-900">{report.causality_score}</span>
              <span className="block text-xs uppercase font-bold text-slate-400 mt-0.5">Naranjo Score</span>
              <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold bg-teal-100 text-teal-900 border border-teal-300">
                {report.causality_category} Causality
              </span>
            </div>

            <div className="text-xs text-slate-500 space-y-2 pt-2 border-t border-slate-100">
              <div className="flex justify-between">
                <span>Dechallenge:</span>
                <span className="font-bold text-slate-800">{report.dechallenge_outcome || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span>Rechallenge:</span>
                <span className="font-bold text-slate-800">{report.rechallenge_action || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Seriousness Checklist */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
            <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-3">Seriousness Criteria</h3>
            
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-600">Life-Threatening</span>
                <span className={`font-bold ${report.seriousness_life_threatening ? 'text-rose-600' : 'text-slate-300'}`}>
                  {report.seriousness_life_threatening ? 'YES' : 'NO'}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-600">Hospitalization</span>
                <span className={`font-bold ${report.seriousness_hospitalization ? 'text-rose-600' : 'text-slate-300'}`}>
                  {report.seriousness_hospitalization ? 'YES' : 'NO'}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-600">Disability / Incapacity</span>
                <span className={`font-bold ${report.seriousness_disability ? 'text-rose-600' : 'text-slate-300'}`}>
                  {report.seriousness_disability ? 'YES' : 'NO'}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-600">Medically Important</span>
                <span className={`font-bold ${report.seriousness_other_medically_important ? 'text-rose-600' : 'text-slate-300'}`}>
                  {report.seriousness_other_medically_important ? 'YES' : 'NO'}
                </span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-600">Results in Death</span>
                <span className={`font-bold ${report.seriousness_death ? 'text-rose-600' : 'text-slate-300'}`}>
                  {report.seriousness_death ? 'YES' : 'NO'}
                </span>
              </div>
            </div>
          </div>

          {/* Primary Reporter Info */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
            <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-3">Primary Reporter Details</h3>
            
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Healthcare Professional</span>
                <span className="font-bold text-slate-800">{report.reporter_name || 'Dr. Rajesh Sharma'}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Role & Department</span>
                <span className="font-semibold text-slate-700">{report.reporter_role || 'Physician'}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Institution</span>
                <span className="font-semibold text-slate-700">{report.reporter_institution || 'Metropolitan Medical Center'}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Country</span>
                <span className="font-semibold text-slate-700">{report.reporter_country || 'United States'}</span>
              </div>
            </div>
          </div>

          {/* Clinical Audit Log */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
            <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-3">Compliance Audit Trail</h3>
            
            <div className="space-y-3 text-xs">
              {report.audit_logs && report.audit_logs.length > 0 ? (
                report.audit_logs.map((log) => (
                  <div key={log.id} className="border-l-2 border-teal-500 pl-3 py-1 space-y-0.5">
                    <span className="font-bold text-slate-800">{log.action}</span>
                    <p className="text-[11px] text-slate-500">{log.details}</p>
                    <span className="text-[10px] text-slate-400">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400">Initial log created.</p>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Chief Medical Officer Verification & Clinical Feedback Console Modal */}
      {showVerifyModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-100 p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold shadow-inner">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Chief Medical Officer Verification Console</h3>
                  <div className="flex items-center space-x-2 mt-0.5">
                    <span className="text-xs font-semibold text-purple-900">Dr. Rajesh Sharma, MD</span>
                    <span className="text-[9px] px-1.5 py-0.2 bg-purple-100 text-purple-800 border border-purple-300 rounded font-bold uppercase">
                      Admin Verifier
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowVerifyModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Decision Action Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Select Clinical Determination:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setVerificationAction('APPROVE')}
                  className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                    verificationAction === 'APPROVE'
                      ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500/20 text-emerald-950'
                      : 'bg-slate-50 hover:bg-slate-100/70 border-slate-200 text-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <CheckCircle2 className={`w-4 h-4 ${verificationAction === 'APPROVE' ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span className="text-[9px] font-bold uppercase">Option 1</span>
                  </div>
                  <div className="text-xs font-bold">Approve & Sign-Off</div>
                  <p className="text-[10px] opacity-80 mt-0.5 leading-tight">Ready for registry</p>
                </button>

                <button
                  type="button"
                  onClick={() => setVerificationAction('REQUEST_CHANGES')}
                  className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                    verificationAction === 'REQUEST_CHANGES'
                      ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-500/20 text-amber-950'
                      : 'bg-slate-50 hover:bg-slate-100/70 border-slate-200 text-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <AlertTriangle className={`w-4 h-4 ${verificationAction === 'REQUEST_CHANGES' ? 'text-amber-600' : 'text-slate-400'}`} />
                    <span className="text-[9px] font-bold uppercase">Option 2</span>
                  </div>
                  <div className="text-xs font-bold">Request Changes</div>
                  <p className="text-[10px] opacity-80 mt-0.5 leading-tight">Return for revision</p>
                </button>

                <button
                  type="button"
                  onClick={() => setVerificationAction('REJECT')}
                  className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                    verificationAction === 'REJECT'
                      ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-500/20 text-rose-950'
                      : 'bg-slate-50 hover:bg-slate-100/70 border-slate-200 text-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <XCircle className={`w-4 h-4 ${verificationAction === 'REJECT' ? 'text-rose-600' : 'text-slate-400'}`} />
                    <span className="text-[9px] font-bold uppercase">Option 3</span>
                  </div>
                  <div className="text-xs font-bold">Reject Case</div>
                  <p className="text-[10px] opacity-80 mt-0.5 leading-tight">Disapprove report</p>
                </button>
              </div>
            </div>

            {/* Quick Clinical Feedback Templates */}
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Insert Clinical Feedback Template:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "Causality confirmed via Naranjo scoring. Clinical chronology matches adverse drug reaction profile.",
                  "Please clarify dechallenge onset timeline and confirm concomitant medication list.",
                  "Recommend monitoring liver enzyme panels and obtaining follow-up creatinine values.",
                  "Clinical presentation is consistent with underlying viral illness rather than drug toxicity."
                ].map((template, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setVerificationNotes(template)}
                    className="text-[10px] font-medium bg-slate-100 hover:bg-purple-100 hover:text-purple-900 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 transition-colors text-left"
                  >
                    + {template.slice(0, 48)}...
                  </button>
                ))}
              </div>
            </div>

            {/* Feedback Textarea */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Official Clinical Feedback & Reviewer Notes:
              </label>
              <textarea
                rows={4}
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
                placeholder="Enter clinical assessment, causality rationale, or instructions for the reporting clinician..."
                className="w-full text-xs p-3 rounded-2xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none leading-relaxed"
              />
            </div>

            {/* Regulatory Notice */}
            <div className="bg-purple-50/50 p-3 rounded-2xl border border-purple-100 text-[11px] text-slate-600 flex items-start space-x-2">
              <Shield className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
              <span>
                As Chief Medical Officer, your digital sign-off and feedback are permanently recorded in the ICH compliance audit trail with your professional credentials.
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowVerifyModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={verifying}
                onClick={() => handleVerify(verificationAction)}
                className={`flex items-center space-x-1.5 px-6 py-2.5 rounded-xl text-white text-xs font-bold shadow-md transition-all ${
                  verificationAction === 'APPROVE'
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                    : verificationAction === 'REQUEST_CHANGES'
                    ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
                    : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                }`}
              >
                {verificationAction === 'APPROVE' && <CheckCircle2 className="w-4 h-4" />}
                {verificationAction === 'REQUEST_CHANGES' && <AlertTriangle className="w-4 h-4" />}
                {verificationAction === 'REJECT' && <XCircle className="w-4 h-4" />}
                <span>
                  {verifying 
                    ? 'Recording Assessment...' 
                    : verificationAction === 'APPROVE' 
                    ? 'Confirm Approval & Verify' 
                    : verificationAction === 'REQUEST_CHANGES'
                    ? 'Submit Clinical Revision Request'
                    : 'Confirm Case Rejection'}
                </span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
