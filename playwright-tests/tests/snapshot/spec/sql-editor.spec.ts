import { Locator, Page, expect, test } from '@playwright/test'

// weird thing, in playwright UI test runner it acts as linux/windows and works with Control
const cmdKey = process.env.CI && process.platform === 'darwin' ? 'Meta' : 'Control'

test.describe('SQL Editor Page', () => {
  test.setTimeout(10000) // Sets the timeout for this test suite to 10 seconds

  test.beforeEach(async ({ page }) => {
    await page.goto('http://127.0.0.1:54323/project/default/sql/1')
  })

  test('sql editor opens with welcome screen', async ({ page }) => {
    // Expect a title "to contain" a substring.
    await expect(page.locator('[id="__next"]')).toContainText('SQL Editor')
  })

  test('switch between two queries and verify the right one executed', async ({ page }) => {
    await test.step('run the default query', async () => {
      // await monaco loading
      const monaco = await page.locator('div.monaco-editor').first()
      await monaco.waitFor({ state: 'visible' })

      // run the default query
      await page.getByRole('button', { name: 'Run' }).click()
      const gridDiv = await page.locator('div[role="grid"]').first()
      await gridDiv.waitFor({ state: 'visible' })

      // query returns current PostgreSQL info + version
      await expect(gridDiv).toContainText('PostgreSQL')
    })

    await test.step('Create second snippet and run it', async () => {
      await page.getByText('New query').click()

      // await monaco loading
      const monaco = await page.locator('div.monaco-editor').first()
      await monaco.waitFor({ state: 'visible' })
      await enterMonacoQueryGUI(page, "select 'first test';")

      // run the default query
      await page.getByRole('button', { name: 'Run' }).click()

      const gridDiv = await page.locator('div[role="grid"]').first()
      await gridDiv.waitFor({ state: 'visible' })
      await expect(gridDiv).toContainText('first test')
    })

    await test.step('Go back to first snippet and confirm it runs first query', async () => {
      await page.getByText('SQL Query').click()
      const monaco = await page.locator('div.monaco-editor').first()
      await monaco.waitFor({ state: 'visible' })
      await enterMonacoQueryGUI(page, "select 'second test';")

      // run the default query
      await page.getByRole('button', { name: 'Run' }).click()

      const gridDiv = await page.locator('div[role="grid"]').first()
      await gridDiv.waitFor({ state: 'visible' })
      await expect(gridDiv).toContainText('second test')
    })
  })
})

async function enterMonacoQueryGUI(page: Page, query: string = ''): Promise<Locator> {
  // Wait for Monaco Editor to be ready
  const monacoEditor = page.locator('.monaco-editor').first()
  await monacoEditor.waitFor({ state: 'visible' })
  await monacoEditor.click({ delay: 20 })

  // Emulate typing using low-level key events
  await page.keyboard.press(`${cmdKey}+A`) // Select all existing text
  await page.keyboard.press('Backspace') // Delete the selected text
  await page.keyboard.type(query) // Type the desired text
  return monacoEditor
}
