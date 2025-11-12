import React from 'react';
import { Check } from 'lucide-react';

interface CheckboxProps {
  id?: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  id,
  checked = false,
  onCheckedChange,
  disabled = false,
  className = "",
  children,
}) => {
  const handleClick = () => {
    if (!disabled && onCheckedChange) {
      onCheckedChange(!checked);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div className={`inline-flex items-center ${className}`}>
      <div
        id={id}
        role="checkbox"
        aria-checked={checked}
        tabIndex={disabled ? -1 : 0}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={`
          relative flex items-center justify-center
          w-5 h-5 rounded border-2 transition-all duration-200 cursor-pointer
          ${checked 
            ? 'bg-[#2c3e50] border-[#2c3e50]' 
            : 'bg-white border-gray-300 hover:border-[#2c3e50]'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          focus:outline-none focus:ring-2 focus:ring-[#2c3e50] focus:ring-opacity-50
        `}
        style={{
          borderRadius: 7,
        }}
      >
        {checked && (
          <Check 
            size={15} 
            className="text-white absolute"
            style={{
              strokeWidth: 3,
            }}
          />
        )}
      </div>
      {children}
    </div>
  );
};