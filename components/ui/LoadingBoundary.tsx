import React, { Suspense, ReactNode } from 'react';
import { Skeleton } from './Skeleton';

interface LoadingBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
    variant?: 'card' | 'list' | 'dashboard' | 'minimal';
}

/**
 * LoadingBoundary Component
 * 
 * Wraps components with Suspense and provides role-appropriate loading UI.
 * Integrates with React Suspense for lazy-loaded components.
 */
export const LoadingBoundary: React.FC<LoadingBoundaryProps> = ({
    children,
    fallback,
    variant = 'card'
}) => {
    const renderFallback = () => {
        if (fallback) return fallback;

        switch (variant) {
            case 'dashboard':
                return <DashboardSkeleton />;
            case 'list':
                return <ListSkeleton />;
            case 'minimal':
                return <MinimalSkeleton />;
            case 'card':
            default:
                return <CardSkeleton />;
        }
    };

    return (
        <Suspense fallback={renderFallback()}>
            {children}
        </Suspense>
    );
};

// Dashboard skeleton with stats and sections
const DashboardSkeleton: React.FC = () => (
    <div className="space-y-6 p-4 animate-pulse">
        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-xl p-4 shadow-sm">
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-8 w-16" />
                </div>
            ))}
        </div>

        {/* Main content area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm">
                <Skeleton className="h-6 w-32 mb-4" />
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                    ))}
                </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
                <Skeleton className="h-6 w-24 mb-4" />
                <Skeleton className="h-48 w-full" />
            </div>
        </div>
    </div>
);

// List skeleton for table/list views
const ListSkeleton: React.FC = () => (
    <div className="space-y-2 p-4 animate-pulse">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-10 w-24" />
        </div>

        {/* List items */}
        {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4 p-4 bg-white rounded-lg shadow-sm">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1">
                    <Skeleton className="h-4 w-48 mb-2" />
                    <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-6 w-16" />
            </div>
        ))}
    </div>
);

// Card skeleton for individual card loading
const CardSkeleton: React.FC = () => (
    <div className="bg-white rounded-xl p-6 shadow-sm animate-pulse">
        <Skeleton className="h-6 w-40 mb-4" />
        <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
        </div>
        <div className="flex gap-2 mt-6">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
        </div>
    </div>
);

// Minimal skeleton for inline loading
const MinimalSkeleton: React.FC = () => (
    <div className="flex items-center justify-center py-8">
        <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
    </div>
);

export default LoadingBoundary;
