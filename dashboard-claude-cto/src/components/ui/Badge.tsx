import React, { HTMLAttributes, forwardRef } from 'react';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';
  size?: 'sm' | 'md' | 'lg';
  pill?: boolean;
  dot?: boolean;
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ 
    variant = 'default',
    size = 'md',
    pill = false,
    dot = false,
    children,
    className = '',
    ...props 
  }, ref) => {
    const baseStyles = `
      inline-flex items-center justify-center font-medium
      transition-colors duration-200
    `;

    const variantStyles = {
      default: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      primary: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      secondary: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      danger: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      info: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    };

    const sizeStyles = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-1 text-sm',
      lg: 'px-3 py-1.5 text-base',
    };

    const radiusStyles = pill ? 'rounded-full' : 'rounded-md';

    return (
      <span
        ref={ref}
        className={`
          ${baseStyles}
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${radiusStyles}
          ${className}
        `}
        {...props}
      >
        {dot && (
          <span 
            className={`
              inline-block rounded-full mr-1.5
              ${size === 'sm' ? 'w-1.5 h-1.5' : size === 'md' ? 'w-2 h-2' : 'w-2.5 h-2.5'}
              ${variant === 'default' ? 'bg-gray-500' : ''}
              ${variant === 'primary' ? 'bg-blue-500' : ''}
              ${variant === 'secondary' ? 'bg-gray-500' : ''}
              ${variant === 'success' ? 'bg-green-500' : ''}
              ${variant === 'danger' ? 'bg-red-500' : ''}
              ${variant === 'warning' ? 'bg-yellow-500' : ''}
              ${variant === 'info' ? 'bg-blue-500' : ''}
            `}
            aria-hidden="true"
          />
        )}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';