import {
    NotificationItem,
    NotificationQueryOptions,
    NotificationSettings,
    NotificationType,
    User,
    UserRole,
} from '../types';
import {
    createNotification,
    defaultNotificationSettings,
    getNotificationSettings,
    getNotifications,
    markAllNotificationsRead,
    markNotificationRead,
    updateNotificationSettings,
    updateNotificationsReadState,
} from './firestoreDataService';
import { DateUtils } from './storageService';

const NOTIFICATION_CACHE_KEY = 'manabee_notification_cache_v2';
const NOTIFICATION_SETTINGS_KEY = 'manabee_notification_settings_v2';

const seedNotifications: NotificationItem[] = [
    {
        id: 'seed-homework-1',
        userId: 's1',
        role: UserRole.STUDENT,
        type: 'homework',
        title: '【期限超過】英語ワークの提出が遅れています',
        body: 'P.32-35 の提出期限を過ぎています。今すぐ提出して再確認しましょう。',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
        priority: 'high',
        payload: { taskId: 'hw-1', dueDate: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), ctaLabel: '提出画面を開く' },
        deepLink: '/homework',
    },
    {
        id: 'seed-lesson-1',
        userId: 's1',
        role: UserRole.STUDENT,
        type: 'lesson',
        title: '本日の授業リマインダー',
        body: '16:00 から算数のオンライン授業があります。準備チェックリストを確認しましょう。',
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        priority: 'high',
        payload: { lessonId: 'l1', startTime: new Date().toISOString(), ctaLabel: '授業の詳細を見る' },
        deepLink: '/lessons/l1',
    },
    {
        id: 'seed-achievement-1',
        userId: 's1',
        role: UserRole.STUDENT,
        type: 'achievement',
        title: '7日連続学習バッジを獲得',
        body: '連続学習の継続が素晴らしいです。次は10日連続に挑戦！',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
        priority: 'normal',
        payload: { badgeId: 'badge-streak-7', ctaLabel: '振り返りを確認' },
        deepLink: '/goals',
    },
    {
        id: 'seed-homework-2',
        userId: 's1',
        role: UserRole.STUDENT,
        type: 'homework',
        title: '24時間以内のタスク：理科レポート',
        body: '「電流と磁界」のレポート提出期限が明日です。30分で終わらせましょう。',
        createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
        priority: 'high',
        payload: { taskId: 'hw-2', dueDate: new Date(Date.now() + 1000 * 60 * 60 * 20).toISOString(), ctaLabel: '下書きを開く' },
        deepLink: '/homework',
    },
];

const priorityOrder: Record<string, number> = { high: 0, normal: 1, low: 2 };

const clientFilter = (notifications: NotificationItem[], options: NotificationQueryOptions = {}) => {
    let data = [...notifications];

    if (options.categories?.length) {
        data = data.filter(n => options.categories!.includes(n.type));
    }

    if (options.unreadOnly) {
        data = data.filter(n => !n.readAt);
    }

    if (options.sortBy === 'priority') {
        data = data.sort((a, b) => {
            const pDiff = (priorityOrder[a.priority || 'normal'] ?? 1) - (priorityOrder[b.priority || 'normal'] ?? 1);
            if (pDiff !== 0) return pDiff;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
    } else {
        data = data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    if (options.limit) {
        data = data.slice(0, options.limit);
    }

    return data;
};

class NotificationService {
    private cache: NotificationItem[] = [];
    private settings: NotificationSettings = defaultNotificationSettings;
    private lastUserId?: string;

    constructor() {
        this.loadFromLocal();
    }

    private loadFromLocal() {
        if (typeof window === 'undefined') return;
        const saved = localStorage.getItem(NOTIFICATION_CACHE_KEY);
        if (saved) {
            this.cache = JSON.parse(saved);
        } else {
            this.cache = seedNotifications;
        }

        const savedSettings = localStorage.getItem(NOTIFICATION_SETTINGS_KEY);
        if (savedSettings) {
            this.settings = { ...defaultNotificationSettings, ...JSON.parse(savedSettings) };
        }
    }

    private persistLocal(notifications: NotificationItem[]) {
        if (typeof window === 'undefined') return;
        localStorage.setItem(NOTIFICATION_CACHE_KEY, JSON.stringify(notifications));
    }

    private persistSettings(settings: NotificationSettings) {
        if (typeof window === 'undefined') return;
        localStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings));
    }

    private async logEvent(eventType: 'notif_click' | 'notif_mark_all', data: Record<string, any>) {
        console.info('[notification-event]', eventType, data);
        try {
            const { logAnalyticsEvent } = await import('./firestoreDataService');
            await logAnalyticsEvent({
                eventType,
                eventData: data,
                userId: data.userId,
                userRole: data.userRole,
                pageUrl: window.location.hash,
                sessionId: data.sessionId || 'local',
            } as any);
        } catch (error) {
            console.debug('Analytics log skipped', error);
        }
    }

    async fetchNotifications(userId: string, options: NotificationQueryOptions = {}): Promise<NotificationItem[]> {
        const isFirebaseMode = import.meta.env.VITE_APP_MODE === 'firebase';

        if (isFirebaseMode) {
            try {
                const remote = await getNotifications(userId, options);
                this.cache = remote;
                this.lastUserId = userId;
                this.persistLocal(remote);
                return remote;
            } catch (error) {
                console.error('Failed to fetch notifications from Firestore, falling back to cache', error);
            }
        }

        const data = this.cache.filter(n => n.userId === userId || !this.lastUserId);
        return clientFilter(data.length ? data : seedNotifications, options);
    }

    async markAsRead(notificationId: string, user: User): Promise<void> {
        const isFirebaseMode = import.meta.env.VITE_APP_MODE === 'firebase';
        if (isFirebaseMode) {
            await markNotificationRead(notificationId);
        }

        this.cache = this.cache.map(n => n.id === notificationId ? { ...n, readAt: new Date().toISOString() } : n);
        this.persistLocal(this.cache);
        await this.logEvent('notif_click', { notificationId, userId: user.id, userRole: user.role });
    }

    async markAllRead(user: User): Promise<string[]> {
        const isFirebaseMode = import.meta.env.VITE_APP_MODE === 'firebase';
        let updatedIds: string[] = [];

        if (isFirebaseMode) {
            try {
                updatedIds = await markAllNotificationsRead(user.id);
            } catch (error) {
                console.error('Failed to mark all read in Firestore, falling back to local', error);
                updatedIds = this.cache.filter(n => !n.readAt).map(n => n.id);
            }
        } else {
            updatedIds = this.cache.filter(n => !n.readAt).map(n => n.id);
        }

        const nowIso = new Date().toISOString();
        this.cache = this.cache.map(n => updatedIds.includes(n.id) ? { ...n, readAt: nowIso } : n);
        this.persistLocal(this.cache);
        await this.logEvent('notif_mark_all', { userId: user.id, userRole: user.role, count: updatedIds.length });
        return updatedIds;
    }

    async undoMarkAll(userId: string, notificationIds: string[]): Promise<void> {
        const isFirebaseMode = import.meta.env.VITE_APP_MODE === 'firebase';
        if (notificationIds.length === 0) return;

        if (isFirebaseMode) {
            try {
                await updateNotificationsReadState(notificationIds, null);
            } catch (error) {
                console.error('Failed to undo mark all in Firestore, keeping local state only', error);
            }
        }

        this.cache = this.cache.map(n => notificationIds.includes(n.id) ? { ...n, readAt: null } : n);
        this.persistLocal(this.cache);
    }

    async getSettings(userId: string): Promise<NotificationSettings> {
        const isFirebaseMode = import.meta.env.VITE_APP_MODE === 'firebase';
        if (isFirebaseMode) {
            try {
                this.settings = await getNotificationSettings(userId);
                this.persistSettings(this.settings);
                return this.settings;
            } catch (error) {
                console.error('Failed to fetch notification settings, falling back', error);
            }
        }

        return this.settings;
    }

    async updateSettings(userId: string, updates: Partial<NotificationSettings>): Promise<NotificationSettings> {
        const merged: NotificationSettings = {
            homeworkReminder: { ...this.settings.homeworkReminder, ...(updates.homeworkReminder || {}) },
            lessonReminder: { ...this.settings.lessonReminder, ...(updates.lessonReminder || {}) },
            achievement: { ...this.settings.achievement, ...(updates.achievement || {}) },
        };

        merged.homeworkReminder.offsets = Array.from(new Set(merged.homeworkReminder.offsets)).sort((a, b) => a - b);
        merged.lessonReminder.offsets = Array.from(new Set(merged.lessonReminder.offsets)).sort((a, b) => a - b);
        merged.achievement.offsets = Array.from(new Set(merged.achievement.offsets)).sort((a, b) => a - b);

        const isFirebaseMode = import.meta.env.VITE_APP_MODE === 'firebase';
        if (isFirebaseMode) {
            await updateNotificationSettings(userId, merged);
        }

        this.settings = merged;
        this.persistSettings(merged);
        return merged;
    }

    async create(notification: Omit<NotificationItem, 'id' | 'createdAt'>): Promise<NotificationItem> {
        const isFirebaseMode = import.meta.env.VITE_APP_MODE === 'firebase';
        let created: NotificationItem;

        if (isFirebaseMode) {
            created = await createNotification(notification);
        } else {
            created = {
                ...notification,
                id: `local-${Date.now()}`,
                createdAt: new Date().toISOString(),
                readAt: notification.readAt || null,
            } as NotificationItem;
            this.cache = [created, ...this.cache];
            this.persistLocal(this.cache);
        }

        return created;
    }

    resolveDeepLink(notification: NotificationItem): string {
        if (notification.deepLink) return notification.deepLink;
        if (notification.type === 'homework') return '/homework';
        if (notification.type === 'lesson' && notification.payload?.lessonId) return `/lessons/${notification.payload.lessonId}`;
        if (notification.type === 'achievement') return '/goals';
        return '/';
    }

    categoryLabel(type: NotificationType): string {
        const labels: Record<NotificationType, string> = {
            homework: '宿題',
            lesson: '授業',
            achievement: '達成',
            system: 'システム',
            message: 'メッセージ',
        };
        return labels[type];
    }

    /**
     * Legacy compatibility: dashboard uses checkDueItems to fire reminders.
     * This implementation adds high-priority local notifications for overdue/24h items when in local mode.
     */
    checkDueItems(items: Array<{ id?: string; title: string; daysRemaining?: number; dueDate?: string; isCompleted?: boolean }>): void {
        if (!items || !items.length) return;

        const reminders: NotificationItem[] = [];
        const nowIso = new Date().toISOString();

        items.forEach((item) => {
            if (item.isCompleted) return;
            const daysRemaining = item.daysRemaining ?? (item.dueDate ? DateUtils.getDaysRemaining(item.dueDate, true) : 99);
            if (daysRemaining > 1) return;

            const existing = this.cache.find(n => n.payload?.taskId === item.id && !n.readAt);
            if (existing) return;

            const isOverdue = daysRemaining < 0;
            reminders.push({
                id: `local-due-${item.id || Math.random()}`,
                userId: this.lastUserId || 'local-student',
                role: UserRole.STUDENT,
                type: 'homework',
                title: isOverdue ? `【期限超過】${item.title}` : `24h以内に締切: ${item.title}`,
                body: isOverdue ? '期限を過ぎています。提出して確認を依頼しましょう。' : '締切が迫っています。25分集中で片付けましょう。',
                createdAt: nowIso,
                priority: 'high',
                readAt: null,
                deepLink: '/homework',
                payload: { taskId: item.id, dueDate: item.dueDate, ctaLabel: isOverdue ? '提出画面を開く' : '今すぐ取り組む' },
            });
        });

        if (reminders.length) {
            this.cache = [...reminders, ...this.cache];
            this.persistLocal(this.cache);
        }
    }

    // Testing utility to reset local cache without hitting Firestore
    resetForTests(notifications: NotificationItem[] = seedNotifications) {
        this.cache = notifications;
        this.settings = defaultNotificationSettings;
        this.persistLocal(this.cache);
        this.persistSettings(this.settings);
    }
}

export const notificationService = new NotificationService();

export default notificationService;
