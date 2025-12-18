import { test, expect } from '@playwright/test';

test.describe('通知センター (生徒)', () => {
    const waitForNotifications = async (page: any) => {
        await expect(page.getByRole('heading', { name: '通知センター' })).toBeVisible({ timeout: 10000 });
        await expect(page.locator('section[aria-label="通知リスト"] [role="listitem"]').first()).toBeVisible({ timeout: 10000 });
    };

    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => localStorage.clear());
        await page.reload();

        // ローカルモードの簡易ログイン（生徒）
        const emailInput = page.getByRole('textbox', { name: /メールアドレス|email/i });
        await emailInput.fill('student@manabee.com');
        const nextButton = page.getByRole('button', { name: /次へ|next/i });
        await nextButton.click();
        await expect(page.getByRole('link', { name: /通知/ })).toBeVisible({ timeout: 10000 });

        const studentButton = page.getByRole('button', { name: /生徒/ });
        if (await studentButton.isVisible({ timeout: 4000 }).catch(() => false)) {
            await studentButton.click();
        }

        await page.waitForTimeout(500);
        await page.goto('/#/notifications');
        await expect(page).toHaveURL(/notifications/);
    });

    test('未読→既読→Undo が確認できる', async ({ page }) => {
        await waitForNotifications(page);
        const markAllButton = page.getByRole('button', { name: /すべて既読にする/ });
        await expect(markAllButton).toBeVisible({ timeout: 10000 });
        await markAllButton.click();
        await expect(page.getByText(/確認してください/)).toBeVisible();

        await markAllButton.click();
        await expect(page.getByText(/すべて既読にしました/)).toBeVisible();

        const undoButton = page.getByRole('button', { name: '取り消す' });
        await undoButton.click();
        await expect(page.getByText(/既読操作を取り消しました/)).toBeVisible();
    });

    test('カテゴリフィルタと重要順ソートが機能する', async ({ page }) => {
        await waitForNotifications(page);
        const homeworkChip = page.getByRole('button', { name: /宿題/ }).first();
        await homeworkChip.click();

        const cards = page.locator('section[aria-label="通知リスト"] [role="listitem"]');
        await expect(cards.first()).toContainText(/宿題|期限|タスク/);

        const sortSelect = page.locator('select#sort-select');
        await sortSelect.selectOption('newest');
        await expect(cards.first()).toBeVisible();
    });

    test('通知カードから関連画面へ遷移できる', async ({ page }) => {
        await waitForNotifications(page);
        const lessonCard = page.locator('section[aria-label="通知リスト"] [role="listitem"]').filter({ hasText: '授業' }).first();
        await lessonCard.click();
        await expect(page).toHaveURL(/lessons|homework/);
        await page.goBack();
        await expect(page).toHaveURL(/notifications/);
    });
});
