import React, { useEffect, useState, createContext, useContext } from 'react';

// ===== TOAST TYPES =====

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastMessage {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number;
}

// ===== TOAST CONTEXT =====

interface ToastContextType {
    toasts: ToastMessage[];
    addToast: (toast: Omit<ToastMessage, 'id'>) => void;
    removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

// ===== TOAST PROVIDER =====

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const addToast = (toast: Omit<ToastMessage, 'id'>) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newToast: ToastMessage = { ...toast, id };
        setToasts((prev) => [...prev, newToast]);

        // Auto-remove after duration
        const duration = toast.duration || 5000;
        setTimeout(() => {
            removeToast(id);
        }, duration);
    };

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
            {children}
            <ToastContainer toasts={toasts} onRemove={removeToast} />
        </ToastContext.Provider>
    );
};

// ===== TOAST CONTAINER =====

interface ToastContainerProps {
    toasts: ToastMessage[];
    onRemove: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
    if (toasts.length === 0) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
            {toasts.map((toast) => (
                <Toast key={toast.id} toast={toast} onRemove={() => onRemove(toast.id)} />
            ))}
        </div>
    );
};

// ===== SINGLE TOAST =====

interface ToastProps {
    toast: ToastMessage;
    onRemove: () => void;
}

const toastStyles: Record<ToastType, { bg: string; icon: string; iconBg: string }> = {
    success: { bg: 'bg-green-50 border-green-200', icon: '✓', iconBg: 'bg-green-500' },
    error: { bg: 'bg-red-50 border-red-200', icon: '✕', iconBg: 'bg-red-500' },
    warning: { bg: 'bg-yellow-50 border-yellow-200', icon: '⚠', iconBg: 'bg-yellow-500' },
    info: { bg: 'bg-blue-50 border-blue-200', icon: 'ℹ', iconBg: 'bg-blue-500' },
};

const Toast: React.FC<ToastProps> = ({ toast, onRemove }) => {
    const [isExiting, setIsExiting] = useState(false);
    const style = toastStyles[toast.type];

    const handleRemove = () => {
        setIsExiting(true);
        setTimeout(onRemove, 300);
    };

    return (
        <div
            className={`${style.bg} border rounded-xl p-4 shadow-lg flex items-start gap-3 transition-all duration-300 ${isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'
                }`}
            role="alert"
        >
            <div className={`${style.iconBg} text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0`}>
                {style.icon}
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm">{toast.title}</p>
                {toast.message && <p className="text-gray-600 text-xs mt-1">{toast.message}</p>}
            </div>
            <button
                onClick={handleRemove}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none"
                aria-label="閉じる"
            >
                ×
            </button>
        </div>
    );
};

// ===== STANDALONE TOAST FUNCTION (for use without context) =====

let toastContainerRoot: HTMLDivElement | null = null;
let toastQueue: ToastMessage[] = [];
let updateToastUI: (() => void) | null = null;

export const toast = {
    success: (title: string, message?: string) => showToast('success', title, message),
    error: (title: string, message?: string) => showToast('error', title, message),
    warning: (title: string, message?: string) => showToast('warning', title, message),
    info: (title: string, message?: string) => showToast('info', title, message),
};

function showToast(type: ToastType, title: string, message?: string) {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: ToastMessage = { id, type, title, message };
    toastQueue.push(newToast);

    if (updateToastUI) {
        updateToastUI();
    }

    setTimeout(() => {
        toastQueue = toastQueue.filter(t => t.id !== id);
        if (updateToastUI) {
            updateToastUI();
        }
    }, 5000);
}
