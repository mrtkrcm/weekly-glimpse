import { defineConfig, devices } from '@playwright/test';
import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config();

const testPort = 4174;
const testBaseUrl = `http://localhost:${testPort}`;

export default defineConfig({
	testDir: './e2e',
	webServer: {
		command: 'pnpm run build && npm run test:preview',
		port: testPort,
		reuseExistingServer: !process.env.CI,
		stdout: 'pipe',
		stderr: 'pipe',
		env: {
			DATABASE_URL: 'postgres://postgres:mysecretpassword@localhost:5432/weekly_glimpse',
			NODE_ENV: 'development',
			GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
			GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
			SENTRY_DSN: process.env.SENTRY_DSN
		}
	},
	outputDir: 'test-results/',
	timeout: 30000,
	expect: {
		timeout: 5000
	},
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: process.env.CI ? [['html', { outputFolder: 'playwright-report' }], ['list']] : 'list',
	use: {
		baseURL: testBaseUrl,
		trace: 'on-first-retry',
		screenshot: 'only-on-failure',
		video: 'retain-on-failure',
		testIdAttribute: 'data-testid'
	},
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] }
		},
		{
			name: 'webkit',
			use: { ...devices['Desktop Safari'] }
		},
		{
			name: 'Mobile Chrome',
			use: { ...devices['Pixel 5'] }
		},
		{
			name: 'Mobile Safari',
			use: { ...devices['iPhone 12'] }
		}
	],
	globalSetup: path.resolve('e2e/global-setup.ts'),
	globalTeardown: path.resolve('e2e/global-teardown.ts')
});
