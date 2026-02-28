import { cn } from '../../lib/utils';

const base = 'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

const variants = {
  primary: 'bg-blue-700 text-white hover:bg-blue-800 focus:ring-blue-500',
  secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200 focus:ring-slate-400 border border-slate-300',
  success: 'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500',
  danger: 'bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500',
  warning: 'bg-amber-500 text-white hover:bg-amber-600 focus:ring-amber-400',
  ghost: 'text-slate-600 hover:bg-slate-100 focus:ring-slate-300',
  outline: 'border border-blue-600 text-blue-700 hover:bg-blue-50 focus:ring-blue-400',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
};

export function Button({ variant = 'primary', size = 'md', className, children, ...props }) {
  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  );
}
