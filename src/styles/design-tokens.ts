/**
 * Design Tokens - Otto Uno Game
 * Based on UI/UX Pro Max Entertainment Card Game patterns
 */

// Spacing Scale (4dp/8dp system - Material Design)
export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  base: '16px',
  lg: '24px',
  xl: '32px',
  '2xl': '48px',
  '3xl': '64px',
} as const;

// Animation Tokens
export const animation = {
  // Duration (150-300ms for micro-interactions)
  duration: {
    fast: 150,
    normal: 200,
    slow: 300,
    modal: 400,
  },
  // Spring physics (Apple HIG)
  spring: {
    stiffness: 400,
    damping: 18,
    mass: 0.8,
  },
  // Easing
  easing: {
    easeOut: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0.0, 1, 1)',
    standard: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
  },
} as const;

// Touch Targets (Apple HIG + Material Design)
export const touchTarget = {
  minSize: 44, // 44pt iOS / 48dp Android
  minSpacing: 8, // minimum gap between targets
} as const;

// Typography Scale
export const typography = {
  // Font sizes
  size: {
    xs: '10px',
    sm: '12px',
    base: '14px',
    md: '16px',
    lg: '18px',
    xl: '24px',
    '2xl': '32px',
    '3xl': '48px',
  },
  // Font weights
  weight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    black: 900,
  },
  // Line heights
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

// Semantic Colors (light mode)
export const colors = {
  // Brand colors (Uno)
  brand: {
    red: '#E3170A',
    blue: '#027CFF',
    green: '#00AA4F',
    yellow: '#FFD500',
  },
  // Semantic UI colors
  primary: '#E3170A',
  secondary: '#027CFF',
  success: '#00AA4F',
  warning: '#FFD500',
  danger: '#E3170A',
  
  // Surfaces
  surface: {
    base: '#FFFFFF',
    raised: '#F8F9FA',
    card: '#FFFFFF',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
  
  // Text
  text: {
    primary: 'rgba(0, 0, 0, 0.87)',
    secondary: 'rgba(0, 0, 0, 0.60)',
    muted: 'rgba(0, 0, 0, 0.38)',
    inverse: '#FFFFFF',
  },
  
  // Borders
  border: {
    default: 'rgba(0, 0, 0, 0.12)',
    strong: 'rgba(0, 0, 0, 0.24)',
  },
} as const;

// Border Radius
export const radius = {
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  '2xl': '24px',
  full: '9999px',
} as const;

// Shadows (elevation system)
export const shadows = {
  sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
  card: '0 2px 8px rgba(0, 0, 0, 0.08)',
  button: '0 2px 4px rgba(0, 0, 0, 0.12)',
} as const;

// Z-index scale
export const zIndex = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  modal: 40,
  popover: 50,
  toast: 100,
  tooltip: 1000,
} as const;
