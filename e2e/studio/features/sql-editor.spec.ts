import { expect } from '@playwright/test'
import { env } from '../env.config'
import { test } from '../utils/test'
import { toUrl } from '../utils/to-url'

test.describe('SQL Editor', () => {
  test('should check if SQL editor can run simple commands', async ({ page }) => {
    await page.goto(toUrl(`/project/${env.PROJECT_REF}/sql/new?skip=true`))

    const editor = page.getByRole('code').nth(0)

    // write some sql in the editor
    // This has to be done since the editor is not editable (input, textarea, etc.)
    await editor.click()
    await editor.click()
    await page.keyboard.press('ControlOrMeta+KeyA')
    await page.keyboard.type(`select 'hello world';`)

    await page.getByRole('button', { name: /^Run( CTRL)?$/, exact: false }).click()

    // Should say "Running..."
    await expect(page.getByText('Running...')).toBeVisible()

    // Wait until Running... is not visible
    await expect(page.getByText('Running...')).not.toBeVisible()

    // clear the editor
    await editor.click()
    await page.keyboard.press('ControlOrMeta+KeyA')
    await page.keyboard.press('Backspace')

    // verify the result
    const result = page.getByRole('gridcell', { name: 'hello world' })
    await expect(result).toBeVisible()
  })
})

test.describe('SQL Snippets', () => {
  test('should create and load a new snippet', async ({ page }) => {
    await page.goto(toUrl(`/project/${env.PROJECT_REF}/sql`))

    const addButton = page.getByTestId('sql-editor-new-query-button')
    const runButton = page.getByTestId('sql-run-button')
    await page.getByRole('button', { name: 'Favorites' }).click()
    await page.getByRole('button', { name: 'Shared' }).click()
    await expect(page.getByText('No shared queries')).toBeVisible()
    await expect(page.getByText('No favorite queries')).toBeVisible()

    // write some sql in the editor
    await addButton.click()
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
    await page.getByRole('textbox', { name: 'Name' }).fill('test snippet')
    await page.getByRole('button', { name: 'Rename query', exact: true }).click()

    const privateSnippet2 = privateSnippet.getByText('test snippet', { exact: true })
    await expect(privateSnippet2).toBeVisible()

    // share with a team
    await privateSnippet2.click({ button: 'right' })
    await page.getByRole('menuitem', { name: 'Share query with team' }).click()
    await expect(page.getByRole('heading', { name: 'Confirm to share query: test' })).toBeVisible()
    await page.getByRole('button', { name: 'Share query', exact: true }).click()
    const sharedSnippet = await page.getByLabel('project-level-snippets')
    await expect(sharedSnippet).toContainText('test snippet')

    // unshare a snippet
    await sharedSnippet.getByText('test snippet').click({ button: 'right' })
    await page.getByRole('menuitem', { name: 'Unshare query with team' }).click()
    await expect(page.getByRole('heading', { name: 'Confirm to unshare query:' })).toBeVisible()
    await page.getByRole('button', { name: 'Unshare query', exact: true }).click()
    await expect(sharedSnippet).not.toBeVisible()
  })
})
