export const colors = {
  // Primary
  primary: '#6366f1',
  primaryHover: '#4f46e5',
  primaryLight: 'rgba(99, 102, 241, 0.1)',

  // Backgrounds
  background: '#fafafa',
  backgroundCard: '#ffffff',
  backgroundDark: '#0f0f10',
  backgroundCardDark: '#1a1a1c',

  // Text
  foreground: '#111827',
  foregroundMuted: '#6b7280',
  foregroundSubtle: '#9ca3af',
  foregroundDark: '#f3f4f6',
  foregroundMutedDark: '#9ca3af',
  foregroundSubtleDark: '#6b7280',

  // Borders
  border: '#e5e7eb',
  borderHover: '#d1d5db',
  borderDark: '#27272a',
  borderHoverDark: '#3f3f46',

  // Status colors
  success: '#10b981',
  successLight: 'rgba(16, 185, 129, 0.1)',
  warning: '#f59e0b',
  warningLight: 'rgba(245, 158, 11, 0.1)',
  danger: '#ef4444',
  dangerLight: 'rgba(239, 68, 68, 0.1)',
  info: '#3b82f6',
  infoLight: 'rgba(59, 130, 246, 0.1)',

  // Gradients
  gradientStart: '#6366f1',
  gradientEnd: '#a855f7',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const fontWeight = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export type Theme = {
  dark: boolean;
  colors: {
    primary: string;
    primaryHover: string;
    primaryLight: string;
    background: string;
    backgroundCard: string;
    foreground: string;
    foregroundMuted: string;
    foregroundSubtle: string;
    border: string;
    borderHover: string;
    success: string;
    successLight: string;
    warning: string;
    warningLight: string;
    danger: string;
    dangerLight: string;
    info: string;
    infoLight: string;
  };
};

export const lightTheme: Theme = {
  dark: false,
  colors: {
    primary: colors.primary,
    primaryHover: colors.primaryHover,
    primaryLight: colors.primaryLight,
    background: colors.background,
    backgroundCard: colors.backgroundCard,
    foreground: colors.foreground,
    foregroundMuted: colors.foregroundMuted,
    foregroundSubtle: colors.foregroundSubtle,
    border: colors.border,
    borderHover: colors.borderHover,
    success: colors.success,
    successLight: colors.successLight,
    warning: colors.warning,
    warningLight: colors.warningLight,
    danger: colors.danger,
    dangerLight: colors.dangerLight,
    info: colors.info,
    infoLight: colors.infoLight,
  },
};

export const darkTheme: Theme = {
  dark: true,
  colors: {
    primary: colors.primary,
    primaryHover: colors.primaryHover,
    primaryLight: colors.primaryLight,
    background: colors.backgroundDark,
    backgroundCard: colors.backgroundCardDark,
    foreground: colors.foregroundDark,
    foregroundMuted: colors.foregroundMutedDark,
    foregroundSubtle: colors.foregroundSubtleDark,
    border: colors.borderDark,
    borderHover: colors.borderHoverDark,
    success: colors.success,
    successLight: 'rgba(16, 185, 129, 0.2)',
    warning: colors.warning,
    warningLight: 'rgba(245, 158, 11, 0.2)',
    danger: colors.danger,
    dangerLight: 'rgba(239, 68, 68, 0.2)',
    info: colors.info,
    infoLight: 'rgba(59, 130, 246, 0.2)',
  },
};



