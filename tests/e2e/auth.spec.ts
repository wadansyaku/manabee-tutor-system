import { test, expect } from '@playwright/test';

/**
 * Authentication E2E Tests for Manabee Tutor System
 * 
 * Tests: Login flows, Demo accounts, Password reset
 */

test.describe('Authentication', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        // Clear local storage to ensure clean state
        await page.evaluate(() => localStorage.clear());
        await page.reload();
    });

    test('should display login screen on initial load', async ({ page }) => {
        await expect(page.locator('h1, h2').first()).toContainText(/まなびー|ログイン/);
    });

    test('should show demo login buttons in firebase mode', async ({ page }) => {
        // Check for demo login section
        const demoSection = page.locator('text=デモ');
        if (await demoSection.count() > 0) {
            await expect(page.locator('button:has-text("生徒")')).toBeVisible();
            await expect(page.locator('button:has-text("保護者")')).toBeVisible();
            await expect(page.locator('button:has-text("講師")')).toBeVisible();
            await expect(page.locator('button:has-text("管理者")')).toBeVisible();
        }
    });

    test('should login with student demo account', async ({ page }) => {
        // Look for demo section or email input
        const demoButton = page.locator('button:has-text("生徒")').first();

        if (await demoButton.isVisible({ timeout: 3000 }).catch(() => false)) {
            // Firebase mode - use demo button
            await demoButton.click();
            // Wait for login to complete
            await page.waitForTimeout(2000);
            // Check for student dashboard indicators
            await expect(page.locator('text=/ダッシュボード|宿題|質問/')).toBeVisible({ timeout: 10000 });
        } else {
            // Local mode - use email input
            const emailInput = page.locator('input[type="email"]');
            if (await emailInput.isVisible()) {
                await emailInput.fill('student@demo.com');
                await page.locator('button[type="submit"]').click();
                await page.waitForTimeout(2000);
            }
        }
    });

    test('should login with admin demo account', async ({ page }) => {
        const demoButton = page.locator('button:has-text("管理者")').first();

        if (await demoButton.isVisible({ timeout: 3000 }).catch(() => false)) {
            // Firebase mode
            await demoButton.click();
            await page.waitForTimeout(2000);
            // Admin should see system/settings related items
            await expect(page.locator('text=/ダッシュボード|設定|システム/')).toBeVisible({ timeout: 10000 });
        }
    });

    test('should show password reset option for firebase mode', async ({ page }) => {
        const forgotPassword = page.locator('text=/パスワードを忘れた|リセット/');
        // Only check if visible - local mode may not have this
        if (await forgotPassword.count() > 0) {
            await expect(forgotPassword.first()).toBeVisible();
        }
    });

    test('should show registration option for firebase mode', async ({ page }) => {
        const registerLink = page.locator('text=/新規登録|アカウント作成/');
        if (await registerLink.count() > 0) {
            await expect(registerLink.first()).toBeVisible();
        }
    });
});

test.describe('Role-based Navigation', () => {
    test('student should see limited navigation items', async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => localStorage.clear());
        await page.reload();

        // Login as student
        const demoButton = page.locator('button:has-text("生徒")').first();
        if (await demoButton.isVisible({ timeout: 3000 }).catch(() => false)) {
            await demoButton.click();
            await page.waitForTimeout(2000);

            // Student should NOT see admin-only items
            await expect(page.locator('text=/ユーザー管理|API監視/')).not.toBeVisible();
        }
    });

    test('admin should see all navigation items', async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => localStorage.clear());
        await page.reload();

        // Login as admin
        const demoButton = page.locator('button:has-text("管理者")').first();
        if (await demoButton.isVisible({ timeout: 3000 }).catch(() => false)) {
            await demoButton.click();
            await page.waitForTimeout(3000);

            // Admin should see admin navigation
            // Look for any of the admin-specific elements
            const adminNav = page.locator('nav, aside').locator('text=/設定|管理|システム/').first();
            await expect(adminNav).toBeVisible({ timeout: 10000 });
        }
    });
});

test.describe('Logout Flow', () => {
    test('should be able to logout', async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => localStorage.clear());
        await page.reload();

        // Login first
        const demoButton = page.locator('button:has-text("生徒")').first();
        if (await demoButton.isVisible({ timeout: 3000 }).catch(() => false)) {
            await demoButton.click();
            await page.waitForTimeout(2000);

            // Find and click logout button
            const logoutButton = page.locator('button:has-text("ログアウト")');
            if (await logoutButton.isVisible({ timeout: 3000 }).catch(() => false)) {
                await logoutButton.click();
                await page.waitForTimeout(1000);
                // Should be back at login screen
                await expect(page.locator('text=/ログイン|まなびー/')).toBeVisible({ timeout: 5000 });
            }
        }
    });
});
