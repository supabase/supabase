import { expect } from '@playwright/test'

import { test } from '../utils/test.js'
import { toUrl } from '../utils/to-url.js'

test.describe('Connect', async () => {
  test('ConnectSheet opens when showConnect=true query param is present', async ({ page, ref }) => {
    // Navigate to project page with showConnect=true query param
    await page.goto(toUrl(`/project/${ref}?showConnect=true`))

    // Check that the ConnectSheet is visible
    await expect(page.getByRole('heading', { name: 'Connect to your project' })).toBeVisible({
      timeout: 30000,
    })
  })

  test('ConnectSheet closes when dismissed', async ({ page, ref }) => {
    // Navigate to project page with showConnect=true query param
    await page.goto(toUrl(`/project/${ref}?showConnect=true`))

    // Wait for the ConnectSheet to be visible
    await expect(page.getByRole('heading', { name: 'Connect to your project' })).toBeVisible({
      timeout: 30000,
    })

    // Close the sheet by pressing Escape
    await page.keyboard.press('Escape')

    // Verify the sheet is no longer visible
    await expect(page.getByRole('heading', { name: 'Connect to your project' })).not.toBeVisible({
      timeout: 10000,
    })

    // Verify the query param is removed from the URL
    await expect(page).not.toHaveURL(/showConnect=true/)
  })

  test('Connect button in header opens the ConnectSheet', async ({ page, ref }) => {
    // Navigate to project page without the query param
    await page.goto(toUrl(`/project/${ref}`))

    // Wait for the page to load
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 30000 })

    // Click the Connect button in the header
    await page.getByRole('button', { name: 'Connect' }).click()

    // Verify the ConnectSheet opens
    await expect(page.getByRole('heading', { name: 'Connect to your project' })).toBeVisible({
      timeout: 30000,
    })

    // Verify the URL has the showConnect query param
    await expect(page).toHaveURL(/showConnect=true/)
  })
})

test.describe('Connect Sheet deep linking', async () => {
  test('pre-selects framework and variant from URL params', async ({ page, ref }) => {
    await page.goto(
      toUrl(
        `/project/${ref}?showConnect=true&connectTab=framework&framework=nextjs&using=pages`
      )
    )

    await expect(
      page.getByRole('heading', { name: 'Connect to your project' }),
      'ConnectSheet should open from deep link'
    ).toBeVisible({ timeout: 30000 })

    await expect(
      page.getByRole('combobox').filter({ hasText: 'Next.js' }),
      'Framework select should show Next.js'
    ).toBeVisible()

    await expect(
      page.getByRole('combobox').filter({ hasText: 'Pages Router' }),
      'Variant select should show Pages Router'
    ).toBeVisible()
  })

  test('supports legacy frameworks tab alias', async ({ page, ref }) => {
    await page.goto(
      toUrl(`/project/${ref}?showConnect=true&connectTab=frameworks&framework=nextjs`)
    )

    await expect(
      page.getByRole('heading', { name: 'Connect to your project' }),
      'ConnectSheet should open with legacy tab alias'
    ).toBeVisible({ timeout: 30000 })

    await expect(
      page.getByRole('combobox').filter({ hasText: 'Next.js' }),
      'Framework select should show Next.js via legacy connectTab alias'
    ).toBeVisible()
  })

  test('pre-selects ORM from URL params', async ({ page, ref }) => {
    // Use drizzle (non-default) to verify the param takes effect
    await page.goto(toUrl(`/project/${ref}?showConnect=true&connectTab=orm&framework=drizzle`))

    await expect(
      page.getByRole('heading', { name: 'Connect to your project' }),
      'ConnectSheet should open from deep link'
    ).toBeVisible({ timeout: 30000 })

    await expect(
      page.locator('[data-state="checked"]').filter({ hasText: 'Drizzle' }),
      'Drizzle radio should be selected'
    ).toBeVisible()
  })

  test('pre-selects MCP client from URL params', async ({ page, ref }) => {
    await page.goto(toUrl(`/project/${ref}?showConnect=true&connectTab=mcp&mcpClient=goose`))

    await expect(
      page.getByRole('heading', { name: 'Connect to your project' }),
      'ConnectSheet should open from deep link'
    ).toBeVisible({ timeout: 30000 })

    await expect(
      page.getByRole('combobox').filter({ hasText: 'Goose' }),
      'MCP client select should show Goose'
    ).toBeVisible()
  })

  test('pre-selects direct connection method from URL params', async ({ page, ref }) => {
    await page.goto(
      toUrl(`/project/${ref}?showConnect=true&connectTab=direct&method=transaction`)
    )

    await expect(
      page.getByRole('heading', { name: 'Connect to your project' }),
      'ConnectSheet should open from deep link'
    ).toBeVisible({ timeout: 30000 })

    await expect(
      page.locator('[data-state="checked"]').filter({ hasText: 'Transaction pooler' }),
      'Transaction pooler radio should be selected'
    ).toBeVisible()
  })

  test('closing the sheet clears all deep-link params from URL', async ({ page, ref }) => {
    await page.goto(
      toUrl(
        `/project/${ref}?showConnect=true&connectTab=framework&framework=nextjs&using=pages`
      )
    )

    await expect(
      page.getByRole('heading', { name: 'Connect to your project' }),
      'ConnectSheet should open'
    ).toBeVisible({ timeout: 30000 })

    await page.keyboard.press('Escape')

    await expect(
      page.getByRole('heading', { name: 'Connect to your project' }),
      'ConnectSheet should close'
    ).not.toBeVisible({ timeout: 10000 })

    await expect(page, 'connectTab param should be removed').not.toHaveURL(/connectTab/)
    await expect(page, 'framework param should be removed').not.toHaveURL(/[?&]framework=/)
    await expect(page, 'using param should be removed').not.toHaveURL(/using=/)
  })

  test('changing mode clears previous mode params from URL', async ({ page, ref }) => {
    await page.goto(
      toUrl(`/project/${ref}?showConnect=true&connectTab=framework&framework=nextjs`)
    )

    await expect(
      page.getByRole('heading', { name: 'Connect to your project' }),
      'ConnectSheet should open'
    ).toBeVisible({ timeout: 30000 })

    await expect(page, 'framework param should be in URL initially').toHaveURL(/framework=nextjs/)

    await page.getByRole('button', { name: /ORM/ }).click()

    await expect(page, 'framework param should be cleared after mode change').not.toHaveURL(
      /framework=nextjs/
    )
    await expect(page, 'connectTab should update to orm').toHaveURL(/connectTab=orm/)
  })
})
