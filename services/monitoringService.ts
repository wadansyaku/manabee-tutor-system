/**
 * Monitoring Service
 * 
 * Integrates with Firebase Performance Monitoring and custom analytics.
 * Provides centralized tracking of performance metrics and user actions.
 */

// Performance trace types
type TraceType = 'page_load' | 'api_call' | 'data_sync' | 'ai_generation';

interface CustomTrace {
    name: string;
    startTime: number;
    attributes: Record<string, string>;
}

// Active traces
const activeTraces: Map<string, CustomTrace> = new Map();

/**
 * Start a custom performance trace
 */
export const startTrace = (name: string, type: TraceType): string => {
    const traceId = `${type}_${name}_${Date.now()}`;

    activeTraces.set(traceId, {
        name,
        startTime: performance.now(),
        attributes: { type }
    });

    // If Firebase Performance is available, also start there
    try {
        if (typeof window !== 'undefined' && (window as any).firebase?.performance) {
            const perf = (window as any).firebase.performance();
            const trace = perf.trace(name);
            trace.start();
            (activeTraces.get(traceId) as any)._fbTrace = trace;
        }
    } catch (e) {
        // Firebase Performance not available
    }

    return traceId;
};

/**
 * Stop a performance trace and log the duration
 */
export const stopTrace = (traceId: string, success: boolean = true): number => {
    const trace = activeTraces.get(traceId);
    if (!trace) {
        console.warn(`Trace ${traceId} not found`);
        return -1;
    }

    const duration = performance.now() - trace.startTime;

    // Stop Firebase trace if exists
    try {
        if ((trace as any)._fbTrace) {
            (trace as any)._fbTrace.putAttribute('success', String(success));
            (trace as any)._fbTrace.stop();
        }
    } catch (e) {
        // Ignore Firebase errors
    }

    // Log to console in development
    if (import.meta.env.DEV) {
        console.log(`[Trace] ${trace.name}: ${duration.toFixed(2)}ms (${success ? 'success' : 'failed'})`);
    }

    // Send to analytics
    trackEvent('performance_trace', {
        trace_name: trace.name,
        duration_ms: Math.round(duration),
        success: success
    });

    activeTraces.delete(traceId);
    return duration;
};

/**
 * Track custom events
 */
export const trackEvent = (eventName: string, params?: Record<string, any>): void => {
    // Google Analytics / Firebase Analytics
    try {
        if (typeof window !== 'undefined' && (window as any).gtag) {
            (window as any).gtag('event', eventName, params);
        }
    } catch (e) {
        // Analytics not available
    }

    // Log in development
    if (import.meta.env.DEV) {
        console.log(`[Event] ${eventName}`, params);
    }
};

/**
 * Track page views
 */
export const trackPageView = (pageName: string, path: string): void => {
    trackEvent('page_view', {
        page_name: pageName,
        page_path: path,
        timestamp: new Date().toISOString()
    });
};

/**
 * Track errors
 */
export const trackError = (
    error: Error,
    context?: { component?: string; action?: string; userId?: string }
): void => {
    trackEvent('error', {
        error_message: error.message,
        error_stack: error.stack?.slice(0, 500), // Limit stack trace length
        ...context,
        timestamp: new Date().toISOString()
    });

    // Log structured error
    console.error('[Error]', {
        message: error.message,
        ...context
    });
};

/**
 * Track user actions for analytics
 */
export const trackUserAction = (
    action: string,
    category: string,
    label?: string,
    value?: number
): void => {
    trackEvent('user_action', {
        action,
        category,
        label,
        value
    });
};

/**
 * Measure async function execution time
 */
export const measureAsync = async <T>(
    name: string,
    fn: () => Promise<T>,
    type: TraceType = 'api_call'
): Promise<T> => {
    const traceId = startTrace(name, type);
    try {
        const result = await fn();
        stopTrace(traceId, true);
        return result;
    } catch (error) {
        stopTrace(traceId, false);
        throw error;
    }
};

/**
 * Initialize monitoring
 */
export const initMonitoring = (): void => {
    // Track initial page load
    if (typeof window !== 'undefined') {
        window.addEventListener('load', () => {
            const timing = performance.timing;
            const loadTime = timing.loadEventEnd - timing.navigationStart;

            trackEvent('page_load_complete', {
                load_time_ms: loadTime,
                dom_ready_ms: timing.domContentLoadedEventEnd - timing.navigationStart,
                first_paint_ms: timing.responseStart - timing.navigationStart
            });
        });

        // Track unhandled errors
        window.addEventListener('error', (event) => {
            trackError(event.error || new Error(event.message), {
                component: 'window',
                action: 'unhandled_error'
            });
        });

        // Track unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            trackError(
                event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
                { component: 'promise', action: 'unhandled_rejection' }
            );
        });
    }
};

export default {
    startTrace,
    stopTrace,
    trackEvent,
    trackPageView,
    trackError,
    trackUserAction,
    measureAsync,
    initMonitoring
};
