// @ts-nocheck
import React, { Component, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    componentStack: string | null;
}

/**
 * ErrorBoundary Component
 * 
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI.
 */
class ErrorBoundary extends Component<Props, State> {
    state: State = {
        hasError: false,
        error: null,
        componentStack: null
    };

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
        this.setState({ componentStack: errorInfo.componentStack || null });

        // Log to console in development
        console.error('ErrorBoundary caught an error:', error, errorInfo);

        // Report error to analytics
        this.reportError(error, errorInfo);
    }

    private reportError(error: Error, errorInfo: React.ErrorInfo): void {
        try {
            if (typeof window !== 'undefined' && (window as any).gtag) {
                (window as any).gtag('event', 'exception', {
                    description: error.message,
                    fatal: false,
                    component_stack: errorInfo.componentStack
                });
            }
        } catch (e) {
            console.warn('Failed to report error:', e);
        }
    }

    private handleRetry = (): void => {
        this.setState({
            hasError: false,
            error: null,
            componentStack: null
        });
    };

    private handleReload = (): void => {
        window.location.reload();
    };

    render(): ReactNode {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
                    <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                        <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
                            <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>

                        <h1 className="text-2xl font-bold text-gray-800 mb-2">
                            エラーが発生しました
                        </h1>

                        <p className="text-gray-600 mb-6">
                            申し訳ございません。予期しないエラーが発生しました。
                        </p>

                        {import.meta.env.DEV && this.state.error && (
                            <details className="mb-6 text-left bg-gray-50 rounded-lg p-4">
                                <summary className="cursor-pointer text-sm font-medium text-gray-700">
                                    エラー詳細
                                </summary>
                                <pre className="mt-2 text-xs text-red-600 overflow-auto max-h-40">
                                    {this.state.error.message}
                                    {'\n\n'}
                                    {this.state.componentStack}
                                </pre>
                            </details>
                        )}

                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={this.handleRetry}
                                className="px-6 py-2.5 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
                            >
                                再試行
                            </button>
                            <button
                                onClick={this.handleReload}
                                className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                            >
                                ページ再読み込み
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export { ErrorBoundary };
export default ErrorBoundary;
