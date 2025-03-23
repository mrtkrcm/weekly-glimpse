import { expect, test } from '@playwright/test';

test('Create Task', async ({ page }) => {
	await page.goto('/');
	await page.click('button#add-task');
	await page.fill('input#title', 'New Task');
	await page.fill('textarea#description', 'Task Description');
	await page.click('button#save');
	await expect(page.locator('text=New Task')).toBeVisible();
});

test('Update Task', async ({ page }) => {
	await page.goto('/');
	await page.click('text=New Task');
	await page.fill('input#title', 'Updated Task');
	await page.click('button#save');
	await expect(page.locator('text=Updated Task')).toBeVisible();
});

test('Delete Task', async ({ page }) => {
	await page.goto('/');
	await page.click('text=Updated Task');
	await page.click('button#delete');
	await expect(page.locator('text=Updated Task')).not.toBeVisible();
});

test('Drag and Drop', async ({ page }) => {
	await page.goto('/');
	const task = page.locator('text=New Task');
	const target = page.locator('text=Mon');
	await task.dragTo(target);
	await expect(target.locator('text=New Task')).toBeVisible();
});

test('Task Persistence Across Page Refreshes', async ({ page }) => {
	await page.goto('/');
	await expect(page.locator('text=New Task')).toBeVisible();
});
