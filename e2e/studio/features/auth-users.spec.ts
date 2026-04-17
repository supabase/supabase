import { expect, Page } from '@playwright/test'

import { createUserViaUI, deleteUserViaUI, navigateToAuthUsers } from '../utils/auth-helpers.js'
import { test } from '../utils/test.js'
import { toUrl } from '../utils/to-url.js'
import { waitForApiResponse } from '../utils/wait-for-response.js'

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

test('should show web3 users as enabled when the matching web3 provider is enabled', async ({
  page,
  ref,
}) => {
  test.skip(
    process.env.IS_PLATFORM !== 'true',
    'Provider enabled status is only resolved in platform mode'
  )

  const userId = '11111111-1111-4111-8111-111111111111'

  await page.route('**/platform/pg-meta/*/query**', async (route) => {
    const key = new URL(route.request().url()).searchParams.get('key')
    if (key !== `user-${userId}`) return route.continue()

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: userId,
          email: 'web3-user@example.com',
          phone: null,
          role: 'authenticated',
          aud: 'authenticated',
          created_at: '2025-10-15T10:00:00.000Z',
          updated_at: '2025-10-15T10:05:00.000Z',
          confirmed_at: '2025-10-15T10:01:00.000Z',
          invited_at: null,
          confirmation_sent_at: null,
          last_sign_in_at: '2025-10-15T10:06:00.000Z',
          banned_until: null,
          is_sso_user: false,
          is_anonymous: false,
          providers: ['web3'],
          raw_app_meta_data: {
            provider: 'web3',
            providers: ['web3'],
          },
          raw_user_meta_data: {
            custom_claims: {
              chain: 'solana',
            },
          },
          user_metadata: {},
        },
      ]),
    })
  })

  await page.route('**/platform/auth/*/config**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        EXTERNAL_WEB3_SOLANA_ENABLED: true,
        INDEX_WORKER_ENSURE_USER_SEARCH_INDEXES_EXIST: false,
        MAILER_OTP_EXP: 0,
      }),
    })
  })

  await page.goto(toUrl(`/project/${ref}/auth/users?show=${userId}`))

  const providerRow = page
    .getByRole('link', { name: 'Configure web3 provider' })
    .locator("xpath=ancestor::div[contains(@class, 'bg-surface-100')][1]")

  await expect(providerRow).toContainText('Enabled')
  await expect(providerRow).not.toContainText('Disabled')
})
