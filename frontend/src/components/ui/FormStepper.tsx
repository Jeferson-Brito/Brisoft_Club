import React from 'react';
import { Check, ChevronRight } from 'lucide-react';

export interface StepItem {
  number: number;
  label: string;
  sublabel?: string;
}

interface Props {
  steps: StepItem[];
  currentStep: number;
  onStepClick?: (stepNumber: number) => void;
}

export function FormStepper({ steps, currentStep, onStepClick }: Props) {
  return (
    <div className="w-full sticky top-[60px] z-30 py-1.5 backdrop-blur-md bg-[#f8fafc]/95 border-b border-slate-200/60 mb-3">
      <div className="flex items-center justify-center gap-1 sm:gap-2 max-w-2xl mx-auto px-3 overflow-x-auto no-scrollbar">
        {steps.map((step, idx) => {
          const isDone = step.number < currentStep;
          const isCurrent = step.number === currentStep;
          const canClick = isDone && onStepClick;

          return (
            <React.Fragment key={step.number}>
              <button
                type="button"
                onClick={() => {
                  if (canClick) onStepClick(step.number);
                }}
                disabled={!canClick}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] sm:text-xs transition-all shrink-0 ${
                  isCurrent
                    ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200/80 shadow-2xs'
                    : isDone
                    ? 'text-slate-700 font-semibold hover:bg-slate-100 cursor-pointer'
                    : 'text-slate-400 font-medium cursor-default'
                }`}
              >
                {/* Mini Badge */}
                <span
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] sm:text-[10px] font-bold shrink-0 transition-colors ${
                    isDone
                      ? 'bg-emerald-500 text-white'
                      : isCurrent
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {isDone ? <Check size={10} strokeWidth={3} /> : step.number}
                </span>

                {/* Nome da etapa */}
                <span className="whitespace-nowrap">{step.label}</span>
              </button>

              {/* Separador entre etapas */}
              {idx < steps.length - 1 && (
                <ChevronRight size={12} className="text-slate-300 shrink-0" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

