import React, { useState } from 'react';
import { 
  Sparkles, 
  Send, 
  User as UserIcon, 
  Pill, 
  Activity, 
  ShieldAlert, 
  Calculator,
  CheckCircle2,
  AlertTriangle,
  Info
} from 'lucide-react';
import { 
  ADRReport, 
  AIExtractionResponse, 
  ClinicalScenario 
} from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ScenarioSelector } from '../components/ScenarioSelector';

interface NewReportProps {
  onNavigate: (page: string, reportId?: any) => void;
}

export const NewReport: React.FC<NewReportProps> = ({ onNavigate }) => {
  const { user } = useAuth();

  // Narrative Input & Key State
  const [narrative, setNarrative] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [extractedData, setExtractedData] = useState<AIExtractionResponse | null>(null);

  // Form State initialized with defaults
  const [formData, setFormData] = useState<Partial<ADRReport>>({
    patient_identifier: '',
    patient_age: undefined,
    patient_age_unit: 'Years',
    patient_gender: 'Unknown',
    patient_weight_kg: undefined,
    medical_history: '',
    known_allergies: '',
    clinical_narrative: '',
    suspected_medicines: [],
    concomitant_medicines: [],
    reactions: [],
    reaction_onset_date: '',
    reaction_outcome: 'Recovering',
    is_serious: false,
    seriousness_death: false,
    seriousness_life_threatening: false,
    seriousness_hospitalization: false,
    seriousness_disability: false,
    seriousness_congenital_anomaly: false,
    seriousness_other_medically_important: false,
    seriousness_details: '',
    dechallenge_action: 'Medicine discontinued',
    dechallenge_outcome: 'Reaction abated',
    rechallenge_action: 'Not reintroduced',
    rechallenge_outcome: 'Not applicable',
    causality_method: 'Naranjo Algorithm',
    causality_score: 0,
    causality_category: 'Possible',
    naranjo_answers: {},
    lab_findings: '',
    additional_remarks: '',
    reporter_name: user?.full_name || 'Dr. Rajesh Sharma',
    reporter_role: user?.role || 'Physician',
    reporter_contact: user?.email || 'r.sharma@maxmedical.in',
    reporter_institution: user?.institution || 'Max Super Speciality Hospital',
    reporter_country: 'India',
    completeness_score: 0,
    ai_missing_fields: [],
    ich_criteria_met: false,
    ai_clinical_summary: '',
    status: 'DRAFT'
  });

  const [submitting, setSubmitting] = useState(false);

  // Handle clinical scenarios selection
  const handleSelectScenario = (scText: string, scenario: ClinicalScenario) => {
    setNarrative(scText);
    handleAIExtract(scText);
  };

  // Run AI Extraction using free key or fallback rule-based system
  const handleAIExtract = async (textToExtract?: string) => {
    const rawText = textToExtract || narrative;
    if (!rawText.trim()) return;

    try {
      setExtracting(true);
      const userApiKey = localStorage.getItem('gemini_api_key') || undefined;
      const extracted = await api.extractFromNarrative(rawText, userApiKey);
      setExtractedData(extracted);

      // Populate form state with AI suggestions
      setFormData((prev) => {
        const updated: Partial<ADRReport> = {
          ...prev,
          clinical_narrative: rawText,
          patient_identifier: prev.patient_identifier || (extracted.patient_age ? `PT-${extracted.patient_age}${extracted.patient_gender?.[0] || 'X'}` : 'PT-UNSPECIFIED'),
          patient_age: extracted.patient_age ?? prev.patient_age,
          patient_age_unit: extracted.patient_age_unit || prev.patient_age_unit || 'Years',
          patient_gender: extracted.patient_gender || prev.patient_gender || 'Unknown',
          patient_weight_kg: extracted.patient_weight_kg ?? prev.patient_weight_kg,
          medical_history: extracted.medical_history || prev.medical_history,
          suspected_medicines: extracted.suspected_medicines || prev.suspected_medicines,
          concomitant_medicines: extracted.concomitant_medicines || prev.concomitant_medicines,
          reactions: extracted.reactions || prev.reactions,
          reaction_onset_date: extracted.reaction_onset_date || prev.reaction_onset_date,
          reaction_outcome: extracted.reaction_outcome || prev.reaction_outcome,
          is_serious: extracted.is_serious || false,
          seriousness_death: extracted.seriousness_criteria?.death || false,
          seriousness_life_threatening: extracted.seriousness_criteria?.life_threatening || false,
          seriousness_hospitalization: extracted.seriousness_criteria?.hospitalization || false,
          seriousness_disability: extracted.seriousness_criteria?.disability || false,
          seriousness_congenital_anomaly: extracted.seriousness_criteria?.congenital_anomaly || false,
          seriousness_other_medically_important: extracted.seriousness_criteria?.other_medically_important || false,
          seriousness_details: extracted.seriousness_details || prev.seriousness_details,
          dechallenge_action: extracted.dechallenge_action || prev.dechallenge_action,
          dechallenge_outcome: extracted.dechallenge_outcome || prev.dechallenge_outcome,
          rechallenge_action: extracted.rechallenge_action || prev.rechallenge_action,
          rechallenge_outcome: extracted.rechallenge_outcome || prev.rechallenge_outcome,
          lab_findings: extracted.lab_findings || prev.lab_findings,
          completeness_score: extracted.completeness_score,
          ai_missing_fields: extracted.missing_fields,
          ich_criteria_met: extracted.ich_criteria_met,
          ai_clinical_summary: extracted.ai_clinical_summary || '',
          status: 'AI_EXTRACTED'
        };

        if (extracted.naranjo_estimate) {
          updated.causality_score = extracted.naranjo_estimate.score;
          updated.causality_category = extracted.naranjo_estimate.category;
          updated.naranjo_answers = extracted.naranjo_estimate.suggested_answers;
        }

        return updated;
      });

    } catch (err: any) {
      alert('AI Extraction error: ' + (err.message || 'Could not process narrative.'));
    } finally {
      setExtracting(false);
    }
  };

  // Submit report to the database
  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      // Run quick validation
      const validation = await api.validateReport(formData);
      const payload: Partial<ADRReport> = {
        ...formData,
        completeness_score: validation.completeness_score,
        ai_missing_fields: validation.missing_fields,
        ich_criteria_met: validation.ich_criteria_met,
        status: 'SUBMITTED' // Directly verify and submit to registry
      };

      const created = await api.createReport(payload);
      onNavigate('report-detail', created.id);
    } catch (err: any) {
      alert('Error submitting report: ' + (err.message || 'Submission failed.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      
      {/* 1-Click Scenario Selector */}
      <ScenarioSelector onSelectScenario={handleSelectScenario} />

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Left Column: Narrative Input */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-extrabold text-slate-900 text-sm">Clinical Narrative Note</h2>
                <p className="text-[10px] text-slate-400">Paste unstructured discharge notes or descriptions</p>
              </div>
            </div>

            <div className="space-y-4">
              <textarea
                rows={10}
                value={narrative}
                onChange={(e) => setNarrative(e.target.value)}
                placeholder="e.g. A 35-year-old female patient developed facial swelling, severe itching, and difficulty breathing 45 minutes after taking oral Amoxicillin 500mg at Max Hospital. Epinephrine was administered in the ED..."
                className="w-full text-xs p-4 rounded-2xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all resize-y placeholder:text-slate-400 bg-slate-50/50"
              />

              <button
                type="button"
                disabled={extracting || !narrative.trim()}
                onClick={() => handleAIExtract()}
                className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 disabled:opacity-50 text-white text-xs font-bold py-3 rounded-xl shadow-md shadow-teal-600/20 transition-all hover:scale-[1.01]"
              >
                <Sparkles className={`w-4 h-4 ${extracting ? 'animate-spin' : ''}`} />
                <span>{extracting ? 'AI Extracting...' : 'Analyze & Extract with AI'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: AI Suggestions & Review Form */}
        <div className="lg:col-span-3 space-y-6">
          {!extractedData ? (
            <div className="h-full min-h-[300px] bg-slate-50 border border-dashed border-slate-300 rounded-3xl flex flex-col items-center justify-center text-center p-8 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Awaiting AI Clinical Analysis</h3>
                <p className="text-xs text-slate-500 max-w-xs mt-1">Paste a narrative or select a scenario on the left, then click "Analyze" to generate a clinical response.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Premium AI Generated Response Summary Card */}
              <div className="bg-gradient-to-br from-teal-900 to-slate-900 rounded-3xl p-6 text-white shadow-xl space-y-3 relative overflow-hidden">
                <div className="absolute right-0 top-0 w-40 h-40 bg-teal-500/10 rounded-full blur-2xl pointer-events-none"></div>
                
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-teal-400" />
                  <span className="text-xs font-extrabold uppercase tracking-wider text-teal-400">AI Clinical Summary & Guidance</span>
                </div>
                
                <p className="text-xs text-teal-55/90 leading-relaxed font-medium">
                  {formData.ai_clinical_summary || "Processing clinical narrative..."}
                </p>
                
                <div className="flex items-center space-x-1.5 text-[10px] text-teal-300 pt-2">
                  <Info className="w-3.5 h-3.5" />
                  <span>Review details in the verification form below before submitting.</span>
                </div>
              </div>

              {/* Verification & Quick Submission Form */}
              <form onSubmit={handleSubmitReport} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-extrabold text-slate-950 text-sm flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Review Extracted ADR Parameters</span>
                  </h3>
                  <span className="text-xs text-slate-400">Step 2: Confirm & Save</span>
                </div>

                {/* Patient Demographics */}
                <div className="space-y-3">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">1. Patient Profile</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">Patient ID</label>
                      <input
                        type="text"
                        value={formData.patient_identifier || ''}
                        onChange={(e) => setFormData({ ...formData, patient_identifier: e.target.value })}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-teal-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">Age</label>
                      <input
                        type="number"
                        value={formData.patient_age ?? ''}
                        onChange={(e) => setFormData({ ...formData, patient_age: e.target.value ? Number(e.target.value) : undefined })}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-teal-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">Gender</label>
                      <select
                        value={formData.patient_gender}
                        onChange={(e) => setFormData({ ...formData, patient_gender: e.target.value })}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-teal-500 outline-none bg-white"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                        <option value="Unknown">Unknown</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">Weight (kg)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.patient_weight_kg ?? ''}
                        onChange={(e) => setFormData({ ...formData, patient_weight_kg: e.target.value ? Number(e.target.value) : undefined })}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-teal-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Suspected Drug */}
                <div className="space-y-3 pt-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">2. Suspected Medicine</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">Drug Name</label>
                      <input
                        type="text"
                        value={formData.suspected_medicines?.[0]?.drug_name || ''}
                        onChange={(e) => {
                          const updated = [...(formData.suspected_medicines || [])];
                          if (updated[0]) {
                            updated[0].drug_name = e.target.value;
                          } else {
                            updated.push({ drug_name: e.target.value, dose: '', route: 'Oral', is_suspected: true });
                          }
                          setFormData({ ...formData, suspected_medicines: updated });
                        }}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-teal-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">Dosage</label>
                      <input
                        type="text"
                        value={formData.suspected_medicines?.[0]?.dose || ''}
                        onChange={(e) => {
                          const updated = [...(formData.suspected_medicines || [])];
                          if (updated[0]) {
                            updated[0].dose = e.target.value;
                          }
                          setFormData({ ...formData, suspected_medicines: updated });
                        }}
                        placeholder="e.g. 500 mg"
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-teal-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">Route</label>
                      <input
                        type="text"
                        value={formData.suspected_medicines?.[0]?.route || 'Oral'}
                        onChange={(e) => {
                          const updated = [...(formData.suspected_medicines || [])];
                          if (updated[0]) {
                            updated[0].route = e.target.value;
                          }
                          setFormData({ ...formData, suspected_medicines: updated });
                        }}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-teal-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Reaction Details */}
                <div className="space-y-3 pt-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">3. Adverse Reaction & Seriousness</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">Reaction Term</label>
                      <input
                        type="text"
                        value={formData.reactions?.[0]?.term || ''}
                        onChange={(e) => {
                          const updated = [...(formData.reactions || [])];
                          if (updated[0]) {
                            updated[0].term = e.target.value;
                          } else {
                            updated.push({ term: e.target.value, outcome: 'Recovering' });
                          }
                          setFormData({ ...formData, reactions: updated });
                        }}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-teal-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">Causality (Naranjo Assessment)</label>
                      <div className="w-full text-xs p-2.5 rounded-xl border border-slate-100 bg-slate-50 font-bold text-teal-800">
                        Score: {formData.causality_score} ({formData.causality_category})
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 pt-2">
                    <label className="flex items-center space-x-2 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-100 rounded-xl px-4 py-2 cursor-pointer hover:bg-rose-100/50 transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.is_serious || false}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          is_serious: e.target.checked,
                          seriousness_life_threatening: e.target.checked // Autofill seriousness details
                        })}
                        className="w-3.5 h-3.5 accent-rose-600 rounded"
                      />
                      <span>Expedite as Serious ADR Report</span>
                    </label>
                  </div>
                </div>

                {/* Submit & Save */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => onNavigate('dashboard')}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center space-x-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-bold px-6 py-3 rounded-xl shadow-md shadow-teal-600/20 transition-all hover:scale-[1.01]"
                  >
                    <Send className="w-4 h-4" />
                    <span>{submitting ? 'Submitting...' : 'Submit Report to National PV Registry'}</span>
                  </button>
                </div>
              </form>

            </div>
          )}
        </div>

      </div>
    </div>
  );
};
