const { designTokens } = require('./src/styles/design-tokens')

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Design tokens colors
        primary: designTokens.colors.primary,
        secondary: designTokens.colors.secondary,
        success: designTokens.colors.success,
        warning: designTokens.colors.warning,
        error: designTokens.colors.error,
        info: designTokens.colors.info,
        neutral: designTokens.colors.neutral,
      },
      spacing: designTokens.spacing,
      fontSize: designTokens.typography.fontSize,
      fontWeight: designTokens.typography.fontWeight,
      lineHeight: designTokens.typography.lineHeight,
      borderRadius: designTokens.border.radius,
      borderWidth: designTokens.border.width,
      boxShadow: designTokens.shadow,
      screens: designTokens.breakpoints,
      zIndex: designTokens.zIndex,
      transitionDuration: designTokens.transition.duration,
      transitionTimingFunction: {
        'ease-default': designTokens.transition.easing.default,
        'ease-in': designTokens.transition.easing.in,
        'ease-out': designTokens.transition.easing.out,
        'ease-in-out': designTokens.transition.easing.inOut,
      },
      fontFamily: {
        sans: designTokens.typography.fontFamily.sans,
        mono: designTokens.typography.fontFamily.mono,
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'pulse-soft': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [
    // Plugin personalizado para utilitários de design system
    function({ addUtilities }) {
      const newUtilities = {
        '.text-balance': {
          'text-wrap': 'balance',
        },
        '.animation-delay-200': {
          'animation-delay': '200ms',
        },
        '.animation-delay-400': {
          'animation-delay': '400ms',
        },
      }
      addUtilities(newUtilities)
    }
  ],
}