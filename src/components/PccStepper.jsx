import { CheckCircle, Circle, Clock } from 'lucide-react';
import { PCC_STATUS } from '../data/mockData';
import { cn } from '../lib/utils';

const steps = [
  { label: 'SiteAdmin', sublabel: 'Created', statuses: [] },
  { label: 'PM', sublabel: 'Verify', statuses: [PCC_STATUS.PENDING_PM] },
  { label: 'AccountPay', sublabel: 'Verify', statuses: [PCC_STATUS.PENDING_AP, PCC_STATUS.AP_REJECTED] },
  { label: 'GM', sublabel: 'Approve', statuses: [PCC_STATUS.PENDING_GM, PCC_STATUS.GM_REJECTED, PCC_STATUS.APPROVED] },
];

function getStepState(stepIdx, status) {
  if (status === PCC_STATUS.APPROVED) return 'complete';
  if (status === PCC_STATUS.AP_REJECTED) {
    if (stepIdx < 2) return 'complete';
    if (stepIdx === 2) return 'rejected';
    return 'upcoming';
  }
  if (status === PCC_STATUS.GM_REJECTED) {
    if (stepIdx < 3) return 'complete';
    if (stepIdx === 3) return 'rejected';
    return 'upcoming';
  }
  const order = [PCC_STATUS.PENDING_PM, PCC_STATUS.PENDING_AP, PCC_STATUS.PENDING_GM];
  const currentOrder = order.indexOf(status);
  if (currentOrder === -1) return 'upcoming';
  if (stepIdx === 0) return 'complete';
  if (stepIdx - 1 < currentOrder) return 'complete';
  if (stepIdx - 1 === currentOrder) return 'active';
  return 'upcoming';
}

export function PccStepper({ status }) {
  return (
    <div className="flex items-center gap-0 w-full">
      {steps.map((step, idx) => {
        const state = getStepState(idx, status);
        return (
          <div key={step.label} className="flex items-center flex-1">
            <div className="flex flex-col items-center gap-1 min-w-[80px]">
              <div
                className={cn(
                  'w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all',
                  state === 'complete' && 'bg-emerald-500 border-emerald-500 text-white',
                  state === 'active' && 'bg-blue-600 border-blue-600 text-white',
                  state === 'rejected' && 'bg-rose-500 border-rose-500 text-white',
                  state === 'upcoming' && 'bg-white border-slate-300 text-slate-400'
                )}
              >
                {state === 'complete' ? (
                  <CheckCircle size={18} />
                ) : state === 'active' ? (
                  <Clock size={18} />
                ) : state === 'rejected' ? (
                  <span className="text-xs font-bold">✕</span>
                ) : (
                  <Circle size={18} />
                )}
              </div>
              <div className="text-center">
                <p className={cn(
                  'text-xs font-semibold',
                  state === 'complete' && 'text-emerald-700',
                  state === 'active' && 'text-blue-700',
                  state === 'rejected' && 'text-rose-700',
                  state === 'upcoming' && 'text-slate-400'
                )}>
                  {step.label}
                </p>
                <p className="text-[10px] text-slate-400">{step.sublabel}</p>
              </div>
            </div>
            {idx < steps.length - 1 && (
              <div
                className={cn(
                  'flex-1 h-0.5 mx-1 rounded',
                  getStepState(idx, status) === 'complete' ? 'bg-emerald-400' : 'bg-slate-200'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
