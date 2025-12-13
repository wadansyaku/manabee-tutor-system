// Admin Service - Client-side wrapper for admin Cloud Functions
import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions';
import { User, UserRole } from '../types';
import { isFirebaseConfigured } from './firebaseService';

// Initialize Functions (lazy)
let functionsInstance: ReturnType<typeof getFunctions> | null = null;

const getFunctionsInstance = () => {
    if (functionsInstance) return functionsInstance;

    if (!isFirebaseConfigured()) {
        throw new Error('Firebase must be configured to use Cloud Functions');
    }

    // Dynamic import to avoid issues when Firebase not configured
    const { getApp } = require('firebase/app');
    functionsInstance = getFunctions(getApp(), 'asia-northeast1'); // Tokyo region

    // Connect to emulator in development
    if (import.meta.env.DEV && import.meta.env.VITE_USE_FUNCTIONS_EMULATOR === 'true') {
        connectFunctionsEmulator(functionsInstance, 'localhost', 5001);
    }

    return functionsInstance;
};

export interface UsageStats {
    totalCalls: number;
    byUser: Record<string, number>;
    byFunction: Record<string, number>;
    byDate: Record<string, number>;
    timeRange: string;
}

export interface LessonContentResult {
    summary: {
        lesson_goal: string;
        what_we_did: string[];
        what_went_well: string[];
        issues: string[];
        next_actions: string[];
        parent_message: string;
        quiz_focus: string[];
    };
    homework: {
        items: Array<{
            title: string;
            due_days_from_now: number;
            type: 'practice' | 'review' | 'challenge';
            estimated_minutes: number;
        }>;
    };
    quiz: {
        questions: Array<{
            type: 'mcq' | 'short';
            q: string;
            choices?: string[];
            answer: string;
            explain: string;
        }>;
    };
}

/**
 * Generate lesson content using Cloud Functions
 * Secure server-side AI generation with rate limiting
 */
export const generateLessonContentCloud = async (
    transcript: string,
    studentContext: string
): Promise<LessonContentResult> => {
    const functions = getFunctionsInstance();
    const generateFn = httpsCallable<
        { transcript: string; studentContext: string },
        LessonContentResult
    >(functions, 'generateLessonContent');

    const result = await generateFn({ transcript, studentContext });
    return result.data;
};

/**
 * Get usage statistics (Admin only)
 */
export const getUsageStats = async (timeRange: '7d' | '30d' = '7d'): Promise<UsageStats> => {
    const functions = getFunctionsInstance();
    const getStatsFn = httpsCallable<{ timeRange: string }, UsageStats>(
        functions,
        'getUsageStats'
    );

    const result = await getStatsFn({ timeRange });
    return result.data;
};

/**
 * List all users (Admin only)
 */
export const listAllUsers = async (): Promise<User[]> => {
    const functions = getFunctionsInstance();
    const listUsersFn = httpsCallable<void, User[]>(functions, 'listAllUsers');

    const result = await listUsersFn();
    return result.data;
};

/**
 * Update user (Admin only)
 */
export const updateUserCloud = async (
    userId: string,
    updates: Partial<User>
): Promise<{ success: boolean }> => {
    const functions = getFunctionsInstance();
    const updateFn = httpsCallable<
        { userId: string; updates: Partial<User> },
        { success: boolean }
    >(functions, 'updateUser');

    const result = await updateFn({ userId, updates });
    return result.data;
};

/**
 * Check if Cloud Functions are available
 */
export const isCloudFunctionsEnabled = (): boolean => {
    return isFirebaseConfigured() &&
        import.meta.env.VITE_USE_CLOUD_FUNCTIONS === 'true';
};

export default {
    generateLessonContentCloud,
    getUsageStats,
    listAllUsers,
    updateUserCloud,
    isCloudFunctionsEnabled
};
