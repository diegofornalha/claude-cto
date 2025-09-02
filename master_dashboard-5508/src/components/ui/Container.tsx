import React, { HTMLAttributes, forwardRef } from 'react';
import { tokens } from '../../utils/design-tokens';

export interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  centered?: boolean;
  padding?: boolean;
  fluid?: boolean;
}

export const Container = forwardRef<HTMLDivElement, ContainerProps>(
  ({ 
    maxWidth = 'xl',
    centered = true,
    padding = true,
    fluid = false,
    children,
    className = '',
    ...props 
  }, ref) => {
    const maxWidthStyles = {
      sm: 'max-w-screen-sm',   // 640px
      md: 'max-w-screen-md',   // 768px
      lg: 'max-w-screen-lg',   // 1024px
      xl: 'max-w-screen-xl',   // 1280px
      '2xl': 'max-w-screen-2xl', // 1536px
      full: 'max-w-full',
    };

    const baseStyles = `
      w-full
      ${fluid ? '' : maxWidthStyles[maxWidth]}
      ${centered && !fluid ? 'mx-auto' : ''}
      ${padding ? 'px-4 sm:px-6 lg:px-8' : ''}
    `;

    return (
      <div
        ref={ref}
        className={`${baseStyles} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Container.displayName = 'Container';

// Section component for semantic page sections
export interface SectionProps extends HTMLAttributes<HTMLElement> {
  background?: 'default' | 'muted' | 'accent';
  spacing?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

export const Section = forwardRef<HTMLElement, SectionProps>(
  ({ 
    background = 'default',
    spacing = 'lg',
    children,
    className = '',
    ...props 
  }, ref) => {
    const backgroundStyles = {
      default: '',
      muted: 'bg-gray-50 dark:bg-gray-900',
      accent: 'bg-blue-50 dark:bg-blue-900/20',
    };

    const spacingStyles = {
      none: '',
      sm: 'py-8',
      md: 'py-12',
      lg: 'py-16 md:py-20',
      xl: 'py-20 md:py-28',
    };

    return (
      <section
        ref={ref}
        className={`
          ${backgroundStyles[background]}
          ${spacingStyles[spacing]}
          ${className}
        `}
        {...props}
      >
        {children}
      </section>
    );
  }
);

Section.displayName = 'Section';

// Main content wrapper with proper semantic HTML
export interface MainProps extends HTMLAttributes<HTMLElement> {
  withSidebar?: boolean;
}

export const Main = forwardRef<HTMLElement, MainProps>(
  ({ withSidebar = false, children, className = '', ...props }, ref) => {
    const layoutStyles = withSidebar
      ? 'flex-1 min-w-0' // Allows main content to shrink when sidebar is present
      : 'w-full';

    return (
      <main
        ref={ref}
        className={`${layoutStyles} ${className}`}
        {...props}
      >
        {children}
      </main>
    );
  }
);

Main.displayName = 'Main';

// Page wrapper for consistent page structure
export interface PageProps extends HTMLAttributes<HTMLDivElement> {
  fullHeight?: boolean;
}

export const Page = forwardRef<HTMLDivElement, PageProps>(
  ({ fullHeight = false, children, className = '', ...props }, ref) => {
    const heightStyles = fullHeight ? 'min-h-screen' : '';

    return (
      <div
        ref={ref}
        className={`
          flex flex-col
          ${heightStyles}
          ${className}
        `}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Page.displayName = 'Page';