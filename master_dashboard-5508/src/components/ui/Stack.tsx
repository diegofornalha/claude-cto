import React, { HTMLAttributes, forwardRef } from 'react';

export interface StackProps extends HTMLAttributes<HTMLDivElement> {
  direction?: 'horizontal' | 'vertical';
  spacing?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  wrap?: boolean;
  divider?: boolean;
  fullWidth?: boolean;
  fullHeight?: boolean;
}

export const Stack = forwardRef<HTMLDivElement, StackProps>(
  ({ 
    direction = 'vertical',
    spacing = 'md',
    align = 'stretch',
    justify = 'start',
    wrap = false,
    divider = false,
    fullWidth = false,
    fullHeight = false,
    children,
    className = '',
    ...props 
  }, ref) => {
    const directionStyles = {
      horizontal: 'flex-row',
      vertical: 'flex-col',
    };

    const spacingStyles = {
      none: '',
      xs: direction === 'horizontal' ? 'space-x-1' : 'space-y-1',
      sm: direction === 'horizontal' ? 'space-x-2' : 'space-y-2',
      md: direction === 'horizontal' ? 'space-x-4' : 'space-y-4',
      lg: direction === 'horizontal' ? 'space-x-6' : 'space-y-6',
      xl: direction === 'horizontal' ? 'space-x-8' : 'space-y-8',
    };

    const alignStyles = {
      start: 'items-start',
      center: 'items-center',
      end: 'items-end',
      stretch: 'items-stretch',
      baseline: 'items-baseline',
    };

    const justifyStyles = {
      start: 'justify-start',
      center: 'justify-center',
      end: 'justify-end',
      between: 'justify-between',
      around: 'justify-around',
      evenly: 'justify-evenly',
    };

    const wrapStyles = wrap ? 'flex-wrap' : '';
    const widthStyles = fullWidth ? 'w-full' : '';
    const heightStyles = fullHeight ? 'h-full' : '';

    // Process children to add dividers if needed
    const processedChildren = divider && React.Children.count(children) > 1
      ? React.Children.toArray(children).reduce((acc: React.ReactNode[], child, index, array) => {
          acc.push(child);
          if (index < array.length - 1) {
            acc.push(
              <div
                key={`divider-${index}`}
                className={
                  direction === 'horizontal'
                    ? 'w-px h-full bg-gray-200 dark:bg-gray-700'
                    : 'h-px w-full bg-gray-200 dark:bg-gray-700'
                }
                aria-hidden="true"
              />
            );
          }
          return acc;
        }, [])
      : children;

    return (
      <div
        ref={ref}
        className={`
          flex
          ${directionStyles[direction]}
          ${spacingStyles[spacing]}
          ${alignStyles[align]}
          ${justifyStyles[justify]}
          ${wrapStyles}
          ${widthStyles}
          ${heightStyles}
          ${className}
        `}
        {...props}
      >
        {processedChildren}
      </div>
    );
  }
);

Stack.displayName = 'Stack';

// HStack - Horizontal Stack shorthand
export interface HStackProps extends Omit<StackProps, 'direction'> {}

export const HStack = forwardRef<HTMLDivElement, HStackProps>(
  (props, ref) => {
    return <Stack ref={ref} direction="horizontal" {...props} />;
  }
);

HStack.displayName = 'HStack';

// VStack - Vertical Stack shorthand
export interface VStackProps extends Omit<StackProps, 'direction'> {}

export const VStack = forwardRef<HTMLDivElement, VStackProps>(
  (props, ref) => {
    return <Stack ref={ref} direction="vertical" {...props} />;
  }
);

VStack.displayName = 'VStack';

// Spacer - Flexible space component for use in stacks
export interface SpacerProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'auto';
}

export const Spacer = forwardRef<HTMLDivElement, SpacerProps>(
  ({ size = 'auto', className = '', ...props }, ref) => {
    const sizeStyles = {
      xs: 'w-1 h-1',
      sm: 'w-2 h-2',
      md: 'w-4 h-4',
      lg: 'w-6 h-6',
      xl: 'w-8 h-8',
      auto: 'flex-1',
    };

    return (
      <div
        ref={ref}
        className={`${sizeStyles[size]} ${className}`}
        aria-hidden="true"
        {...props}
      />
    );
  }
);

Spacer.displayName = 'Spacer';

// Divider - Standalone divider component
export interface DividerProps extends HTMLAttributes<HTMLHRElement> {
  orientation?: 'horizontal' | 'vertical';
  thickness?: 'thin' | 'medium' | 'thick';
  color?: 'light' | 'medium' | 'dark';
}

export const Divider = forwardRef<HTMLHRElement, DividerProps>(
  ({ 
    orientation = 'horizontal',
    thickness = 'medium',
    color = 'medium',
    className = '',
    ...props 
  }, ref) => {
    const orientationStyles = {
      horizontal: 'w-full',
      vertical: 'h-full',
    };

    const thicknessStyles = {
      thin: orientation === 'horizontal' ? 'h-px' : 'w-px',
      medium: orientation === 'horizontal' ? 'h-0.5' : 'w-0.5',
      thick: orientation === 'horizontal' ? 'h-1' : 'w-1',
    };

    const colorStyles = {
      light: 'bg-gray-100 dark:bg-gray-800',
      medium: 'bg-gray-200 dark:bg-gray-700',
      dark: 'bg-gray-300 dark:bg-gray-600',
    };

    return (
      <hr
        ref={ref}
        className={`
          border-0
          ${orientationStyles[orientation]}
          ${thicknessStyles[thickness]}
          ${colorStyles[color]}
          ${className}
        `}
        {...props}
      />
    );
  }
);

Divider.displayName = 'Divider';