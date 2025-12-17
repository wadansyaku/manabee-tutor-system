import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    currentUser?: { id: string; name: string; role: string } | null;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);

        // Log to Firestore if in Firebase mode
        if (import.meta.env.VITE_APP_MODE === 'firebase') {
            import('../../services/firebaseService').then(({ firestoreOperations }) => {
                const log = {
                    id: `err_${Date.now()}`,
                    userId: this.props.currentUser?.id || 'anonymous',
                    userName: this.props.currentUser?.name || 'Anonymous',
                    userRole: (this.props.currentUser?.role as any) || 'STUDENT',
                    action: 'ERROR',
                    summary: error.message + (errorInfo.componentStack ? ` \nStack: ${errorInfo.componentStack.slice(0, 200)}...` : ''),
                    at: new Date().toISOString()
                };

                // Use cast since AuditLog type alignment might be slightly off with strictness
                firestoreOperations.addAuditLog(log as any);
            }).catch(e => console.error('Failed to log error', e));
        }
    }

    private handleReset = () => {
        this.setState({ hasError: false, error: null });
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                    <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-3xl">⚠️</span>
                        </div>
                        <h1 className="text-xl font-bold text-gray-900 mb-2">予期せぬエラーが発生しました</h1>
                        <p className="text-gray-500 mb-6 text-sm">
                            申し訳ありません。システムに問題が発生しました。
                            自動的に管理者へ報告されました。
                        </p>

                        <div className="bg-gray-100 p-4 rounded-xl text-left mb-6 overflow-auto max-h-40">
                            <code className="text-xs text-red-600 font-mono">
                                {this.state.error?.message}
                            </code>
                        </div>

                        <button
                            onClick={this.handleReset}
                            className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition"
                        >
                            アプリを再読み込み
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
