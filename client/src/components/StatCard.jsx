import React from 'react';

export const StatCard = ({
  title,
  value,
  subtitle = '',
  icon: Icon,
  color = 'blue', // 'blue', 'green', 'amber', 'rose'
  onClick = null
}) => {
  const colorMap = {
    blue: {
      bg: 'bg-blue-50 border-blue-200',
      text: 'text-blue-900',
      iconBg: 'bg-blue-600 text-white',
      accent: 'text-blue-700'
    },
    green: {
      bg: 'bg-emerald-50 border-emerald-200',
      text: 'text-emerald-950',
      iconBg: 'bg-emerald-600 text-white',
      accent: 'text-emerald-700'
    },
    amber: {
      bg: 'bg-amber-50 border-amber-200',
      text: 'text-amber-950',
      iconBg: 'bg-amber-500 text-slate-950',
      accent: 'text-amber-800'
    },
    rose: {
      bg: 'bg-rose-50 border-rose-200',
      text: 'text-rose-950',
      iconBg: 'bg-rose-600 text-white',
      accent: 'text-rose-700'
    }
  };

  const c = colorMap[color] || colorMap.blue;

  return (
    <div
      onClick={onClick}
      className={`p-6 rounded-2xl border-2 ${c.bg} shadow-sm transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:shadow-lg hover:-translate-y-1' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-xl font-bold text-slate-700">{title}</span>
        {Icon && (
          <div className={`p-3 rounded-xl ${c.iconBg} shadow-sm`}>
            <Icon className="w-8 h-8 stroke-[2.2]" />
          </div>
        )}
      </div>

      <div className={`text-4xl font-extrabold tracking-tight ${c.accent}`}>
        {value}
      </div>

      {subtitle && (
        <div className="mt-2 text-base font-medium text-slate-600">{subtitle}</div>
      )}
    </div>
  );
};
