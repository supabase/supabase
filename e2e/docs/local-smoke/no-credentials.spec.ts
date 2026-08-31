import { expect, test } from '@playwright/test'

const SUPABASE_URL_ERROR = /supabaseUrl is required/i

function collectPageErrors(page: import('@playwright/test').Page) {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(err.message))
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  return errors
}

test.describe('docs dev runs locally without credentials', () => {
  test('a normal guide page renders and the feedback widget does not crash', async ({ page }) => {
    const errors = collectPageErrors(page)

    const response = await page.goto('/docs/guides/database/postgres/row-level-security')
    expect(response?.ok(), `expected 200, got ${response?.status()}`).toBeTruthy()

    const yesButton = page.getByRole('button', { name: 'Yes', exact: true })
    await expect(yesButton).toBeVisible()
    await yesButton.click()

    expect(errors.some((message) => SUPABASE_URL_ERROR.test(message))).toBeFalsy()
  })

  test('database-advisors page renders (full content or graceful fallback, never a crash)', async ({
    page,
  }) => {
    const response = await page.goto('/docs/guides/database/database-advisors')
    expect(response?.ok(), `expected 200, got ${response?.status()}`).toBeTruthy()

    await expect(
      page.getByRole('heading', { name: 'Performance and Security Advisors' })
    ).toBeVisible()
  })

  test('a troubleshooting article page renders without Supabase credentials', async ({ page }) => {
    const errors = collectPageErrors(page)

    const response = await page.goto('/docs/guides/troubleshooting/rls-simplified-BJTcS8')
    expect(response?.status(), `expected 200, got ${response?.status()}`).toBe(200)

    await expect(page.getByRole('heading', { name: 'RLS Simplified' })).toBeVisible()

    expect(errors.some((message) => SUPABASE_URL_ERROR.test(message))).toBeFalsy()
  })

  test('a federated guide missing locally returns a clean 404, not a crash', async ({ page }) => {
    const response = await page.goto('/docs/guides/graphql')
    expect(response?.status()).toBe(404)
  })

  test('the wrappers overview page renders without GitHub credentials', async ({ page }) => {
    const errors = collectPageErrors(page)

    const response = await page.goto('/docs/guides/database/extensions/wrappers/overview')
    expect(response?.status(), `expected 200, got ${response?.status()}`).toBe(200)

    await expect(page.getByRole('heading', { name: 'Foreign Data Wrappers' })).toBeVisible()

    expect(errors.some((message) => SUPABASE_URL_ERROR.test(message))).toBeFalsy()
  })

  test('a federated wrappers page missing locally returns a clean 404, not a crash', async ({
    page,
  }) => {
    const response = await page.goto('/docs/guides/database/extensions/wrappers/stripe')
    expect(response?.status()).toBe(404)
  })
})
