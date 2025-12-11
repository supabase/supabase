import { expect, Page } from '@playwright/test'
import { waitForApiResponse } from './wait-for-response.js'
import { dismissToastsIfAny } from './dismiss-toast.js'
import { toUrl } from './to-url.js'

export const createUserViaUI = async (page: Page, ref: string, email: string, password: string) => {
  await dismissToastsIfAny(page)

  // Open the Add user dropdown
  await page.getByRole('button', { name: 'Add user' }).click()

  // Click "Create new user"
  await page.getByRole('menuitem', { name: 'Create new user' }).click()

  // Wait for dialog to be visible
  await expect(page.getByRole('dialog', { name: 'Create a new user' })).toBeVisible()

  // Fill in email
  await page.getByRole('textbox', { name: 'user@example.com' }).fill(email)

  // Fill in password
  await page.getByRole('textbox', { name: '••••••••' }).fill(password)

  // Verify that "Auto Confirm User?" is checked by default
  await expect(page.getByRole('checkbox', { name: 'Auto Confirm User?' })).toBeChecked()

  // Set up API waiters BEFORE clicking the button to avoid race conditions
  const createUserPromise = waitForApiResponse(page, 'platform/auth', ref, 'users', {
    method: 'POST',
  })
  const usersListPromise = waitForApiResponse(page, 'platform/pg-meta', ref, 'query?key=')

  // Click "Create user"
  await page.getByRole('button', { name: 'Create user' }).click()

  // Wait for both API calls to complete
  await Promise.all([createUserPromise, usersListPromise])

  // Wait for success toast
  await expect(
    page.getByText(`Successfully created user: ${email}`),
    'Success toast should be visible after user creation'
  ).toBeVisible({ timeout: 10_000 })
}

export const deleteUserViaUI = async (page: Page, ref: string, email: string) => {
  await dismissToastsIfAny(page)

  // Find the user row by email and click the checkbox
  const userRow = page.getByRole('row').filter({ hasText: email })
  await expect(userRow, `User row with email ${email} should be visible`).toBeVisible()

  // Click the checkbox to select the user
  await userRow.getByRole('checkbox').first().click()

  // Click "Delete 1 users" button
  await page.getByRole('button', { name: 'Delete 1 users' }).click()

  // Wait for confirmation dialog
  await expect(page.getByRole('dialog', { name: 'Confirm to delete 1 user' })).toBeVisible()

  // Set up API waiters BEFORE clicking the delete button
  const deleteUserPromise = waitForApiResponse(page, 'platform/auth', ref, 'users/', {
    method: 'DELETE',
  })
  const usersListPromise = waitForApiResponse(page, 'platform/pg-meta', ref, 'query?key=')

  // Confirm deletion
  await page.getByRole('button', { name: 'Delete' }).click()

  // Wait for both API calls to complete
  await Promise.all([deleteUserPromise, usersListPromise])

  // Wait for success toast
  await expect(
    page.getByText('Successfully deleted the selected 1 user'),
    'Success toast should be visible after user deletion'
  ).toBeVisible({ timeout: 10_000 })
}

export const navigateToAuthUsers = async (page: Page, ref: string) => {
  await page.goto(toUrl(`/project/${ref}/auth/users`))

  // Wait for the page to load by checking for the "Users" heading
  await expect(page.getByRole('heading', { name: 'Users', level: 3 })).toBeVisible()

  // Wait for initial users list to load
  await waitForApiResponse(page, 'platform/pg-meta', ref, 'query?key=')
}
