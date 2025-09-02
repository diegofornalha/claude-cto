import React, { HTMLAttributes, forwardRef } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  hoverable?: boolean;
  selected?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ 
    padding = 'md', 
    shadow = 'md',
    hoverable = false,
    selected = false,
    children, 
    className = '',
    ...props 
  }, ref) => {
    const paddingStyles = {
      none: '',
      sm: 'p-3',
      md: 'p-6',
      lg: 'p-8',
    };

    const shadowStyles = {
      none: '',
      sm: 'shadow-sm',
      md: 'shadow-md',
      lg: 'shadow-lg',
      xl: 'shadow-xl',
    };

    const hoverStyles = hoverable 
      ? 'hover:shadow-lg transition-shadow duration-200 cursor-pointer' 
      : '';

    const selectedStyles = selected
      ? 'ring-2 ring-blue-500 dark:ring-blue-400'
      : '';

    return (
      <div
        ref={ref}
        className={`
          bg-white dark:bg-gray-800 rounded-lg
          ${paddingStyles[padding]}
          ${shadowStyles[shadow]}
          ${hoverStyles}
          ${selectedStyles}
          ${className}
        `}
        aria-selected={selected}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ children, className = '', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`pb-4 border-b border-gray-200 dark:border-gray-700 ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardHeader.displayName = 'CardHeader';

export interface CardBodyProps extends HTMLAttributes<HTMLDivElement> {}

export const CardBody = forwardRef<HTMLDivElement, CardBodyProps>(
  ({ children, className = '', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`py-4 ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardBody.displayName = 'CardBody';

export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {}

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ children, className = '', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`pt-4 border-t border-gray-200 dark:border-gray-700 ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardFooter.displayName = 'CardFooter';

// Alias for CardBody for compatibility
export const CardContent = CardBody;