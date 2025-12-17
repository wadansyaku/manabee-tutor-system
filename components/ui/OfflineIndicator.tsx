import React, { useState, useEffect } from 'react';

interface OfflineIndicatorProps {
    className?: string;
}

/**
 * OfflineIndicator Component
 * 
 * Displays a visual indicator when the user is offline.
 * Automatically syncs with navigator.onLine status.
 */
export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ className = '' }) => {
    const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
    const [showReconnected, setShowReconnected] = useState(false);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            setShowReconnected(true);
            // Hide the "reconnected" message after 3 seconds
            setTimeout(() => setShowReconnected(false), 3000);
        };

        const handleOffline = () => {
            setIsOnline(false);
            setShowReconnected(false);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Online and not showing reconnected message - render nothing
    if (isOnline && !showReconnected) {
        return null;
    }

    return (
        <div className={`fixed bottom-4 left-4 z-50 ${className}`}>
            {!isOnline ? (
                <div className="flex items-center gap-2 px-4 py-2 bg-amber-100 border border-amber-300 rounded-lg shadow-lg animate-pulse">
                    <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
                    </svg>
                    <span className="text-sm font-medium text-amber-800">
                        オフラインです
                    </span>
                </div>
            ) : showReconnected ? (
                <div className="flex items-center gap-2 px-4 py-2 bg-green-100 border border-green-300 rounded-lg shadow-lg animate-fade-out">
                    <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm font-medium text-green-800">
                        オンラインに復帰しました
                    </span>
                </div>
            ) : null}
        </div>
    );
};

export default OfflineIndicator;
