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
  FileDown
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
  const [report, setReport] = useState<ADRReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [showVerifyModal, setShowVerifyModal] = useState(false);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const data = await api.getReportById(reportId);
      setReport(data);
      if (data.verification_notes) {
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

  const handleVerify = async (approved: boolean) => {
    try {
      setVerifying(true);
      const updated = await api.verifyReport(reportId, {
        approved,
        verification_notes: verificationNotes
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

          {!isVerified ? (
            <button
              onClick={() => setShowVerifyModal(true)}
              className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-600/20 transition-all hover:scale-[1.01]"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Review & Clinically Verify</span>
            </button>
          ) : report.status !== 'SUBMITTED' ? (
            <button
              disabled={submitting}
              onClick={handleSubmit}
              className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all hover:scale-[1.01]"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'Transmitting...' : 'Submit to National PV Centre'}</span>
            </button>
          ) : (
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
        isVerified
          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
          : 'bg-amber-50/70 border-amber-200 text-amber-950'
      }`}>
        <div className="flex items-start space-x-3">
          {isVerified ? (
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <Clock className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
          )}
          <div>
            <h4 className="text-sm font-bold">
              {isVerified ? 'Clinical Verification Confirmed' : 'Pending Healthcare Professional Sign-Off'}
            </h4>
            <p className="text-xs mt-0.5 opacity-90">
              {isVerified
                ? `Verified by ${report.verified_by?.full_name || report.reporter_name || 'Clinician'} on ${report.verified_at ? new Date(report.verified_at).toLocaleString() : 'N/A'}. Clinical note: "${report.verification_notes || 'All entities verified.'}"`
                : 'This case draft was generated with AI assistance and requires clinical review before final regulatory sign-off.'}
            </p>
          </div>
        </div>

        {!isVerified && (
          <button
            onClick={() => setShowVerifyModal(true)}
            className="text-xs font-bold px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-sm transition-colors whitespace-nowrap"
          >
            Perform Sign-Off
          </button>
        )}
      </div>

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

      {/* Verification Sign-Off Modal */}
      {showVerifyModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Clinician Sign-Off & Verification</h3>
                <p className="text-xs text-slate-500">Human-in-the-loop validation of AI extracted ADR parameters</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Clinical Reviewer Notes</label>
              <textarea
                rows={4}
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
                placeholder="e.g. Reviewed clinical chronology, confirmed IgE mediated hypersensitivity to Amoxicillin. Verified for national registry reporting."
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:border-teal-500 outline-none"
              />
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-600">
              By clicking "Confirm Approval", you confirm that you have reviewed the patient information, suspected drug, adverse event description, and causality scoring.
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
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
                onClick={() => handleVerify(true)}
                className="flex items-center space-x-1.5 px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-600/20 transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{verifying ? 'Signing...' : 'Confirm Approval & Verify'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
