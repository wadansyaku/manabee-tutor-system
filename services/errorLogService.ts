// Error Log Service - Auto Error Collection and Improvement
// Captures errors and sends them to Firestore for analysis

interface ErrorLog {
    id: string;
    userId?: string;
    errorType: string;
    message: string;
    stack?: string;
    componentStack?: string;
    url: string;
    userAgent: string;
    timestamp: string;
    metadata?: Record<string, any>;
    status: 'new' | 'analyzing' | 'fixed' | 'ignored';
    fixSuggestion?: string;
}

const ERRORS_KEY = 'manabee_error_logs';
const MAX_LOCAL_ERRORS = 50;

class ErrorLogService {
    private isFirebaseMode = false;

    constructor() {
        try {
            this.isFirebaseMode = import.meta.env.VITE_APP_MODE === 'firebase';
        } catch {
            this.isFirebaseMode = false;
        }

        // Set up global error handlers
        this.setupGlobalErrorHandlers();
    }

    private setupGlobalErrorHandlers() {
        // Unhandled errors
        window.addEventListener('error', (event) => {
            this.logError({
                errorType: 'unhandled_error',
                message: event.message,
                stack: event.error?.stack,
                metadata: {
                    filename: event.filename,
                    lineno: event.lineno,
                    colno: event.colno
                }
            });
        });

        // Unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.logError({
                errorType: 'unhandled_promise_rejection',
                message: event.reason?.message || String(event.reason),
                stack: event.reason?.stack
            });
        });
    }

    /**
     * Log an error to the error log
     */
    async logError(params: {
        errorType: string;
        message: string;
        stack?: string;
        componentStack?: string;
        metadata?: Record<string, any>;
        userId?: string;
    }): Promise<void> {
        const errorLog: ErrorLog = {
            id: this.generateId(),
            userId: params.userId,
            errorType: params.errorType,
            message: params.message,
            stack: params.stack,
            componentStack: params.componentStack,
            url: window.location.href,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString(),
            metadata: params.metadata,
            status: 'new'
        };

        // Log to console in dev
        if (import.meta.env.DEV) {
            console.error('[ErrorLogService]', errorLog);
        }

        // Save to Firestore or localStorage
        if (this.isFirebaseMode) {
            try {
                const { db } = await this.getFirestore();
                const { doc, setDoc, collection } = await import('firebase/firestore');
                await setDoc(doc(collection(db, 'error_logs'), errorLog.id), errorLog);
            } catch (e) {
                console.error('[ErrorLogService] Failed to save to Firestore:', e);
                this.saveToLocal(errorLog);
            }
        } else {
            this.saveToLocal(errorLog);
        }
    }

    /**
     * Save error log to localStorage (fallback)
     */
    private saveToLocal(errorLog: ErrorLog): void {
        try {
            const existing = this.getLocalLogs();
            existing.unshift(errorLog);
            // Keep only recent errors
            while (existing.length > MAX_LOCAL_ERRORS) {
                existing.pop();
            }
            localStorage.setItem(ERRORS_KEY, JSON.stringify(existing));
        } catch (e) {
            console.error('[ErrorLogService] Failed to save locally:', e);
        }
    }

    /**
     * Get local error logs
     */
    private getLocalLogs(): ErrorLog[] {
        try {
            const stored = localStorage.getItem(ERRORS_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    }

    /**
     * Get all error logs (from Firestore or local)
     */
    async getErrorLogs(limit: number = 50): Promise<ErrorLog[]> {
        if (this.isFirebaseMode) {
            try {
                const { db } = await this.getFirestore();
                const { collection, query, orderBy, limit: fbLimit, getDocs } = await import('firebase/firestore');
                const q = query(
                    collection(db, 'error_logs'),
                    orderBy('timestamp', 'desc'),
                    fbLimit(limit)
                );
                const snapshot = await getDocs(q);
                return snapshot.docs.map(doc => doc.data() as ErrorLog);
            } catch (e) {
                console.error('[ErrorLogService] Failed to fetch from Firestore:', e);
                return this.getLocalLogs();
            }
        }
        return this.getLocalLogs();
    }

    /**
     * Get error statistics
     */
    async getErrorStats(): Promise<{
        total: number;
        byType: Record<string, number>;
        byStatus: Record<string, number>;
        recentCount: number;
    }> {
        const logs = await this.getErrorLogs(100);
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        const byType: Record<string, number> = {};
        const byStatus: Record<string, number> = {};
        let recentCount = 0;

        logs.forEach(log => {
            byType[log.errorType] = (byType[log.errorType] || 0) + 1;
            byStatus[log.status] = (byStatus[log.status] || 0) + 1;
            if (new Date(log.timestamp) > oneDayAgo) {
                recentCount++;
            }
        });

        return {
            total: logs.length,
            byType,
            byStatus,
            recentCount
        };
    }

    /**
     * Update error log status
     */
    async updateErrorStatus(
        errorId: string,
        status: ErrorLog['status'],
        fixSuggestion?: string
    ): Promise<void> {
        if (this.isFirebaseMode) {
            try {
                const { db } = await this.getFirestore();
                const { doc, updateDoc } = await import('firebase/firestore');
                await updateDoc(doc(db, 'error_logs', errorId), {
                    status,
                    fixSuggestion,
                    updatedAt: new Date().toISOString()
                });
            } catch (e) {
                console.error('[ErrorLogService] Failed to update in Firestore:', e);
            }
        }
    }

    private async getFirestore() {
        const { initializeApp, getApps } = await import('firebase/app');
        const { getFirestore } = await import('firebase/firestore');

        const firebaseConfig = {
            apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
            authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
            projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
            storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
            messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
            appId: import.meta.env.VITE_FIREBASE_APP_ID
        };

        const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
        const db = getFirestore(app);
        return { db };
    }

    private generateId(): string {
        return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

// Export singleton
export const errorLogService = new ErrorLogService();

export default errorLogService;
