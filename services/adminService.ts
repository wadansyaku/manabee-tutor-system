// Admin Service - Client-side wrapper for admin Cloud Functions
// All Firebase imports are dynamic to prevent page load crashes
import { User, UserRole } from '../types';

// Check if Firebase mode is enabled (no SDK import)
const checkFirebaseMode = (): boolean => {
    try {
        return import.meta.env.VITE_APP_MODE === 'firebase' && !!import.meta.env.VITE_FIREBASE_API_KEY;
    } catch {
        return false;
    }
};

// Firebase Functions instance - lazy loaded
let functionsInstance: any = null;

const getFunctionsInstance = async () => {
    if (functionsInstance) return functionsInstance;

    if (!checkFirebaseMode()) {
        throw new Error('Firebase must be configured to use Cloud Functions');
    }

    // Dynamic imports
    const [firebaseApp, firebaseFunctions] = await Promise.all([
        import('firebase/app'),
        import('firebase/functions')
    ]);

    const app = firebaseApp.getApp();
    functionsInstance = firebaseFunctions.getFunctions(app, 'us-central1');

    // Connect to emulator in development
    if (import.meta.env.DEV && import.meta.env.VITE_USE_FUNCTIONS_EMULATOR === 'true') {
        firebaseFunctions.connectFunctionsEmulator(functionsInstance, 'localhost', 5001);
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
 */
export const generateLessonContentCloud = async (
    transcript: string,
    studentContext: string
): Promise<LessonContentResult> => {
    const functions = await getFunctionsInstance();
    const firebaseFunctions = await import('firebase/functions');
    const generateFn = firebaseFunctions.httpsCallable<
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
    const functions = await getFunctionsInstance();
    const firebaseFunctions = await import('firebase/functions');
    const getStatsFn = firebaseFunctions.httpsCallable<{ timeRange: string }, UsageStats>(
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
    const functions = await getFunctionsInstance();
    const firebaseFunctions = await import('firebase/functions');
    const listUsersFn = firebaseFunctions.httpsCallable<void, User[]>(functions, 'listAllUsers');

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
    const functions = await getFunctionsInstance();
    const firebaseFunctions = await import('firebase/functions');
    const updateFn = firebaseFunctions.httpsCallable<
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
    return checkFirebaseMode() &&
        import.meta.env.VITE_USE_CLOUD_FUNCTIONS === 'true';
};

export default {
    generateLessonContentCloud,
    getUsageStats,
    listAllUsers,
    updateUserCloud,
    isCloudFunctionsEnabled
};
