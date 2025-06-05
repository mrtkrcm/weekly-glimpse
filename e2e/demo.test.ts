import { expect, test } from '@playwright/test';

test('login page is accessible', async ({ page, browserName }) => {
	// Use explicit base URL
	const baseURL = 'http://localhost:4174';
	console.log(`Running test in ${browserName}`);
	console.log('Navigating to:', baseURL);

	// Function to attempt navigation with retries
	async function attemptNavigation(maxRetries = 3) {
		for (let attempt = 1; attempt <= maxRetries; attempt++) {
			try {
				// For Firefox, always go directly to the login page
				if (browserName === 'firefox') {
					await page.goto(baseURL + '/demo/lucia/login', {
						waitUntil: 'networkidle',
						timeout: 30000
					});
				} else {
					await page.goto(baseURL, {
						waitUntil: 'networkidle',
						timeout: 30000
					});
				}
				console.log(`Page loaded on attempt ${attempt}, waiting for network idle`);

				// Wait for all network requests to complete and page to be stable
				await page.waitForLoadState('networkidle', { timeout: 30000 });
				await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
				await page.waitForLoadState('load', { timeout: 30000 });

				// Add more debugging information
				console.log('Current URL:', page.url());
				console.log('Page title:', await page.title());
				console.log('Page status:', await page.evaluate(() => document.readyState));
				console.log('Document URL:', await page.evaluate(() => document.URL));

				// If we're not on the login page and not using Firefox, try navigating there directly
				const url = page.url();
				if (!url.includes('/demo/lucia/login') && browserName !== 'firefox') {
					console.log('Not on login page, navigating directly...');
					await page.goto(baseURL + '/demo/lucia/login', {
						waitUntil: 'networkidle',
						timeout: 30000
					});
					console.log('Current URL after redirect:', page.url());
				}

				// Wait for the page to be fully rendered
				await page.waitForTimeout(3000);

				// Try to find the h1 element
				const h1Element = page.locator('h1:has-text("Login/Register")');
				const isVisible = await h1Element.isVisible();

				if (isVisible) {
					console.log('Successfully found h1 element');
					return true;
				}

				console.log(`Attempt ${attempt}: h1 element not visible yet`);

				if (attempt === maxRetries) {
					// On last attempt, log detailed debugging information
					console.log('Page content on final attempt:', await page.content());
					console.log(
						'HTML structure:',
						await page.evaluate(() => document.documentElement.outerHTML)
					);
					console.log(
						'All h1 elements:',
						await page.evaluate(() =>
							Array.from(document.querySelectorAll('h1')).map((el) => el.outerHTML)
						)
					);
				}
			} catch (error) {
				console.log(`Attempt ${attempt} failed:`, error.message);
				if (attempt === maxRetries) throw error;
				await page.waitForTimeout(2000 * attempt); // Exponential backoff
			}
		}
		return false;
	}

	// Attempt navigation with retries
	await attemptNavigation();

	// Verify login page content with longer timeouts and more specific selectors
	await expect(page.locator('h1:has-text("Login/Register")')).toBeVisible({ timeout: 30000 });
	await expect(page.locator('form[action="?/login"]')).toBeVisible({ timeout: 30000 });
	await expect(page.locator('button:has-text("Login")')).toBeVisible({ timeout: 30000 });
	await expect(page.locator('button:has-text("Register")')).toBeVisible({ timeout: 30000 });
});
