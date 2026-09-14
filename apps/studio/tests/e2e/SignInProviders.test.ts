import { test, expect } from '@playwright/test'

test.describe('Sign In / Providers Page', () => {
    test('should render correctly in self-hosted environments', async ({ page }) => {
        await page.goto('/project/test-project/auth/providers')

        await expect(page.locator('text=Sign In / Providers')).toBeVisible()
        await expect(
            page.locator('text=Configure authentication providers and login methods for your users')
        ).toBeVisible()
    })
})