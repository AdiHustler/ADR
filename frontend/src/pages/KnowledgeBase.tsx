import React, { useState } from 'react';
import { 
  BookOpen, 
  Search, 
  AlertTriangle, 
  ShieldAlert, 
  HeartPulse, 
  Sparkles
} from 'lucide-react';

interface DrugSafetyProfile {
  id: string;
  name: string;
  brandNames: string[];
  drugClass: string;
  category: 'Antibiotic' | 'Cardiovascular' | 'Anticoagulant' | 'Metabolic' | 'Immunomodulator' | 'Analgesic';
  boxedWarning?: string;
  commonAdrs: string[];
  seriousAdrs: string[];
  meddraTerms: string[];
  keyInteractions: string;
  monitoringProtocol: string;
  typicalOnset: string;
}

const DRUG_DATABASE: DrugSafetyProfile[] = [
  {
    id: 'amoxicillin',
    name: 'Amoxicillin',
    brandNames: ['Amoxil', 'Moxatag', 'Augmentin'],
    drugClass: 'Aminopenicillin Beta-lactam Antibiotic',
    category: 'Antibiotic',
    boxedWarning: 'Risk of immediate anaphylaxis and life-threatening angioedema in penicillin-sensitive patients.',
    commonAdrs: ['Erythematous rash', 'Diarrhea', 'Pruritus / Itching', 'Nausea / Vomiting'],
    seriousAdrs: ['Anaphylactic shock', 'Stevens-Johnson Syndrome (SJS)', 'DRESS Syndrome', 'Clostridioides difficile colitis'],
    meddraTerms: ['Rash erythematous', 'Anaphylactic reaction', 'Face oedema', 'Pruritus', 'Pseudomembranous colitis'],
    keyInteractions: 'Competitive inhibition of methotrexate renal clearance (methotrexate toxicity); may reduce oral contraceptive effectiveness.',
    monitoringProtocol: 'Observe first-dose allergic signs; assess renal function in prolonged or high-dose therapy.',
    typicalOnset: '30 to 60 minutes for anaphylaxis; 3 to 7 days for cutaneous morbilliform rash.'
  },
  {
    id: 'lisinopril',
    name: 'Lisinopril',
    brandNames: ['Prinivil', 'Zestril', 'Qbrelis'],
    drugClass: 'Angiotensin-Converting Enzyme (ACE) Inhibitor',
    category: 'Cardiovascular',
    boxedWarning: 'Fetal toxicity: Discontinue as soon as pregnancy is detected; can cause fetal injury and death.',
    commonAdrs: ['Intractable dry hacking cough', 'Dizziness / Orthostatic hypotension', 'Hyperkalemia', 'Headache'],
    seriousAdrs: ['Head and neck angioedema with airway obstruction', 'Acute renal insufficiency', 'Severe hyperkalemic arrhythmia'],
    meddraTerms: ['Cough', 'Angioedema', 'Hyperkalaemia', 'Hypotension', 'Renal impairment'],
    keyInteractions: 'Co-administration with spironolactone or potassium supplements sharply elevates hyperkalemia risk; NSAIDs blunt antihypertensive effect.',
    monitoringProtocol: 'Baseline and bi-weekly serum potassium and serum creatinine. Strict contraindication for rechallenge if angioedema occurs.',
    typicalOnset: 'Cough onset: 1 to 16 weeks post initiation; Angioedema can occur within hours or after years.'
  },
  {
    id: 'warfarin',
    name: 'Warfarin',
    brandNames: ['Coumadin', 'Jantoven'],
    drugClass: 'Vitamin K Antagonist (VKAs)',
    category: 'Anticoagulant',
    boxedWarning: 'Major or fatal bleeding: Requires regular INR monitoring and strict dosage titration.',
    commonAdrs: ['Minor mucosal bleeding', 'Gingival bleeding', 'Epistaxis', 'Subcutaneous hematomas'],
    seriousAdrs: ['Fatal intracranial hemorrhage', 'Massive GI bleeding', 'Warfarin-induced skin necrosis', 'Purple toe syndrome'],
    meddraTerms: ['Haemorrhage', 'Haematuria', 'Epistaxis', 'Skin necrosis', 'International normalised ratio increased'],
    keyInteractions: 'Markedly potentiated by CYP2C9/CYP3A4 inhibitors (Clarithromycin, Metronidazole, Fluconazole) causing INR surges; antagonized by enzyme inducers (Carbamazepine, St. John’s Wort).',
    monitoringProtocol: 'Serial INR tracking (therapeutic target usually 2.0–3.0). Emergency reversal with 4-factor PCC and IV Vitamin K1.',
    typicalOnset: 'Coagulopathy changes emerge within 48 to 72 hours following dosage or interaction change.'
  },
  {
    id: 'allopurinol',
    name: 'Allopurinol',
    brandNames: ['Zyloprim', 'Aloprim'],
    drugClass: 'Xanthine Oxidase Inhibitor',
    category: 'Metabolic',
    boxedWarning: 'Severe cutaneous adverse reactions (SCAR), including fatal DRESS, SJS, and TEN.',
    commonAdrs: ['Mild pruritic maculopapular rash', 'Gastrointestinal upset', 'Acute gout flare on initiation'],
    seriousAdrs: ['Allopurinol Hypersensitivity Syndrome (AHS)', 'Toxic Epidermal Necrolysis (TEN)', 'Drug-induced liver injury (DILI)'],
    meddraTerms: ['Drug reaction with eosinophilia and systemic symptoms', 'Stevens-Johnson syndrome', 'Hepatotoxicity', 'Pyrexia'],
    keyInteractions: 'Inhibits azathioprine and 6-mercaptopurine inactivation; azathioprine dose must be reduced by 66% to 75%.',
    monitoringProtocol: 'Pre-screening for HLA-B*58:01 allele in high-risk populations. Immediate cessation at the earliest appearance of skin rash.',
    typicalOnset: 'DRESS/SCAR reactions typically present 2 to 8 weeks after starting therapy.'
  },
  {
    id: 'atorvastatin',
    name: 'Atorvastatin',
    brandNames: ['Lipitor'],
    drugClass: 'HMG-CoA Reductase Inhibitor (Statin)',
    category: 'Cardiovascular',
    commonAdrs: ['Myalgia / Muscle soreness', 'Mild transaminase elevation', 'Dyspepsia', 'Arthralgia'],
    seriousAdrs: ['Rhabdomyolysis with myoglobinuria', 'Acute kidney failure', 'Immune-mediated necrotizing myopathy (IMNM)'],
    meddraTerms: ['Myalgia', 'Rhabdomyolysis', 'Blood creatine phosphokinase increased', 'Alanine aminotransferase increased'],
    keyInteractions: 'CYP3A4 inhibitors (Clarithromycin, Itraconazole, Ketoconazole, HIV protease inhibitors) markedly boost statin AUC, risking rhabdomyolysis.',
    monitoringProtocol: 'Baseline liver transaminases. Check serum Creatine Kinase (CK) promptly if unexplained muscle tenderness or tea-colored urine occurs.',
    typicalOnset: 'Myopathy usually develops within 2 to 12 weeks of initiation or dosage increase.'
  },
  {
    id: 'metformin',
    name: 'Metformin',
    brandNames: ['Glucophage', 'Fortamet'],
    drugClass: 'Biguanide Antidiabetic',
    category: 'Metabolic',
    boxedWarning: 'Lactic acidosis: Rare but fatal condition associated with renal impairment, sepsis, or acute hypoxic states.',
    commonAdrs: ['Diarrhea / Loose stools', 'Nausea / Flatulence', 'Abdominal cramping', 'Metallic taste in mouth'],
    seriousAdrs: ['Metformin-associated lactic acidosis (MALA)', 'Severe secondary Vitamin B12 deficiency'],
    meddraTerms: ['Diarrhoea', 'Lactic acidosis', 'Abdominal discomfort', 'Vitamin B12 deficiency'],
    keyInteractions: 'Iodinated radiocontrast agents increase risk of acute renal failure and lactic acidosis; Cimetidine decreases renal clearance.',
    monitoringProtocol: 'Assess eGFR prior to initiation; contraindicated if eGFR < 30 mL/min/1.73m². Withhold before iodinated contrast procedures.',
    typicalOnset: 'GI symptoms start within days; MALA precipitates in context of acute renal insult.'
  },
  {
    id: 'clarithromycin',
    name: 'Clarithromycin',
    brandNames: ['Biaxin'],
    drugClass: 'Macrolide Antibiotic (Potent CYP3A4 Inhibitor)',
    category: 'Antibiotic',
    boxedWarning: 'Increased risk of long-term all-cause mortality in patients with coronary artery disease (FDA Drug Safety Alert).',
    commonAdrs: ['Dysgeusia / Intense metallic taste', 'Nausea', 'Diarrhea', 'Abdominal pain'],
    seriousAdrs: ['QTc prolongation and Torsades de Pointes', 'Severe interaction-mediated hemorrhage with Warfarin', 'Acute cholestatic jaundice'],
    meddraTerms: ['Electrocardiogram QT prolonged', 'Ventricular tachycardia', 'Haemorrhage', 'Jaundice cholestatic'],
    keyInteractions: 'Strong CYP3A4 inhibitor: dangerously increases systemic concentrations of Warfarin, Statins, Digoxin, and Carbamazepine.',
    monitoringProtocol: 'Baseline ECG for QTc assessment; comprehensive review of patient medication list for CYP3A4 substrates.',
    typicalOnset: 'Interaction toxicity manifests within 48–96 hours of concurrent administration.'
  }
];

interface KnowledgeBaseProps {
  onNavigate?: (page: string, param?: any) => void;
}

export const KnowledgeBase: React.FC<KnowledgeBaseProps> = ({ onNavigate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedDrug, setSelectedDrug] = useState<DrugSafetyProfile | null>(DRUG_DATABASE[0]);

  const categories = ['All', 'Antibiotic', 'Cardiovascular', 'Anticoagulant', 'Metabolic'];

  const filteredDrugs = DRUG_DATABASE.filter((drug) => {
    const matchesSearch = 
      drug.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      drug.drugClass.toLowerCase().includes(searchTerm.toLowerCase()) ||
      drug.meddraTerms.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || drug.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10">
          <div className="flex items-center space-x-2 text-teal-400 text-xs font-bold uppercase tracking-wider mb-2">
            <BookOpen className="w-4 h-4" />
            <span>MedDRA Aligned Pharmacovigilance Reference</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            High-Alert Drug Safety & Reaction Directory
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl">
            Verified clinical safety profiles, regulatory black box warnings, MedDRA Preferred Terms, and critical drug-drug interaction mechanisms.
          </p>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search drug name, class, MedDRA term..."
            className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:border-teal-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Directory Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Drug Cards List */}
        <div className="lg:col-span-5 space-y-3">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            Implicated Medications ({filteredDrugs.length})
          </p>

          <div className="space-y-2.5 max-h-[700px] overflow-y-auto pr-1">
            {filteredDrugs.map((drug) => {
              const isSelected = selectedDrug?.id === drug.id;
              return (
                <div
                  key={drug.id}
                  onClick={() => setSelectedDrug(drug)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-teal-50/60 border-teal-500 ring-2 ring-teal-500/20 shadow-md'
                      : 'bg-white hover:bg-slate-50 border-slate-200 shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-extrabold text-slate-900 text-sm">{drug.name}</h4>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium">
                          {drug.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{drug.drugClass}</p>
                    </div>
                    {drug.boxedWarning && (
                      <span className="p-1 rounded-md bg-rose-50 text-rose-600" title="Boxed Warning Present">
                        <AlertTriangle className="w-4 h-4" />
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1">
                    {drug.seriousAdrs.slice(0, 2).map((adr, idx) => (
                      <span key={idx} className="text-[10px] px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 font-semibold border border-rose-100">
                        {adr}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Detailed Safety Monograph */}
        <div className="lg:col-span-7">
          {selectedDrug ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
              
              {/* Header */}
              <div className="border-b border-slate-100 pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">{selectedDrug.category}</span>
                    <h2 className="text-2xl font-black text-slate-950 mt-0.5">{selectedDrug.name}</h2>
                    <p className="text-xs text-slate-500">{selectedDrug.drugClass} • Brands: {selectedDrug.brandNames.join(', ')}</p>
                  </div>

                  {onNavigate && (
                    <button
                      onClick={() => onNavigate('new-report')}
                      className="flex items-center space-x-1.5 bg-teal-600 hover:bg-teal-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Report {selectedDrug.name} Case</span>
                    </button>
                  )}
                </div>

                {/* Boxed Warning Alert */}
                {selectedDrug.boxedWarning && (
                  <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-900 flex items-start space-x-2.5">
                    <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-rose-950 uppercase tracking-wider block text-[11px]">Regulatory Black Box Warning</span>
                      <p className="mt-0.5 text-rose-800 leading-relaxed font-medium">{selectedDrug.boxedWarning}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* ADRs Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Common ADRs */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <HeartPulse className="w-3.5 h-3.5 text-teal-600" />
                    <span>Common & Expected ADRs</span>
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-600">
                    {selectedDrug.commonAdrs.map((item, idx) => (
                      <li key={idx} className="flex items-center space-x-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Serious ADRs */}
                <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-100 space-y-2">
                  <h4 className="text-xs font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Serious / Regulatory Significant</span>
                  </h4>
                  <ul className="space-y-1.5 text-xs text-rose-900">
                    {selectedDrug.seriousAdrs.map((item, idx) => (
                      <li key={idx} className="flex items-center space-x-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                        <span className="font-medium">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

              </div>

              {/* MedDRA Preferred Terms */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Coded MedDRA Preferred Terms (PT)
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedDrug.meddraTerms.map((term, idx) => (
                    <span key={idx} className="text-xs px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 border border-teal-200/60 font-semibold font-mono">
                      {term}
                    </span>
                  ))}
                </div>
              </div>

              {/* Pharmacological Details */}
              <div className="space-y-4 pt-2 border-t border-slate-100 text-xs">
                
                <div>
                  <h4 className="font-bold text-slate-800 mb-1">Critical Drug-Drug Interactions:</h4>
                  <p className="text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {selectedDrug.keyInteractions}
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-800 mb-1">Clinical Dechallenge & Laboratory Protocol:</h4>
                  <p className="text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {selectedDrug.monitoringProtocol}
                  </p>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                  <span><strong>Typical Onset Latency:</strong> {selectedDrug.typicalOnset}</span>
                  <span className="text-teal-700 font-semibold">ICH E2B(R3) Aligned</span>
                </div>

              </div>

            </div>
          ) : (
            <div className="h-full min-h-[300px] flex items-center justify-center bg-slate-50 rounded-3xl border border-dashed border-slate-300 text-slate-400 text-xs">
              Select a drug from the left to view complete safety monograph.
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
