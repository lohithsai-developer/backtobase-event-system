import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: React.ReactNode;
  accentColor?: 'turquoise' | 'gold' | 'green' | 'amber';
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtext,
  icon,
  accentColor = 'turquoise',
}) => {
  const accentBorder = {
    turquoise: 'border-l-[#00e5ff]',
    gold: 'border-l-[#e6be6d]',
    green: 'border-l-emerald-500',
    amber: 'border-l-amber-500',
  }[accentColor];

  const iconBg = {
    turquoise: 'bg-[#00e5ff]/10 text-[#00e5ff]',
    gold: 'bg-[#e6be6d]/10 text-[#e6be6d]',
    green: 'bg-emerald-500/10 text-emerald-400',
    amber: 'bg-amber-500/10 text-amber-400',
  }[accentColor];

  return (
    <div
      className={`bg-[#171b26] border border-[#272d3f] border-l-4 ${accentBorder} rounded-xl p-5 shadow-lg transition-all duration-200 hover:border-[#37415a]`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
          <p className="text-3xl font-extrabold text-white mt-1.5 tracking-tight">{value}</p>
          {subtext && <p className="text-xs text-slate-500 mt-1">{subtext}</p>}
        </div>
        {icon && <div className={`p-3 rounded-xl ${iconBg}`}>{icon}</div>}
      </div>
    </div>
  );
};
