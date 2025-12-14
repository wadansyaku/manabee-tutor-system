import React from 'react';

// ===== SKELETON COMPONENT =====

interface SkeletonProps {
    variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
    width?: string | number;
    height?: string | number;
    className?: string;
    animation?: 'pulse' | 'wave' | 'none';
}

const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-2xl',
};

export const Skeleton: React.FC<SkeletonProps> = ({
    variant = 'text',
    width,
    height,
    className = '',
    animation = 'pulse',
}) => {
    const animationClass = animation === 'pulse' ? 'animate-pulse' : animation === 'wave' ? 'animate-shimmer' : '';

    const style: React.CSSProperties = {
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
    };

    return (
        <div
            className={`bg-gray-200 ${variantClasses[variant]} ${animationClass} ${className}`}
            style={style}
        />
    );
};

// ===== SKELETON CARD =====

export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => {
    return (
        <div className={`bg-white rounded-2xl p-6 shadow-sm border border-gray-100 ${className}`}>
            <div className="flex items-center gap-4 mb-4">
                <Skeleton variant="circular" width={48} height={48} />
                <div className="flex-1">
                    <Skeleton width="60%" height={20} className="mb-2" />
                    <Skeleton width="40%" height={16} />
                </div>
            </div>
            <Skeleton width="100%" height={60} className="mb-4" variant="rounded" />
            <div className="flex gap-2">
                <Skeleton width="30%" height={32} variant="rounded" />
                <Skeleton width="30%" height={32} variant="rounded" />
            </div>
        </div>
    );
};

// ===== SKELETON DASHBOARD =====

export const SkeletonDashboard: React.FC = () => {
    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Header skeleton */}
            <Skeleton width="100%" height={140} variant="rounded" />

            {/* Stats grid skeleton */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        <Skeleton width="50%" height={12} className="mb-2" />
                        <Skeleton width="70%" height={28} className="mb-2" />
                        <Skeleton width="40%" height={12} />
                    </div>
                ))}
            </div>

            {/* Content skeleton */}
            <SkeletonCard />
        </div>
    );
};

// CSS for wave animation (add to index.html or global CSS)
// @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
// .animate-shimmer { background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; }
