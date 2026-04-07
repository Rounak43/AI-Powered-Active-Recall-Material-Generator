import React from 'react';
import { cn } from '../utils/cn';

const PillSelector = ({ options, active, onChange }) => {
  return (
    <div className="inline-flex flex-wrap gap-2 rounded-full bg-black/30 p-1">
      {options.map((opt) => {
        const value = typeof opt === 'string' ? opt : opt.value;
        const label = typeof opt === 'string' ? opt : opt.label;
        const isActive = active === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => onChange(value)}
            className={cn(
              'px-3 py-1.5 text-xs font-body rounded-full transition-all cursor-pointer',
              isActive
                ? 'bg-gradient-to-r from-primary via-accent to-secondary text-white shadow-glow'
                : 'glass bg-transparent text-muted hover:text-white hover:border-primary/70'
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
};

export default PillSelector;

