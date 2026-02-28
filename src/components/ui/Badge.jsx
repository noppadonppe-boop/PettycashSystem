import { cn } from '../../lib/utils';

const variants = {
  'Pending GM': 'bg-amber-100 text-amber-800 border-amber-200',
  'GM Rejected': 'bg-rose-100 text-rose-800 border-rose-200',
  Approved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'Acknowledged by AP': 'bg-blue-100 text-blue-800 border-blue-200',
  'Closure Requested': 'bg-purple-100 text-purple-800 border-purple-200',
  'Closure Confirmed by AP': 'bg-indigo-100 text-indigo-800 border-indigo-200',
  Closed: 'bg-slate-100 text-slate-700 border-slate-200',
  'Pending PM': 'bg-amber-100 text-amber-800 border-amber-200',
  'Pending AP': 'bg-orange-100 text-orange-800 border-orange-200',
  'AP Rejected': 'bg-rose-100 text-rose-800 border-rose-200',
  default: 'bg-slate-100 text-slate-700 border-slate-200',
};

export function Badge({ status, className }) {
  const style = variants[status] || variants.default;
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        style,
        className
      )}
    >
      {status}
    </span>
  );
}
