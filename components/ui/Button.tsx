import React from 'react';
import { UserRole } from '../../types';
import { getTheme } from '../../theme';

// ===== BUTTON COMPONENT =====

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    variant?: ButtonVariant;
    size?: ButtonSize;
    role?: UserRole;
    icon?: React.ReactNode;
    iconPosition?: 'left' | 'right';
    loading?: boolean;
    fullWidth?: boolean;
}

const sizeClasses: Record<ButtonSize, string> = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
};

const getVariantClasses = (variant: ButtonVariant, role?: UserRole): string => {
    const theme = role ? getTheme(role) : null;

    switch (variant) {
        case 'primary':
            if (theme) {
                return `bg-gradient-to-r ${theme.gradient} text-white hover:shadow-lg`;
            }
            return 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 shadow-md hover:shadow-lg';
        case 'secondary':
            if (theme) {
                return `${theme.bgLight} ${theme.borderColor} border text-gray-700 hover:bg-opacity-80`;
            }
            return 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200';
        case 'ghost':
            return 'bg-transparent text-gray-600 hover:bg-gray-100';
        case 'danger':
            return 'bg-red-500 text-white hover:bg-red-600 shadow-md hover:shadow-lg';
        case 'success':
            return 'bg-green-500 text-white hover:bg-green-600 shadow-md hover:shadow-lg';
        case 'outline':
            if (theme) {
                return `bg-transparent ${theme.borderColor} border-2 hover:${theme.bgLight}`;
            }
            return 'bg-transparent border-2 border-gray-300 text-gray-700 hover:bg-gray-50';
        default:
            return '';
    }
};

export const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    size = 'md',
    role,
    icon,
    iconPosition = 'left',
    loading = false,
    fullWidth = false,
    className = '',
    disabled,
    ...props
}) => {
    const baseClasses = 'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500';
    const disabledClasses = disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';
    const widthClasses = fullWidth ? 'w-full' : '';

    return (
        <button
            className={`${baseClasses} ${sizeClasses[size]} ${getVariantClasses(variant, role)} ${disabledClasses} ${widthClasses} ${className}`}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? (
                <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    処理中...
                </>
            ) : (
                <>
                    {icon && iconPosition === 'left' && <span className="text-lg">{icon}</span>}
                    {children}
                    {icon && iconPosition === 'right' && <span className="text-lg">{icon}</span>}
                </>
            )}
        </button>
    );
};

// ===== ICON BUTTON =====

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    icon: React.ReactNode;
    variant?: 'ghost' | 'filled';
    size?: ButtonSize;
    label: string; // For accessibility
}

export const IconButton: React.FC<IconButtonProps> = ({
    icon,
    variant = 'ghost',
    size = 'md',
    label,
    className = '',
    ...props
}) => {
    const sizeMap = {
        sm: 'w-8 h-8 text-lg',
        md: 'w-10 h-10 text-xl',
        lg: 'w-12 h-12 text-2xl',
    };

    const variantMap = {
        ghost: 'bg-transparent hover:bg-gray-100 text-gray-600',
        filled: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
    };

    return (
        <button
            className={`${sizeMap[size]} ${variantMap[variant]} rounded-xl flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300 ${className}`}
            aria-label={label}
            {...props}
        >
            {icon}
        </button>
    );
};

// ===== LINK BUTTON =====

interface LinkButtonProps {
    children: React.ReactNode;
    href?: string;
    onClick?: () => void;
    className?: string;
}

export const LinkButton: React.FC<LinkButtonProps> = ({
    children,
    href,
    onClick,
    className = '',
}) => {
    const baseClasses = 'text-indigo-600 hover:text-indigo-800 font-medium underline-offset-2 hover:underline transition-colors';

    if (href) {
        return (
            <a href={href} className={`${baseClasses} ${className}`}>
                {children}
            </a>
        );
    }

    return (
        <button onClick={onClick} className={`${baseClasses} ${className}`}>
            {children}
        </button>
    );
};
