import React, { SelectHTMLAttributes, forwardRef } from 'react';
import { tokens } from '../../utils/design-tokens';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  selectSize?: 'sm' | 'md' | 'lg';
  options: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ 
    label,
    error,
    helperText,
    fullWidth = false,
    selectSize = 'md',
    options,
    placeholder = 'Select an option',
    className = '',
    id,
    required,
    disabled,
    value,
    ...props 
  }, ref) => {
    const selectId = id || `select-${Math.random().toString(36).substring(7)}`;
    
    const sizeStyles = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-4 py-3 text-lg',
    };

    const baseSelectStyles = `
      block rounded-lg border pr-10
      bg-white dark:bg-gray-900
      transition-colors duration-200
      focus:outline-none focus:ring-2 focus:ring-offset-2
      disabled:bg-gray-100 disabled:cursor-not-allowed
      dark:disabled:bg-gray-800
      appearance-none cursor-pointer
      bg-no-repeat bg-right
    `;

    const borderStyles = error
      ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
      : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500';

    const widthStyles = fullWidth ? 'w-full' : '';

    // Custom arrow icon as background image
    const arrowIcon = `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`;

    return (
      <div className={`${fullWidth ? 'w-full' : ''} ${className}`}>
        {label && (
          <label 
            htmlFor={selectId}
            className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {label}
            {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
          </label>
        )}
        
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={`
              ${baseSelectStyles}
              ${sizeStyles[selectSize]}
              ${borderStyles}
              ${widthStyles}
              text-gray-900 dark:text-gray-100
            `}
            style={{
              backgroundImage: arrowIcon,
              backgroundPosition: 'right 0.5rem center',
              backgroundSize: '1.5em 1.5em',
            }}
            disabled={disabled}
            required={required}
            value={value}
            aria-invalid={!!error}
            aria-describedby={
              error ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined
            }
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option 
                key={option.value} 
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>
        </div>
        
        {error && (
          <p 
            id={`${selectId}-error`}
            className="mt-2 text-sm text-red-600 dark:text-red-400"
            role="alert"
          >
            {error}
          </p>
        )}
        
        {helperText && !error && (
          <p 
            id={`${selectId}-helper`}
            className="mt-2 text-sm text-gray-500 dark:text-gray-400"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';