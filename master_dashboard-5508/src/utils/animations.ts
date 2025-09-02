// Animation utilities for smooth transitions and effects
import React from 'react';

export const transitions = {
  // Common transition durations
  duration: {
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
    slower: '500ms',
  },
  
  // Easing functions
  easing: {
    default: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
    in: 'cubic-bezier(0.4, 0.0, 1, 1)',
    out: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    elastic: 'cubic-bezier(0.175, 0.885, 0.320, 1.275)',
  },
  
  // Common transition classes
  classes: {
    // Scale animations
    scaleHover: 'transition-transform duration-200 hover:scale-105',
    scaleClick: 'active:scale-95',
    scaleIn: 'animate-scale-in',
    
    // Fade animations
    fadeIn: 'animate-fade-in',
    fadeInUp: 'animate-fade-in-up',
    fadeInDown: 'animate-fade-in-down',
    fadeInLeft: 'animate-fade-in-left',
    fadeInRight: 'animate-fade-in-right',
    
    // Slide animations
    slideIn: 'animate-slide-in',
    slideUp: 'animate-slide-up',
    slideDown: 'animate-slide-down',
    
    // Color transitions
    colorTransition: 'transition-colors duration-200',
    allTransition: 'transition-all duration-200',
    
    // Shadow transitions
    shadowHover: 'transition-shadow duration-200 hover:shadow-lg',
    shadowLarge: 'transition-shadow duration-200 hover:shadow-xl',
    
    // Transform combinations
    hoverLift: 'transition-all duration-200 hover:-translate-y-1 hover:shadow-lg',
    hoverGlow: 'transition-all duration-200 hover:shadow-2xl hover:shadow-blue-500/25',
    
    // Interactive elements
    button: 'transition-all duration-200 transform active:scale-95 hover:shadow-md',
    card: 'transition-all duration-300 hover:shadow-xl hover:-translate-y-1',
    link: 'transition-colors duration-200 hover:text-blue-600',
    
    // Loading states
    pulse: 'animate-pulse',
    spin: 'animate-spin',
    bounce: 'animate-bounce',
    
    // Stagger delay utilities
    delay: {
      '50': 'delay-50',
      '100': 'delay-100', 
      '150': 'delay-150',
      '200': 'delay-200',
      '300': 'delay-300',
      '500': 'delay-500',
    }
  }
};

// Animation delay utility for staggered animations
export const getStaggerDelay = (index: number, baseDelay: number = 50): string => {
  return `${index * baseDelay}ms`;
};

// Intersection Observer hook for scroll animations
export const useIntersectionObserver = (
  ref: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
) => {
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      {
        threshold: 0.1,
        ...options,
      }
    );

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, [ref, options]);

  return isVisible;
};

// Spring animation configurations
export const springConfigs = {
  default: { tension: 300, friction: 30 },
  gentle: { tension: 120, friction: 14 },
  wobbly: { tension: 180, friction: 12 },
  stiff: { tension: 210, friction: 20 },
  slow: { tension: 280, friction: 60 },
  molasses: { tension: 280, friction: 120 },
};

// Page transition variants
export const pageTransitions = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.3 }
  },
  
  slide: {
    initial: { x: '100%' },
    animate: { x: 0 },
    exit: { x: '-100%' },
    transition: { type: 'spring', damping: 20, stiffness: 300 }
  },
  
  scale: {
    initial: { scale: 0.9, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 1.1, opacity: 0 },
    transition: { duration: 0.2 }
  }
};

// Card hover animations
export const cardAnimations = {
  hover: 'transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:scale-[1.02]',
  press: 'active:scale-[0.98] active:shadow-md',
  combined: 'transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:scale-[1.02] active:scale-[0.98]'
};

// Button animations
export const buttonAnimations = {
  primary: 'transition-all duration-200 hover:shadow-lg hover:scale-105 active:scale-95',
  secondary: 'transition-all duration-200 hover:shadow-md hover:scale-102 active:scale-95',
  ghost: 'transition-all duration-200 hover:bg-opacity-10 active:scale-95',
  icon: 'transition-all duration-200 hover:rotate-6 hover:scale-110 active:scale-95'
};

// Loading animation keyframes
export const loadingAnimations = {
  dots: 'animate-pulse',
  spinner: 'animate-spin',
  wave: 'animate-wave',
  bounce: 'animate-bounce',
  skeleton: 'animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700'
};

export default transitions;