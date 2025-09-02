import React, { ReactNode, ButtonHTMLAttributes } from 'react';
import { tokens } from '../../utils/design-tokens';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses = `
    inline-flex items-center justify-center
    font-medium rounded-lg
    transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    ${fullWidth ? 'w-full' : ''}
  `;

  const variantClasses = {
    primary: `
      bg-blue-600 hover:bg-blue-700 
      text-white 
      focus:ring-blue-500
      active:bg-blue-800
    `,
    secondary: `
      bg-gray-100 hover:bg-gray-200 
      dark:bg-gray-700 dark:hover:bg-gray-600
      text-gray-900 dark:text-white
      focus:ring-gray-500
    `,
    danger: `
      bg-red-600 hover:bg-red-700 
      text-white 
      focus:ring-red-500
      active:bg-red-800
    `,
    success: `
      bg-green-600 hover:bg-green-700 
      text-white 
      focus:ring-green-500
      active:bg-green-800
    `,
    ghost: `
      bg-transparent hover:bg-gray-100 
      dark:hover:bg-gray-800
      text-gray-700 dark:text-gray-300
      focus:ring-gray-500
    `,
    outline: `
      border-2 border-gray-300 dark:border-gray-600
      bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800
      text-gray-700 dark:text-gray-300
      focus:ring-gray-500
    `
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2 text-base gap-2',
    lg: 'px-6 py-3 text-lg gap-2.5'
  };

  return (
    <button
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg 
          className="animate-spin h-4 w-4" 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24"
        >
          <circle 
            className="opacity-25" 
            cx="12" 
            cy="12" 
            r="10" 
            stroke="currentColor" 
            strokeWidth="4"
          ></circle>
          <path 
            className="opacity-75" 
            fill="currentColor" 
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      )}
      {leftIcon && !loading && leftIcon}
      {children}
      {rightIcon && !loading && rightIcon}
    </button>
  );
};

export default Button;