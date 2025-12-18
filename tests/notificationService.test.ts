import { beforeEach, describe, expect, it } from 'vitest';
import notificationService from '../services/notificationService';
import { NotificationSettings, NotificationType, UserRole } from '../types';

const student = { id: 's1', role: UserRole.STUDENT, name: 'テスト生徒', email: 'student@example.com' } as const;

describe('notificationService (local mode)', () => {
    beforeEach(() => {
        localStorage.clear();
        notificationService.resetForTests();
    });

    it('filters notifications by category and sorts by priority', async () => {
        const categories: NotificationType[] = ['homework'];
        const notifications = await notificationService.fetchNotifications(student.id, { categories, sortBy: 'priority' });

        expect(notifications.every(n => categories.includes(n.type))).toBe(true);
        expect(notifications[0].priority).toBe('high');
    });

    it('marks all notifications as read and allows undo', async () => {
        const initial = await notificationService.fetchNotifications(student.id, { sortBy: 'newest' });
        const unreadIds = initial.filter(n => !n.readAt).map(n => n.id);
        expect(unreadIds.length).toBeGreaterThan(0);

        const updatedIds = await notificationService.markAllRead(student as any);
        expect(updatedIds.length).toBe(unreadIds.length);

        await notificationService.undoMarkAll(student.id, updatedIds);
        const afterUndo = await notificationService.fetchNotifications(student.id, { sortBy: 'newest' });
        const restoredIds = afterUndo.filter(n => !n.readAt).map(n => n.id);
        expect(restoredIds).toEqual(expect.arrayContaining(unreadIds));
    });

    it('updates notification settings with offsets', async () => {
        const nextSettings: Partial<NotificationSettings> = {
            homeworkReminder: { enabled: true, offsets: [24, 6] },
        };

        const updated = await notificationService.updateSettings(student.id, nextSettings as NotificationSettings);
        expect(updated.homeworkReminder.offsets).toEqual([24, 6].sort((a, b) => a - b));
    });
});
