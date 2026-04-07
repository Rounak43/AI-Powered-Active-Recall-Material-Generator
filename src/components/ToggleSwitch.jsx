import React from 'react';
import { cn } from '../utils/cn';

const ToggleSwitch = ({ checked, onChange, label, subtitle }) => {
  const handleClick = () => {
    onChange(!checked);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="w-full flex items-center justify-between gap-3 rounded-xl bg-black/40 px-3 py-2 text-left cursor-pointer hover:bg-white/5 transition-colors"
    >
      <div>
        <div className="text-sm font-body text-white">{label}</div>
        {subtitle && (
          <div className="text-[11px] font-body text-muted mt-0.5">
            {subtitle}
          </div>
        )}
      </div>
      <div
        className={cn(
          'flex h-6 w-11 items-center rounded-full border px-0.5 transition-all',
          checked
            ? 'bg-gradient-to-r from-primary to-secondary border-transparent'
            : 'bg-white/10 border-border'
        )}
      >
        <div
          className={cn(
            'h-4 w-4 rounded-full bg-white shadow-sm transition-transform',
            checked ? 'translate-x-4' : 'translate-x-0'
          )}
        />
      </div>
    </button>
  );
};

export default ToggleSwitch;

