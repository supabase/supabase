import { expect, test } from '@playwright/test'

const GUIDE = '/kb/guides/migrate-from-heroku'

test('home page links to guides', async ({ page }) => {
  const response = await page.goto('/kb')
  expect(response?.ok()).toBeTruthy()
  await expect(page.locator('a[href^="/kb/guides/"]').first()).toBeVisible()
})

test('topic page links to a guide that renders', async ({ page }) => {
  await page.goto('/kb/topics/migration')
  await page.locator('a[href^="/kb/guides/"]').first().click()
  await expect(page).toHaveURL(/\/kb\/guides\//)
  await expect(page.locator('main article h1')).toBeVisible()
})

test('troubleshooting article renders', async ({ page }) => {
  await page.goto('/kb/topics/troubleshooting')
  await page.locator('a[href^="/kb/troubleshooting/"]').first().click()
  await expect(page).toHaveURL(/\/kb\/troubleshooting\//)
  await expect(page.locator('main article h1')).toBeVisible()
})

test('guide is available as markdown via .md and Accept header', async ({ request }) => {
  for (const response of [
    await request.get(`${GUIDE}.md`),
    await request.get(GUIDE, { headers: { Accept: 'text/markdown' } }),
  ]) {
    expect(response.ok()).toBeTruthy()
    expect(response.headers()['content-type']).toContain('text/markdown')
    expect(await response.text()).toMatch(/^# /)
  }
})

test('markdown sitemap lists guides', async ({ request }) => {
  const response = await request.get('/kb/sitemap.md')
  expect(response.ok()).toBeTruthy()
  expect(await response.text()).toContain('/kb/guides/')
})

test('search API returns results and rejects a missing query', async ({ request, baseURL }) => {
  test.skip(baseURL !== 'https://supabase.com', 'Search is only configured in production')

  const results = await request.get('/kb/api/search?q=auth&limit=1')
  expect(results.ok()).toBeTruthy()
  expect(await results.json()).toEqual([expect.objectContaining({ title: expect.any(String) })])

  expect((await request.get('/kb/api/search')).status()).toBe(400)
})
