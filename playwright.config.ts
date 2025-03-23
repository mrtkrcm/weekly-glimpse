import { defineConfig, devices } from '@playwright/test';
import * as path from 'path';
import { config } from './src/lib/config';

export default defineConfig({
	testDir: './e2e',
	webServer: {
		command: 'npm run build && npm run preview',
		port: config.test.port,
		reuseExistingServer: !process.env.CI
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
		baseURL: config.test.baseUrl,
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
			name: 'firefox',
			use: { ...devices['Desktop Firefox'] }
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
