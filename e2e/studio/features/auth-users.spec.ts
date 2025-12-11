import { expect, Page } from '@playwright/test'
import { test } from '../utils/test.js'
import { toUrl } from '../utils/to-url.js'
import { waitForApiResponse } from '../utils/wait-for-response.js'
import { createUserViaUI, deleteUserViaUI, navigateToAuthUsers } from '../utils/auth-helpers.js'

test.describe('auth users list refresh', () => {
  test.beforeEach(async ({ page, ref }) => {
    await navigateToAuthUsers(page, ref)
  })

  test('should automatically refresh users list after creating a user', async ({ page, ref }) => {
    const testEmail = `test-create-${Date.now()}@example.com`
    const testPassword = 'testpassword123'

    // Create user via UI
    await createUserViaUI(page, ref, testEmail, testPassword)

    // Verify the user appears in the table WITHOUT manually refreshing the page
    const userRow = page.getByRole('row').filter({ hasText: testEmail })
    await expect(
      userRow,
      'User should appear in the table immediately after creation without manual refresh'
    ).toBeVisible({ timeout: 10_000 })

    // Verify the user details are correct
    await expect(userRow.getByText(testEmail)).toBeVisible()
    await expect(userRow.getByText('Email')).toBeVisible()

    // Clean up: delete the user
    await deleteUserViaUI(page, ref, testEmail)

    // Verify the user is removed from the table
    await expect
      .poll(async () => {
        return await page.getByRole('row').filter({ hasText: testEmail }).count()
      }, 'User should be removed from the table after deletion')
      .toBe(0)
  })

  test('should automatically refresh users list after creating multiple users', async ({
    page,
    ref,
  }) => {
    const testUsers = [
      { email: `test-multi-1-${Date.now()}@example.com`, password: 'testpassword123' },
      { email: `test-multi-2-${Date.now()}@example.com`, password: 'testpassword123' },
      { email: `test-multi-3-${Date.now()}@example.com`, password: 'testpassword123' },
    ]

    // Create multiple users
    for (const user of testUsers) {
      await createUserViaUI(page, ref, user.email, user.password)

      // Verify each user appears in the table
      await expect(
        page.getByRole('row').filter({ hasText: user.email }),
        `User ${user.email} should appear in the table after creation`
      ).toBeVisible()
    }

    // Clean up: delete all test users
    for (const user of testUsers) {
      await deleteUserViaUI(page, ref, user.email)

      // Verify each user is removed
      await expect
        .poll(async () => {
          return await page.getByRole('row').filter({ hasText: user.email }).count()
        }, `User ${user.email} should be removed from the table after deletion`)
        .toBe(0)
    }
  })
})
