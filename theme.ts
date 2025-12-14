import { UserRole } from './types';

// ===== ROLE-BASED THEME SYSTEM =====

export interface RoleTheme {
    primary: string;
    primaryLight: string;
    primaryDark: string;
    secondary: string;
    secondaryLight: string;
    accent: string;
    gradient: string;
    gradientHover: string;
    bgLight: string;
    borderColor: string;
    icon: string;
}

export const roleThemes: Record<UserRole, RoleTheme> = {
    [UserRole.STUDENT]: {
        primary: '#10b981',      // emerald-500
        primaryLight: '#d1fae5', // emerald-100
        primaryDark: '#059669',  // emerald-600
        secondary: '#14b8a6',    // teal-500
        secondaryLight: '#ccfbf1', // teal-100
        accent: '#06b6d4',       // cyan-500
        gradient: 'from-emerald-500 via-teal-500 to-cyan-500',
        gradientHover: 'from-emerald-600 via-teal-600 to-cyan-600',
        bgLight: 'bg-emerald-50',
        borderColor: 'border-emerald-200',
        icon: '🎓',
    },
    [UserRole.GUARDIAN]: {
        primary: '#f43f5e',      // rose-500
        primaryLight: '#ffe4e6', // rose-100
        primaryDark: '#e11d48',  // rose-600
        secondary: '#f97316',    // orange-500
        secondaryLight: '#ffedd5', // orange-100
        accent: '#f59e0b',       // amber-500
        gradient: 'from-rose-500 via-orange-500 to-amber-500',
        gradientHover: 'from-rose-600 via-orange-600 to-amber-600',
        bgLight: 'bg-rose-50',
        borderColor: 'border-rose-200',
        icon: '👪',
    },
    [UserRole.TUTOR]: {
        primary: '#3b82f6',      // blue-500
        primaryLight: '#dbeafe', // blue-100
        primaryDark: '#2563eb',  // blue-600
        secondary: '#6366f1',    // indigo-500
        secondaryLight: '#e0e7ff', // indigo-100
        accent: '#8b5cf6',       // violet-500
        gradient: 'from-blue-500 via-indigo-500 to-violet-500',
        gradientHover: 'from-blue-600 via-indigo-600 to-violet-600',
        bgLight: 'bg-blue-50',
        borderColor: 'border-blue-200',
        icon: '👨‍🏫',
    },
    [UserRole.ADMIN]: {
        primary: '#6b7280',      // gray-500
        primaryLight: '#f3f4f6', // gray-100
        primaryDark: '#4b5563',  // gray-600
        secondary: '#64748b',    // slate-500
        secondaryLight: '#f1f5f9', // slate-100
        accent: '#71717a',       // zinc-500
        gradient: 'from-gray-700 via-gray-800 to-gray-900',
        gradientHover: 'from-gray-800 via-gray-900 to-black',
        bgLight: 'bg-gray-50',
        borderColor: 'border-gray-200',
        icon: '⚙️',
    },
};

// ===== UTILITY FUNCTIONS =====

export const getTheme = (role: UserRole): RoleTheme => {
    return roleThemes[role] || roleThemes[UserRole.STUDENT];
};

export const getGradientClasses = (role: UserRole): string => {
    const theme = getTheme(role);
    return `bg-gradient-to-r ${theme.gradient}`;
};

export const getGradientHoverClasses = (role: UserRole): string => {
    const theme = getTheme(role);
    return `hover:bg-gradient-to-r hover:${theme.gradientHover}`;
};

// ===== COMMON UI CONSTANTS =====

export const spacing = {
    xs: '0.25rem',  // 4px
    sm: '0.5rem',   // 8px
    md: '1rem',     // 16px
    lg: '1.5rem',   // 24px
    xl: '2rem',     // 32px
    '2xl': '3rem',  // 48px
};

export const borderRadius = {
    sm: '0.375rem',  // 6px
    md: '0.5rem',    // 8px
    lg: '0.75rem',   // 12px
    xl: '1rem',      // 16px
    '2xl': '1.5rem', // 24px
    '3xl': '2rem',   // 32px
    full: '9999px',
};

export const shadows = {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
};

// ===== ANIMATION PRESETS =====

export const animations = {
    fadeIn: 'animate-fade-in',
    slideUp: 'animate-slide-up',
    slideDown: 'animate-slide-down',
    bounce: 'animate-bounce',
    pulse: 'animate-pulse',
    spin: 'animate-spin',
    shake: 'animate-shake',
};

// ===== BREAKPOINTS =====

export const breakpoints = {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
};
