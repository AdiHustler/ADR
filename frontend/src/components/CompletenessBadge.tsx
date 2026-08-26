import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react';
import { MissingFieldItem } from '../types';

interface CompletenessBadgeProps {
  score: number;
  missingFields: MissingFieldItem[];
  ichCriteriaMet: boolean;
  onSelectField?: (fieldName: string) => void;
}

export const CompletenessBadge: React.FC<CompletenessBadgeProps> = ({
  score,
  missingFields,
  ichCriteriaMet,
  onSelectField
}) => {
  const [expanded, setExpanded] = useState(false);

  const getScoreColor = (s: number) => {
    if (s >= 85) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (s >= 60) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-rose-600 bg-rose-50 border-rose-200';
  };

  const getProgressBarColor = (s: number) => {
    if (s >= 85) return 'bg-emerald-500';
    if (s >= 60) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  const mandatoryCount = missingFields.filter(f => f.category === 'mandatory_ich').length;
  const clinicalCount = missingFields.filter(f => f.category === 'important_clinical').length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 transition-all">
      <div className="flex items-center justify-between">
        
        {/* Left score & status */}
        <div className="flex items-center space-x-4">
          <div className={`w-14 h-14 rounded-2xl border flex flex-col items-center justify-center font-black ${getScoreColor(score)}`}>
            <span className="text-lg leading-none">{Math.round(score)}%</span>
            <span className="text-[9px] uppercase font-bold tracking-tight mt-0.5">Quality</span>
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <h4 className="font-bold text-slate-900 text-sm">Pharmacovigilance Completeness</h4>
              {ichCriteriaMet ? (
                <span className="inline-flex items-center space-x-1 text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>ICH 4/4 Criteria Met</span>
                </span>
              ) : (
                <span className="inline-flex items-center space-x-1 text-[11px] font-semibold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full border border-rose-300">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>ICH Criteria Incomplete</span>
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500 mt-1">
              {missingFields.length === 0
                ? 'All mandatory and recommended pharmacovigilance fields are complete.'
                : `${mandatoryCount > 0 ? `${mandatoryCount} mandatory ICH item(s)` : ''} ${
                    clinicalCount > 0 ? `${clinicalCount} recommended clinical detail(s)` : ''
                  } missing.`}
            </p>
          </div>
        </div>

        {/* Right expand toggle */}
        {missingFields.length > 0 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center space-x-1.5 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-lg border border-teal-200 transition-colors"
          >
            <span>{expanded ? 'Hide Checklist' : `View Missing (${missingFields.length})`}</span>
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mt-3 w-full bg-slate-100 rounded-full h-2 overflow-hidden">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${getProgressBarColor(score)}`}
          style={{ width: `${score}%` }}
        ></div>
      </div>

      {/* Expanded Checklist */}
      {expanded && missingFields.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
          <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Missing Field Detection & Suggestions</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {missingFields.map((item, idx) => (
              <div
                key={idx}
                onClick={() => onSelectField && onSelectField(item.field)}
                className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all hover:shadow-sm ${
                  item.category === 'mandatory_ich'
                    ? 'bg-rose-50/70 border-rose-200 hover:bg-rose-50 text-rose-900'
                    : item.category === 'important_clinical'
                    ? 'bg-amber-50/70 border-amber-200 hover:bg-amber-50 text-amber-900'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-800'
                }`}
              >
                <div className="flex items-start space-x-2">
                  {item.category === 'mandatory_ich' ? (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-bold">{item.description}</span>
                    <p className="text-[11px] opacity-80 mt-0.5">💡 {item.suggested_action}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
