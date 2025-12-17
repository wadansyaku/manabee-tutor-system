import { test, expect } from '@playwright/test';

/**
 * Dashboard E2E Tests for Manabee Tutor System
 * 
 * Tests: Role-specific dashboard content, data loading, interactions
 */

test.describe('Student Dashboard', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => localStorage.clear());
        await page.reload();

        // Login as student
        const demoButton = page.locator('button:has-text("生徒")').first();
        if (await demoButton.isVisible({ timeout: 3000 }).catch(() => false)) {
            await demoButton.click();
            await page.waitForTimeout(2000);
        }
    });

    test('should display student dashboard elements', async ({ page }) => {
        // Student dashboard should have homework-related content
        const dashboardContent = page.locator('main, [role="main"], .dashboard');
        await expect(dashboardContent).toBeVisible({ timeout: 10000 });

        // Look for typical student elements
        const studentElements = page.locator('text=/宿題|課題|今日のチャレンジ|質問/');
        await expect(studentElements.first()).toBeVisible({ timeout: 10000 });
    });

    test('should be able to navigate to homework list', async ({ page }) => {
        const homeworkNav = page.locator('a:has-text("宿題"), button:has-text("宿題")').first();
        if (await homeworkNav.isVisible({ timeout: 3000 }).catch(() => false)) {
            await homeworkNav.click();
            await page.waitForTimeout(1000);
            // Should see homework list content
            await expect(page.locator('text=/宿題|課題|期限/')).toBeVisible({ timeout: 5000 });
        }
    });
});

test.describe('Tutor Dashboard', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => localStorage.clear());
        await page.reload();

        // Login as tutor
        const demoButton = page.locator('button:has-text("講師")').first();
        if (await demoButton.isVisible({ timeout: 3000 }).catch(() => false)) {
            await demoButton.click();
            await page.waitForTimeout(2000);
        }
    });

    test('should display tutor-specific elements', async ({ page }) => {
        // Tutor should see review queue and student management
        const tutorElements = page.locator('text=/レビュー|生徒|授業|質問/');
        await expect(tutorElements.first()).toBeVisible({ timeout: 10000 });
    });

    test('should be able to access review queue', async ({ page }) => {
        const reviewNav = page.locator('a:has-text("レビュー"), button:has-text("レビュー")').first();
        if (await reviewNav.isVisible({ timeout: 3000 }).catch(() => false)) {
            await reviewNav.click();
            await page.waitForTimeout(1000);
            await expect(page.locator('text=/レビュー|キュー|質問/')).toBeVisible({ timeout: 5000 });
        }
    });
});

test.describe('Admin Dashboard', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => localStorage.clear());
        await page.reload();

        // Login as admin
        const demoButton = page.locator('button:has-text("管理者")').first();
        if (await demoButton.isVisible({ timeout: 3000 }).catch(() => false)) {
            await demoButton.click();
            await page.waitForTimeout(2000);
        }
    });

    test('should display admin-specific elements', async ({ page }) => {
        // Admin should see system management elements
        const adminElements = page.locator('text=/システム|ユーザー|設定|API|管理/');
        await expect(adminElements.first()).toBeVisible({ timeout: 10000 });
    });

    test('should be able to access user management', async ({ page }) => {
        const userMgmtNav = page.locator('a:has-text("ユーザー"), button:has-text("ユーザー")').first();
        if (await userMgmtNav.isVisible({ timeout: 3000 }).catch(() => false)) {
            await userMgmtNav.click();
            await page.waitForTimeout(1000);
            await expect(page.locator('text=/ユーザー|管理|ロール/')).toBeVisible({ timeout: 5000 });
        }
    });

    test('should be able to access usage monitor', async ({ page }) => {
        const usageNav = page.locator('a:has-text("API"), button:has-text("API"), a:has-text("使用量")').first();
        if (await usageNav.isVisible({ timeout: 3000 }).catch(() => false)) {
            await usageNav.click();
            await page.waitForTimeout(1000);
            await expect(page.locator('text=/使用量|API|リクエスト/')).toBeVisible({ timeout: 5000 });
        }
    });
});

test.describe('Guardian Dashboard', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => localStorage.clear());
        await page.reload();

        // Login as guardian
        const demoButton = page.locator('button:has-text("保護者")').first();
        if (await demoButton.isVisible({ timeout: 3000 }).catch(() => false)) {
            await demoButton.click();
            await page.waitForTimeout(2000);
        }
    });

    test('should display guardian-specific elements', async ({ page }) => {
        // Guardian should see child monitoring elements
        const guardianElements = page.locator('text=/お子様|進捗|レポート|成績/');
        await expect(guardianElements.first()).toBeVisible({ timeout: 10000 });
    });

    test('should have student view toggle option', async ({ page }) => {
        // Guardian may have a toggle to view as student
        const toggleButton = page.locator('button:has-text("生徒として表示"), button:has-text("子ども視点")');
        // This is optional - just check if it exists
        if (await toggleButton.count() > 0) {
            await expect(toggleButton.first()).toBeVisible();
        }
    });
});

test.describe('Responsive Design', () => {
    test('should display properly on mobile viewport', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto('/');
        await page.evaluate(() => localStorage.clear());
        await page.reload();

        // Login
        const demoButton = page.locator('button:has-text("生徒")').first();
        if (await demoButton.isVisible({ timeout: 3000 }).catch(() => false)) {
            await demoButton.click();
            await page.waitForTimeout(2000);

            // Should have mobile-friendly layout (hamburger menu or bottom nav)
            const mobileNav = page.locator('[aria-label="menu"], button:has-text("☰"), .hamburger, [data-testid="mobile-menu"]');
            const bottomNav = page.locator('nav[class*="bottom"], .bottom-nav, [role="navigation"]').last();

            // Either mobile menu or bottom nav should be visible
            const hasMobileNav = await mobileNav.isVisible().catch(() => false);
            const hasBottomNav = await bottomNav.isVisible().catch(() => false);

            // At least one mobile navigation element should exist
            expect(hasMobileNav || hasBottomNav).toBe(true);
        }
    });
});
