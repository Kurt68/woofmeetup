import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright config for running tests against existing servers
 * Use when servers are already running (for faster iteration)
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { outputFolder: 'test-results/html-report' }], ['line']],
  use: {
    baseURL:
      process.env.NODE_ENV === 'production'
        ? 'http://localhost:8000'
        : 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // No webServer - assumes servers are already running
})
