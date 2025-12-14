import React from 'react';

// ===== CARD COMPONENT =====

interface CardProps {
    children: React.ReactNode;
    className?: string;
    variant?: 'default' | 'glass' | 'elevated' | 'outline';
    padding?: 'none' | 'sm' | 'md' | 'lg';
    hover?: boolean;
    onClick?: () => void;
}

const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
};

const variantClasses = {
    default: 'bg-white shadow-sm border border-gray-100',
    glass: 'bg-white/10 backdrop-blur-xl border border-white/20',
    elevated: 'bg-white shadow-xl',
    outline: 'bg-transparent border-2 border-gray-200',
};

export const Card: React.FC<CardProps> = ({
    children,
    className = '',
    variant = 'default',
    padding = 'md',
    hover = false,
    onClick,
}) => {
    const baseClasses = 'rounded-2xl transition-all duration-200';
    const hoverClasses = hover ? 'hover:shadow-lg hover:scale-[1.02] cursor-pointer' : '';

    return (
        <div
            className={`${baseClasses} ${variantClasses[variant]} ${paddingClasses[padding]} ${hoverClasses} ${className}`}
            onClick={onClick}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
        >
            {children}
        </div>
    );
};

// ===== CARD HEADER =====

interface CardHeaderProps {
    children: React.ReactNode;
    className?: string;
    icon?: React.ReactNode;
    action?: React.ReactNode;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
    children,
    className = '',
    icon,
    action,
}) => {
    return (
        <div className={`flex items-center justify-between mb-4 ${className}`}>
            <div className="flex items-center gap-3">
                {icon && <span className="text-2xl">{icon}</span>}
                <h3 className="text-lg font-bold text-gray-900">{children}</h3>
            </div>
            {action && <div>{action}</div>}
        </div>
    );
};

// ===== CARD CONTENT =====

interface CardContentProps {
    children: React.ReactNode;
    className?: string;
}

export const CardContent: React.FC<CardContentProps> = ({
    children,
    className = '',
}) => {
    return <div className={className}>{children}</div>;
};

// ===== CARD FOOTER =====

interface CardFooterProps {
    children: React.ReactNode;
    className?: string;
    align?: 'left' | 'center' | 'right' | 'between';
}

const alignClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
    between: 'justify-between',
};

export const CardFooter: React.FC<CardFooterProps> = ({
    children,
    className = '',
    align = 'right',
}) => {
    return (
        <div className={`flex items-center gap-3 mt-4 pt-4 border-t border-gray-100 ${alignClasses[align]} ${className}`}>
            {children}
        </div>
    );
};

// ===== STAT CARD (Special variant for dashboard stats) =====

interface StatCardProps {
    label: string;
    value: string | number;
    icon?: React.ReactNode;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
    className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
    label,
    value,
    icon,
    trend,
    trendValue,
    className = '',
}) => {
    const trendColors = {
        up: 'text-green-600 bg-green-100',
        down: 'text-red-600 bg-red-100',
        neutral: 'text-gray-600 bg-gray-100',
    };

    return (
        <Card className={className}>
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">{label}</p>
                    <p className="text-3xl font-bold text-gray-900">{value}</p>
                    {trend && trendValue && (
                        <span className={`inline-flex items-center gap-1 mt-2 text-xs font-medium px-2 py-1 rounded-full ${trendColors[trend]}`}>
                            {trend === 'up' && '↑'}
                            {trend === 'down' && '↓'}
                            {trendValue}
                        </span>
                    )}
                </div>
                {icon && (
                    <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-2xl">
                        {icon}
                    </div>
                )}
            </div>
        </Card>
    );
};
