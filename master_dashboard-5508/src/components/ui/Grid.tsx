import React, { HTMLAttributes, forwardRef } from 'react';
import { tokens } from '../../utils/design-tokens';

export interface GridProps extends HTMLAttributes<HTMLDivElement> {
  cols?: 1 | 2 | 3 | 4 | 5 | 6 | 12 | 'auto';
  colsSm?: 1 | 2 | 3 | 4 | 5 | 6 | 12 | 'auto';
  colsMd?: 1 | 2 | 3 | 4 | 5 | 6 | 12 | 'auto';
  colsLg?: 1 | 2 | 3 | 4 | 5 | 6 | 12 | 'auto';
  colsXl?: 1 | 2 | 3 | 4 | 5 | 6 | 12 | 'auto';
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  gapX?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  gapY?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  flow?: 'row' | 'col' | 'dense' | 'row-dense' | 'col-dense';
}

export const Grid = forwardRef<HTMLDivElement, GridProps>(
  ({ 
    cols = 1,
    colsSm,
    colsMd,
    colsLg,
    colsXl,
    gap = 'md',
    gapX,
    gapY,
    flow = 'row',
    children,
    className = '',
    ...props 
  }, ref) => {
    const colsStyles = {
      1: 'grid-cols-1',
      2: 'grid-cols-2',
      3: 'grid-cols-3',
      4: 'grid-cols-4',
      5: 'grid-cols-5',
      6: 'grid-cols-6',
      12: 'grid-cols-12',
      'auto': 'grid-cols-[repeat(auto-fit,minmax(250px,1fr))]',
    };

    const responsiveColsStyles = {
      sm: colsSm ? `sm:${colsStyles[colsSm]}` : '',
      md: colsMd ? `md:${colsStyles[colsMd]}` : '',
      lg: colsLg ? `lg:${colsStyles[colsLg]}` : '',
      xl: colsXl ? `xl:${colsStyles[colsXl]}` : '',
    };

    const gapStyles = {
      none: 'gap-0',
      xs: 'gap-1',
      sm: 'gap-2',
      md: 'gap-4',
      lg: 'gap-6',
      xl: 'gap-8',
    };

    const gapXStyles = {
      none: 'gap-x-0',
      xs: 'gap-x-1',
      sm: 'gap-x-2',
      md: 'gap-x-4',
      lg: 'gap-x-6',
      xl: 'gap-x-8',
    };

    const gapYStyles = {
      none: 'gap-y-0',
      xs: 'gap-y-1',
      sm: 'gap-y-2',
      md: 'gap-y-4',
      lg: 'gap-y-6',
      xl: 'gap-y-8',
    };

    const flowStyles = {
      'row': 'grid-flow-row',
      'col': 'grid-flow-col',
      'dense': 'grid-flow-dense',
      'row-dense': 'grid-flow-row-dense',
      'col-dense': 'grid-flow-col-dense',
    };

    const gapClass = gapX || gapY
      ? `${gapX ? gapXStyles[gapX] : ''} ${gapY ? gapYStyles[gapY] : ''}`
      : gapStyles[gap];

    return (
      <div
        ref={ref}
        className={`
          grid
          ${colsStyles[cols]}
          ${responsiveColsStyles.sm}
          ${responsiveColsStyles.md}
          ${responsiveColsStyles.lg}
          ${responsiveColsStyles.xl}
          ${gapClass}
          ${flowStyles[flow]}
          ${className}
        `}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Grid.displayName = 'Grid';

// Grid item component for controlling individual grid items
export interface GridItemProps extends HTMLAttributes<HTMLDivElement> {
  colSpan?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 'auto' | 'full';
  colStart?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 'auto';
  colEnd?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 'auto';
  rowSpan?: 1 | 2 | 3 | 4 | 5 | 6 | 'auto' | 'full';
  rowStart?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 'auto';
  rowEnd?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 'auto';
}

export const GridItem = forwardRef<HTMLDivElement, GridItemProps>(
  ({ 
    colSpan,
    colStart,
    colEnd,
    rowSpan,
    rowStart,
    rowEnd,
    children,
    className = '',
    ...props 
  }, ref) => {
    const colSpanStyles = {
      1: 'col-span-1',
      2: 'col-span-2',
      3: 'col-span-3',
      4: 'col-span-4',
      5: 'col-span-5',
      6: 'col-span-6',
      7: 'col-span-7',
      8: 'col-span-8',
      9: 'col-span-9',
      10: 'col-span-10',
      11: 'col-span-11',
      12: 'col-span-12',
      'auto': 'col-auto',
      'full': 'col-span-full',
    };

    const colStartStyles = {
      1: 'col-start-1',
      2: 'col-start-2',
      3: 'col-start-3',
      4: 'col-start-4',
      5: 'col-start-5',
      6: 'col-start-6',
      7: 'col-start-7',
      8: 'col-start-8',
      9: 'col-start-9',
      10: 'col-start-10',
      11: 'col-start-11',
      12: 'col-start-12',
      13: 'col-start-13',
      'auto': 'col-start-auto',
    };

    const colEndStyles = {
      1: 'col-end-1',
      2: 'col-end-2',
      3: 'col-end-3',
      4: 'col-end-4',
      5: 'col-end-5',
      6: 'col-end-6',
      7: 'col-end-7',
      8: 'col-end-8',
      9: 'col-end-9',
      10: 'col-end-10',
      11: 'col-end-11',
      12: 'col-end-12',
      13: 'col-end-13',
      'auto': 'col-end-auto',
    };

    const rowSpanStyles = {
      1: 'row-span-1',
      2: 'row-span-2',
      3: 'row-span-3',
      4: 'row-span-4',
      5: 'row-span-5',
      6: 'row-span-6',
      'auto': 'row-auto',
      'full': 'row-span-full',
    };

    const rowStartStyles = {
      1: 'row-start-1',
      2: 'row-start-2',
      3: 'row-start-3',
      4: 'row-start-4',
      5: 'row-start-5',
      6: 'row-start-6',
      7: 'row-start-7',
      'auto': 'row-start-auto',
    };

    const rowEndStyles = {
      1: 'row-end-1',
      2: 'row-end-2',
      3: 'row-end-3',
      4: 'row-end-4',
      5: 'row-end-5',
      6: 'row-end-6',
      7: 'row-end-7',
      'auto': 'row-end-auto',
    };

    return (
      <div
        ref={ref}
        className={`
          ${colSpan ? colSpanStyles[colSpan] : ''}
          ${colStart ? colStartStyles[colStart] : ''}
          ${colEnd ? colEndStyles[colEnd] : ''}
          ${rowSpan ? rowSpanStyles[rowSpan] : ''}
          ${rowStart ? rowStartStyles[rowStart] : ''}
          ${rowEnd ? rowEndStyles[rowEnd] : ''}
          ${className}
        `}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GridItem.displayName = 'GridItem';