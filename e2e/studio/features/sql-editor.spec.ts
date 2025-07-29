import { expect, Page } from '@playwright/test'
import { isCLI } from '../utils/is-cli'
import { test } from '../utils/test'
import { toUrl } from '../utils/to-url'

const deleteQuery = async (page: Page, queryName: string) => {
  const privateSnippet = page.getByLabel('private-snippets')
  await privateSnippet.getByText(queryName).first().click({ button: 'right' })
  await page.getByRole('menuitem', { name: 'Delete query' }).click()
  await expect(page.getByRole('heading', { name: 'Confirm to delete query' })).toBeVisible()
  await page.getByRole('button', { name: 'Delete 1 query' }).click()
}

test.describe('SQL Editor', () => {
  let page: Page
  const pwTestQueryName = 'pw-test-query'

  test.beforeAll(async ({ browser, ref }) => {
    test.setTimeout(60000)

    // Create a new table for the tests
    page = await browser.newPage()
    await page.goto(toUrl(`/project/${ref}/sql/new?skip=true`))

    await page.evaluate((ref) => {
      localStorage.removeItem('dashboard-history-default')
      localStorage.removeItem(`dashboard-history-${ref}`)
    }, ref)

    // intercept AI title generation to prevent flaky tests
    await page.route('**/dashboard/api/ai/sql/title-v2', async (route) => {
      await route.abort()
    })
  })

  test.beforeEach(async ({ ref }) => {
    if ((await page.getByLabel('private-snippets').count()) === 0) {
      return
    }

    //  since in local, we don't have access to the supabase platform, reloading would reload all the sql snippets.
    if (isCLI()) {
      await page.reload()
    }

    // remove sql snippets for - "Untitled query" and "pw test query"
    const privateSnippet = page.getByLabel('private-snippets')
    let privateSnippetText = await privateSnippet.textContent()
    while (privateSnippetText.includes('Untitled query')) {
      deleteQuery(page, 'Untitled query')

      await page.waitForResponse(
        (response) =>
          (response.url().includes(`projects/${ref}/content`) ||
            response.url().includes('projects/default/content')) &&
          response.request().method() === 'DELETE'
      )
      await expect(
        page.getByText('Successfully deleted 1 query'),
        'Delete confirmation toast should be visible'
      ).toBeVisible({
        timeout: 50000,
      })
      await page.waitForTimeout(1000)
      privateSnippetText =
        (await page.getByLabel('private-snippets').count()) > 0
          ? await privateSnippet.textContent()
          : ''
    }

    while (privateSnippetText.includes(pwTestQueryName)) {
      deleteQuery(page, pwTestQueryName)
      await page.waitForResponse(
        (response) =>
          (response.url().includes(`projects/${ref}/content`) ||
            response.url().includes('projects/default/content')) &&
          response.request().method() === 'DELETE'
      )
      await expect(
        page.getByText('Successfully deleted 1 query'),
        'Delete confirmation toast should be visible'
      ).toBeVisible({
        timeout: 50000,
      })
      await page.waitForTimeout(1000)
      privateSnippetText =
        (await page.getByLabel('private-snippets').count()) > 0
          ? await privateSnippet.textContent()
          : ''
    }
  })

  test('should check if SQL editor can run simple commands', async () => {
    await page.getByTestId('sql-editor-new-query-button').click()
    await page.getByRole('menuitem', { name: 'Create a new snippet' }).click()

    // write some sql in the editor
    // This has to be done since the editor is not editable (input, textarea, etc.)
    await page.waitForTimeout(1000)
    const editor = page.getByRole('code').nth(0)
    await editor.click()
    await page.keyboard.press('ControlOrMeta+KeyA')
    await page.keyboard.type(`select 'hello world';`)
    await page.getByTestId('sql-run-button').click()

    // verify the result
    await expect(page.getByRole('gridcell', { name: 'hello world' })).toBeVisible({
      timeout: 5000,
    })

    // SQL written in the editor should not be the previous query.
    await page.waitForTimeout(1000)
    await editor.click()
    await page.keyboard.press('ControlOrMeta+KeyA')
    await page.keyboard.type(`select length('hello');`)
    await page.getByTestId('sql-run-button').click()

    // verify the result is updated.
    await expect(page.getByRole('gridcell', { name: '5' })).toBeVisible({
      timeout: 5000,
    })
  })

  test('destructive query would tripper a warning modal', async () => {
    await page.getByTestId('sql-editor-new-query-button').click()
    await page.getByRole('menuitem', { name: 'Create a new snippet' }).click()

    // write some sql in the editor
    // This has to be done since the editor is not editable (input, textarea, etc.)
    await page.waitForTimeout(1000)
    const editor = page.getByRole('code').nth(0)
    await editor.click()
    await page.keyboard.press('ControlOrMeta+KeyA')
    await page.keyboard.type(`delete table 'test';`)
    await page.getByTestId('sql-run-button').click()

    // verify warning modal is visible
    expect(page.getByRole('heading', { name: 'Potential issue detected with' })).toBeVisible()
    expect(page.getByText('Query has destructive')).toBeVisible()

    // reset test
    await page.getByRole('button', { name: 'Cancel' }).click()
    await page.waitForTimeout(500)
    await editor.click()
    await page.keyboard.press('ControlOrMeta+KeyA')
    await page.keyboard.press('Backspace')
  })

  test('should create and load a new snippet', async ({ ref }) => {
    const runButton = page.getByTestId('sql-run-button')
    await page.getByRole('button', { name: 'Favorites' }).click()
    await page.getByRole('button', { name: 'Shared' }).click()

    // write some sql in the editor
    await page.getByTestId('sql-editor-new-query-button').click()
    await page.getByRole('menuitem', { name: 'Create a new snippet' }).click()
    const editor = page.getByRole('code').nth(0)
    await page.waitForTimeout(1000)
    await editor.click()
    await page.keyboard.type(`select 'hello world';`)
    await expect(page.getByText("select 'hello world';")).toBeVisible()
    await runButton.click()

    // snippet exists
    const privateSnippet = page.getByLabel('private-snippets')
    await expect(privateSnippet).toContainText('Untitled query')

    // favourite snippets
    await page.getByTestId('sql-editor-utility-actions').click()
    await page.getByRole('menuitem', { name: 'Add to favorites', exact: true }).click()
    const favouriteSnippetsSection = page.getByLabel('favorite-snippets')
    await expect(favouriteSnippetsSection).toContainText('Untitled query')

    // unfavorite snippets
    await page.waitForTimeout(500)
    await page.getByTestId('sql-editor-utility-actions').click()
    await page.getByRole('menuitem', { name: 'Remove from favorites' }).click()
    await expect(favouriteSnippetsSection).not.toBeVisible()

    // rename snippet
    await privateSnippet.getByText('Untitled query').click({ button: 'right' })
    await page.getByRole('menuitem', { name: 'Rename query', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Rename' })).toBeVisible()
    await page.getByRole('textbox', { name: 'Name' }).fill(pwTestQueryName)
    await page.getByRole('button', { name: 'Rename query', exact: true }).click()
    await page.waitForResponse(
      (response) =>
        (response.url().includes(`projects/${ref}/content`) ||
          response.url().includes('projects/default/content')) &&
        response.request().method() === 'PUT' &&
        response.status().toString().startsWith('2')
    )
    await expect(privateSnippet.getByText(pwTestQueryName, { exact: true })).toBeVisible({
      timeout: 50000,
    })
    const privateSnippet2 = await privateSnippet.getByText(pwTestQueryName, { exact: true })

    // share with a team
    await privateSnippet2.click({ button: 'right' })
    await page.getByRole('menuitem', { name: 'Share query with team' }).click()
    await expect(page.getByRole('heading', { name: 'Confirm to share query' })).toBeVisible()
    await page.getByRole('button', { name: 'Share query', exact: true }).click()
    await page.waitForResponse(
      (response) =>
        (response.url().includes(`projects/${ref}/content`) ||
          response.url().includes('projects/default/content')) &&
        response.request().method() === 'PUT' &&
        response.status().toString().startsWith('2')
    )
    const sharedSnippet = await page.getByLabel('project-level-snippets')
    await expect(sharedSnippet).toContainText(pwTestQueryName)

    // unshare a snippet
    await sharedSnippet.getByText(pwTestQueryName).click({ button: 'right' })
    await page.getByRole('menuitem', { name: 'Unshare query with team' }).click()
    await expect(page.getByRole('heading', { name: 'Confirm to unshare query:' })).toBeVisible()
    await page.getByRole('button', { name: 'Unshare query', exact: true }).click()
    await expect(sharedSnippet).not.toBeVisible()

    // delete snippet (for non-local environment)
    if (!isCLI()) {
      deleteQuery(page, pwTestQueryName)

      await expect(
        page.getByText('Successfully deleted 1 query'),
        'Delete confirmation toast should be visible'
      ).toBeVisible({
        timeout: 50000,
      })
    }
  })
})
