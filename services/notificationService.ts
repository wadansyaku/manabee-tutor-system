// Notification Service for Homework Reminders
// Uses Browser Notification API

interface NotificationPreferences {
    enabled: boolean;
    reminderDays: number[]; // e.g., [0, 1] = today and tomorrow
}

const NOTIFICATION_PREFS_KEY = 'manabee_notification_prefs';
const LAST_CHECK_KEY = 'manabee_notification_last_check';

class NotificationService {
    private preferences: NotificationPreferences = {
        enabled: false,
        reminderDays: [0, 1], // Default: notify on day of and day before
    };

    constructor() {
        this.loadPreferences();
    }

    // Check if browser supports notifications
    isSupported(): boolean {
        return 'Notification' in window;
    }

    // Request notification permission
    async requestPermission(): Promise<boolean> {
        if (!this.isSupported()) {
            console.warn('Notifications not supported in this browser');
            return false;
        }

        const permission = await Notification.requestPermission();
        const granted = permission === 'granted';

        if (granted) {
            this.preferences.enabled = true;
            this.savePreferences();
        }

        return granted;
    }

    // Check current permission status
    getPermissionStatus(): NotificationPermission | 'unsupported' {
        if (!this.isSupported()) return 'unsupported';
        return Notification.permission;
    }

    // Load preferences from localStorage
    private loadPreferences(): void {
        try {
            const stored = localStorage.getItem(NOTIFICATION_PREFS_KEY);
            if (stored) {
                this.preferences = JSON.parse(stored);
            }
        } catch {
            // Use defaults
        }
    }

    // Save preferences to localStorage
    private savePreferences(): void {
        localStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(this.preferences));
    }

    // Get current preferences
    getPreferences(): NotificationPreferences {
        return { ...this.preferences };
    }

    // Update preferences
    updatePreferences(prefs: Partial<NotificationPreferences>): void {
        this.preferences = { ...this.preferences, ...prefs };
        this.savePreferences();
    }

    // Send a notification
    private sendNotification(title: string, body: string, tag?: string): void {
        if (!this.isSupported() || !this.preferences.enabled) return;
        if (Notification.permission !== 'granted') return;

        try {
            const notification = new Notification(title, {
                body,
                icon: '/favicon.ico', // You can add a custom icon
                badge: '/favicon.ico',
                tag: tag || 'manabee-reminder',
                requireInteraction: false,
            });

            // Auto-close after 10 seconds
            setTimeout(() => notification.close(), 10000);

            notification.onclick = () => {
                window.focus();
                notification.close();
            };
        } catch (error) {
            console.error('Failed to send notification:', error);
        }
    }

    // Check due items and send notifications
    checkDueItems(items: Array<{ id?: string; title: string; daysRemaining: number; isCompleted?: boolean }>): void {
        if (!this.preferences.enabled) return;

        // Check if we've already checked today
        const today = new Date().toDateString();
        const lastCheck = localStorage.getItem(LAST_CHECK_KEY);
        if (lastCheck === today) return;

        // Find items that need notification
        const dueItems = items.filter(item =>
            !item.isCompleted &&
            this.preferences.reminderDays.includes(item.daysRemaining)
        );

        if (dueItems.length === 0) return;

        // Group notifications
        const overdueItems = dueItems.filter(i => i.daysRemaining < 0);
        const todayItems = dueItems.filter(i => i.daysRemaining === 0);
        const tomorrowItems = dueItems.filter(i => i.daysRemaining === 1);

        if (overdueItems.length > 0) {
            this.sendNotification(
                '⚠️ 期限切れの宿題があります',
                overdueItems.map(i => i.title).join(', '),
                'overdue'
            );
        }

        if (todayItems.length > 0) {
            this.sendNotification(
                '📅 今日が期限の宿題',
                todayItems.map(i => i.title).join(', '),
                'today'
            );
        }

        if (tomorrowItems.length > 0) {
            this.sendNotification(
                '⏰ 明日が期限の宿題',
                tomorrowItems.map(i => i.title).join(', '),
                'tomorrow'
            );
        }

        // Mark as checked
        localStorage.setItem(LAST_CHECK_KEY, today);
    }

    // Manual trigger for testing
    testNotification(): void {
        this.sendNotification(
            '🔔 テスト通知',
            'Manabeeからの通知が正常に動作しています',
            'test'
        );
    }
}

// Export singleton
export const notificationService = new NotificationService();

export default notificationService;
