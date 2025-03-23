import { expect, test } from '@playwright/test';

test('Real-time Task Update', async ({ page, context }) => {
	const page1 = await context.newPage();
	const page2 = await context.newPage();

	await page1.goto('/');
	await page2.goto('/');

	await page1.click('button#add-task');
	await page1.fill('input#title', 'Real-time Task');
	await page1.fill('textarea#description', 'Task Description');
	await page1.click('button#save');

	await expect(page2.locator('text=Real-time Task')).toBeVisible();
});
