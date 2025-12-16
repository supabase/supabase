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

    // Create user via UI - this verifies the user appears in the table
    await createUserViaUI(page, ref, testEmail, testPassword)

    // Verify the user details are correct
    const userRow = page.getByRole('row').filter({ hasText: testEmail })
    await expect(userRow.getByText(testEmail)).toBeVisible()
    await expect(userRow.getByText('Email')).toBeVisible()

    // Clean up: delete the user - this verifies the user is removed from the table
    await deleteUserViaUI(page, ref, testEmail)
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

    // Create multiple users - each creation verifies the user appears in the table
    for (const user of testUsers) {
      await createUserViaUI(page, ref, user.email, user.password)
    }

    // Clean up: delete all test users - each deletion verifies the user is removed
    for (const user of testUsers) {
      await deleteUserViaUI(page, ref, user.email)
    }
  })
})
