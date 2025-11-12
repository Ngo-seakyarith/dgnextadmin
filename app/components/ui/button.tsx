// ../ui/button.tsx
import * as React from 'react';
import { cn } from '@/app/lib/untils/utils'; // Utility for className concatenation, if using Shadcn

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: 'sm' | 'default' | 'lg';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, size, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors',
          size === 'sm' && 'px-3 py-1.5 text-sm',
          size === 'default' && 'px-4 py-2',
          size === 'lg' && 'px-6 py-3',
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
        disabled={disabled}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button };