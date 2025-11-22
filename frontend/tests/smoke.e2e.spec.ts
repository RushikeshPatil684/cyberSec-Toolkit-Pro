import { test, expect } from '@playwright/test';

const baseUrl = process.env.E2E_BASE_URL || 'http://localhost:3000';
const email = process.env.E2E_EMAIL;
const password = process.env.E2E_PASSWORD;

test.describe('CyberSec Toolkit Pro smoke flow', () => {
  test.skip(!email || !password, 'E2E_EMAIL and E2E_PASSWORD env vars are required');

  test('login → run IP tool → reports reflect entry', async ({ page }) => {
    await page.goto(`${baseUrl}/login`);
    await page.fill('input[type="email"]', email!);
    await page.fill('input[type="password"]', password!);
    await page.getByRole('button', { name: /log in/i }).click();

    await page.waitForURL(/tools/, { timeout: 15000 });

    await page.goto(`${baseUrl}/tools`);
    const ipInput = page.getByPlaceholder('8.8.8.8');
    await ipInput.fill('1.1.1.1');
    await page.getByRole('button', { name: /^scan$/i }).first().click();
    await expect(page.getByText(/Scan Result/i)).toBeVisible({ timeout: 20000 });

    await page.getByRole('button', { name: /Save Report/i }).click();
    await expect(page.getByText(/Report saved/i)).toBeVisible({ timeout: 10000 });

    await page.goto(`${baseUrl}/reports`);
    await expect(page.getByText(/Saved output/i)).toBeVisible();
    await expect(page.getByText(/Reports/i)).toBeVisible();
  });
});

