import { expect } from '@playwright/test'
import { test } from '../utils/test'
import { toUrl } from '../utils/to-url'
import { getProjectRef } from '../env.config'

test.describe('SQL Editor', () => {
  test('should check if SQL editor can run simple commands', async ({ page }) => {
    await page.goto(toUrl(`/project/${getProjectRef()}/sql`))

    //
    const editor = page.getByRole('code').nth(0)

    // write some sql in the editor
    await editor.click()
    await page.keyboard.press('ControlOrMeta+KeyA')
    await page.keyboard.type(`select 'hello world';`)

    // run the query
    await page.getByTestId('sql-run-button').click()

    // Should say "Running..."
    await expect(page.getByText('Running...')).toBeVisible()

    // Wait until Running... is not visible
    await expect(page.getByText('Running...')).not.toBeVisible()

    // remove stuff from the editor
    await page.keyboard.press('ControlOrMeta+KeyA')
    await page.keyboard.press('Backspace')

    // verify the result
    const result = page.getByRole('gridcell', { name: 'hello world' })
    await expect(result).toBeVisible()
  })
})
