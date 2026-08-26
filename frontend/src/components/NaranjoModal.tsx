import React, { useState, useEffect } from 'react';
import { X, Calculator, CheckCircle, HelpCircle, ArrowRight, Sparkles } from 'lucide-react';
import { NaranjoQuestion } from '../types';
import { api } from '../services/api';

interface NaranjoModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialAnswers?: Record<string, number>;
  onApplyScore: (score: number, category: string, answers: Record<string, number>) => void;
}

export const NaranjoModal: React.FC<NaranjoModalProps> = ({
  isOpen,
  onClose,
  initialAnswers = {},
  onApplyScore
}) => {
  const [questions, setQuestions] = useState<NaranjoQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>(initialAnswers);
  const [totalScore, setTotalScore] = useState<number>(0);
  const [category, setCategory] = useState<string>('Possible');
  const [interpretation, setInterpretation] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      api.getNaranjoQuestions().then((qs) => {
        setQuestions(qs);
      });
      setAnswers(initialAnswers || {});
    }
  }, [isOpen]);

  useEffect(() => {
    if (Object.keys(answers).length > 0) {
      api.evaluateNaranjo(answers).then((res) => {
        setTotalScore(res.total_score);
        setCategory(res.category);
        setInterpretation(res.interpretation);
      });
    }
  }, [answers]);

  if (!isOpen) return null;

  const handleOptionSelect = (qid: string, score: number) => {
    setAnswers((prev) => ({
      ...prev,
      [qid]: score
    }));
  };

  const getCategoryBadgeClass = (cat: string) => {
    switch (cat) {
      case 'Definite':
        return 'bg-purple-100 text-purple-900 border-purple-300';
      case 'Probable':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      case 'Possible':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Naranjo ADR Probability Scale</h3>
              <p className="text-xs text-slate-400">Standardized 10-Question Pharmacovigilance Causality Assessment</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Score Summary Banner */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <span className="text-3xl font-black text-slate-900">{totalScore}</span>
              <span className="block text-[10px] uppercase font-bold text-slate-400">Total Score</span>
            </div>
            <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-slate-600">Causality Category:</span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${getCategoryBadgeClass(category)}`}>
                  {category}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{interpretation}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500">
            <span className="text-slate-400">Scale:</span>
            <span className="text-purple-700">Definite ≥9</span> •
            <span className="text-emerald-700">Probable 5-8</span> •
            <span className="text-amber-700">Possible 1-4</span> •
            <span className="text-slate-600">Doubtful ≤0</span>
          </div>
        </div>

        {/* Question List */}
        <div className="p-6 max-h-[55vh] overflow-y-auto space-y-4">
          {questions.map((q, index) => {
            const currentSelected = answers[q.id];
            return (
              <div key={q.id} className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start space-x-3">
                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {index + 1}
                    </span>
                    <p className="text-sm font-medium text-slate-800">{q.question}</p>
                  </div>
                </div>

                {/* Option Buttons */}
                <div className="grid grid-cols-3 gap-2 mt-3 pl-9">
                  {Object.entries(q.options).map(([optName, optScore]) => {
                    const isSelected = currentSelected === optScore;
                    return (
                      <button
                        key={optName}
                        type="button"
                        onClick={() => handleOptionSelect(q.id, optScore)}
                        className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${
                          isSelected
                            ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        <span className="capitalize">{optName}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${isSelected ? 'bg-teal-700 text-teal-100' : 'bg-slate-200 text-slate-600'}`}>
                          {optScore > 0 ? `+${optScore}` : optScore}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => {
              onApplyScore(totalScore, category, answers);
              onClose();
            }}
            className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold shadow-md shadow-teal-600/20 transition-all hover:shadow-lg"
          >
            <Sparkles className="w-4 h-4 text-teal-200" />
            <span>Apply Causality Assessment ({category})</span>
          </button>
        </div>

      </div>
    </div>
  );
};
