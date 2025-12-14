import React, { useEffect, useState } from 'react';

export type ToastType = 'info' | 'warning' | 'error' | 'success';

export interface Toast {
    id: string;
    type: ToastType;
    message: string;
    duration?: number; // ms, default 5000
}

interface NotificationToastProps {
    toasts: Toast[];
    onDismiss: (id: string) => void;
}

const TOAST_ICONS: Record<ToastType, string> = {
    info: 'ℹ️',
    warning: '⚠️',
    error: '❌',
    success: '✅'
};

const TOAST_COLORS: Record<ToastType, string> = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    success: 'bg-green-50 border-green-200 text-green-800'
};

export const NotificationToast: React.FC<NotificationToastProps> = ({ toasts, onDismiss }) => {
    return (
        <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
            {toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
            ))}
        </div>
    );
};

const ToastItem: React.FC<{ toast: Toast; onDismiss: (id: string) => void }> = ({ toast, onDismiss }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Animate in
        requestAnimationFrame(() => setIsVisible(true));

        // Auto-dismiss
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(() => onDismiss(toast.id), 300);
        }, toast.duration || 5000);

        return () => clearTimeout(timer);
    }, [toast.id, toast.duration, onDismiss]);

    return (
        <div
            className={`
                flex items-start gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-sm
                transform transition-all duration-300 ease-out
                ${TOAST_COLORS[toast.type]}
                ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
            `}
        >
            <span className="text-xl flex-shrink-0">{TOAST_ICONS[toast.type]}</span>
            <p className="flex-1 text-sm font-medium">{toast.message}</p>
            <button
                onClick={() => {
                    setIsVisible(false);
                    setTimeout(() => onDismiss(toast.id), 300);
                }}
                className="text-current opacity-50 hover:opacity-100 transition-opacity"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
};

// Hook for managing toasts
export const useToasts = () => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = (type: ToastType, message: string, duration?: number) => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts(prev => [...prev, { id, type, message, duration }]);
        return id;
    };

    const dismissToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    const showInfo = (message: string, duration?: number) => addToast('info', message, duration);
    const showWarning = (message: string, duration?: number) => addToast('warning', message, duration);
    const showError = (message: string, duration?: number) => addToast('error', message, duration);
    const showSuccess = (message: string, duration?: number) => addToast('success', message, duration);

    return {
        toasts,
        addToast,
        dismissToast,
        showInfo,
        showWarning,
        showError,
        showSuccess
    };
};
