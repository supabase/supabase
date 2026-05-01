import { expect, Page } from '@playwright/test'

import { createTable, dropTable, query } from '../utils/db/index.js'
import { test, withSetupCleanup } from '../utils/test.js'
import { toUrl } from '../utils/to-url.js'
import { waitForTableToLoad } from '../utils/wait-for-response.js'

const QUEUE_OPERATIONS_KEY = 'supabase-ui-queue-operations'
const tableNamePrefix = 'pw_queue_table'

const enableQueueOperations = async (page: Page) => {
  await page.evaluate((key) => {
    localStorage.setItem(key, 'true')
  }, QUEUE_OPERATIONS_KEY)
}

const openQueueDropdownAndClick = async (page: Page, itemName: string) => {
  await page.getByRole('button', { name: 'More options' }).click()
  await page.getByRole('menuitem', { name: itemName }).click()
}

const clickReview = async (page: Page) => openQueueDropdownAndClick(page, 'Review')
const clickDiscard = async (page: Page) => openQueueDropdownAndClick(page, 'Discard')

test.describe('Queue Table Operations', () => {
  test.beforeEach(async ({ page, ref }) => {
    const loadPromise = waitForTableToLoad(page, ref)
    await page.goto(toUrl(`/project/${ref}/editor?schema=public`))
    await loadPromise
    await enableQueueOperations(page)
    await page.reload({ waitUntil: 'networkidle' })
  })

  test('cell edits are queued and can be saved', async ({ page, ref }) => {
    const tableName = `${tableNamePrefix}_cell_edit`
    const columnName = 'name'

    await using _ = await withSetupCleanup(
      async () => {
        await createTable(tableName, columnName, [{ name: 'original value' }])
      },
      async () => {
        await dropTable(tableName)
      }
    )

    await page.goto(toUrl(`/project/${ref}/editor?schema=public`))
    await enableQueueOperations(page)
    await page.reload()
    await waitForTableToLoad(page, ref)

    await page.getByRole('button', { name: `View ${tableName}`, exact: true }).click()
    await page.waitForURL(/\/editor\/\d+\?schema=public$/)

    await expect(page.getByRole('gridcell', { name: 'original value' })).toBeVisible()

    const cell = page.getByRole('gridcell', { name: 'original value' })
    await cell.dblclick()

    const editor = page.getByRole('textbox', { name: /Editor content/ })
    await expect(editor).toBeVisible()
    await editor.fill('edited value')
    await page.keyboard.press('Enter')

    await expect(page.getByText('1 pending change')).toBeVisible()

    await clickReview(page)

    const sidePanel = page.getByRole('dialog')
    await expect(sidePanel.getByText('Pending changes')).toBeVisible()
    await expect(sidePanel.getByText('1 cell edit')).toBeVisible()
    await expect(sidePanel.getByTitle('original value')).toBeVisible()
    await expect(sidePanel.getByTitle('edited value')).toBeVisible()

    await sidePanel.getByRole('button', { name: /^Save/ }).click()
    await expect(page.getByText('Changes saved successfully')).toBeVisible()

    await expect(page.getByRole('gridcell', { name: 'edited value' })).toBeVisible()
    await expect(page.getByRole('gridcell', { name: 'original value' })).not.toBeVisible()
  })

  test('cell edits can be cancelled', async ({ page, ref }) => {
    const tableName = `${tableNamePrefix}_cell_cancel`
    const columnName = 'name'

    await using _ = await withSetupCleanup(
      async () => {
        await createTable(tableName, columnName, [{ name: 'keep this value' }])
      },
      async () => {
        await dropTable(tableName)
      }
    )

    await page.goto(toUrl(`/project/${ref}/editor?schema=public`))
    await enableQueueOperations(page)
    await page.reload()
    await waitForTableToLoad(page, ref)

    await page.getByRole('button', { name: `View ${tableName}`, exact: true }).click()
    await page.waitForURL(/\/editor\/\d+\?schema=public$/)

    await expect(page.getByRole('gridcell', { name: 'keep this value' })).toBeVisible()

    const cell = page.getByRole('gridcell', { name: 'keep this value' })
    await cell.dblclick()
    const editor = page.getByRole('textbox', { name: /Editor content/ })
    await editor.fill('should be cancelled')
    await page.keyboard.press('Enter')

    await expect(page.getByText('1 pending change')).toBeVisible()

    await clickDiscard(page)

    const confirmDialog = page.getByRole('alertdialog')
    await expect(confirmDialog.getByRole('heading', { name: 'Unsaved changes' })).toBeVisible()
    await confirmDialog.getByRole('button', { name: 'Discard changes' }).click()

    await expect(page.getByRole('gridcell', { name: 'keep this value' })).toBeVisible()
    await expect(page.getByRole('gridcell', { name: 'should be cancelled' })).not.toBeVisible()

    await expect(page.getByText('pending change')).not.toBeVisible()
  })

  test('revert can be cancelled via discard confirmation dialog', async ({ page, ref }) => {
    const tableName = `${tableNamePrefix}_discard_cancel`
    const columnName = 'name'

    await using _ = await withSetupCleanup(
      async () => {
        await createTable(tableName, columnName, [{ name: 'keep this value' }])
      },
      async () => {
        await dropTable(tableName)
      }
    )

    await page.goto(toUrl(`/project/${ref}/editor?schema=public`))
    await enableQueueOperations(page)
    await page.reload()
    await waitForTableToLoad(page, ref)

    await page.getByRole('button', { name: `View ${tableName}`, exact: true }).click()
    await page.waitForURL(/\/editor\/\d+\?schema=public$/)

    const cell = page.getByRole('gridcell', { name: 'keep this value' })
    await cell.dblclick()
    const editor = page.getByRole('textbox', { name: /Editor content/ })
    await editor.fill('edited value')
    await page.keyboard.press('Enter')

    await expect(page.getByText('1 pending change')).toBeVisible()

    await clickDiscard(page)

    const confirmDialog = page.getByRole('alertdialog')
    await expect(confirmDialog.getByRole('heading', { name: 'Unsaved changes' })).toBeVisible()
    await confirmDialog.getByRole('button', { name: 'Keep editing' }).click()

    await expect(page.getByText('1 pending change')).toBeVisible()
  })

  test('row inserts are queued and can be saved', async ({ page, ref }) => {
    const tableName = `${tableNamePrefix}_row_insert`
    const columnName = 'name'

    await using _ = await withSetupCleanup(
      async () => {
        await createTable(tableName, columnName)
      },
      async () => {
        await dropTable(tableName)
      }
    )

    await page.goto(toUrl(`/project/${ref}/editor?schema=public`))
    await enableQueueOperations(page)
    await page.reload()
    await waitForTableToLoad(page, ref)

    await page.getByRole('button', { name: `View ${tableName}`, exact: true }).click()
    await page.waitForURL(/\/editor\/\d+\?schema=public$/)

    await page.getByTestId('table-editor-insert-new-row').click()
    await page.getByRole('menuitem', { name: 'Insert row' }).click()
    await page.getByTestId(`${columnName}-input`).fill('new row value')
    await page.getByTestId('action-bar-save-row').click()

    await expect(page.getByText('1 pending change')).toBeVisible()

    await expect(page.getByRole('gridcell', { name: 'new row value' })).toBeVisible()

    await clickReview(page)

    const sidePanel = page.getByRole('dialog')
    await expect(sidePanel.getByText('Pending changes')).toBeVisible()
    await expect(sidePanel.getByText('1 row addition')).toBeVisible()
    await expect(sidePanel.getByText('New row', { exact: true })).toBeVisible()

    await sidePanel.getByRole('button', { name: /^Save/ }).click()
    await expect(page.getByText('Changes saved successfully')).toBeVisible()

    await expect(page.getByRole('gridcell', { name: 'new row value' })).toBeVisible()
  })

  test('multiple operations can be batched and saved together', async ({ page, ref }) => {
    const tableName = `${tableNamePrefix}_batch_ops`
    const columnName = 'name'

    await using _ = await withSetupCleanup(
      async () => {
        await createTable(tableName, columnName)
      },
      async () => {
        await dropTable(tableName)
      }
    )
    await page.goto(toUrl(`/project/${ref}/editor?schema=public`))
    await enableQueueOperations(page)
    await page.reload()
    await waitForTableToLoad(page, ref)

    await page.getByRole('button', { name: `View ${tableName}`, exact: true }).click()
    await page.waitForURL(/\/editor\/\d+\?schema=public$/)

    await page.getByTestId('table-editor-insert-new-row').click()
    await page.getByRole('menuitem', { name: 'Insert row' }).click()
    await page.getByTestId(`${columnName}-input`).fill('row one')
    await page.getByTestId('action-bar-save-row').click()

    await page.getByTestId('table-editor-insert-new-row').click()
    await page.getByRole('menuitem', { name: 'Insert row' }).click()
    await page.getByTestId(`${columnName}-input`).fill('row two')
    await page.getByTestId('action-bar-save-row').click()

    await expect(page.getByText('2 pending changes')).toBeVisible()

    await clickReview(page)

    const sidePanel = page.getByRole('dialog')
    await expect(sidePanel.getByText('2 operations')).toBeVisible()
    await expect(sidePanel.getByText('2 row additions')).toBeVisible()

    await sidePanel.getByRole('button', { name: /^Save/ }).click()
    await expect(page.getByText('Changes saved successfully')).toBeVisible()

    await expect(page.getByRole('gridcell', { name: 'row one' })).toBeVisible()
    await expect(page.getByRole('gridcell', { name: 'row two' })).toBeVisible()
  })

  test('individual operations can be removed from the queue', async ({ page, ref }) => {
    const tableName = `${tableNamePrefix}_remove_op`
    const columnName = 'name'

    await using _ = await withSetupCleanup(
      async () => {
        await createTable(tableName, columnName)
      },
      async () => {
        await dropTable(tableName)
      }
    )
    await page.goto(toUrl(`/project/${ref}/editor?schema=public`))
    await enableQueueOperations(page)
    await page.reload()
    await waitForTableToLoad(page, ref)

    await page.getByRole('button', { name: `View ${tableName}`, exact: true }).click()
    await page.waitForURL(/\/editor\/\d+\?schema=public$/)

    await page.getByTestId('table-editor-insert-new-row').click()
    await page.getByRole('menuitem', { name: 'Insert row' }).click()
    await page.getByTestId(`${columnName}-input`).fill('keep this row')
    await page.getByTestId('action-bar-save-row').click()

    await page.getByTestId('table-editor-insert-new-row').click()
    await page.getByRole('menuitem', { name: 'Insert row' }).click()
    await page.getByTestId(`${columnName}-input`).fill('remove this row')
    await page.getByTestId('action-bar-save-row').click()

    await expect(page.getByText('2 pending changes')).toBeVisible()

    await clickReview(page)

    const sidePanel = page.getByRole('dialog')
    const removeButtons = sidePanel.getByRole('button', { name: 'Discard change' })
    await removeButtons.last().click()

    await expect(sidePanel.getByText('1 operation')).toBeVisible()

    await sidePanel.getByRole('button', { name: /^Save/ }).click()
    await expect(page.getByText('Changes saved successfully')).toBeVisible()

    await expect(page.getByRole('gridcell', { name: 'keep this row' })).toBeVisible()
    await expect(page.getByRole('gridcell', { name: 'remove this row' })).not.toBeVisible()
  })

  test('keyboard shortcuts work for queue operations', async ({ page, ref }) => {
    const tableName = `${tableNamePrefix}_shortcuts`
    const columnName = 'name'

    await using _ = await withSetupCleanup(
      async () => {
        await createTable(tableName, columnName)
      },
      async () => {
        await dropTable(tableName)
      }
    )
    await page.goto(toUrl(`/project/${ref}/editor?schema=public`))
    await enableQueueOperations(page)
    await page.reload()
    await waitForTableToLoad(page, ref)

    await page.getByRole('button', { name: `View ${tableName}`, exact: true }).click()
    await page.waitForURL(/\/editor\/\d+\?schema=public$/)

    await page.getByTestId('table-editor-insert-new-row').click()
    await page.getByRole('menuitem', { name: 'Insert row' }).click()
    await page.getByTestId(`${columnName}-input`).fill('shortcut test')
    await page.getByTestId('action-bar-save-row').click()

    await expect(page.getByText('1 pending change')).toBeVisible()

    await page.keyboard.press('ControlOrMeta+.')
    await expect(page.getByRole('dialog').getByText('Pending changes')).toBeVisible()

    await page.keyboard.press('ControlOrMeta+.')
    await expect(page.getByRole('dialog')).not.toBeVisible()
    await expect(page.getByText('pending change')).toBeVisible()

    await page.keyboard.press('ControlOrMeta+s')
    await expect(page.getByText('Changes saved successfully')).toBeVisible()

    await expect(page.getByRole('gridcell', { name: 'shortcut test' })).toBeVisible()
  })

  test('undo reverts the latest operation from the queue', async ({ page, ref }) => {
    const tableName = `${tableNamePrefix}_undo`
    const columnName = 'name'

    await using _ = await withSetupCleanup(
      async () => {
        await createTable(tableName, columnName, [{ name: 'existing row' }])
      },
      async () => {
        await dropTable(tableName)
      }
    )

    await page.goto(toUrl(`/project/${ref}/editor?schema=public`))
    await enableQueueOperations(page)
    await page.reload()
    await waitForTableToLoad(page, ref)

    await page.getByRole('button', { name: `View ${tableName}`, exact: true }).click()
    await page.waitForURL(/\/editor\/\d+\?schema=public$/)

    await expect(page.getByRole('gridcell', { name: 'existing row' })).toBeVisible()

    await page.getByTestId('table-editor-insert-new-row').click()
    await page.getByRole('menuitem', { name: 'Insert row' }).click()
    await page.getByTestId(`${columnName}-input`).fill('undo this row')
    await page.getByTestId('action-bar-save-row').click()

    await expect(page.getByText('1 pending change')).toBeVisible()
    await expect(page.getByRole('gridcell', { name: 'undo this row' })).toBeVisible()

    await page.keyboard.press('ControlOrMeta+z')

    await expect(page.getByText('pending change')).not.toBeVisible()
    await expect(page.getByRole('gridcell', { name: 'undo this row' })).not.toBeVisible()
    await expect(page.getByRole('gridcell', { name: 'existing row' })).toBeVisible()
  })

  test('undo reverts operations one at a time', async ({ page, ref }) => {
    const tableName = `${tableNamePrefix}_undo_multi`
    const columnName = 'name'

    await using _ = await withSetupCleanup(
      async () => {
        await createTable(tableName, columnName)
      },
      async () => {
        await dropTable(tableName)
      }
    )

    await page.goto(toUrl(`/project/${ref}/editor?schema=public`))
    await enableQueueOperations(page)
    await page.reload()
    await waitForTableToLoad(page, ref)

    await page.getByRole('button', { name: `View ${tableName}`, exact: true }).click()
    await page.waitForURL(/\/editor\/\d+\?schema=public$/)

    await page.getByTestId('table-editor-insert-new-row').click()
    await page.getByRole('menuitem', { name: 'Insert row' }).click()
    await page.getByTestId(`${columnName}-input`).fill('first row')
    await page.getByTestId('action-bar-save-row').click()

    await page.getByTestId('table-editor-insert-new-row').click()
    await page.getByRole('menuitem', { name: 'Insert row' }).click()
    await page.getByTestId(`${columnName}-input`).fill('second row')
    await page.getByTestId('action-bar-save-row').click()

    await expect(page.getByText('2 pending changes')).toBeVisible()

    await page.keyboard.press('ControlOrMeta+z')

    await expect(page.getByText('1 pending change')).toBeVisible()
    await expect(page.getByRole('gridcell', { name: 'first row' })).toBeVisible()
    await expect(page.getByRole('gridcell', { name: 'second row' })).not.toBeVisible()

    await page.keyboard.press('ControlOrMeta+z')

    await expect(page.getByText('pending change')).not.toBeVisible()
    await expect(page.getByRole('gridcell', { name: 'first row' })).not.toBeVisible()
  })

  test('undo works for cell edits', async ({ page, ref }) => {
    const tableName = `${tableNamePrefix}_undo_edit`
    const columnName = 'name'

    await using _ = await withSetupCleanup(
      async () => {
        await createTable(tableName, columnName, [{ name: 'original value' }])
      },
      async () => {
        await dropTable(tableName)
      }
    )

    await page.goto(toUrl(`/project/${ref}/editor?schema=public`))
    await enableQueueOperations(page)
    await page.reload()
    await waitForTableToLoad(page, ref)

    await page.getByRole('button', { name: `View ${tableName}`, exact: true }).click()
    await page.waitForURL(/\/editor\/\d+\?schema=public$/)

    await expect(page.getByRole('gridcell', { name: 'original value' })).toBeVisible()

    const cell = page.getByRole('gridcell', { name: 'original value' })
    await cell.dblclick()

    const editor = page.getByRole('textbox', { name: /Editor content/ })
    await expect(editor).toBeVisible()
    await editor.fill('edited value')
    await page.keyboard.press('Enter')

    await expect(page.getByText('1 pending change')).toBeVisible()

    await page.keyboard.press('ControlOrMeta+z')

    await expect(page.getByText('pending change')).not.toBeVisible()
    await expect(page.getByRole('gridcell', { name: 'original value' })).toBeVisible()
    await expect(page.getByRole('gridcell', { name: 'edited value' })).not.toBeVisible()
  })

  test('undo works for row deletes', async ({ page, ref }) => {
    const tableName = `${tableNamePrefix}_undo_del`
    const columnName = 'name'

    await using _ = await withSetupCleanup(
      async () => {
        await createTable(tableName, columnName, [{ name: 'row to keep' }])
      },
      async () => {
        await dropTable(tableName)
      }
    )

    await page.goto(toUrl(`/project/${ref}/editor?schema=public`))
    await enableQueueOperations(page)
    await page.reload()
    await waitForTableToLoad(page, ref)

    await page.getByRole('button', { name: `View ${tableName}`, exact: true }).click()
    await page.waitForURL(/\/editor\/\d+\?schema=public$/)

    await expect(page.getByRole('gridcell', { name: 'row to keep' })).toBeVisible()

    const cell = page.getByRole('gridcell', { name: 'row to keep' })
    await cell.click({ button: 'right' })
    await page.getByRole('menuitem', { name: 'Delete row' }).click()

    await expect(page.getByText('1 pending change')).toBeVisible()

    await page.keyboard.press('ControlOrMeta+z')

    await expect(page.getByText('pending change')).not.toBeVisible()
    await expect(page.getByRole('gridcell', { name: 'row to keep' })).toBeVisible()
  })

  test('row deletes via context menu are queued', async ({ page, ref }) => {
    const tableName = `${tableNamePrefix}_row_delete`
    const columnName = 'name'

    await using _ = await withSetupCleanup(
      async () => {
        await createTable(tableName, columnName, [{ name: 'row to delete' }])
      },
      async () => {
        await dropTable(tableName)
      }
    )

    await page.goto(toUrl(`/project/${ref}/editor?schema=public`))
    await enableQueueOperations(page)
    await page.reload()
    await waitForTableToLoad(page, ref)

    await page.getByRole('button', { name: `View ${tableName}`, exact: true }).click()
    await page.waitForURL(/\/editor\/\d+\?schema=public$/)

    await expect(page.getByRole('gridcell', { name: 'row to delete' })).toBeVisible()

    const cell = page.getByRole('gridcell', { name: 'row to delete' })
    await cell.click({ button: 'right' })

    await page.getByRole('menuitem', { name: 'Delete row' }).click()

    await expect(page.getByText('1 pending change')).toBeVisible()

    await clickReview(page)

    const sidePanel = page.getByRole('dialog')
    await expect(sidePanel.getByText('Pending changes')).toBeVisible()
    await expect(sidePanel.getByText('1 row deletion')).toBeVisible()
    await expect(sidePanel.getByText('Delete row', { exact: true })).toBeVisible()

    await sidePanel.getByRole('button', { name: /^Save/ }).click()
    await expect(page.getByText('Changes saved successfully')).toBeVisible()

    await expect(page.getByRole('gridcell', { name: 'row to delete' })).not.toBeVisible()
    await expect(page.getByText('0 records')).toBeVisible()
  })

  test('row deletes can be cancelled', async ({ page, ref }) => {
    const tableName = `${tableNamePrefix}_delete_cancel`
    const columnName = 'name'

    await using _ = await withSetupCleanup(
      async () => {
        await createTable(tableName, columnName, [{ name: 'should not be deleted' }])
      },
      async () => {
        await dropTable(tableName)
      }
    )

    await page.goto(toUrl(`/project/${ref}/editor?schema=public`))
    await enableQueueOperations(page)
    await page.reload()
    await waitForTableToLoad(page, ref)

    await page.getByRole('button', { name: `View ${tableName}`, exact: true }).click()
    await page.waitForURL(/\/editor\/\d+\?schema=public$/)

    const cell = page.getByRole('gridcell', { name: 'should not be deleted' })
    await cell.click({ button: 'right' })
    await page.getByRole('menuitem', { name: 'Delete row' }).click()

    await expect(page.getByText('1 pending change')).toBeVisible()

    await clickDiscard(page)

    const confirmDialog = page.getByRole('alertdialog')
    await expect(confirmDialog.getByRole('heading', { name: 'Unsaved changes' })).toBeVisible()
    await confirmDialog.getByRole('button', { name: 'Discard changes' }).click()

    await expect(page.getByRole('gridcell', { name: 'should not be deleted' })).toBeVisible()
    await expect(page.getByText('pending change')).not.toBeVisible()
  })

  test('mixed operations (add, edit, delete) can be batched', async ({ page, ref }) => {
    const tableName = `${tableNamePrefix}_mixed_ops`
    const columnName = 'name'
    await using _ = await withSetupCleanup(
      async () => {
        await createTable(tableName, columnName, [
          { name: 'row to edit' },
          { name: 'row to delete' },
        ])
      },
      async () => {
        await dropTable(tableName)
      }
    )

    await page.goto(toUrl(`/project/${ref}/editor?schema=public`))
    await enableQueueOperations(page)
    await page.reload()
    await waitForTableToLoad(page, ref)

    await page.getByRole('button', { name: `View ${tableName}`, exact: true }).click()
    await page.waitForURL(/\/editor\/\d+\?schema=public$/)

    const cellToEdit = page.getByRole('gridcell', { name: 'row to edit' })
    await cellToEdit.dblclick()
    const editor = page.getByRole('textbox', { name: /Editor content/ })
    await editor.fill('edited row')
    await page.keyboard.press('Enter')

    const cellToDelete = page.getByRole('gridcell', { name: 'row to delete' })
    await cellToDelete.click({ button: 'right' })
    await page.getByRole('menuitem', { name: 'Delete row' }).click()

    await page.getByTestId('table-editor-insert-new-row').click()
    await page.getByRole('menuitem', { name: 'Insert row' }).click()
    await page.getByTestId(`${columnName}-input`).fill('new row')
    await page.getByTestId('action-bar-save-row').click()

    await expect(page.getByText('3 pending changes')).toBeVisible()

    await clickReview(page)
    const sidePanel = page.getByRole('dialog')
    await expect(sidePanel.getByText('3 operations')).toBeVisible()
    await expect(sidePanel.getByText('1 row deletion')).toBeVisible()
    await expect(sidePanel.getByText('1 row addition')).toBeVisible()
    await expect(sidePanel.getByText('1 cell edit')).toBeVisible()

    await sidePanel.getByRole('button', { name: /^Save/ }).click()
    await expect(page.getByText('Changes saved successfully')).toBeVisible()

    await expect(page.getByRole('gridcell', { name: 'edited row' })).toBeVisible()
    await expect(page.getByRole('gridcell', { name: 'new row' })).toBeVisible()
    await expect(page.getByRole('gridcell', { name: 'row to delete' })).not.toBeVisible()
    await expect(page.getByRole('gridcell', { name: 'row to edit' })).not.toBeVisible()
  })

  test('newly added row is preserved after deleting another row', async ({ page, ref }) => {
    const tableName = `${tableNamePrefix}_add_then_del`
    const columnName = 'name'

    await using _ = await withSetupCleanup(
      async () => {
        await createTable(tableName, columnName, [{ name: 'existing row' }])
      },
      async () => {
        await dropTable(tableName)
      }
    )

    await page.goto(toUrl(`/project/${ref}/editor?schema=public`))
    await enableQueueOperations(page)
    await page.reload()
    await waitForTableToLoad(page, ref)

    await page.getByRole('button', { name: `View ${tableName}`, exact: true }).click()
    await page.waitForURL(/\/editor\/\d+\?schema=public$/)

    // Add a new row
    await page.getByTestId('table-editor-insert-new-row').click()
    await page.getByRole('menuitem', { name: 'Insert row' }).click()
    await page.getByTestId(`${columnName}-input`).fill('new row')
    await page.getByTestId('action-bar-save-row').click()

    await expect(page.getByText('1 pending change')).toBeVisible()
    await expect(page.getByRole('gridcell', { name: 'new row' })).toBeVisible()

    // Delete the existing row
    const cellToDelete = page.getByRole('gridcell', { name: 'existing row' })
    await cellToDelete.click({ button: 'right' })
    await page.getByRole('menuitem', { name: 'Delete row' }).click()

    await expect(page.getByText('2 pending changes')).toBeVisible()

    // The newly added row should still be visible and not replaced
    await expect(page.getByRole('gridcell', { name: 'new row' })).toBeVisible()

    // Save and verify
    await clickReview(page)
    const sidePanel = page.getByRole('dialog')
    await expect(sidePanel.getByText('1 row addition')).toBeVisible()
    await expect(sidePanel.getByText('1 row deletion')).toBeVisible()

    await sidePanel.getByRole('button', { name: /^Save/ }).click()
    await expect(page.getByText('Changes saved successfully')).toBeVisible()

    await expect(page.getByRole('gridcell', { name: 'new row' })).toBeVisible()
    await expect(page.getByRole('gridcell', { name: 'existing row' })).not.toBeVisible()
  })

  test('pending changes persist when switching between tables', async ({ page, ref }) => {
    const tableName1 = `${tableNamePrefix}_persist1`
    const tableName2 = `${tableNamePrefix}_persist2`
    const columnName = 'name'

    await using _ = await withSetupCleanup(
      async () => {
        await createTable(tableName1, columnName)
        await createTable(tableName2, columnName)
      },
      async () => {
        await dropTable(tableName1)
        await dropTable(tableName2)
      }
    )

    await page.goto(toUrl(`/project/${ref}/editor?schema=public`))
    await enableQueueOperations(page)
    await page.reload()
    await waitForTableToLoad(page, ref)

    await page.getByRole('button', { name: `View ${tableName1}`, exact: true }).click()
    await page.waitForURL(/\/editor\/\d+\?schema=public$/)

    await page.getByTestId('table-editor-insert-new-row').click()
    await page.getByRole('menuitem', { name: 'Insert row' }).click()
    await page.getByTestId(`${columnName}-input`).fill('pending in table 1')
    await page.getByTestId('action-bar-save-row').click()

    await expect(page.getByText('1 pending change')).toBeVisible()

    await page.getByRole('button', { name: `View ${tableName2}`, exact: true }).click()

    await page.getByTestId('table-editor-insert-new-row').click()
    await page.getByRole('menuitem', { name: 'Insert row' }).click()
    await page.getByTestId(`${columnName}-input`).fill('pending in table 2')
    await page.getByTestId('action-bar-save-row').click()

    await expect(page.getByText('2 pending changes')).toBeVisible()

    await clickReview(page)
    const sidePanel = page.getByRole('dialog')
    await expect(sidePanel.getByText('2 operations')).toBeVisible()

    await sidePanel.getByRole('button', { name: /^Save/ }).click()
    await expect(page.getByText('Changes saved successfully')).toBeVisible()

    await page.getByRole('button', { name: `View ${tableName1}`, exact: true }).click()
    await expect(page.getByRole('gridcell', { name: 'pending in table 1' })).toBeVisible()

    await page.getByRole('button', { name: `View ${tableName2}`, exact: true }).click()
    await expect(page.getByRole('gridcell', { name: 'pending in table 2' })).toBeVisible()
  })

  test('pending row changes do not leak across tables', async ({ page, ref }) => {
    const tableName1 = `${tableNamePrefix}_leak1`
    const tableName2 = `${tableNamePrefix}_leak2`
    const columnName = 'name'

    await using _ = await withSetupCleanup(
      async () => {
        await createTable(tableName1, columnName)
        await createTable(tableName2, columnName)
      },
      async () => {
        await dropTable(tableName1)
        await dropTable(tableName2)
      }
    )

    await page.goto(toUrl(`/project/${ref}/editor?schema=public`))
    await enableQueueOperations(page)
    await page.reload()
    await waitForTableToLoad(page, ref)

    await page.getByRole('button', { name: `View ${tableName1}`, exact: true }).click()
    await page.waitForURL(/\/editor\/\d+\?schema=public$/)

    await page.getByTestId('table-editor-insert-new-row').click()
    await page.getByRole('menuitem', { name: 'Insert row' }).click()
    await page.getByTestId(`${columnName}-input`).fill('only in table 1')
    await page.getByTestId('action-bar-save-row').click()

    await expect(page.getByText('1 pending change')).toBeVisible()

    // Navigate to table 2 — pending row from table 1 should not appear
    await page.getByRole('button', { name: `View ${tableName2}`, exact: true }).click()
    await expect(page.getByRole('gridcell', { name: 'only in table 1' })).not.toBeVisible()

    // Add a row in table 2
    await page.getByTestId('table-editor-insert-new-row').click()
    await page.getByRole('menuitem', { name: 'Insert row' }).click()
    await page.getByTestId(`${columnName}-input`).fill('only in table 2')
    await page.getByTestId('action-bar-save-row').click()

    // Navigate back to table 1 — pending row from table 2 should not appear
    await page.getByRole('button', { name: `View ${tableName1}`, exact: true }).click()
    await expect(page.getByRole('gridcell', { name: 'only in table 1' })).toBeVisible()
    await expect(page.getByRole('gridcell', { name: 'only in table 2' })).not.toBeVisible()
  })

  test('reverted cell edit clears the pending change', async ({ page, ref }) => {
    const tableName = `${tableNamePrefix}_revert_edit`
    const columnName = 'name'

    await using _ = await withSetupCleanup(
      async () => {
        await createTable(tableName, columnName, [{ name: 'original value' }])
      },
      async () => {
        await dropTable(tableName)
      }
    )

    await page.goto(toUrl(`/project/${ref}/editor?schema=public`))
    await enableQueueOperations(page)
    await page.reload()
    await waitForTableToLoad(page, ref)

    await page.getByRole('button', { name: `View ${tableName}`, exact: true }).click()
    await page.waitForURL(/\/editor\/\d+\?schema=public$/)

    await expect(page.getByRole('gridcell', { name: 'original value' })).toBeVisible()

    // Edit the cell to a different value
    const cell = page.getByRole('gridcell', { name: 'original value' })
    await cell.dblclick()

    const editor = page.getByRole('textbox', { name: /Editor content/ })
    await expect(editor).toBeVisible()
    await editor.fill('changed value')
    await page.keyboard.press('Enter')

    await expect(page.getByText('1 pending change')).toBeVisible()

    // Edit the cell back to the original value
    const changedCell = page.getByRole('gridcell', { name: 'changed value' })
    await changedCell.dblclick()

    const editor2 = page.getByRole('textbox', { name: /Editor content/ })
    await expect(editor2).toBeVisible()
    await editor2.fill('original value')
    await page.keyboard.press('Enter')

    // The pending change should be cleared since the value was reverted
    await expect(page.getByText('pending change')).not.toBeVisible()
  })

  test('editing multiple columns via side panel queues all changes', async ({ page, ref }) => {
    const tableName = `${tableNamePrefix}_multi_col`

    await using _ = await withSetupCleanup(
      async () => {
        await query(
          `CREATE TABLE IF NOT EXISTS ${tableName} (
            id bigint generated by default as identity primary key,
            created_at timestamp with time zone null default now(),
            first_name text,
            last_name text
          )`
        )
        await query(`INSERT INTO ${tableName} (first_name, last_name) VALUES ($1, $2)`, [
          'Alice',
          'Smith',
        ])
      },
      async () => {
        await dropTable(tableName)
      }
    )

    await page.goto(toUrl(`/project/${ref}/editor?schema=public`))
    await enableQueueOperations(page)
    await page.reload()
    await waitForTableToLoad(page, ref)

    await page.getByRole('button', { name: `View ${tableName}`, exact: true }).click()
    await page.waitForURL(/\/editor\/\d+\?schema=public$/)

    await expect(page.getByRole('gridcell', { name: 'Alice' })).toBeVisible()
    await expect(page.getByRole('gridcell', { name: 'Smith' })).toBeVisible()

    // Right-click to open context menu and edit the row
    const cell = page.getByRole('gridcell', { name: 'Alice' })
    await cell.click({ button: 'right' })
    await page.getByRole('menuitem', { name: 'Edit row' }).click()

    // Update both columns in the side panel
    const firstNameInput = page.getByTestId('first_name-input')
    await expect(firstNameInput).toBeVisible()
    await firstNameInput.clear()
    await firstNameInput.fill('Bob')

    const lastNameInput = page.getByTestId('last_name-input')
    await lastNameInput.clear()
    await lastNameInput.fill('Jones')

    await page.getByTestId('action-bar-save-row').click()

    // Should queue 2 cell edits (one per changed column)
    await expect(page.getByText('2 pending changes')).toBeVisible()

    // Both values should be optimistically updated in the grid
    await expect(page.getByRole('gridcell', { name: 'Bob' })).toBeVisible()
    await expect(page.getByRole('gridcell', { name: 'Jones' })).toBeVisible()

    // Review the queued operations
    await clickReview(page)

    const sidePanel = page.getByRole('dialog')
    await expect(sidePanel.getByText('2 cell edits')).toBeVisible()

    // Save all changes
    await sidePanel.getByRole('button', { name: /^Save/ }).click()
    await expect(page.getByText('Changes saved successfully')).toBeVisible()

    // Both columns should reflect the saved values
    await expect(page.getByRole('gridcell', { name: 'Bob' })).toBeVisible()
    await expect(page.getByRole('gridcell', { name: 'Jones' })).toBeVisible()
    await expect(page.getByRole('gridcell', { name: 'Alice' })).not.toBeVisible()
    await expect(page.getByRole('gridcell', { name: 'Smith' })).not.toBeVisible()
  })
})
