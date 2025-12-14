import React from 'react';

// ===== LINEAR PROGRESS =====

interface LinearProgressProps {
    value: number; // 0-100
    max?: number;
    size?: 'sm' | 'md' | 'lg';
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'gradient';
    showValue?: boolean;
    animated?: boolean;
    className?: string;
}

const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
};

const variantClasses = {
    default: 'bg-indigo-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    danger: 'bg-red-500',
    gradient: 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500',
};

export const LinearProgress: React.FC<LinearProgressProps> = ({
    value,
    max = 100,
    size = 'md',
    variant = 'default',
    showValue = false,
    animated = true,
    className = '',
}) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    return (
        <div className={`w-full ${className}`}>
            {showValue && (
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>進捗</span>
                    <span>{Math.round(percentage)}%</span>
                </div>
            )}
            <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${sizeClasses[size]}`}>
                <div
                    className={`h-full rounded-full ${variantClasses[variant]} ${animated ? 'transition-all duration-500' : ''}`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
};

// ===== CIRCULAR PROGRESS =====

interface CircularProgressProps {
    value: number; // 0-100
    size?: number; // Size in pixels
    strokeWidth?: number;
    variant?: 'default' | 'success' | 'warning' | 'danger';
    showValue?: boolean;
    label?: string;
    animated?: boolean;
    className?: string;
}

const circularVariantColors = {
    default: { stroke: '#6366f1', gradient: ['#6366f1', '#8b5cf6'] },
    success: { stroke: '#22c55e', gradient: ['#22c55e', '#10b981'] },
    warning: { stroke: '#f59e0b', gradient: ['#f59e0b', '#eab308'] },
    danger: { stroke: '#ef4444', gradient: ['#ef4444', '#f97316'] },
};

export const CircularProgress: React.FC<CircularProgressProps> = ({
    value,
    size = 100,
    strokeWidth = 8,
    variant = 'default',
    showValue = true,
    label,
    animated = true,
    className = '',
}) => {
    const percentage = Math.min(Math.max(value, 0), 100);
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;
    const colors = circularVariantColors[variant];
    const gradientId = `progress-gradient-${variant}-${Math.random().toString(36).substr(2, 9)}`;

    return (
        <div className={`relative inline-flex items-center justify-center ${className}`}>
            <svg width={size} height={size} className="-rotate-90">
                <defs>
                    <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={colors.gradient[0]} />
                        <stop offset="100%" stopColor={colors.gradient[1]} />
                    </linearGradient>
                </defs>
                {/* Background circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="#e5e7eb"
                    strokeWidth={strokeWidth}
                    fill="none"
                />
                {/* Progress circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={`url(#${gradientId})`}
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    className={animated ? 'transition-all duration-500' : ''}
                />
            </svg>
            {showValue && (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-gray-900">{Math.round(percentage)}%</span>
                    {label && <span className="text-xs text-gray-500">{label}</span>}
                </div>
            )}
        </div>
    );
};

// ===== XP PROGRESS BAR (Gamification) =====

interface XPProgressProps {
    currentXP: number;
    requiredXP: number;
    level: number;
    className?: string;
}

export const XPProgress: React.FC<XPProgressProps> = ({
    currentXP,
    requiredXP,
    level,
    className = '',
}) => {
    const percentage = Math.min((currentXP / requiredXP) * 100, 100);

    return (
        <div className={`${className}`}>
            <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                    <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                        Lv.{level}
                    </span>
                    <span className="text-sm text-gray-600">経験値</span>
                </div>
                <span className="text-sm font-medium text-gray-700">
                    {currentXP.toLocaleString()} / {requiredXP.toLocaleString()} XP
                </span>
            </div>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-500 rounded-full transition-all duration-700 relative"
                    style={{ width: `${percentage}%` }}
                >
                    <div className="absolute inset-0 bg-white/30 animate-pulse rounded-full" />
                </div>
            </div>
        </div>
    );
};

// ===== STEPS PROGRESS =====

interface Step {
    id: string;
    label: string;
    completed?: boolean;
    current?: boolean;
}

interface StepsProgressProps {
    steps: Step[];
    className?: string;
}

export const StepsProgress: React.FC<StepsProgressProps> = ({
    steps,
    className = '',
}) => {
    return (
        <div className={`flex items-center ${className}`}>
            {steps.map((step, index) => (
                <React.Fragment key={step.id}>
                    <div className="flex flex-col items-center">
                        <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all ${step.completed
                                    ? 'bg-green-500 text-white'
                                    : step.current
                                        ? 'bg-indigo-500 text-white ring-4 ring-indigo-100'
                                        : 'bg-gray-200 text-gray-500'
                                }`}
                        >
                            {step.completed ? '✓' : index + 1}
                        </div>
                        <span className={`text-xs mt-1 ${step.current ? 'text-indigo-600 font-medium' : 'text-gray-500'}`}>
                            {step.label}
                        </span>
                    </div>
                    {index < steps.length - 1 && (
                        <div
                            className={`flex-1 h-1 mx-2 rounded-full ${step.completed ? 'bg-green-500' : 'bg-gray-200'
                                }`}
                        />
                    )}
                </React.Fragment>
            ))}
        </div>
    );
};
