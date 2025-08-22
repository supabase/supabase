import { expect, Page } from '@playwright/test'
import fs from 'fs'
import { isCLI } from '../utils/is-cli'
import { test } from '../utils/test'
import { toUrl } from '../utils/to-url'
import { waitForApiResponse } from '../utils/wait-for-response'
import { waitForApiResponseWithTimeout } from '../utils/wait-for-response-with-timeout'
import { resetLocalStorage } from '../utils/reset-local-storage'

const sqlSnippetName = 'pw_sql_snippet'
const sqlSnippetNameDuplicate = 'pw_sql_snippet (Duplicate)'
const sqlSnippetNameFolder = 'pw_sql_snippet_folder'
const sqlSnippetNameFavorite = 'pw_sql_snippet_favorite'
const sqlSnippetNameShare = 'pw_sql_snippet_share'
const sqlFolderName = 'pw_sql_folder'
const sqlFolderNameUpdated = 'pw_sql_folder_updated'
const newSqlSnippetName = 'Untitled query'

/**
 * Due to how sql editor is created, it's very annoying to test SQL editor in staging, I've created various workarounds to help mitigate flaky tests as much as possible.
 *
 * List of problems:
 * 1. The connection string loading is very intermitten which leads to results not showing on the results tab. Sometimes it loads and sometimes it doesn't.
 *    > I've created a workaround by waiting for the api call which loads the connection string, and also ignore the error if the API call after 3 seconds. (Assuming that the connection string is already loaded)
 * 2. The only way to access actions in the sidebar, is by right clicking unlike the table editor. This might cause issues as keyboard and mouse click actions are not consistent enough.
 *    > The best way to mitigate this, is clear all SQL snippets before and after each tests.
 * 3. There would random have these errors "Sorry, An unexpected errors has occurred." when sharing sql snippet.
 *    > Have not figured out why this is happening. My guess is that when we click too fast things are not loaded properly and it's causing errors.
 *    > Full error: Cannot read properties of undefined (reading 'type')
 *
 */

const deleteSqlSnippet = async (page: Page, ref: string, sqlSnippetName: string) => {
  const privateSnippet = page.getByLabel('private-snippets')
  await privateSnippet.getByText(sqlSnippetName).last().click({ button: 'right' })
  await page.getByRole('menuitem', { name: 'Delete query' }).click()
  await expect(page.getByRole('heading', { name: 'Confirm to delete query' })).toBeVisible()
  await page.getByRole('button', { name: 'Delete 1 query' }).click()
  await waitForApiResponse(page, 'projects', ref, 'content', { method: 'DELETE' })
  await page.waitForTimeout(500)
}

const deleteFolder = async (page: Page, ref: string, folderName: string) => {
  await page.getByText(folderName, { exact: true }).click({ button: 'right' })
  await page.getByRole('menuitem', { name: 'Delete folder' }).click()
  await page.getByRole('button', { name: 'Delete folder' }).click()
  await waitForApiResponse(page, 'projects', ref, 'content/folders', {
    method: 'DELETE',
  })
}

test.describe('SQL Editor', () => {
  let page: Page

  test.beforeAll(async ({ browser, ref }) => {
    test.setTimeout(60000)

    // Create a new table for the tests
    page = await browser.newPage()
    await page.goto(toUrl(`/project/${ref}/sql/new?skip=true`))

    await resetLocalStorage(page, ref)

    // intercept AI title generation to prevent flaky tests
    await page.route('**/dashboard/api/ai/sql/title-v2', async (route) => {
      await route.abort()
    })
  })

  test.beforeEach(async ({ ref }) => {
    test.setTimeout(60000)

    await page.goto(toUrl(`/project/${ref}/sql/new?skip=true`))
    // this is required to load the connection string
    if (!isCLI()) {
      await waitForApiResponseWithTimeout(
        page,
        (response) => response.url().includes('profile/permissions'),
        3000
      )
      await waitForApiResponseWithTimeout(
        page,
        (response) => response.url().includes('profile'),
        3000
      )
    }
  })

  test.afterAll(async ({ ref }) => {
    if ((await page.getByLabel('private-snippets').count()) === 0) {
      return
    }

    if (isCLI()) {
      //  In self-hosted environments, we don't have access to the supabase platform, reloading would clear/reset all the sql snippets.
      await page.reload()
      return
    }

    // remove sql snippets for "Untitled query" and "pw_sql_snippet"
    const privateSnippet = page.getByLabel('private-snippets')
    let privateSnippetText = await privateSnippet.textContent()
    while (privateSnippetText.includes(newSqlSnippetName)) {
      await deleteSqlSnippet(page, ref, newSqlSnippetName)
      privateSnippetText =
        (await page.getByLabel('private-snippets').count()) > 0
          ? await privateSnippet.textContent()
          : ''
    }

    while (privateSnippetText.includes(sqlSnippetName)) {
      await deleteSqlSnippet(page, ref, sqlSnippetName)
      privateSnippetText =
        (await page.getByLabel('private-snippets').count()) > 0
          ? await privateSnippet.textContent()
          : ''
    }
  })

  test('should check if SQL editor is working as expected', async ({ ref }) => {
    await expect(page.getByText('Loading...')).not.toBeVisible()
    await page.locator('.view-lines').click()
    await page.keyboard.press('ControlOrMeta+KeyA')
    await page.keyboard.type(`select 'hello world';`)
    await page.getByTestId('sql-run-button').click()

    // verify the result
    await waitForApiResponse(page, 'pg-meta', ref, 'query?key=', { method: 'POST' })
    await expect(page.getByRole('gridcell', { name: 'hello world' })).toBeVisible()

    // SQL written in the editor should not be the previous query.
    await page.locator('.view-lines').click()
    await page.keyboard.press('ControlOrMeta+KeyA')
    await page.keyboard.type(`select length('hello');`)
    await page.getByTestId('sql-run-button').click()

    // verify the result is updated.
    await waitForApiResponse(page, 'pg-meta', ref, 'query?key=', { method: 'POST' })
    await expect(page.getByRole('gridcell', { name: '5' })).toBeVisible()

    await expect(page.getByText('Loading...')).not.toBeVisible()
    await page.locator('.view-lines').click()
    await page.keyboard.press('ControlOrMeta+KeyA')
    await page.keyboard.type(`delete table 'test';`)
    await page.getByTestId('sql-run-button').click()

    // verify warning modal is visible
    expect(page.getByRole('heading', { name: 'Potential issue detected with' })).toBeVisible()
    expect(page.getByText('Query has destructive')).toBeVisible()
    await page.getByRole('button', { name: 'Cancel' }).click()

    // clear SQL snippet
    if (!isCLI()) {
      await deleteSqlSnippet(page, ref, newSqlSnippetName)
    } else {
      await page.reload()
    }
  })

  test('exporting works as expected', async ({ ref }) => {
    await expect(page.getByText('Loading...')).not.toBeVisible()
    await page.locator('.view-lines').click()
    await page.keyboard.press('ControlOrMeta+KeyA')
    await page.keyboard.type(`select 'hello world';`)
    await page.getByTestId('sql-run-button').click()

    // export as markdown
    await page.getByRole('button', { name: 'Export' }).click()
    await page.getByRole('menuitem', { name: 'Copy as markdown' }).click()
    await page.waitForTimeout(500)
    const copiedMarkdownResult = await page.evaluate(() => navigator.clipboard.readText())
    expect(copiedMarkdownResult).toBe(`| ?column?    |
| ----------- |
| hello world |`)

    // export as JSON
    await page.getByRole('button', { name: 'Export' }).click()
    await page.getByRole('menuitem', { name: 'Copy as JSON' }).click()
    await page.waitForTimeout(500)
    const copiedJsonResult = await page.evaluate(() => navigator.clipboard.readText())
    expect(copiedJsonResult).toBe(`[
  {
    "?column?": "hello world"
  }
]`)

    // export as CSV
    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Export' }).click()
    await page.getByRole('menuitem', { name: 'Download CSV' }).click()
    const download = await downloadPromise
    expect(download.suggestedFilename()).toContain('.csv')
    const downloadPath = await download.path()
    const csvContent = fs.readFileSync(downloadPath, 'utf-8').replace(/\r?\n/g, '\n')
    expect(csvContent).toBe(`?column?
hello world`)
    fs.unlinkSync(downloadPath)

    // clear SQL snippet
    if (!isCLI()) {
      await deleteSqlSnippet(page, ref, newSqlSnippetName)
    } else {
      await page.reload()
    }
  })

  test('snippet favourite works as expected', async ({ ref }) => {
    if (!isCLI()) {
      // clean up private snippets and snippets shared with the team
      await waitForApiResponseWithTimeout(
        page,
        (response) => response.url().includes('query?key=table-columns'),
        3000
      )
      const privateSnippetSection = page.getByLabel('private-snippets')
      if ((await privateSnippetSection.getByText(newSqlSnippetName, { exact: true }).count()) > 0) {
        await deleteSqlSnippet(page, ref, newSqlSnippetName)
      }

      if (
        (await privateSnippetSection.getByText(sqlSnippetNameFavorite, { exact: true }).count()) > 0
      ) {
        await deleteSqlSnippet(page, ref, sqlSnippetNameFavorite)
      }
    }

    // create sql snippet
    await expect(page.getByText('Loading...')).not.toBeVisible()
    await page.locator('.view-lines').click()
    await page.keyboard.press('ControlOrMeta+KeyA')
    await page.keyboard.type(`select 'hello world';`)
    await page.getByTestId('sql-run-button').click()

    // rename snippet
    const privateSnippetSection = page.getByLabel('private-snippets')
    await privateSnippetSection.getByText(newSqlSnippetName).click({ button: 'right' })
    await page.getByRole('menuitem', { name: 'Rename query', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Rename' })).toBeVisible()
    await page.getByRole('textbox', { name: 'Name' }).fill(sqlSnippetNameFavorite)
    await page.getByRole('button', { name: 'Rename query', exact: true }).click()
    await waitForApiResponse(page, 'projects', ref, 'content', { method: 'PUT' })
    await expect(
      privateSnippetSection.getByText(sqlSnippetNameFavorite, { exact: true })
    ).toBeVisible()
    await page.waitForTimeout(2000) // wait for sql snippets cache to invalidate.

    // open up shared and favourites sections
    await page.getByRole('button', { name: 'Favorites' }).click()

    // favourite snippets
    await page.getByTestId('sql-editor-utility-actions').click()
    await page.getByRole('menuitem', { name: 'Add to favorites', exact: true }).click()
    await waitForApiResponse(page, 'projects', ref, 'content', { method: 'PUT' })
    const favouriteSnippetsSection = page.getByLabel('favorite-snippets')
    await expect(
      favouriteSnippetsSection.getByText(sqlSnippetNameFavorite, { exact: true })
    ).toBeVisible()

    // unfavorite snippets
    await page.getByTestId('sql-editor-utility-actions').click()
    await page.getByRole('menuitem', { name: 'Remove from favorites' }).click()
    await waitForApiResponse(page, 'projects', ref, 'content', { method: 'PUT' })
    await expect(
      favouriteSnippetsSection.getByText(sqlSnippetNameFavorite, { exact: true })
    ).not.toBeVisible()

    // clear SQL snippet
    if (!isCLI()) {
      await deleteSqlSnippet(page, ref, sqlSnippetNameFavorite)
    } else {
      await page.reload()
    }
  })

  test('share with team works as expected', async ({ ref }) => {
    if (!isCLI()) {
      console.log('Sharing and unsharing SQL snippet has issues in staging')
      return
    }

    // clean up private snippets and snippets shared with the team
    await waitForApiResponseWithTimeout(
      page,
      (response) => response.url().includes('query?key=table-columns'),
      3000
    )
    const privateSnippetSection = page.getByLabel('private-snippets')
    if ((await privateSnippetSection.getByText(newSqlSnippetName, { exact: true }).count()) > 0) {
      await deleteSqlSnippet(page, ref, newSqlSnippetName)
    }

    if ((await privateSnippetSection.getByText(sqlSnippetNameShare, { exact: true }).count()) > 0) {
      // this would delete snippets from both favorite and private snippets sections
      await deleteSqlSnippet(page, ref, sqlSnippetNameShare)
    }

    if ((await page.getByRole('button', { name: 'Shared' }).textContent()).includes('(')) {
      const sharedSnippetSection = page.getByLabel('project-level-snippets')
      await page.getByRole('button', { name: 'Shared' }).click()

      let sharedSnippetText = await sharedSnippetSection.textContent()
      while (sharedSnippetText.includes(sqlSnippetNameShare)) {
        await sharedSnippetSection.getByText(sqlSnippetName).last().click({ button: 'right' })
        await page.getByRole('menuitem', { name: 'Delete query' }).click()
        await expect(page.getByRole('heading', { name: 'Confirm to delete query' })).toBeVisible()
        await page.getByRole('button', { name: 'Delete 1 query' }).click()
        await waitForApiResponse(page, 'projects', ref, 'content', { method: 'DELETE' })
        await page.waitForTimeout(500)
        sharedSnippetText =
          (await page.getByLabel('project-level-snippets').count()) > 0
            ? await sharedSnippetSection.textContent()
            : ''
      }
      await page.getByRole('button', { name: 'Shared' }).click()
    }

    // create sql snippet
    await expect(page.getByText('Loading...')).not.toBeVisible()
    await page.locator('.view-lines').click()
    await page.keyboard.press('ControlOrMeta+KeyA')
    await page.keyboard.type(`select 'hello world';`)
    await page.getByTestId('sql-run-button').click()

    // rename snippet
    await privateSnippetSection.getByText(newSqlSnippetName).click({ button: 'right' })
    await page.getByRole('menuitem', { name: 'Rename query', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Rename' })).toBeVisible()
    await page.getByRole('textbox', { name: 'Name' }).fill(sqlSnippetNameShare)
    await page.getByRole('button', { name: 'Rename query', exact: true }).click()
    await waitForApiResponse(page, 'projects', ref, 'content', { method: 'PUT' })
    await expect(
      privateSnippetSection.getByText(sqlSnippetNameShare, { exact: true })
    ).toBeVisible()
    await page.waitForTimeout(2000) // wait for sql snippets cache to invalidate.

    // open up shared and favourites sections
    await page.getByRole('button', { name: 'Shared' }).click()

    // share with a team
    const snippet = privateSnippetSection.getByText(sqlSnippetNameShare, { exact: true })
    await snippet.click({ button: 'right' })
    await page.getByRole('menuitem', { name: 'Share query with team' }).click()
    await expect(page.getByRole('heading', { name: 'Confirm to share query' })).toBeVisible()
    await page.waitForTimeout(1000)
    await page.getByRole('button', { name: 'Share query', exact: true }).click()
    await waitForApiResponse(page, 'projects', ref, 'content', { method: 'PUT' })
    const sharedSnippet = page.getByLabel('project-level-snippets')
    await expect(sharedSnippet.getByText(sqlSnippetNameShare, { exact: true })).toBeVisible({
      timeout: 5000,
    })

    // unshare a snippet
    await sharedSnippet.getByText(sqlSnippetNameShare).click({ button: 'right' })
    await page.getByRole('menuitem', { name: 'Unshare query with team' }).click()
    await expect(page.getByRole('heading', { name: 'Confirm to unshare query:' })).toBeVisible()
    await page.getByRole('button', { name: 'Unshare query', exact: true }).click()
    await expect(sharedSnippet.getByText(sqlSnippetNameShare, { exact: true })).not.toBeVisible()

    // clear SQL snippet
    if (!isCLI()) {
      await deleteSqlSnippet(page, ref, sqlSnippetNameShare)
    } else {
      await page.reload()
    }
  })

  test('folders works as expected', async ({ ref }) => {
    if (!isCLI()) {
      // clean up folders and snippets
      await waitForApiResponseWithTimeout(
        page,
        (response) => response.url().includes('query?key=table-columns'),
        3000
      )
      const privateSnippetSection = page.getByLabel('private-snippets')
      if ((await privateSnippetSection.getByText(sqlFolderName, { exact: true }).count()) > 0) {
        await deleteFolder(page, ref, sqlFolderName)
      }
      if (
        (await privateSnippetSection.getByText(sqlFolderNameUpdated, { exact: true }).count()) > 0
      ) {
        await deleteFolder(page, ref, sqlFolderNameUpdated)
      }
    } else {
      console.log('This test does not work in self-hosted environments.')
      return
    }

    // create sql snippet
    await expect(page.getByText('Loading...')).not.toBeVisible()
    await page.locator('.view-lines').click()
    await page.keyboard.press('ControlOrMeta+KeyA')
    await page.keyboard.type(`select 'hello world';`)
    await page.getByTestId('sql-run-button').click()

    // rename snippet
    const privateSnippetSection = page.getByLabel('private-snippets')
    await privateSnippetSection.getByText(newSqlSnippetName).click({ button: 'right' })
    await page.getByRole('menuitem', { name: 'Rename query', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Rename' })).toBeVisible()
    await page.getByRole('textbox', { name: 'Name' }).fill(sqlSnippetNameFolder)
    await page.getByRole('button', { name: 'Rename query', exact: true }).click()
    await waitForApiResponse(page, 'projects', ref, 'content', { method: 'PUT' })
    await expect(
      privateSnippetSection.getByText(sqlSnippetNameFolder, { exact: true })
    ).toBeVisible()
    await page.waitForTimeout(2000) // wait for sql snippets cache to invalidate.

    // create a folder
    await page.getByTestId('sql-editor-new-query-button').click()
    await page.getByRole('menuitem', { name: 'Create a new folder' }).click()
    await page.getByRole('tree', { name: 'private-snippets' }).getByRole('textbox').click()
    await page
      .getByRole('tree', { name: 'private-snippets' })
      .getByRole('textbox')
      .fill(sqlFolderName)
    await page.waitForTimeout(500)
    await page.locator('.view-lines').click() // blur input and renames folder
    await waitForApiResponse(page, 'projects', ref, 'content/folders', { method: 'POST' })
    await expect(page.getByText('Successfully created folder')).toBeVisible()

    // rename a folder
    await privateSnippetSection.getByText(sqlFolderName).click({ button: 'right' })
    await page.getByRole('menuitem', { name: 'Rename folder' }).click()
    await page
      .getByRole('treeitem', { name: sqlFolderName })
      .getByRole('textbox')
      .fill(sqlFolderNameUpdated)
    await page.waitForTimeout(500)
    await page.locator('.view-lines').click() // blur input and renames folder
    await waitForApiResponse(page, 'projects', ref, 'content/folders', { method: 'PATCH' })

    // move sql snippet into folder
    await privateSnippetSection.getByText(sqlSnippetNameFolder).click({ button: 'right' })
    await page.getByRole('menuitem', { name: 'Move query' }).click()
    await page.getByRole('button', { name: 'Root of the editor (Current)' }).click()
    await page.getByRole('option', { name: sqlFolderNameUpdated, exact: true }).click()
    await page.getByRole('button', { name: 'Move file' }).click()
    await waitForApiResponse(page, 'projects', ref, 'content', { method: 'PUT' })
    await expect(page.getByText('Successfully moved')).toBeVisible({
      timeout: 5000,
    })

    // delete a folder + deleting a folder would also remove the SQL snippets within
    await privateSnippetSection
      .getByText(sqlFolderNameUpdated, { exact: true })
      .click({ button: 'right' })
    await page.getByRole('menuitem', { name: 'Delete folder' }).click()
    await expect(page.getByRole('heading', { name: 'Confirm to delete folder' })).toBeVisible()
    await page.getByRole('button', { name: 'Delete folder' }).click()
    await waitForApiResponse(page, 'projects', ref, 'content/folders', {
      method: 'DELETE',
    })
    await expect(page.getByText('Successfully deleted folder', { exact: true })).toBeVisible({
      timeout: 5000,
    })
    await expect(privateSnippetSection.getByText(sqlFolderNameUpdated)).not.toBeVisible()
    await expect(privateSnippetSection.getByText(sqlSnippetNameFolder)).not.toBeVisible()
  })

  test('other SQL snippets actions work as expected', async ({ ref }) => {
    if (!isCLI()) {
      // clean up 'Untitled query', 'pw_sql_snippet' and 'pw_sql_snippet (Duplicate)' snippets if exists
      await waitForApiResponseWithTimeout(
        page,
        (response) => response.url().includes('query?key=table-columns'),
        3000
      )
      const privateSnippet = page.getByLabel('private-snippets')
      if ((await privateSnippet.getByText(newSqlSnippetName).count()) > 0) {
        deleteSqlSnippet(page, ref, newSqlSnippetName)
      }
      if ((await privateSnippet.getByText(sqlSnippetNameDuplicate, { exact: true }).count()) > 0) {
        await deleteSqlSnippet(page, ref, sqlSnippetNameDuplicate)
      }
      if ((await privateSnippet.getByText(sqlSnippetName, { exact: true }).count()) > 0) {
        await deleteSqlSnippet(page, ref, sqlSnippetName)
      }
    } else {
      console.log('This test does not work in self-hosted environments.')
      return
    }

    // create sql snippet
    await expect(page.getByText('Loading...')).not.toBeVisible()
    await page.locator('.view-lines').click()
    await page.keyboard.press('ControlOrMeta+KeyA')
    await page.keyboard.type(`select 'hello world';`)
    await page.getByTestId('sql-run-button').click()

    // rename snippet
    const privateSnippetSection = page.getByLabel('private-snippets')
    await privateSnippetSection.getByText(newSqlSnippetName).click({ button: 'right' })
    await page.getByRole('menuitem', { name: 'Rename query', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Rename' })).toBeVisible()
    await page.getByRole('textbox', { name: 'Name' }).fill(sqlSnippetName)
    await page.getByRole('button', { name: 'Rename query', exact: true }).click()
    await waitForApiResponse(page, 'projects', ref, 'content', { method: 'PUT' })
    await expect(privateSnippetSection.getByText(sqlSnippetName, { exact: true })).toBeVisible()
    await page.waitForTimeout(2000) // wait for sql snippets cache to invalidate.

    // duplicate SQL snippet
    await privateSnippetSection
      .getByTitle(sqlSnippetName, { exact: true })
      .click({ button: 'right' })
    await page.getByRole('menuitem', { name: 'Duplicate query' }).click()
    await waitForApiResponse(page, 'projects', ref, 'content', { method: 'PUT' })
    await expect(
      privateSnippetSection.getByText(sqlSnippetNameDuplicate, { exact: true })
    ).toBeVisible()

    // filter SQL snippets
    const searchBar = page.getByRole('textbox', { name: 'Search queries...' })
    await searchBar.fill('Duplicate')
    await expect(page.getByText(sqlSnippetName, { exact: true })).not.toBeVisible()
    await expect(page.getByRole('link', { name: sqlSnippetNameDuplicate })).toBeVisible()
    await expect(page.getByText('result found')).toBeVisible()
    await searchBar.fill('') // clear search bar

    // download as migration file
    await privateSnippetSection
      .getByTitle(sqlSnippetName, { exact: true })
      .click({ button: 'right' })
    await page.getByRole('menuitem', { name: 'Download as migration file' }).click()
    await expect(page.getByText('supabase migration new')).toBeVisible()
    await page.getByRole('button', { name: 'Close' }).click()

    // delete all files used in this test
    await deleteSqlSnippet(page, ref, sqlSnippetNameDuplicate)
    await deleteSqlSnippet(page, ref, sqlSnippetName)
  })
})
