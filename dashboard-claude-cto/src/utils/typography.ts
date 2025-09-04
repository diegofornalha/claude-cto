import { tokens } from './design-tokens';

// Typography utilities based on design tokens
export const typography = {
  // Text size utilities
  sizes: {
    xs: `text-xs`, // 0.75rem
    sm: `text-sm`, // 0.875rem
    base: `text-base`, // 1rem
    lg: `text-lg`, // 1.125rem
    xl: `text-xl`, // 1.25rem
    '2xl': `text-2xl`, // 1.5rem
    '3xl': `text-3xl`, // 1.875rem
    '4xl': `text-4xl`, // 2.25rem
    '5xl': `text-5xl`, // 3rem
  },
  
  // Font weight utilities
  weights: {
    normal: 'font-normal', // 400
    medium: 'font-medium', // 500
    semibold: 'font-semibold', // 600
    bold: 'font-bold', // 700
  },
  
  // Common typography combinations
  headings: {
    h1: 'text-4xl font-bold text-gray-900 dark:text-white',
    h2: 'text-3xl font-bold text-gray-900 dark:text-white',
    h3: 'text-2xl font-semibold text-gray-900 dark:text-white',
    h4: 'text-xl font-semibold text-gray-900 dark:text-white',
    h5: 'text-lg font-semibold text-gray-900 dark:text-white',
    h6: 'text-base font-semibold text-gray-900 dark:text-white',
  },
  
  // Body text styles
  body: {
    large: 'text-lg text-gray-700 dark:text-gray-300',
    base: 'text-base text-gray-700 dark:text-gray-300',
    small: 'text-sm text-gray-600 dark:text-gray-400',
    xs: 'text-xs text-gray-500 dark:text-gray-500',
  },
  
  // Special text styles
  special: {
    muted: 'text-gray-500 dark:text-gray-400',
    caption: 'text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide',
    code: 'font-mono text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded',
    link: 'text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors',
    error: 'text-red-600 dark:text-red-400',
    success: 'text-green-600 dark:text-green-400',
    warning: 'text-amber-600 dark:text-amber-400',
  },
  
  // Line height utilities
  lineHeight: {
    tight: 'leading-tight',
    snug: 'leading-snug',
    normal: 'leading-normal',
    relaxed: 'leading-relaxed',
    loose: 'leading-loose',
  }
};

// Spacing utilities based on design tokens
export const spacing = {
  // Margin utilities
  margin: {
    xs: 'm-1',   // 0.25rem
    sm: 'm-2',   // 0.5rem
    md: 'm-4',   // 1rem
    lg: 'm-6',   // 1.5rem
    xl: 'm-8',   // 2rem
    '2xl': 'm-12', // 3rem
    '3xl': 'm-16', // 4rem
  },
  
  // Padding utilities
  padding: {
    xs: 'p-1',   // 0.25rem
    sm: 'p-2',   // 0.5rem
    md: 'p-4',   // 1rem
    lg: 'p-6',   // 1.5rem
    xl: 'p-8',   // 2rem
    '2xl': 'p-12', // 3rem
    '3xl': 'p-16', // 4rem
  },
  
  // Gap utilities for flexbox/grid
  gap: {
    xs: 'gap-1',   // 0.25rem
    sm: 'gap-2',   // 0.5rem
    md: 'gap-4',   // 1rem
    lg: 'gap-6',   // 1.5rem
    xl: 'gap-8',   // 2rem
    '2xl': 'gap-12', // 3rem
    '3xl': 'gap-16', // 4rem
  },
  
  // Space between utilities
  space: {
    xs: 'space-y-1',   // 0.25rem
    sm: 'space-y-2',   // 0.5rem
    md: 'space-y-4',   // 1rem
    lg: 'space-y-6',   // 1.5rem
    xl: 'space-y-8',   // 2rem
    '2xl': 'space-y-12', // 3rem
    '3xl': 'space-y-16', // 4rem
  },
  
  // Common spacing patterns
  patterns: {
    // Card spacing
    cardPadding: 'p-6',
    cardGap: 'gap-4',
    
    // Section spacing
    sectionPadding: 'py-12 px-4',
    sectionGap: 'space-y-8',
    
    // Form spacing
    formGroup: 'space-y-4',
    formField: 'space-y-2',
    
    // Navigation spacing
    navPadding: 'px-4 py-2',
    navGap: 'space-x-4',
    
    // Button spacing
    buttonPadding: 'px-4 py-2',
    buttonGap: 'space-x-2',
  }
};

// Layout utilities
export const layout = {
  // Container utilities
  containers: {
    sm: 'max-w-sm mx-auto',     // 384px
    md: 'max-w-md mx-auto',     // 448px
    lg: 'max-w-lg mx-auto',     // 512px
    xl: 'max-w-xl mx-auto',     // 576px
    '2xl': 'max-w-2xl mx-auto', // 672px
    '3xl': 'max-w-3xl mx-auto', // 768px
    '4xl': 'max-w-4xl mx-auto', // 896px
    '5xl': 'max-w-5xl mx-auto', // 1024px
    '6xl': 'max-w-6xl mx-auto', // 1152px
    '7xl': 'max-w-7xl mx-auto', // 1280px
  },
  
  // Grid utilities
  grids: {
    cols1: 'grid grid-cols-1',
    cols2: 'grid grid-cols-1 md:grid-cols-2',
    cols3: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    cols4: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    cols5: 'grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5',
    cols6: 'grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6',
  },
  
  // Flex utilities
  flexbox: {
    row: 'flex flex-row items-center',
    col: 'flex flex-col',
    center: 'flex items-center justify-center',
    between: 'flex items-center justify-between',
    wrap: 'flex flex-wrap',
  }
};

// Component style presets
export const componentStyles = {
  // Card styles
  card: {
    base: 'bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm',
    elevated: 'bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg',
    interactive: 'bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-shadow cursor-pointer',
  },
  
  // Button styles
  button: {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors',
    secondary: 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 font-medium px-4 py-2 rounded-lg transition-colors',
    outline: 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium px-4 py-2 rounded-lg transition-colors',
    ghost: 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium px-4 py-2 rounded-lg transition-colors',
  },
  
  // Input styles
  input: {
    base: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors',
    error: 'w-full px-3 py-2 border border-red-300 dark:border-red-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors',
  },
  
  // Badge styles
  badge: {
    primary: 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    secondary: 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    success: 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    warning: 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    error: 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  }
};

// Utility function to combine styles
export const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

// Responsive utilities
export const responsive = {
  // Show/hide on different screen sizes
  showOnMobile: 'block md:hidden',
  hideOnMobile: 'hidden md:block',
  showOnTablet: 'hidden md:block lg:hidden',
  hideOnTablet: 'block md:hidden lg:block',
  showOnDesktop: 'hidden lg:block',
  hideOnDesktop: 'block lg:hidden',
  
  // Text size responsive
  textResponsive: {
    sm: 'text-sm md:text-base',
    base: 'text-base md:text-lg',
    lg: 'text-lg md:text-xl',
    xl: 'text-xl md:text-2xl',
    '2xl': 'text-2xl md:text-3xl',
  },
  
  // Padding responsive
  paddingResponsive: {
    sm: 'p-4 md:p-6',
    md: 'p-6 md:p-8',
    lg: 'p-8 md:p-12',
  }
};

export default {
  typography,
  spacing,
  layout,
  componentStyles,
  cn,
  responsive
};