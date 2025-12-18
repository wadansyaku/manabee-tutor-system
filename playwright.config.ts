import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Test Configuration for Manabee Tutor System
 * 
 * Run: npx playwright test
 * Debug: npx playwright test --debug
 * With existing server: SKIP_WEBSERVER=1 npx playwright test
 */
const serverPort = Number(process.env.E2E_DEV_PORT || 3001);
const baseURL = `http://localhost:${serverPort}`;
const webServerCommand = `VITE_APP_MODE=local npm run dev -- --host --clearScreen false`;

export default defineConfig({
    testDir: './tests/e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: 'html',
    timeout: 30000,
    use: {
        baseURL,
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
    },

    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
        {
            name: 'Mobile Chrome',
            use: { ...devices['Pixel 5'] },
        },
    ],

    // Only start webServer if not skipped and not already running
    webServer: process.env.SKIP_WEBSERVER ? undefined : {
        command: webServerCommand,
        url: baseURL,
        reuseExistingServer: true,
        timeout: 30 * 1000,
    },
});
