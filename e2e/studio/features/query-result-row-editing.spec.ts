import { expect } from '@playwright/test'

import { query } from '../utils/db/index.js'
import { openExplorerQuery } from '../utils/query-editor-helpers.js'
import { test } from '../utils/test.js'

test('edits a query result row and protects unsaved changes with mouse and keyboard', async ({
  page,
  ref,
}, testInfo) => {
  const table = `pw_query_result_rows_${testInfo.workerIndex}_${Date.now()}`
  await query(
    `create table public.${table} (id integer primary key, name text not null, hidden text)`
  )
  try {
    await query(`insert into public.${table} values (1, 'Before', 'Keep this')`)
    await openExplorerQuery(page, ref, `select id as key, name as label from public.${table}`)
    const edit = page.getByRole('button', { name: 'Edit row', exact: true })
    await expect(edit, 'Results with a primary key should have a row edit action').toBeVisible()
    await edit.click()
    const sheet = page.getByTestId('side-panel-row-editor')
    await expect(
      sheet.getByTestId('hidden-input'),
      'The sheet should load columns omitted from the query'
    ).toHaveValue('Keep this')
    await sheet.getByTestId('id-input').fill('2')
    await sheet.getByTestId('name-input').fill('After')
    await sheet.getByRole('button', { name: 'Save', exact: true }).click()
    await expect(sheet, 'Saving should close the row sheet').not.toBeVisible()
    await expect(page.getByRole('gridcell', { name: 'After', exact: true })).toBeVisible()
    await expect
      .poll(() => query(`select * from public.${table}`))
      .toEqual([{ id: 2, name: 'After', hidden: 'Keep this' }])

    await edit.focus()
    await page.keyboard.press('Enter')
    await expect(sheet, 'The row action should work from the keyboard').toBeVisible()
    await sheet.getByTestId('name-input').fill('Discard me')
    await page.keyboard.press('Escape')
    await expect(page.getByRole('alertdialog')).toContainText('Unsaved changes')
    await page.getByRole('button', { name: 'Keep editing' }).click()
    await expect(sheet.getByTestId('name-input')).toHaveValue('Discard me')
    await sheet.getByRole('button', { name: 'Cancel', exact: true }).click()
    await page.getByRole('button', { name: 'Discard changes' }).click()
    await expect(sheet).not.toBeVisible()
    await expect.poll(() => query(`select name from public.${table}`)).toEqual([{ name: 'After' }])

    await openExplorerQuery(page, ref, `select name from public.${table}`)
    await expect(page.getByRole('gridcell', { name: 'After', exact: true })).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Edit row', exact: true }),
      'Results missing their primary key should remain read-only'
    ).toHaveCount(0)
  } finally {
    await query(`drop table public.${table}`)
  }
})
