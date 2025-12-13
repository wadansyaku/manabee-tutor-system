// Auth Context for Firebase and Local authentication
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, UserRole } from '../types';
import { StorageService } from './storageService';
import firebaseService, { isFirebaseConfigured } from './firebaseService';

// Auth state interface
interface AuthState {
    user: User | null;
    isLoading: boolean;
    isFirebaseMode: boolean;
}

// Auth context interface
interface AuthContextType extends AuthState {
    login: (email: string, password?: string) => Promise<{ success: boolean; user?: User; error?: string }>;
    logout: () => Promise<void>;
    changePassword: (userId: string, newPassword: string) => Promise<boolean>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Auth Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, setState] = useState<AuthState>({
        user: null,
        isLoading: true,
        isFirebaseMode: false,
    });

    // Check if Firebase is configured
    const isFirebase = isFirebaseConfigured();

    // Initialize auth state
    useEffect(() => {
        const initAuth = async () => {
            if (isFirebase) {
                // Firebase mode: listen to auth state changes
                setState(prev => ({ ...prev, isFirebaseMode: true }));

                try {
                    firebaseService.onAuthChange(async (firebaseUser) => {
                        if (firebaseUser) {
                            // Get user profile from Firestore
                            const userProfile = await firebaseService.getUser(firebaseUser.uid);
                            if (userProfile) {
                                setState({ user: userProfile, isLoading: false, isFirebaseMode: true });
                            } else {
                                // Create default profile
                                const newUser: User = {
                                    id: firebaseUser.uid,
                                    name: firebaseUser.email?.split('@')[0] || 'User',
                                    email: firebaseUser.email || '',
                                    role: UserRole.STUDENT,
                                };
                                setState({ user: newUser, isLoading: false, isFirebaseMode: true });
                            }
                        } else {
                            setState({ user: null, isLoading: false, isFirebaseMode: true });
                        }
                    });
                } catch (error) {
                    console.error('Firebase auth initialization failed:', error);
                    setState({ user: null, isLoading: false, isFirebaseMode: false });
                }
            } else {
                // Local mode: no auto-login, just set loading to false
                setState({ user: null, isLoading: false, isFirebaseMode: false });
            }
        };

        initAuth();
    }, [isFirebase]);

    // Login function
    const login = useCallback(async (email: string, password?: string): Promise<{ success: boolean; user?: User; error?: string }> => {
        if (state.isFirebaseMode) {
            // Firebase login
            if (!password) {
                return { success: false, error: 'パスワードを入力してください' };
            }
            const result = await firebaseService.firebaseLogin(email, password);
            if (result.success && result.user) {
                setState(prev => ({ ...prev, user: result.user! }));
            }
            return result;
        } else {
            // Local login
            const result = StorageService.login(email, password);
            if (result.success && result.user) {
                setState(prev => ({ ...prev, user: result.user! }));
            }
            return result;
        }
    }, [state.isFirebaseMode]);

    // Logout function
    const logout = useCallback(async () => {
        if (state.isFirebaseMode) {
            await firebaseService.firebaseLogout();
        }
        setState(prev => ({ ...prev, user: null }));
    }, [state.isFirebaseMode]);

    // Change password function
    const changePassword = useCallback(async (userId: string, newPassword: string): Promise<boolean> => {
        if (state.isFirebaseMode) {
            // Firebase password change would require reauthentication
            // For now, just update user profile to mark as changed
            try {
                await firebaseService.updateUser(userId, { isInitialPassword: false });
                return true;
            } catch {
                return false;
            }
        } else {
            return StorageService.changePassword(userId, newPassword);
        }
    }, [state.isFirebaseMode]);

    // Refresh user data
    const refreshUser = useCallback(async () => {
        if (state.isFirebaseMode && state.user) {
            const userProfile = await firebaseService.getUser(state.user.id);
            if (userProfile) {
                setState(prev => ({ ...prev, user: userProfile }));
            }
        }
    }, [state.isFirebaseMode, state.user]);

    const value: AuthContextType = {
        ...state,
        login,
        logout,
        changePassword,
        refreshUser,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook to use auth context
export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext;
