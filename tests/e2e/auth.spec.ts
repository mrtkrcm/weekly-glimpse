import { expect, test } from '@playwright/test';

test('Login Flow', async ({ page, context }) => {
  await test.step('Successful Login', async () => {
    await page.goto('/lucia');
    await page.fill('input#email', 'testuser@example.com');
    await page.fill('input#password', 'testpassword');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/');

    const cookies = await context.cookies();
    const sessionCookie = cookies.find(cookie => cookie.name === 'auth_session');
    expect(sessionCookie).toBeDefined();
    expect(sessionCookie?.httpOnly).toBe(true);
    expect(sessionCookie?.sameSite).toBe('lax');
    expect(sessionCookie?.path).toBe('/');
  });

  await test.step('Failed Login (Invalid Credentials)', async () => {
    await page.goto('/lucia');
    await page.fill('input#email', 'invalid@example.com');
    await page.fill('input#password', 'invalidpassword');
    await page.click('button[type="submit"]');
    await expect(page.locator('p')).toHaveText('Invalid credentials');

    const cookies = await context.cookies();
    const sessionCookie = cookies.find(cookie => cookie.name === 'auth_session');
    expect(sessionCookie).toBeUndefined();
  });

  await test.step('Failed Login (Non-existent User)', async () => {
    await page.goto('/lucia');
    await page.fill('input#email', 'nonexistent@example.com');
    await page.fill('input#password', 'password');
    await page.click('button[type="submit"]');
    await expect(page.locator('p')).toHaveText('Invalid credentials');

    const cookies = await context.cookies();
    const sessionCookie = cookies.find(cookie => cookie.name === 'auth_session');
    expect(sessionCookie).toBeUndefined();
  });
});

test('Session Management', async ({ page, context }) => {
  await test.step('Session Persistence', async () => {
    // Login
    await page.goto('/lucia');
    await page.fill('input#email', 'testuser@example.com');
    await page.fill('input#password', 'testpassword');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/');

    // Get initial cookie
    const initialCookies = await context.cookies();
    const initialSession = initialCookies.find(cookie => cookie.name === 'auth_session');
    expect(initialSession).toBeDefined();

    // Navigate to trigger session validation
    await page.reload();
    await expect(page).toHaveURL('/');

    // Session should be maintained
    const newCookies = await context.cookies();
    const newSession = newCookies.find(cookie => cookie.name === 'auth_session');
    expect(newSession).toBeDefined();
    expect(newSession?.value).toBe(initialSession?.value);
  });

  await test.step('Logout', async () => {
    await page.goto('/');
    await page.click('button#logout');
    await expect(page).toHaveURL('/lucia');

    const cookies = await context.cookies();
    const sessionCookie = cookies.find(cookie => cookie.name === 'auth_session');
    expect(sessionCookie).toBeUndefined();
  });

  await test.step('Protected Route Access After Logout', async () => {
    await page.goto('/');
    await expect(page).toHaveURL('/lucia');
  });
});
