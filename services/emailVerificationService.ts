/**
 * Email Verification Service
 * 
 * Handles email verification flow for Firebase Authentication.
 */

import { getAuth, sendEmailVerification, applyActionCode, User as FirebaseUser } from 'firebase/auth';

/**
 * Check if the current user's email is verified
 */
export const isEmailVerified = (user: FirebaseUser | null): boolean => {
    return user?.emailVerified ?? false;
};

/**
 * Send verification email to current user
 */
export const sendVerificationEmail = async (): Promise<{ success: boolean; error?: string }> => {
    try {
        const auth = getAuth();
        const user = auth.currentUser;

        if (!user) {
            return { success: false, error: 'ログインしていません' };
        }

        if (user.emailVerified) {
            return { success: false, error: 'メールは既に確認済みです' };
        }

        await sendEmailVerification(user, {
            url: window.location.origin,
            handleCodeInApp: false
        });

        return { success: true };
    } catch (error: any) {
        console.error('Email verification error:', error);

        // Handle specific Firebase errors
        if (error.code === 'auth/too-many-requests') {
            return { success: false, error: '送信回数が多すぎます。しばらく待ってから再試行してください。' };
        }

        return { success: false, error: error.message || 'メール送信に失敗しました' };
    }
};

/**
 * Apply email verification code from URL
 */
export const applyVerificationCode = async (oobCode: string): Promise<{ success: boolean; error?: string }> => {
    try {
        const auth = getAuth();
        await applyActionCode(auth, oobCode);

        // Reload user to update emailVerified status
        if (auth.currentUser) {
            await auth.currentUser.reload();
        }

        return { success: true };
    } catch (error: any) {
        console.error('Apply verification code error:', error);

        if (error.code === 'auth/expired-action-code') {
            return { success: false, error: '確認リンクの有効期限が切れています。再送信してください。' };
        }
        if (error.code === 'auth/invalid-action-code') {
            return { success: false, error: '無効な確認リンクです。' };
        }

        return { success: false, error: error.message || '確認に失敗しました' };
    }
};

/**
 * Check URL for verification code and apply if present
 */
export const handleEmailVerificationFromUrl = async (): Promise<{ verified: boolean; error?: string }> => {
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');
    const oobCode = urlParams.get('oobCode');

    if (mode === 'verifyEmail' && oobCode) {
        const result = await applyVerificationCode(oobCode);

        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);

        return { verified: result.success, error: result.error };
    }

    return { verified: false };
};

export default {
    isEmailVerified,
    sendVerificationEmail,
    applyVerificationCode,
    handleEmailVerificationFromUrl
};
