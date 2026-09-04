import React from 'react';
import { 
  Users, 
  ShieldCheck, 
  Sparkles, 
  Award, 
  Activity, 
  Code2, 
  HeartHandshake, 
  FileCheck2,
  Stethoscope,
  ExternalLink,
  Cpu
} from 'lucide-react';

export const AboutTeam: React.FC = () => {
  const teamMembers = [
    {
      name: 'Pushkar Madan',
      position: 'First / Front Position',
      role: 'Lead Developer & Pharmacovigilance Systems Architect',
      bio: 'Architected the core system infrastructure, CIOMS I regulatory PDF pipeline, ICH E2B(R3) interoperability engine, and responsive clinical UI. Focused on building safe, compliant, human-in-the-loop medical software.',
      contributions: [
        'End-to-end full stack architecture (FastAPI & React 19)',
        'CIOMS Form I generation and ICH E2B(R3) validation suite',
        'AI Voice speech recognition integration & mobile responsiveness',
        'Causality assessment algorithm implementation (Naranjo Algorithm)'
      ],
      badge: 'Lead Architect'
    },
    {
      name: 'Priyansh Sharma',
      position: 'Last / Back Position',
      role: 'Core Developer & Clinical NLP Specialist',
      bio: 'Spearheaded the Clinical NLP extraction algorithms, MedDRA terminology mapping, rule-based medical named entity recognition (NER), and regulatory audit logging. Passionate about applying AI responsibly in clinical healthcare.',
      contributions: [
        'Hybrid Clinical NLP extraction pipeline (LLM + Heuristic Rules)',
        'ICH 4 Minimum Criteria validation & Completeness scoring index',
        'MedDRA System Organ Class (SOC) and Preferred Term (PT) dictionary integration',
        'Pharmacovigilance signals, disproportionality analytics & case registry'
      ],
      badge: 'Core Specialist'
    }
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden text-center sm:text-left">
        <div className="absolute right-0 top-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 text-teal-400 text-xs font-bold uppercase tracking-wider mb-3 px-3 py-1 rounded-full bg-white/5 border border-teal-500/20">
            <Activity className="w-3.5 h-3.5" />
            <span>Advancing Drug Safety Through Responsible AI</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
            About ADR-Sentinel AI & Clinical Team
          </h1>
          <p className="text-sm text-slate-300 mt-3 leading-relaxed">
            ADR-Sentinel AI is an intelligent Pharmacovigilance (PV) and Adverse Drug Reaction (ADR) reporting platform with <strong>human-in-the-loop clinical assistance</strong>. Built to streamline clinical documentation, automate regulatory compliance (ICH E2B(R3) & CIOMS I), and accelerate signal detection for healthcare providers worldwide.
          </p>
        </div>
      </div>

      {/* Core Team Members Section */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-600" />
            <span>Project Authors & Engineering Team</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            The engineers and developers behind the ADR-Sentinel AI system architecture
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {teamMembers.map((member, idx) => (
            <div
              key={member.name}
              className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between relative overflow-hidden"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200/60 uppercase tracking-wider">
                      {member.badge}
                    </span>
                    <h3 className="text-xl font-extrabold text-slate-900 mt-1.5">{member.name}</h3>
                    <p className="text-xs font-semibold text-teal-700">{member.role}</p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-600 to-cyan-600 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-teal-600/20">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed font-normal">
                  {member.bio}
                </p>

                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Key Technical Contributions:
                  </span>
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    {member.contributions.map((c, i) => (
                      <li key={i} className="flex items-start space-x-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-1.5 shrink-0"></span>
                        <span className="leading-tight">{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>ADR-Sentinel Project Core Team</span>
                <span className="font-semibold text-teal-800">Verified Contributor</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* System Principles & Regulatory Adherence */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <span>Core System Design Principles</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
              <Stethoscope className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-900">Human-in-the-Loop</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              AI provides suggestions and extraction but never submits regulatory reports automatically. Licensed clinicians must review and digitally sign all case files.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold">
              <FileCheck2 className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-900">ICH E2B(R3) Compliance</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Conforms strictly to the 4 Minimum Reporting Criteria and international ICSR standards mandated by FDA, EMA, WHO-UMC, and national regulatory agencies.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <Cpu className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-900">Offline-First Resilience</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Equipped with a zero-dependency clinical rule engine and local knowledge base, ensuring full functionality and uninterrupted patient safety monitoring even during network outages.
            </p>
          </div>

        </div>
      </div>

    </div>
  );
};
