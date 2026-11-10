import React from 'react';

export const BigButton = ({
  children,
  onClick,
  variant = 'primary', // 'primary' (green), 'blue', 'danger' (red), 'secondary' (slate)
  type = 'button',
  disabled = false,
  className = '',
  icon: Icon = null
}) => {
  let baseStyle =
    'inline-flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-bold text-lg transition-all active:scale-[0.98] shadow-md disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer';

  let colorStyle = '';
  if (variant === 'primary') {
    // Huge action green
    colorStyle = 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-700/30';
  } else if (variant === 'blue') {
    colorStyle = 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-700/30';
  } else if (variant === 'danger') {
    colorStyle = 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-700/30';
  } else if (variant === 'warning') {
    colorStyle = 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-amber-600/30';
  } else {
    colorStyle = 'bg-slate-200 hover:bg-slate-300 text-slate-800 shadow-slate-300/30';
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyle} ${colorStyle} ${className}`}
    >
      {Icon && <Icon className="w-6 h-6 stroke-[2.5]" />}
      <span>{children}</span>
    </button>
  );
};
