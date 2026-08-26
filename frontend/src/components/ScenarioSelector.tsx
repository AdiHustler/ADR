import React, { useEffect, useState } from 'react';
import { Sparkles, FileText, ChevronRight, Stethoscope } from 'lucide-react';
import { ClinicalScenario } from '../types';
import { api } from '../services/api';

interface ScenarioSelectorProps {
  onSelectScenario: (narrative: string, scenario: ClinicalScenario) => void;
}

export const ScenarioSelector: React.FC<ScenarioSelectorProps> = ({ onSelectScenario }) => {
  const [scenarios, setScenarios] = useState<ClinicalScenario[]>([]);

  useEffect(() => {
    api.getScenarios().then(setScenarios).catch(() => {});
  }, []);

  return (
    <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-slate-900 rounded-3xl p-6 text-white shadow-xl mb-6 relative overflow-hidden">
      <div className="absolute right-0 top-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Pre-Loaded Clinical Scenarios</h3>
            <p className="text-xs text-slate-300">Choose a real-world adverse drug reaction case to test AI extraction & report drafting</p>
          </div>
        </div>
      </div>

      {/* Scenario Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {scenarios.map((sc) => (
          <div
            key={sc.id}
            onClick={() => onSelectScenario(sc.narrative, sc)}
            className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-teal-500/50 rounded-2xl p-3.5 cursor-pointer transition-all hover:scale-[1.01] hover:shadow-lg group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400 bg-teal-950/60 px-2 py-0.5 rounded-md border border-teal-800/50">
                  {sc.category}
                </span>
              </div>
              <h4 className="text-xs font-bold text-white group-hover:text-teal-300 transition-colors line-clamp-1">
                {sc.title}
              </h4>
              <p className="text-[11px] text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                {sc.description}
              </p>
            </div>

            <div className="mt-3 pt-2 border-t border-slate-700/50 flex items-center justify-between text-[11px] font-medium text-teal-400 group-hover:translate-x-0.5 transition-transform">
              <span>Load Case Narrative</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
