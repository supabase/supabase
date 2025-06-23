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
