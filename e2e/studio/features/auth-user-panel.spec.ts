import { expect } from '@playwright/test'

import { createUserViaUI, deleteUserViaUI, navigateToAuthUsers } from '../utils/auth-helpers.js'
import { expectClipboardValue } from '../utils/clipboard.js'
import { test } from '../utils/test.js'

test('user details support copying fields and raw JSON with mouse and keyboard', async ({
  page,
  ref,
}) => {
  const email = `test-user-panel-${Date.now()}@example.com`
  await navigateToAuthUsers(page, ref)
  await createUserViaUI(page, ref, email, 'testpassword123')

  try {
    await page.getByRole('row').filter({ hasText: email }).getByText(email, { exact: true }).click()
    const overview = page.getByRole('tabpanel', { name: 'Overview' })
    const emailField = overview.getByRole('button', { name: `Email ${email}`, exact: true })
    await expect(emailField, 'User overview should show a copyable email field').toBeVisible()
    await emailField.focus()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('menuitem', { name: /Copy/ })).toBeVisible()
    await page.getByRole('menuitem', { name: /Copy/ }).press('Enter')
    await expectClipboardValue({ page, value: email })
    await emailField.click()
    await page.getByRole('menuitem', { name: /Copy/ }).click()
    await expectClipboardValue({ page, value: email })

    await page.getByRole('tab', { name: 'Raw JSON' }).focus()
    await page.keyboard.press('Enter')
    const rawPanel = page.getByRole('tabpanel', { name: 'Raw JSON' })
    await expect(rawPanel, 'Raw JSON should include the selected user').toContainText(email)
    const json = await rawPanel.locator('code').innerText()
    await rawPanel.getByRole('button', { name: 'Copy user as JSON' }).click()
    await expectClipboardValue({ page, value: json })
    await page.keyboard.press('Escape')
    await expect(rawPanel, 'Escape should close the user details panel').not.toBeVisible()
  } finally {
    await navigateToAuthUsers(page, ref)
    await deleteUserViaUI(page, ref, email)
  }
})
