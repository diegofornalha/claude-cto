import React, { InputHTMLAttributes, forwardRef } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  inputSize?: 'sm' | 'md' | 'lg';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ 
    label,
    error,
    helperText,
    fullWidth = false,
    inputSize = 'md',
    className = '',
    id,
    required,
    disabled,
    ...props 
  }, ref) => {
    const inputId = id || `input-default`;
    
    const sizeStyles = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-4 py-3 text-lg',
    };

    const baseInputStyles = `
      block rounded-lg border
      bg-white dark:bg-gray-900
      transition-colors duration-200
      focus:outline-none focus:ring-2 focus:ring-offset-2
      disabled:bg-gray-100 disabled:cursor-not-allowed
      dark:disabled:bg-gray-800
    `;

    const borderStyles = error
      ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
      : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500';

    const widthStyles = fullWidth ? 'w-full' : '';

    return (
      <div className={`${fullWidth ? 'w-full' : ''} ${className}`}>
        {label && (
          <label 
            htmlFor={inputId}
            className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {label}
            {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
          </label>
        )}
        
        <input
          ref={ref}
          id={inputId}
          className={`
            ${baseInputStyles}
            ${sizeStyles[inputSize]}
            ${borderStyles}
            ${widthStyles}
            text-gray-900 dark:text-gray-100
            placeholder-gray-400 dark:placeholder-gray-500
          `}
          disabled={disabled}
          required={required}
          aria-invalid={!!error}
          aria-describedby={
            error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
          }
          {...props}
        />
        
        {error && (
          <p 
            id={`${inputId}-error`}
            className="mt-2 text-sm text-red-600 dark:text-red-400"
            role="alert"
          >
            {error}
          </p>
        )}
        
        {helperText && !error && (
          <p 
            id={`${inputId}-helper`}
            className="mt-2 text-sm text-gray-500 dark:text-gray-400"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';