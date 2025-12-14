import { describe, it, expect, beforeEach, vi } from 'vitest';

// DateUtils tests
describe('DateUtils', () => {
    beforeEach(() => {
        // Reset date mock before each test
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2024-01-15T10:00:00'));
    });

    it('should parse date string correctly', async () => {
        const { DateUtils } = await import('@/services/storageService');
        const date = DateUtils.parse('2024-01-15');
        expect(date.getFullYear()).toBe(2024);
        expect(date.getMonth()).toBe(0);
        expect(date.getDate()).toBe(15);
    });

    it('should add days correctly', async () => {
        const { DateUtils } = await import('@/services/storageService');
        const result = DateUtils.addDays('2024-01-15', 5);
        expect(result).toContain('2024-01-20');
    });

    it('should calculate days remaining correctly', async () => {
        const { DateUtils } = await import('@/services/storageService');
        const baseDate = new Date('2024-01-15T10:00:00');

        // Same day
        const today = DateUtils.getDaysRemaining('2024-01-15', true, baseDate);
        expect(today).toBe(0);

        // Tomorrow
        const tomorrow = DateUtils.getDaysRemaining('2024-01-16', true, baseDate);
        expect(tomorrow).toBe(1);

        // Yesterday (overdue)
        const yesterday = DateUtils.getDaysRemaining('2024-01-14', true, baseDate);
        expect(yesterday).toBe(-1);
    });

    it('should format days remaining in Japanese', async () => {
        const { DateUtils } = await import('@/services/storageService');

        expect(DateUtils.formatDaysRemaining(0)).toBe('今日まで');
        expect(DateUtils.formatDaysRemaining(1)).toBe('明日まで');
        expect(DateUtils.formatDaysRemaining(3)).toBe('あと3日');
        expect(DateUtils.formatDaysRemaining(-1)).toBe('期限切れ');
    });

    it('should format date in Japanese format', async () => {
        const { DateUtils } = await import('@/services/storageService');
        const formatted = DateUtils.formatDate('2024-01-15');
        expect(formatted).toContain('1月15日');
    });
});

// Mock user data for auth tests
const mockUsers = [
    {
        id: 'admin1',
        email: 'admin@test.com',
        password: 'admin123',
        role: 'ADMIN' as const,
        name: 'Test Admin'
    },
    {
        id: 'student1',
        email: 'student@test.com',
        role: 'STUDENT' as const,
        name: 'Test Student'
    }
];

describe('LocalDataStore', () => {
    beforeEach(() => {
        vi.resetModules();
        localStorage.clear();
        vi.mocked(localStorage.getItem).mockImplementation((key: string) => {
            if (key === 'manabee_users_v2') {
                return JSON.stringify(mockUsers);
            }
            return null;
        });
    });

    it('should generate unique IDs', async () => {
        const { StorageService } = await import('@/services/storageService');
        const id1 = StorageService.generateId();
        const id2 = StorageService.generateId();

        expect(id1).toBeDefined();
        expect(id2).toBeDefined();
        expect(id1).not.toBe(id2);
    });

    it('should load users from localStorage', async () => {
        const { StorageService } = await import('@/services/storageService');
        const users = StorageService.loadUsers();

        expect(Array.isArray(users)).toBe(true);
    });

    it('should login admin user with correct password', async () => {
        vi.mocked(localStorage.getItem).mockImplementation((key: string) => {
            if (key === 'manabee_users_v2') {
                return JSON.stringify(mockUsers);
            }
            return null;
        });

        const { StorageService } = await import('@/services/storageService');
        const result = StorageService.login('admin@test.com', 'admin123');

        expect(result.success).toBe(true);
        expect(result.user?.role).toBe('ADMIN');
    });

    it('should fail login with incorrect password', async () => {
        vi.mocked(localStorage.getItem).mockImplementation((key: string) => {
            if (key === 'manabee_users_v2') {
                return JSON.stringify(mockUsers);
            }
            return null;
        });

        const { StorageService } = await import('@/services/storageService');
        const result = StorageService.login('admin@test.com', 'wrongpassword');

        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
    });
});

describe('Homework Utils', () => {
    it('should detect overdue homework', async () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2024-01-15'));

        const { isOverdue } = await import('@/services/homeworkUtils');

        // Past date
        expect(isOverdue('2024-01-14')).toBe(true);

        // Today
        expect(isOverdue('2024-01-15')).toBe(false);

        // Future date
        expect(isOverdue('2024-01-16')).toBe(false);
    });
});
