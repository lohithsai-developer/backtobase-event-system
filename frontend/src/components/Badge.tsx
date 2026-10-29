import React from 'react';

interface BadgeProps {
  variant?: 'active' | 'inactive' | 'success' | 'warning' | 'danger' | 'info';
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'info', children }) => {
  const styles = {
    active: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    inactive: 'bg-slate-700/40 text-slate-400 border border-slate-700',
    success: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    warning: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    danger: 'bg-rose-500/15 text-rose-400 border border-rose-500/30',
    info: 'bg-[#00e5ff]/15 text-[#00e5ff] border border-[#00e5ff]/30',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide ${styles[variant]}`}
    >
      {children}
    </span>
  );
};
