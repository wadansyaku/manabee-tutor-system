import { User, UserRole } from '../types';
import { firebaseLogin, firebaseLogout, onAuthChange, firestoreOperations } from './firebaseService';
import { StorageService } from './storageService';
import type { User as FirebaseUser } from 'firebase/auth';

// Check app mode
const APP_MODE: 'local' | 'firebase' =
    (import.meta.env.VITE_APP_MODE as 'local' | 'firebase') || 'local';

export const isFirebaseMode = () => APP_MODE === 'firebase';

// Unified Auth Result
export interface AuthResult {
    success: boolean;
    user?: User;
    error?: string;
    requiresPasswordChange?: boolean;
}

// Auth Service - Unified interface for local and Firebase auth
export const AuthService = {
    /**
     * Check if email exists in the system
     */
    async checkEmail(email: string): Promise<{ exists: boolean; requiresPassword: boolean }> {
        if (isFirebaseMode()) {
            const user = await firestoreOperations.getUserByEmail(email);
            if (!user) return { exists: false, requiresPassword: false };
            // Firebase always requires password except for students (but Firebase Auth still needs it)
            return { exists: true, requiresPassword: true };
        } else {
            const result = StorageService.login(email);
            if (!result.success && result.error === 'ユーザーが見つかりません') {
                return { exists: false, requiresPassword: false };
            }
            // Check if user is student (no password needed in local mode)
            const check = StorageService.login(email, '');
            if (check.success) {
                return { exists: true, requiresPassword: false };
            }
            return { exists: true, requiresPassword: true };
        }
    },

    /**
     * Login with email and optional password
     */
    async login(email: string, password?: string): Promise<AuthResult> {
        if (isFirebaseMode()) {
            // Firebase mode - always requires password
            if (!password) {
                return { success: false, error: 'パスワードを入力してください' };
            }

            const result = await firebaseLogin(email, password);
            if (result.success && result.user) {
                // Check if initial password change is required
                if (result.user.isInitialPassword) {
                    return {
                        success: true,
                        user: result.user,
                        requiresPasswordChange: true
                    };
                }
                return { success: true, user: result.user };
            }
            return { success: false, error: result.error || '認証に失敗しました' };
        } else {
            // Local mode - student doesn't need password
            const result = StorageService.login(email, password);
            if (result.success && result.user) {
                if (result.user.isInitialPassword) {
                    return {
                        success: true,
                        user: result.user,
                        requiresPasswordChange: true
                    };
                }
                return { success: true, user: result.user };
            }
            return { success: false, error: result.error || '認証に失敗しました' };
        }
    },

    /**
     * Logout
     */
    async logout(): Promise<void> {
        if (isFirebaseMode()) {
            await firebaseLogout();
        }
        // Local mode doesn't need explicit logout - just clear state in component
    },

    /**
     * Change password
     */
    async changePassword(userId: string, newPassword: string): Promise<boolean> {
        if (isFirebaseMode()) {
            try {
                await firestoreOperations.updateUser(userId, {
                    isInitialPassword: false
                });
                // Note: Firebase Auth password change requires reauthentication
                // For simplicity, we just mark isInitialPassword as false
                // Full password change would need updatePassword from Firebase Auth
                return true;
            } catch {
                return false;
            }
        } else {
            return StorageService.changePassword(userId, newPassword);
        }
    },

    /**
     * Subscribe to auth state changes (Firebase mode only)
     */
    onAuthStateChanged(callback: (user: User | null) => void): (() => void) | null {
        if (!isFirebaseMode()) {
            return null; // No subscription needed for local mode
        }

        return onAuthChange(async (firebaseUser: FirebaseUser | null) => {
            if (firebaseUser) {
                const userData = await firestoreOperations.getUser(firebaseUser.uid);
                callback(userData);
            } else {
                callback(null);
            }
        });
    },

    /**
     * Get current app mode
     */
    getMode(): 'local' | 'firebase' {
        return APP_MODE;
    }
};

export default AuthService;
