import { cn } from '../../lib/utils';

export function Input({ label, error, className, id, required, ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-slate-700">
          {label}{required && <span className="text-rose-500 ml-0.5">*</span>}
        </label>
      )}
      <input
        id={id}
        className={cn(
          'w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-800 placeholder-slate-400',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors',
          error && 'border-rose-400 focus:ring-rose-400',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  );
}

export function Textarea({ label, error, className, id, required, ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-slate-700">
          {label}{required && <span className="text-rose-500 ml-0.5">*</span>}
        </label>
      )}
      <textarea
        id={id}
        className={cn(
          'w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-800 placeholder-slate-400 resize-none',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors',
          error && 'border-rose-400 focus:ring-rose-400',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  );
}

export function Select({ label, error, className, id, required, children, ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-slate-700">
          {label}{required && <span className="text-rose-500 ml-0.5">*</span>}
        </label>
      )}
      <select
        id={id}
        className={cn(
          'w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-800',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white',
          error && 'border-rose-400 focus:ring-rose-400',
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  );
}
