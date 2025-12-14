import React from 'react';

// ===== BADGE COMPONENT =====

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple';
type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
    children: React.ReactNode;
    variant?: BadgeVariant;
    size?: BadgeSize;
    icon?: React.ReactNode;
    pill?: boolean;
    animate?: boolean;
    className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
    default: 'bg-gray-100 text-gray-700',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-yellow-100 text-yellow-700',
    danger: 'bg-red-100 text-red-700',
    info: 'bg-blue-100 text-blue-700',
    purple: 'bg-purple-100 text-purple-700',
};

const sizeClasses: Record<BadgeSize, string> = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
};

export const Badge: React.FC<BadgeProps> = ({
    children,
    variant = 'default',
    size = 'md',
    icon,
    pill = false,
    animate = false,
    className = '',
}) => {
    const baseClasses = 'inline-flex items-center gap-1 font-medium transition-all';
    const roundedClasses = pill ? 'rounded-full' : 'rounded-lg';
    const animateClasses = animate ? 'animate-pulse' : '';

    return (
        <span className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${roundedClasses} ${animateClasses} ${className}`}>
            {icon && <span>{icon}</span>}
            {children}
        </span>
    );
};

// ===== STATUS BADGE =====

type StatusType = 'online' | 'offline' | 'busy' | 'away' | 'pending' | 'completed' | 'error';

interface StatusBadgeProps {
    status: StatusType;
    label?: string;
    showDot?: boolean;
    className?: string;
}

const statusConfig: Record<StatusType, { color: string; defaultLabel: string; dotColor: string }> = {
    online: { color: 'bg-green-100 text-green-700', defaultLabel: 'オンライン', dotColor: 'bg-green-500' },
    offline: { color: 'bg-gray-100 text-gray-500', defaultLabel: 'オフライン', dotColor: 'bg-gray-400' },
    busy: { color: 'bg-red-100 text-red-700', defaultLabel: '取り込み中', dotColor: 'bg-red-500' },
    away: { color: 'bg-yellow-100 text-yellow-700', defaultLabel: '離席中', dotColor: 'bg-yellow-500' },
    pending: { color: 'bg-orange-100 text-orange-700', defaultLabel: '保留中', dotColor: 'bg-orange-500' },
    completed: { color: 'bg-green-100 text-green-700', defaultLabel: '完了', dotColor: 'bg-green-500' },
    error: { color: 'bg-red-100 text-red-700', defaultLabel: 'エラー', dotColor: 'bg-red-500' },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
    status,
    label,
    showDot = true,
    className = '',
}) => {
    const config = statusConfig[status];

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${config.color} ${className}`}>
            {showDot && (
                <span className={`w-2 h-2 rounded-full ${config.dotColor} ${status === 'online' ? 'animate-pulse' : ''}`} />
            )}
            {label || config.defaultLabel}
        </span>
    );
};

// ===== NOTIFICATION BADGE =====

interface NotificationBadgeProps {
    count: number;
    max?: number;
    className?: string;
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({
    count,
    max = 99,
    className = '',
}) => {
    if (count <= 0) return null;

    const displayCount = count > max ? `${max}+` : count.toString();

    return (
        <span className={`inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 text-xs font-bold text-white bg-red-500 rounded-full ${className}`}>
            {displayCount}
        </span>
    );
};

// ===== ACHIEVEMENT BADGE =====

interface AchievementBadgeProps {
    emoji: string;
    title: string;
    unlocked?: boolean;
    size?: 'sm' | 'md' | 'lg';
    onClick?: () => void;
}

export const AchievementBadge: React.FC<AchievementBadgeProps> = ({
    emoji,
    title,
    unlocked = true,
    size = 'md',
    onClick,
}) => {
    const sizeMap = {
        sm: 'w-10 h-10 text-lg',
        md: 'w-14 h-14 text-2xl',
        lg: 'w-20 h-20 text-4xl',
    };

    return (
        <div
            className={`relative group ${onClick ? 'cursor-pointer' : ''}`}
            onClick={onClick}
            title={title}
        >
            <div
                className={`${sizeMap[size]} rounded-2xl flex items-center justify-center transition-all duration-300 ${unlocked
                        ? 'bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg group-hover:scale-110 group-hover:shadow-xl'
                        : 'bg-gray-200 grayscale opacity-50'
                    }`}
            >
                <span className={unlocked ? '' : 'opacity-40'}>{emoji}</span>
            </div>
            {unlocked && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white text-xs shadow-md">
                    ✓
                </div>
            )}
        </div>
    );
};
