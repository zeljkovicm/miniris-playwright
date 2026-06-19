import dotenv from "dotenv";
import path from "path";
import { defineConfig, devices } from '@playwright/test';

dotenv.config({path: path.resolve(__dirname, ".env")});

export default defineConfig({
  globalSetup: "./global-setup.ts",
  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },
  testDir: './tests',
  outputDir: "test-results/",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? "50%" : undefined,
  reporter: [
    ['html', { open: 'on-failure' }],
    process.env.CI ? ['github'] : ['list'],
  ],
  use: {
    headless: !!process.env.CI,
    baseURL: process.env.BASE_URL,
    trace: 'on-first-retry',
    screenshot: "only-on-failure",
    video: "on-first-retry",
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    }
  ],

  webServer: {
    command: "docker compose -f miniris/docker-compose.yml up --build",
    url: `${process.env.BASE_URL}/api/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  },
});
