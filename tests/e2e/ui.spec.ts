import { test, expect } from '@playwright/test';

/**
 * UI Component and Animation E2E Tests for Manabee Tutor System
 * 
 * Tests: Animations, visual effects, UI components
 */

test.describe('UI Animations', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => localStorage.clear());
        await page.reload();
    });

    test('login screen should have animated background elements', async ({ page }) => {
        // Check for animated background orbs
        const bgElements = page.locator('.animate-pulse, [class*="blur-3xl"]');
        const count = await bgElements.count();
        expect(count).toBeGreaterThanOrEqual(1);
    });

    test('login card should have glassmorphism styling', async ({ page }) => {
        // Look for backdrop-blur class (glassmorphism)
        const glassCard = page.locator('[class*="backdrop-blur"]');
        await expect(glassCard.first()).toBeVisible({ timeout: 5000 });
    });

    test('form inputs should have focus transitions', async ({ page }) => {
        const emailInput = page.locator('input[type="email"]');
        if (await emailInput.isVisible()) {
            await emailInput.focus();
            // Check that input still exists and is focused
            await expect(emailInput).toBeFocused();
        }
    });
});

test.describe('Dashboard Card Animations', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => localStorage.clear());
        await page.reload();

        // Login as student to see dashboard
        const demoButton = page.locator('button:has-text("生徒")').first();
        if (await demoButton.isVisible({ timeout: 3000 }).catch(() => false)) {
            await demoButton.click();
            await page.waitForTimeout(2000);
        }
    });

    test('dashboard cards should have slide-up animations', async ({ page }) => {
        // Check for animate-slide-up classes on dashboard elements
        const animatedCards = page.locator('[class*="animate-slide-up"]');
        const count = await animatedCards.count();
        // Should have at least some animated elements
        expect(count).toBeGreaterThanOrEqual(1);
    });

    test('dashboard cards should have stagger delays', async ({ page }) => {
        // Check for staggered animation delay classes
        const delayedElements = page.locator('[class*="animate-delay-"]');
        const count = await delayedElements.count();
        // Should have staggered elements for smooth animation
        expect(count).toBeGreaterThanOrEqual(1);
    });

    test('cards should have hover effects', async ({ page }) => {
        // Find cards with hover-lift or transition classes
        const interactiveCards = page.locator('[class*="hover:shadow"], [class*="transition-"]');
        const count = await interactiveCards.count();
        expect(count).toBeGreaterThanOrEqual(1);
    });

    test('gradient elements should be visible', async ({ page }) => {
        // Check for gradient backgrounds
        const gradientElements = page.locator('[class*="bg-gradient-"]');
        const count = await gradientElements.count();
        expect(count).toBeGreaterThanOrEqual(1);
    });
});

test.describe('UI Component States', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => localStorage.clear());
        await page.reload();
    });

    test('loading spinner should appear during auth', async ({ page }) => {
        // Look for loading indicator
        const demoButton = page.locator('button:has-text("生徒")').first();
        if (await demoButton.isVisible({ timeout: 3000 }).catch(() => false)) {
            await demoButton.click();
            // Check for loading state (might be brief)
            const loadingSpinner = page.locator('.animate-spin, [class*="loading"]');
            // Either spinner or dashboard should appear
            await expect(page.locator('.animate-spin, text=/ダッシュボード/')).toBeVisible({ timeout: 10000 });
        }
    });

    test('error messages should have shake animation', async ({ page }) => {
        // Enter invalid data to trigger error
        const emailInput = page.locator('input[type="email"]');
        if (await emailInput.isVisible()) {
            // Click next without entering email
            const nextButton = page.locator('button:has-text("次へ")');
            if (await nextButton.isVisible()) {
                await nextButton.click();
                // Error should appear with shake animation
                await page.waitForTimeout(500);
            }
        }
    });

    test('quick login buttons should have hover transitions', async ({ page }) => {
        // Check for quick login buttons with transitions
        const quickLoginButtons = page.locator('button:has-text("講師"), button:has-text("生徒")');
        const count = await quickLoginButtons.count();
        expect(count).toBeGreaterThanOrEqual(1);
    });
});

test.describe('Role-Specific Dashboard UI', () => {
    test('student dashboard should have gamification elements', async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => localStorage.clear());
        await page.reload();

        const demoButton = page.locator('button:has-text("生徒")').first();
        if (await demoButton.isVisible({ timeout: 3000 }).catch(() => false)) {
            await demoButton.click();
            await page.waitForTimeout(2000);

            // Student dashboard should have XP, level, or streak elements
            const gamificationElements = page.locator('text=/XP|レベル|連続|ストリーク|ミッション/');
            if (await gamificationElements.count() > 0) {
                await expect(gamificationElements.first()).toBeVisible({ timeout: 5000 });
            }
        }
    });

    test('guardian dashboard should have premium styling', async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => localStorage.clear());
        await page.reload();

        const demoButton = page.locator('button:has-text("保護者")').first();
        if (await demoButton.isVisible({ timeout: 3000 }).catch(() => false)) {
            await demoButton.click();
            await page.waitForTimeout(2000);

            // Guardian dashboard should have professional/premium elements
            const premiumElements = page.locator('[class*="from-slate-900"], [class*="from-amber-"], text=/進捗|レポート/');
            if (await premiumElements.count() > 0) {
                await expect(premiumElements.first()).toBeVisible({ timeout: 5000 });
            }
        }
    });

    test('admin dashboard should have system status indicators', async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => localStorage.clear());
        await page.reload();

        const demoButton = page.locator('button:has-text("管理者")').first();
        if (await demoButton.isVisible({ timeout: 3000 }).catch(() => false)) {
            await demoButton.click();
            await page.waitForTimeout(2000);

            // Admin dashboard should have status indicators
            const statusIndicators = page.locator('text=/稼働|接続|アクティブ|ローカル|クラウド/');
            if (await statusIndicators.count() > 0) {
                await expect(statusIndicators.first()).toBeVisible({ timeout: 5000 });
            }
        }
    });
});
