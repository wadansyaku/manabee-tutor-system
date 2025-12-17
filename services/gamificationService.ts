import { User } from '../types';
import { StorageService } from './storageService';
import { notificationService } from './notificationService';

// XP Constants
const XP_REWARDS = {
    HOMEWORK_COMPLETE: 25,      // Complete a homework item
    HOMEWORK_EARLY: 10,         // Complete homework 1+ days before deadline
    QUESTION_SUBMIT: 10,        // Submit a question
    QUESTION_UNDERSTOOD: 15,    // Mark a question as understood
    DAILY_LOGIN: 5,             // First login of the day
    STREAK_BONUS: 5,            // Bonus per streak day (max 7x)
    STUDY_SESSION: 20,          // Complete a study session
    REFLECTION_SUBMIT: 30,      // Submit a character reflection
    CHALLENGE_COMPLETE: 50,     // Complete a challenge homework
};

// Badges Definitions
export interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string;
    condition: (user: User) => boolean;
}

export const BADGES: Badge[] = [
    {
        id: 'new_scholar',
        name: 'はじめての学者',
        description: '初めてログインした',
        icon: '🎓',
        condition: (u) => true
    },
    {
        id: 'week_streak',
        name: '一週間継続',
        description: '7日間連続で学習した',
        icon: '🔥',
        condition: (u) => (u.streak || 0) >= 7
    },
    {
        id: 'streak_master',
        name: '継続の達人',
        description: '30日間連続で学習した',
        icon: '⚡',
        condition: (u) => (u.streak || 0) >= 30
    },
    {
        id: 'homework_master',
        name: '宿題マスター',
        description: 'レベル5に到達した',
        icon: '📚',
        condition: (u) => (u.level || 1) >= 5
    },
    {
        id: 'question_asker',
        name: '探究者',
        description: '合計1000XPを獲得した',
        icon: '❓',
        condition: (u) => (u.xp || 0) >= 1000
    },
    {
        id: 'question_master',
        name: '質問マスター',
        description: '10回以上質問をした',
        icon: '🤔',
        // Note: Simple heuristic for now, ideal would be to count actual questions in DB
        condition: (u) => (u.xp || 0) >= 2000
    },
    {
        id: 'early_bird',
        name: '早起き鳥',
        description: '宿題を期限より早く完了した',
        icon: '🐦',
        // Placeholder condition until we track "early completions" count in User model
        condition: (u) => (u.xp || 0) > 500 && (u.level || 1) >= 3
    }
];

// Level calculation using exponential curve
const xpPerLevel = (level: number): number => Math.floor(100 * Math.pow(1.2, level - 1));

// Calculate level and remaining XP from total XP
const calculateLevel = (totalXp: number): { level: number; xpInLevel: number; xpNeeded: number } => {
    let level = 1;
    let remainingXp = totalXp;

    while (remainingXp >= xpPerLevel(level)) {
        remainingXp -= xpPerLevel(level);
        level++;
    }

    return {
        level,
        xpInLevel: remainingXp,
        xpNeeded: xpPerLevel(level)
    };
};

// Check if Firebase mode is enabled
const isFirebaseMode = (): boolean => {
    try {
        return import.meta.env.VITE_APP_MODE === 'firebase';
    } catch {
        return false;
    }
};

export interface GamificationResult {
    success: boolean;
    xp: number;
    level: number;
    leveledUp: boolean;
    streak: number;
    xpGained: number;
    bonusXp?: number;
    message?: string;
    newBadges?: Badge[];
}

export const GamificationService = {
    /**
     * Add XP to a user and check for level up
     */
    async addXp(
        userId: string,
        xpToAdd: number,
        reason: keyof typeof XP_REWARDS | string
    ): Promise<GamificationResult> {
        const baseXp = typeof reason === 'string' && reason in XP_REWARDS
            ? XP_REWARDS[reason as keyof typeof XP_REWARDS]
            : xpToAdd;

        let result: GamificationResult = {
            success: false,
            xp: 0,
            level: 1,
            leveledUp: false,
            streak: 0,
            xpGained: 0,
        };

        if (isFirebaseMode()) {
            try {
                const { firestoreOperations } = await import('./firebaseService');
                const fbResult = await firestoreOperations.addUserXp(userId, baseXp);
                result = {
                    success: true,
                    xp: fbResult.xp,
                    level: fbResult.level,
                    leveledUp: fbResult.leveledUp,
                    streak: 0, // Would need separate call
                    xpGained: baseXp,
                    message: fbResult.leveledUp ? `レベルアップ！ レベル${fbResult.level}になりました！` : undefined
                };
            } catch (err) {
                console.error('[Gamification] Firebase XP add failed:', err);
                // Fall through to local
            }
        }

        if (!result.success) {
            // Local mode
            const users = StorageService.loadUsers();
            const userIndex = users.findIndex(u => u.id === userId);

            if (userIndex === -1) {
                return result;
            }

            const user = users[userIndex];
            const currentXp = (user.xp || 0) + baseXp;
            const currentLevel = user.level || 1;
            const { level: newLevel } = calculateLevel(currentXp);
            const leveledUp = newLevel > currentLevel;

            // Update user
            users[userIndex] = {
                ...user,
                xp: currentXp,
                level: newLevel,
                updatedAt: new Date().toISOString()
            };
            StorageService.saveUsers(users);

            result = {
                success: true,
                xp: currentXp,
                level: newLevel,
                leveledUp,
                streak: user.streak || 0,
                xpGained: baseXp,
                message: leveledUp ? `レベルアップ！ レベル${newLevel}になりました！` : undefined
            };
        }

        // Check for Badges
        const newBadges = await this.checkAndAwardBadges(userId);
        if (newBadges.length > 0) {
            result.newBadges = newBadges;
        }

        // Send Notification if Leveled Up
        if (result.leveledUp) {
            notificationService.sendLevelUpNotification(userId, result.level, result.xpGained);
        }

        return result;
    },

    /**
     * Check metrics against badge conditions and award any new ones
     */
    async checkAndAwardBadges(userId: string): Promise<Badge[]> {
        const users = StorageService.loadUsers();
        const userIndex = users.findIndex(u => u.id === userId);
        if (userIndex === -1) return [];

        const user = users[userIndex];
        const currentBadges = new Set(user.badges || []);
        const newBadges: Badge[] = [];

        BADGES.forEach(badge => {
            if (!currentBadges.has(badge.id) && badge.condition(user)) {
                newBadges.push(badge);
                currentBadges.add(badge.id);
            }
        });

        if (newBadges.length > 0) {
            // Persist new badges
            if (isFirebaseMode()) {
                try {
                    const { firestoreOperations } = await import('./firebaseService');
                    // In real implementation, we would sync badges here.
                    // For now, we rely on the local update or future sync
                } catch (e) { console.warn("Failed to sync badges to Firebase", e); }
            }

            users[userIndex] = { ...user, badges: Array.from(currentBadges) };
            StorageService.saveUsers(users);

            // Notify for badges
            newBadges.forEach(b => {
                notificationService.sendNotification(
                    `🏆 バッジ獲得: ${b.name}`,
                    b.description
                );
            });
        }

        return newBadges;
    },

    /**
     * Subscribe to real-time Gamification updates (Firebase only)
     */
    subscribeToUpdates(userId: string, onUpdate: (stats: { xp: number, level: number, streak: number, badges: string[] }) => void): () => void {
        if (isFirebaseMode()) {
            import('./firebaseService').then(({ firestoreOperations }) => {
                // Fallback polling or listener if available
                if (firestoreOperations.subscribeToUser) {
                    firestoreOperations.subscribeToUser(userId, (user: User) => {
                        onUpdate({
                            xp: user.xp || 0,
                            level: user.level || 1,
                            streak: user.streak || 0,
                            badges: user.badges || []
                        });
                    });
                }
            });
            return () => { };
        }

        const checkStorage = (e: StorageEvent) => {
            if (e.key === 'manabee_users_v2') {
                const users = StorageService.loadUsers();
                const user = users.find(u => u.id === userId);
                if (user) {
                    onUpdate({
                        xp: user.xp || 0,
                        level: user.level || 1,
                        streak: user.streak || 0,
                        badges: user.badges || []
                    });
                }
            }
        };
        window.addEventListener('storage', checkStorage);
        return () => window.removeEventListener('storage', checkStorage);
    },

    /**
     * Update user's activity streak (should be called on app load or significant action)
     */
    async updateActivity(userId: string): Promise<GamificationResult> {
        if (isFirebaseMode()) {
            try {
                const { firestoreOperations } = await import('./firebaseService');
                const result = await firestoreOperations.updateUserActivity(userId);
                return {
                    success: true,
                    xp: result.xp,
                    level: result.level,
                    leveledUp: false,
                    streak: result.streak,
                    xpGained: 0,
                };
            } catch (err) {
                console.error('[Gamification] Firebase activity update failed:', err);
                // Fall through to local
            }
        }

        // Local mode
        const users = StorageService.loadUsers();
        const userIndex = users.findIndex(u => u.id === userId);

        if (userIndex === -1) {
            return {
                success: false,
                xp: 0,
                level: 1,
                leveledUp: false,
                streak: 0,
                xpGained: 0,
            };
        }

        const user = users[userIndex];
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        let newStreak = user.streak || 0;
        let streakBonusXp = 0;

        if (user.lastActiveAt) {
            const lastActive = new Date(user.lastActiveAt);
            const lastActiveDate = lastActive.toISOString().split('T')[0];
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];

            if (lastActiveDate === today) {
                // Already active today, no change
            } else if (lastActiveDate === yesterdayStr) {
                // Continue streak
                newStreak += 1;
                // Award streak bonus (cap at 7 days = 35 bonus XP)
                streakBonusXp = Math.min(newStreak, 7) * XP_REWARDS.STREAK_BONUS;
            } else {
                // Streak broken
                newStreak = 1;
            }
        } else {
            // First activity
            newStreak = 1;
        }

        // Calculate XP if it changed
        let currentXp = user.xp || 0;
        let currentLevel = user.level || 1;
        let leveledUp = false;

        if (streakBonusXp > 0) {
            currentXp += streakBonusXp;
            const { level: newLevel } = calculateLevel(currentXp);
            leveledUp = newLevel > currentLevel;
            currentLevel = newLevel;
        }

        // Update user
        users[userIndex] = {
            ...user,
            lastActiveAt: now.toISOString(),
            streak: newStreak,
            xp: currentXp,
            level: currentLevel,
            updatedAt: now.toISOString()
        };
        StorageService.saveUsers(users);

        return {
            success: true,
            xp: currentXp,
            level: currentLevel,
            leveledUp,
            streak: newStreak,
            xpGained: streakBonusXp,
            bonusXp: streakBonusXp,
            message: streakBonusXp > 0 ? `${newStreak}日連続ログイン！ +${streakBonusXp}XP` : undefined
        };
    },

    /**
     * Award XP for homework completion
     */
    async onHomeworkComplete(userId: string, isEarly: boolean = false): Promise<GamificationResult> {
        const baseXp = XP_REWARDS.HOMEWORK_COMPLETE;
        const earlyBonus = isEarly ? XP_REWARDS.HOMEWORK_EARLY : 0;
        const totalXp = baseXp + earlyBonus;

        const result = await this.addXp(userId, totalXp, 'HOMEWORK_COMPLETE');
        return {
            ...result,
            bonusXp: earlyBonus,
            message: isEarly
                ? `早期完了ボーナス！ +${totalXp}XP (${earlyBonus}XPボーナス)`
                : `宿題完了！ +${baseXp}XP`
        };
    },

    /**
     * Award XP for submitting a question
     */
    async onQuestionSubmit(userId: string): Promise<GamificationResult> {
        return await this.addXp(userId, XP_REWARDS.QUESTION_SUBMIT, 'QUESTION_SUBMIT');
    },

    /**
     * Award XP for marking a question as understood
     */
    async onQuestionUnderstood(userId: string): Promise<GamificationResult> {
        return await this.addXp(userId, XP_REWARDS.QUESTION_UNDERSTOOD, 'QUESTION_UNDERSTOOD');
    },

    /**
     * Award XP for completing a study session
     */
    async onStudySessionComplete(userId: string): Promise<GamificationResult> {
        return await this.addXp(userId, XP_REWARDS.STUDY_SESSION, 'STUDY_SESSION');
    },

    /**
     * Award XP for submitting a character reflection
     */
    async onReflectionSubmit(userId: string): Promise<GamificationResult> {
        return await this.addXp(userId, XP_REWARDS.REFLECTION_SUBMIT, 'REFLECTION_SUBMIT');
    },

    /**
     * Get current user's gamification stats
     */
    getUserStats(userId: string): { xp: number; level: number; streak: number; xpProgress: number; xpNeeded: number } {
        const users = StorageService.loadUsers();
        const user = users.find(u => u.id === userId);

        if (!user) {
            return { xp: 0, level: 1, streak: 0, xpProgress: 0, xpNeeded: 100 };
        }

        const { level, xpInLevel, xpNeeded } = calculateLevel(user.xp || 0);

        return {
            xp: user.xp || 0,
            level,
            streak: user.streak || 0,
            xpProgress: xpInLevel,
            xpNeeded
        };
    },

    /**
     * Get XP reward amounts (for UI display)
     */
    getRewardAmounts(): typeof XP_REWARDS {
        return { ...XP_REWARDS };
    }
};

export default GamificationService;
