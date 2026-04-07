import React from 'react';
import { cn } from '../utils/cn';

const GlassCard = ({ className, children, as: Component = 'div', ...rest }) => {
  return (
    <Component className={cn('glass', className)} {...rest}>
      {children}
    </Component>
  );
};

export default GlassCard;

