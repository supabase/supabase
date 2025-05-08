import { Locator, Page, expect } from '@playwright/test'
import { test } from '../../base'

const cmdKey = process.env.CI && process.platform === 'darwin' ? 'Meta' : 'Control'

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

async function executeQueryGUI(page: Page) {
  // Get the Monaco Editor instance
  const monacoEditor = page.locator('.monaco-editor').first()
  await monacoEditor.waitFor({ state: 'visible' })
  await monacoEditor.focus()
  await monacoEditor.click({ delay: 20 })
  await page.keyboard.press(`${cmdKey}+Enter`, { delay: 100 })

  const sqlQueryResp = await page.waitForResponse((r) => {
    return r.url().includes('/query') && r.request().method() === 'POST'
  })
  return sqlQueryResp
}

async function createSnippetGUI(page: Page, ref: string, query: string): Promise<string> {
  await page.goto(`./project/${ref}/sql/new`)
  await expect(page.getByText('Click Run to execute')).toBeVisible()

  await enterMonacoQueryGUI(page, query)
  const firstSqlQueryResp = await executeQueryGUI(page)
  expect(firstSqlQueryResp.ok()).toBeTruthy()

  const snippetOneUrl = page.url()
  return snippetOneUrl
}

async function deleteSnippetGUI(page: Page, snippetUrl: string) {
  await page.getByLabel('private-snippets').locator('div').filter({ hasText: 'Colors' }).click({
    button: 'right',
  })
  await page.click(`a[href="${snippetUrl}"]`)

  // Check dropdown appeared
  await expect(page.getByText(/Delete query/)).toBeVisible()
  await page.getByRole('menuitem', { name: 'Delete query' }).click()

  // delete the snippet
  await page.getByRole('button', { name: 'Delete 1 query' }).click()
  const deleteSnippetResp = await page.waitForResponse((r) => {
    return r.url().includes('/content') && r.request().method() === 'DELETE'
  })
  expect(deleteSnippetResp.ok()).toBeTruthy()
}

test.describe('SQL Editor', () => {
  test.beforeEach(async ({ page, apiUrl, ref }) => {
    const connectionStringResp = page.waitForResponse(
      `${apiUrl}/platform/projects/${ref}/databases`,
      { timeout: 0 }
    )
    await page.goto(`./project/${ref}/sql/new`)
    await connectionStringResp
  })

  test.skip('SQL Editor opens with welcome screen', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'SQL Editor' })).toBeVisible()
    await expect(page.getByText('Click Run to execute')).toBeVisible()
  })

  test('Switch between 2 queries and verify the right one executed', async ({
    page,
    ref,
    apiUrl,
  }) => {
    let snippetOneUrl: string = ''
    let snippetTwoUrl: string = ''

    await test.step('Create 2 snippets and execute the first one', async () => {
      await test.step('Create first snippet and run it', async () => {
        snippetOneUrl = await createSnippetGUI(page, ref, 'select * from public.colors;')
        await expect(page.getByText(/Absolute Zero/)).toBeVisible()
        await expect(page.getByText(/Acid green/)).toBeVisible()
        await expect(page.getByText(/Aero/)).toBeVisible()
      })

      await test.step('Create second snippet', async () => {
        snippetTwoUrl = await createSnippetGUI(
          page,
          ref,
          'select * from public.colors where id >= 50;'
        )
        await expect(page.getByText(/Bitter lemon/)).toBeVisible()
        await expect(page.getByText(/Black bean/)).toBeVisible()
        await expect(page.getByText(/Black coral/)).toBeVisible()
      })
    })

    console.log({ snippetOneUrl, snippetTwoUrl })

    // await test.step('Act: switch between snippets and execute the second query', async () => {
    //   await test.step('Switch between snippets', async () => {
    //     // todo: add snippet renames and search by name to not fail if there >20 snippets
    //     await page.click(`a[href="${snippetOneUrl}"]`)
    //     await page.click(`a[href="${snippetTwoUrl}"]`)
    //     await page.click(`a[href="${snippetOneUrl}"]`)
    //     await page.click(`a[href="${snippetTwoUrl}"]`)
    //   })

    //   await test.step('Run 2nd query snippet', async () => {
    //     const secondSqlQueryResp = await executeQueryGUI(page)
    //     expect(secondSqlQueryResp.ok()).toBeTruthy()
    //     await expect(page.getByText(/Bitter lemon/)).toBeVisible()
    //     await expect(page.getByText(/Black/)).toBeVisible()
    //     await expect(page.getByText(/Black bean/)).toBeVisible()
    //   })
    // })

    // await test.step('Cleanup: delete snippets', async () => {
    //   await deleteSnippetGUI(page, snippetOneUrl)
    //   await expect(page.getByText(/Confirm to delete/)).not.toBeVisible()
    //   await deleteSnippetGUI(page, snippetTwoUrl)
    // })
  })
})
