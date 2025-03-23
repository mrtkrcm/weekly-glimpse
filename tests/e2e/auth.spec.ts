import { expect, test } from '@playwright/test';

test('Successful Login', async ({ page }) => {
	await page.goto('/lucia');
	await page.fill('input#email', 'testuser@example.com');
	await page.fill('input#password', 'testpassword');
	await page.click('button[type="submit"]');
	await expect(page).toHaveURL('/');
});

test('Failed Login (Invalid Credentials)', async ({ page }) => {
	await page.goto('/lucia');
	await page.fill('input#email', 'invalid@example.com');
	await page.fill('input#password', 'invalidpassword');
	await page.click('button[type="submit"]');
	await expect(page.locator('p')).toHaveText('Invalid credentials');
});

test('Failed Login (Non-existent User)', async ({ page }) => {
	await page.goto('/lucia');
	await page.fill('input#email', 'nonexistent@example.com');
	await page.fill('input#password', 'password');
	await page.click('button[type="submit"]');
	await expect(page.locator('p')).toHaveText('Invalid credentials');
});

test('Logout', async ({ page }) => {
	await page.goto('/');
	await page.click('button#logout');
	await expect(page).toHaveURL('/lucia');
});
