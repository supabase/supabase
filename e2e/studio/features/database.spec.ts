import { expect } from '@playwright/test'

import { env } from '../env.config.js'
import { expectClipboardValue } from '../utils/clipboard.js'
import { createTable, dropTable, query } from '../utils/db/index.js'
import { test, withSetupCleanup } from '../utils/test.js'
import { toUrl } from '../utils/to-url.js'
import {
  createApiResponseWaiter,
  waitForApiResponse,
  waitForDatabaseToLoad,
} from '../utils/wait-for-response.js'

test.describe('Database', () => {
  test.describe('Schema Visualizer', () => {
    test('actions works as expected', async ({ page, ref }) => {
      const databaseTableName = 'pw_database_schema_table'
      const databaseColumnName = 'pw_database_schema_column'
      await using _ = await withSetupCleanup(
        async () => {
          await createTable(databaseTableName, databaseColumnName)
        },
        async () => {
          await dropTable(databaseTableName)
        }
      )
      const wait = createApiResponseWaiter(
        page,
        'pg-meta',
        ref,
        'tables?include_columns=true&included_schemas=public'
      )
      await page.goto(toUrl(`/project/${env.PROJECT_REF}/database/schemas?schema=public`))
      await wait

      // validates table and column exists
      await expect(page.getByText(databaseTableName, { exact: true })).toBeVisible()
      await expect(page.getByText(databaseColumnName, { exact: true })).toBeVisible()

      // copies schema definition to clipboard
      await page.getByRole('button', { name: 'Copy as SQL' }).click()
      await expect(page.getByTestId('copy-sql-ready')).toBeVisible()
      await expectClipboardValue({
        page,
        value: `CREATE TABLE public.${databaseTableName} (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  ${databaseColumnName} text,
  CONSTRAINT ${databaseTableName}_pkey PRIMARY KEY (id)
);`,
      })

      // downloads schema diagram when export is triggered
      const downloadPromise = page.waitForEvent('download')
      await page.getByRole('button', { name: 'Export options' }).click()
      await page.getByRole('menuitem', { name: 'Download as PNG' }).click()
      const download = await downloadPromise
      expect(download.suggestedFilename()).toContain('.png')

      // changing schema -> auth
      await page.getByTestId('schema-selector').click()
      await page.getByRole('option', { name: 'auth' }).click()
      await waitForDatabaseToLoad(page, ref, 'auth')
      await expect(page.getByText('users', { exact: true })).toBeVisible()
      await expect(page.getByText('sso_providers', { exact: true })).toBeVisible()
      await expect(page.getByText('saml_providers', { exact: true })).toBeVisible()
    })

    test('table actions work as expected', async ({ page, ref }) => {
      const databaseTableName = 'pw_database_schema_table_actions'
      const databaseColumnName = 'pw_database_schema_column_table_actions'
      await using _ = await withSetupCleanup(
        async () => {
          await createTable(databaseTableName, databaseColumnName)
        },
        async () => {
          await dropTable(databaseTableName)
        }
      )
      const wait = createApiResponseWaiter(
        page,
        'pg-meta',
        ref,
        'tables?include_columns=true&included_schemas=public'
      )
      await page.goto(toUrl(`/project/${env.PROJECT_REF}/database/schemas?schema=public`))
      await wait

      // validates table and column exists
      await expect(page.getByText(databaseTableName, { exact: true })).toBeVisible()
      // test we can edit the column
      const tableActionsButton = page.getByRole('button', {
        name: `${databaseTableName} actions`,
      })
      await tableActionsButton.click()
      const editTableMenuItem = page.getByRole('menuitem', { name: 'Edit table' })
      await expect(editTableMenuItem).toBeVisible()
      await editTableMenuItem.press('Enter')
      await expect(editTableMenuItem).not.toBeVisible()
      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible()
      await expect(dialog.getByText('timestamptz')).toBeVisible()
      // FIXME: For some reason, the dialog is not stable and rerenders, sometimes preventing the description to be filled
      await page.waitForTimeout(500)
      await page.getByLabel('Description').fill('Bazinga')
      await page.getByRole('button', { name: 'Save' }).click()
      await expect(page.getByText(`Successfully updated ${databaseTableName}!`)).toBeVisible()
      await expect(page.getByRole('dialog')).not.toBeVisible()

      // test the schema view has been refreshed
      await tableActionsButton.click()
      await expect(editTableMenuItem).toBeVisible()
      await editTableMenuItem.press('Enter')
      await expect(editTableMenuItem).not.toBeVisible()
      await expect(page.getByRole('dialog')).toBeVisible()
      await expect(page.getByLabel('Description')).toHaveValue('Bazinga')
      await page.getByRole('button', { name: 'Cancel' }).click()
      await expect(page.getByRole('dialog')).not.toBeVisible()

      await tableActionsButton.click()
      const copyTableNameMenuItem = page.getByRole('menuitem', { name: 'Copy name' })
      await expect(copyTableNameMenuItem).toBeVisible()
      await copyTableNameMenuItem.press('Enter')
      await expect(copyTableNameMenuItem).not.toBeVisible()
      await expectClipboardValue({ page, value: databaseTableName, exact: true })

      await tableActionsButton.click()
      const viewInTableEditorMenuItem = page.getByRole('menuitem', {
        name: 'View in Table Editor',
      })
      await expect(viewInTableEditorMenuItem).toBeVisible()
      await viewInTableEditorMenuItem.press('Enter')
      await page.waitForURL(/.*\/editor\/\d+/)
      await expect(page.getByRole('tab', { name: databaseTableName })).toBeVisible()
    })

    test('columns actions work as expected', async ({ page, ref }) => {
      const databaseTableName = 'pw_database_schema_columns_actions'
      const databaseColumnName = 'pw_database_schema_column_actions'
      await using _ = await withSetupCleanup(
        async () => {
          await createTable(databaseTableName, databaseColumnName)
        },
        async () => {
          await dropTable(databaseTableName)
        }
      )
      const wait = createApiResponseWaiter(
        page,
        'pg-meta',
        ref,
        'tables?include_columns=true&included_schemas=public'
      )
      await page.goto(toUrl(`/project/${env.PROJECT_REF}/database/schemas?schema=public`))
      await wait

      // validates table and column exists
      await expect(page.getByText(databaseTableName, { exact: true })).toBeVisible()
      await expect(page.getByText(databaseColumnName, { exact: true })).toBeVisible()
      // test we can edit the column
      const columnActionsButton = page.getByRole('button', {
        name: `${databaseTableName} ${databaseColumnName} actions`,
      })
      await columnActionsButton.click()
      const editColumnMenuItem = page.getByRole('menuitem', { name: 'Edit column' })
      await expect(editColumnMenuItem).toBeVisible()
      await editColumnMenuItem.press('Enter')
      await page.getByLabel('Description').fill('Bazinga')
      await page.getByRole('button', { name: 'Save' }).click()
      await expect(
        page.getByText(`Successfully updated column "${databaseColumnName}"`)
      ).toBeVisible()
      await expect(page.getByRole('dialog')).not.toBeVisible()

      // test the schema view has been refreshed
      await columnActionsButton.click()
      await expect(editColumnMenuItem).toBeVisible()
      await editColumnMenuItem.press('Enter')
      await expect(page.getByLabel('Description')).toHaveValue('Bazinga')
      await page.getByRole('button', { name: 'Cancel' }).click()
      await expect(page.getByRole('dialog')).not.toBeVisible()

      await columnActionsButton.click()
      const copyColumnNameMenuItem = page.getByRole('menuitem', { name: 'Copy name' })
      await expect(copyColumnNameMenuItem).toBeVisible()
      await copyColumnNameMenuItem.press('Enter')
      await expectClipboardValue({ page, value: databaseColumnName, exact: true })
    })
  })

  test.describe('Tables', () => {
    test('actions works as expected', async ({ page, ref }) => {
      const databaseTableName = 'pw_database_table_actions'
      const databaseColumnName = 'pw_database_column_actions'
      await using _ = await withSetupCleanup(
        async () => {
          await createTable(databaseTableName, databaseColumnName)
        },
        async () => {
          await dropTable(databaseTableName)
        }
      )
      const wait = createApiResponseWaiter(
        page,
        'pg-meta',
        ref,
        'tables?include_columns=true&included_schemas=public'
      )
      await page.goto(toUrl(`/project/${env.PROJECT_REF}/database/tables?schema=public`))
      await wait

      // check new table button is present in public schema
      await expect(page.getByRole('button', { name: 'New table' })).toBeVisible()

      // validates database name is present and has accurate number of columns
      const tableRow = page
        .getByRole('row')
        .filter({ has: page.getByText(databaseTableName, { exact: true }) })
        .first()
      await expect(tableRow).toContainText(databaseTableName)
      await expect(tableRow.getByRole('cell').filter({ hasText: /^3$/ }).first()).toBeVisible()
      await expect(tableRow.getByRole('link', { name: 'View columns' })).toBeVisible()

      // change schema -> auth
      await page.getByTestId('schema-selector').click()
      await page.getByPlaceholder('Find schema...').fill('auth')
      const authSchemaWait = createApiResponseWaiter(
        page,
        'pg-meta',
        ref,
        'tables?include_columns=true&included_schemas=auth'
      )
      await page.getByRole('option', { name: 'auth' }).click()
      await authSchemaWait
      await expect(page.getByText('sso_providers')).toBeVisible()
      // check new table button is not present in other schemas
      await expect(page.getByRole('button', { name: 'New table' })).not.toBeVisible()

      // filter by querying
      await page.getByRole('textbox', { name: 'Search for a table' }).fill('mfa')
      await expect(page.getByText('sso_providers')).not.toBeVisible()
      await expect(page.getByText('mfa_factors')).toBeVisible()
    })

    test('CRUD operations and copy works as expected', async ({ page, ref }) => {
      const databaseTableName = 'pw_database_table_crud_table'
      const databaseTableNameNew = 'pw_database_table_crud_new'
      const databaseTableNameUpdated = 'pw_database_table_crud_updated'
      const databaseTableNameDuplicate = 'pw_database_table_crud_duplicate'
      const databaseColumnName = 'pw_database_column_table_crud'

      await using _ = await withSetupCleanup(
        async () => {
          await createTable(databaseTableName, databaseColumnName)
        },
        async () => {
          // Cleanup the table in case the test failed at some point
          await dropTable(databaseTableName)
          await dropTable(databaseTableNameNew)
          await dropTable(databaseTableNameUpdated)
          await dropTable(databaseTableNameDuplicate)
        }
      )
      await page.goto(toUrl(`/project/${env.PROJECT_REF}/database/tables?schema=public`))
      // Wait for database tables to be populated
      await waitForDatabaseToLoad(page, ref)

      // create a new table
      await page.getByRole('button', { name: 'New table' }).click()
      await page.getByLabel('Name', { exact: true }).fill(databaseTableNameNew)
      const createTableWait = createApiResponseWaiter(
        page,
        'pg-meta',
        ref,
        'query?key=table-create'
      )
      await page.getByRole('button', { name: 'Save' }).click()

      // validate table creation
      await createTableWait
      await waitForDatabaseToLoad(page, ref)
      await expect(page.getByText(databaseTableNameNew, { exact: true })).toBeVisible()

      // edit a new table
      await page.getByRole('row', { name: databaseTableNameNew }).getByRole('button').last().click()
      await page.getByRole('menuitem', { name: 'Edit table' }).click()
      await page.getByTestId('table-name-input').fill(databaseTableNameUpdated)
      const updateTableWait = createApiResponseWaiter(
        page,
        'pg-meta',
        ref,
        'query?key=table-update'
      )
      await page.getByRole('button', { name: 'Save' }).click()

      // validate table update
      await updateTableWait
      await waitForDatabaseToLoad(page, ref)
      await expect(page.getByText(databaseTableNameUpdated, { exact: true })).toBeVisible()

      // duplicate table
      await page
        .getByRole('row', { name: databaseTableNameUpdated })
        .getByRole('button')
        .last()
        .click()
      await page.getByRole('menuitem', { name: 'Duplicate Table' }).click()
      await page.getByLabel('Name').fill(databaseTableNameDuplicate)
      await page.getByLabel('Description').fill('')
      const duplicateTableWait = createApiResponseWaiter(page, 'pg-meta', ref, 'query?key=')
      await page.getByRole('button', { name: 'Save' }).click()

      // validate table duplicate
      await duplicateTableWait
      await waitForDatabaseToLoad(page, ref)
      await expect(page.getByText(databaseTableNameDuplicate, { exact: true })).toBeVisible()

      // delete tables
      await page
        .getByRole('row', { name: `${databaseTableNameDuplicate}` })
        .getByRole('button')
        .last()
        .click()
      await page.getByRole('menuitem', { name: 'Delete table' }).click()
      await page.getByRole('checkbox', { name: 'Drop table with cascade?' }).check()
      const deleteDuplicateWait = createApiResponseWaiter(
        page,
        'pg-meta',
        ref,
        'query?key=table-delete'
      )
      await page.getByRole('button', { name: 'Delete' }).click()
      await deleteDuplicateWait

      await page
        .getByRole('row', { name: `${databaseTableNameUpdated}` })
        .getByRole('button')
        .last()
        .click()
      await page.getByRole('menuitem', { name: 'Delete table' }).click()
      await page.getByRole('checkbox', { name: 'Drop table with cascade?' }).check()
      const deleteUpdatedWait = createApiResponseWaiter(
        page,
        'pg-meta',
        ref,
        'query?key=table-delete'
      )
      await page.getByRole('button', { name: 'Delete' }).click()
      await deleteUpdatedWait

      // validate navigating to table editor from database table page
      await page.getByRole('row', { name: databaseTableName }).getByRole('button').last().click()
      await page.getByRole('menuitem', { name: 'View in Table Editor' }).click()
      await page.waitForURL(/.*\/editor\/\d+/)
    })
  })

  test.describe('Tables columns', () => {
    test('can view, create, update, delete, and filter table columns', async ({ page, ref }) => {
      const databaseTableName = 'pw_database_columns_table'
      const databaseColumnName = 'pw_database_column_crud'
      const databaseColumnName2 = 'pw_database_column_crud_2'
      const databaseColumnName3 = 'pw_database_column_crud_3'

      await using _ = await withSetupCleanup(
        async () => {
          await createTable(databaseTableName, databaseColumnName)
        },
        async () => {
          await dropTable(databaseTableName)
        }
      )

      const databaseWait = createApiResponseWaiter(
        page,
        'pg-meta',
        ref,
        'tables?include_columns=true&included_schemas=public'
      )
      await page.goto(toUrl(`/project/${env.PROJECT_REF}/database/tables?schema=public`))

      // Wait for database tables to be populated
      await databaseWait

      // navigate to table columns
      const databaseRow = page.getByRole('row', { name: databaseTableName })
      await databaseRow.getByRole('link', { name: 'View columns' }).click()
      await page.waitForURL(/.*\/database\/tables\/\d+/)

      // validate and display everything correctly
      const columnDatabaseRow = page.getByRole('row', { name: databaseColumnName })
      await expect(columnDatabaseRow).toContainText(databaseColumnName)
      await expect(columnDatabaseRow).toContainText('text')

      // create a new table column
      await page.getByRole('button', { name: 'New column' }).click()
      await expect(page.getByRole('dialog')).toBeVisible()
      await page.getByLabel('name').fill(databaseColumnName2)
      await page.getByText('Choose a column type...').click()
      await page.getByText('numeric', { exact: true }).click()
      const columnCreateWait = createApiResponseWaiter(
        page,
        'pg-meta',
        ref,
        'query?key=column-create'
      )
      const columnCreateRefreshWait = createApiResponseWaiter(
        page,
        'pg-meta',
        ref,
        'query?key=table-editor-'
      )
      await page.getByRole('button', { name: 'Save' }).click()

      // wait for response + validate
      await columnCreateWait
      await columnCreateRefreshWait
      const columnDatabase2Row = page.getByRole('row', { name: databaseColumnName2 })
      await expect(columnDatabase2Row).toContainText(databaseColumnName2)
      await expect(columnDatabase2Row).toContainText('numeric')

      // update table column
      await columnDatabase2Row.getByRole('button', { name: 'Edit' }).click()
      await page.getByLabel('name').fill(databaseColumnName3)
      const columnUpdateWait = createApiResponseWaiter(
        page,
        'pg-meta',
        ref,
        'query?key=column-update'
      )
      const columnUpdateRefreshWait = createApiResponseWaiter(
        page,
        'pg-meta',
        ref,
        'query?key=table-editor-'
      )
      await page.getByRole('button', { name: 'Save' }).click()

      // wait for response + validate
      await columnUpdateWait
      await columnUpdateRefreshWait

      // delete table column
      const columnDatabase3Row = page.getByRole('row', { name: databaseColumnName3 })
      await columnDatabase3Row.getByRole('button').last().click()
      await page.getByRole('menuitem', { name: 'Delete column' }).click()
      await page.getByRole('checkbox', { name: 'Drop column with cascade?' }).check()
      const columnDeleteWait = createApiResponseWaiter(
        page,
        'pg-meta',
        ref,
        'query?key=column-delete'
      )
      const columnDeleteRefreshWait = createApiResponseWaiter(
        page,
        'pg-meta',
        ref,
        'query?key=table-editor-'
      )
      await page.getByRole('button', { name: 'Delete' }).click()

      // wait for response + validate
      await columnDeleteWait
      await columnDeleteRefreshWait
      await expect(
        page.getByText(`Successfully deleted column "${databaseColumnName3}"`),
        'Delete confirmation toast should be visible'
      ).toBeVisible()

      // test filtering columns
      await page.getByRole('textbox', { name: 'Filter columns' }).fill('id')
      await expect(page.getByRole('row', { name: 'id' })).toBeVisible()
      await expect(page.getByRole('row', { name: databaseColumnName })).not.toBeVisible()
    })
  })

  test.describe('Triggers', () => {
    test('actions works as expected', async ({ page, ref }) => {
      await page.goto(toUrl(`/project/${env.PROJECT_REF}/database/triggers?schema=public`))

      // Wait for database triggers to be populated
      await waitForApiResponse(page, 'pg-meta', ref, 'triggers')

      const newTriggerButton = page.getByRole('button', { name: 'New trigger' }).first()
      // create new trigger button to exist in public schema
      await expect(newTriggerButton).toBeVisible()

      // change schema -> realtime
      await page.getByTestId('schema-selector').click()
      await page.getByPlaceholder('Find schema...').fill('realtime')
      await page.getByRole('option', { name: 'realtime', exact: true }).click()
      await expect(page.getByText('tr_check_filters')).toBeVisible()
      // create new trigger button does not exist in other schemas
      await expect(page.getByRole('button', { name: 'New trigger' })).not.toBeVisible()

      // filter by querying
      await page.getByRole('textbox', { name: 'Search for a trigger' }).fill('abc')
      await expect(page.getByText('tr_check_filters')).not.toBeVisible()
    })

    test('CRUD operations works as expected', async ({ page, ref }) => {
      const databaseTableName = 'pw_database_trigger_table'
      const databaseColumnName = 'pw_database_column_trigger'
      const databaseTriggerName = 'pw_database_trigger'
      const databaseTriggerNameUpdated = 'pw_database_trigger_updated'

      await using _ = await withSetupCleanup(
        async () => {
          await createTable(databaseTableName, databaseColumnName)
        },
        async () => {
          await query(`drop trigger if exists ${databaseTriggerName} on ${databaseTableName};`)
          await query(
            `drop trigger if exists ${databaseTriggerNameUpdated} on ${databaseTableName};`
          )
          await dropTable(databaseTableName)
        }
      )

      await page.goto(toUrl(`/project/${env.PROJECT_REF}/database/triggers?schema=public`))

      // Wait for database triggers to be populated
      await waitForApiResponse(page, 'pg-meta', ref, 'triggers')

      // create new trigger
      await page.getByRole('button', { name: 'New trigger' }).first().click()
      await page.getByRole('textbox', { name: 'Name of trigger' }).fill(databaseTriggerName)
      await page.getByRole('combobox').first().click()
      await page.getByRole('option', { name: `public.${databaseTableName}`, exact: true }).click()
      await page.getByRole('checkbox').first().click()
      await page.getByRole('checkbox').nth(1).click()
      await page.getByRole('checkbox').nth(2).click()
      await page.getByRole('button', { name: 'Choose a function to trigger' }).click()
      await page.getByRole('paragraph').filter({ hasText: 'subscription_check_filters' }).click()
      const triggerCreateWait = createApiResponseWaiter(
        page,
        'pg-meta',
        ref,
        'query?key=trigger-create'
      )
      await page.getByRole('button', { name: /^(Create|Save) trigger$/ }).click()

      // validate trigger creation
      await triggerCreateWait
      await expect(
        page.getByText(`Successfully created trigger`),
        'Trigger creation confirmation toast should be visible'
      ).toBeVisible({
        timeout: 50000,
      })
      const triggerRow = page.getByRole('row', { name: databaseTriggerName })
      await expect(triggerRow).toContainText('subscription_check_filters')
      await expect(triggerRow).toContainText(databaseTriggerName)

      // update trigger
      await triggerRow.getByRole('button', { name: 'More options' }).click()
      await page.getByRole('menuitem', { name: 'Edit trigger' }).click()
      await page.getByRole('textbox', { name: 'Name of trigger' }).fill(databaseTriggerNameUpdated)
      const triggerUpdateWait = createApiResponseWaiter(
        page,
        'pg-meta',
        ref,
        'query?key=trigger-update'
      )
      await page.getByRole('button', { name: /^(Create|Save) trigger$/ }).click()

      // validate trigger update
      await triggerUpdateWait
      await expect(
        page.getByText(`Successfully updated trigger`),
        'Trigger updated confirmation toast should be visible'
      ).toBeVisible({
        timeout: 50000,
      })
      const updatedTriggerRow = page.getByRole('row', { name: databaseTriggerNameUpdated })
      await expect(updatedTriggerRow).toContainText('subscription_check_filters')
      await expect(updatedTriggerRow).toContainText(databaseTriggerNameUpdated)

      // delete trigger
      await updatedTriggerRow.getByRole('button', { name: 'More options' }).click()
      await page.getByRole('menuitem', { name: 'Delete trigger' }).click()
      await page.getByPlaceholder('Type in name of trigger').fill(databaseTriggerNameUpdated)
      await page
        .getByRole('button', { name: `Delete trigger ${databaseTriggerNameUpdated}` })
        .click()
      await expect(
        page.getByText(`Successfully removed ${databaseTriggerNameUpdated}`),
        'Delete confirmation toast should be visible'
      ).toBeVisible({
        timeout: 50000,
      })
    })
  })

  test.describe('Database Indexes', () => {
    test('actions works as expected', async ({ page, ref }) => {
      await page.goto(toUrl(`/project/${env.PROJECT_REF}/database/indexes?schema=public`))

      // Wait for database indexes to be populated
      await waitForApiResponse(page, 'pg-meta', ref, 'query?key=indexes-public')

      // create new index button exists in public schema
      await expect(page.getByRole('button', { name: 'Create index' })).toBeVisible()

      // change schema -> auth
      await page.getByTestId('schema-selector').click()
      await page.getByPlaceholder('Find schema...').fill('auth')
      await page.getByRole('option', { name: 'auth' }).click()
      await page.waitForTimeout(2000)

      const ssoProvidersPkeyRow = page.getByRole('row', { name: 'sso_providers_pkey' })
      const confirmationTokenIdxRow = page.getByRole('row', { name: 'confirmation_token_idx' })
      const createIndexButton = page.getByRole('button', { name: 'Create index' }).first()

      await expect(ssoProvidersPkeyRow).toBeVisible()
      await expect(confirmationTokenIdxRow).toBeVisible()
      // create new index button does not exist in other schemas
      await expect(createIndexButton).not.toBeVisible()

      // filter by querying
      await page.getByRole('textbox', { name: 'Search for an index' }).fill('users')
      await page.waitForTimeout(2000)

      await expect(page.getByText('sso_providers_pkey')).not.toBeVisible()
      await expect(page.getByText('confirmation_token_idx')).toBeVisible()

      // check index definition
      await page
        .getByRole('row', { name: 'confirmation_token_idx' })
        .getByRole('button')
        .last()
        .click()
      await expect(
        page.getByText(
          `CREATE UNIQUE INDEX confirmation_token_idx ON auth.users USING btree (confirmation_token) WHERE ((confirmation_token)::text !~ '^[0-9 ]*$'::text)`
        )
      ).toBeVisible()
    })

    test('CRUD operations works as expected', async ({ page, ref }) => {
      const databaseTableName = 'pw_database_indexes_table'
      const databaseColumnName = 'pw_database_column_index'
      const databaseIndexName = 'pw_database_index'

      await using _ = await withSetupCleanup(
        async () => {
          await createTable(databaseTableName, databaseColumnName)
        },
        async () => {
          await query(`drop index if exists ${databaseIndexName};`)
          await dropTable(databaseTableName)
        }
      )
      const indexWait = waitForApiResponse(page, 'pg-meta', ref, 'query?key=indexes-public')
      await page.goto(toUrl(`/project/${env.PROJECT_REF}/database/indexes?schema=public`))

      // Wait for database indexes to be populated
      await indexWait

      // create new index
      await page.getByRole('button', { name: 'Create index' }).click()
      await page.getByRole('button', { name: 'Choose a table' }).click()

      const columnsWait = waitForApiResponse(
        page,
        'pg-meta',
        ref,
        `query?key=table-columns-public-${databaseTableName}`
      )
      await page.getByRole('option', { name: databaseTableName, exact: true }).click()
      await columnsWait

      await page.getByRole('combobox', { name: 'Select up to 32 columns' }).click()
      await page.getByRole('option', { name: databaseColumnName }).click()
      await page.getByRole('button', { name: 'Create index' }).click()
      await expect(
        page.getByText(`Successfully created index`),
        'Index creation confirmation toast should be visible.'
      ).toBeVisible({ timeout: 50000 })
      await expect(
        page.getByText(`${databaseTableName}_${databaseColumnName}_idx`, { exact: true })
      ).toBeVisible()

      // check index definition
      const newIndexRow = page.getByRole('row', {
        name: `${databaseTableName}_${databaseColumnName}_idx`,
      })
      await newIndexRow.getByRole('button', { name: 'View definition' }).click()
      await expect(
        page.getByText(
          `CREATE INDEX ${databaseTableName}_${databaseColumnName}_idx ON public.${databaseTableName} USING btree (${databaseColumnName})`
        )
      ).toBeVisible()
      await page.getByRole('button', { name: 'Cancel' }).click()

      // delete the index
      await newIndexRow.getByRole('button', { name: 'Delete index' }).click()
      const indexDeleteWait = createApiResponseWaiter(page, 'pg-meta', ref, 'query?key=indexes')
      await page.getByRole('button', { name: 'Confirm delete' }).click()
      await indexDeleteWait
      await expect(
        page.getByText('Successfully deleted index'),
        'Index deletion confirmation toast should be visible'
      ).toBeVisible({ timeout: 50000 })
    })
  })

  test.describe('Roles', () => {
    test('actions works as expected', async ({ page, ref }) => {
      await page.goto(toUrl(`/project/${env.PROJECT_REF}/database/roles`))

      // Wait for database roles list to be populated
      await waitForApiResponse(page, 'pg-meta', ref, 'query?key=database-roles')

      // filter between active and all roles
      await page.getByRole('button', { name: 'Active roles' }).click()
      await expect(page.getByRole('button', { name: 'supabase_admin' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'authenticator' })).toBeVisible()

      // filter by querying
      await page.getByRole('textbox', { name: 'Search for a role' }).fill('supabase')
      await expect(page.getByRole('button', { name: 'supabase_admin' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'authenticator' })).not.toBeVisible()
    })

    test('CRUD operations works as expected', async ({ page, ref }) => {
      const databaseRoleName = 'pw_database_role'
      await page.goto(toUrl(`/project/${env.PROJECT_REF}/database/roles`))

      // Wait for database roles to be populated
      await waitForApiResponse(page, 'pg-meta', ref, 'query?key=database-roles')

      // delete role if exists
      const exists = (await page.getByRole('button', { name: databaseRoleName }).count()) > 0
      if (exists) {
        await page.getByRole('button', { name: `${databaseRoleName} actions` }).click()
        await page.getByRole('menuitem', { name: 'Delete' }).click()
        await page.getByRole('button', { name: 'Submit' }).click()
        await expect(
          page.getByText(`Successfully deleted role`),
          'Delete confirmation toast should be visible'
        ).toBeVisible({ timeout: 50000 })
      }

      // create new role
      await page.getByRole('button', { name: 'Add role' }).click()
      await page.getByRole('textbox', { name: 'Name' }).fill(databaseRoleName)
      await page.getByRole('switch').nth(0).click()
      await page.getByRole('switch').nth(1).click()
      await page.getByRole('switch').nth(2).click()
      await page.getByRole('button', { name: 'Save' }).click()
      await expect(
        page.getByText(`Successfully created new role: ${databaseRoleName}`),
        'Create confirmation toast should be visible'
      ).toBeVisible({ timeout: 50000 })

      // delete a role
      await page.getByRole('button', { name: `${databaseRoleName} actions` }).click()
      await page.getByRole('menuitem', { name: 'Delete' }).click()
      const roleDeleteWait = createApiResponseWaiter(page, 'pg-meta', ref, 'query?key=roles-delete')
      await page.getByRole('button', { name: 'Submit' }).click()
      await roleDeleteWait
      await expect(
        page.getByText(`Successfully deleted role`),
        'Delete confirmation toast should be visible'
      ).toBeVisible({ timeout: 50000 })
    })
  })
})

test.describe('Database Extensions', () => {
  test.describe.configure({ mode: 'serial' })

  const EXTENSION_NAME = 'pgtap'

  test('can enable an extension', async ({ page, ref }) => {
    await query(`DROP EXTENSION IF EXISTS ${EXTENSION_NAME} CASCADE;`)

    const extensionsWait = createApiResponseWaiter(
      page,
      'pg-meta',
      ref,
      'query?key=database-extensions'
    )
    await page.goto(toUrl(`/project/${env.PROJECT_REF}/database/extensions`))
    await extensionsWait

    await page.getByPlaceholder('Search for an extension').fill(EXTENSION_NAME)

    const row = page.getByRole('row').filter({ hasText: EXTENSION_NAME }).first()
    await expect(row, 'Extension row should be visible').toBeVisible()

    await row.getByRole('switch').click()

    const dialog = page.getByRole('dialog')
    await expect(dialog, 'Enable extension dialog should be visible').toBeVisible()
    await expect(
      dialog.getByText(`Enable ${EXTENSION_NAME}`),
      'Dialog title should match extension name'
    ).toBeVisible()

    const enableWait = createApiResponseWaiter(page, 'pg-meta', ref, 'query?key=extension-create')
    const refetchWait = createApiResponseWaiter(
      page,
      'pg-meta',
      ref,
      'query?key=database-extensions'
    )
    await dialog.getByRole('button', { name: 'Enable extension' }).click()
    await enableWait
    await refetchWait

    await expect(
      page.getByText(`Extension "${EXTENSION_NAME}" is now enabled`),
      'Success toast should appear after enabling extension'
    ).toBeVisible({ timeout: 15000 })

    await expect(
      row.getByRole('switch'),
      'Extension switch should be checked after enabling'
    ).toBeChecked()
  })

  test('can disable an extension', async ({ page, ref }) => {
    const extensionsWait = createApiResponseWaiter(
      page,
      'pg-meta',
      ref,
      'query?key=database-extensions'
    )
    await page.goto(toUrl(`/project/${env.PROJECT_REF}/database/extensions`))
    await extensionsWait

    await page.getByPlaceholder('Search for an extension').fill(EXTENSION_NAME)

    const row = page.getByRole('row').filter({ hasText: EXTENSION_NAME }).first()
    await expect(row, 'Extension row should be visible').toBeVisible()

    await row.getByRole('switch').click()

    const dialog = page.getByRole('dialog')
    await expect(dialog, 'Disable confirmation dialog should be visible').toBeVisible()
    await expect(
      dialog.getByText('Confirm to disable extension'),
      'Dialog title should be correct'
    ).toBeVisible()

    const disableWait = createApiResponseWaiter(
      page,
      'pg-meta',
      ref,
      `query?key=extension-delete-${EXTENSION_NAME}`
    )
    const refetchWait = createApiResponseWaiter(
      page,
      'pg-meta',
      ref,
      'query?key=database-extensions'
    )
    await page.getByRole('button', { name: 'Disable' }).click()
    await disableWait
    await refetchWait

    await expect(
      page.getByText(`${EXTENSION_NAME} is off.`),
      'Success toast should appear after disabling extension'
    ).toBeVisible({ timeout: 15000 })

    await expect(
      row.getByRole('switch'),
      'Extension switch should be unchecked after disabling'
    ).not.toBeChecked()
  })

  test('can enable an extension in a different existing schema', async ({ page, ref }) => {
    await query(`DROP EXTENSION IF EXISTS ${EXTENSION_NAME} CASCADE;`)

    const extensionsWait = createApiResponseWaiter(
      page,
      'pg-meta',
      ref,
      'query?key=database-extensions'
    )
    await page.goto(toUrl(`/project/${env.PROJECT_REF}/database/extensions`))
    await extensionsWait

    await page.getByPlaceholder('Search for an extension').fill(EXTENSION_NAME)

    const row = page.getByRole('row').filter({ hasText: EXTENSION_NAME }).first()
    await expect(row, 'Extension row should be visible').toBeVisible()
    await row.getByRole('switch').click()

    const dialog = page.getByRole('dialog')
    await expect(dialog, 'Enable extension dialog should be visible').toBeVisible()

    // Change schema to 'public'
    await dialog.getByRole('combobox').click()
    await page.getByRole('option', { name: 'public', exact: true }).click()

    const enableWait = createApiResponseWaiter(page, 'pg-meta', ref, 'query?key=extension-create')
    const refetchWait = createApiResponseWaiter(
      page,
      'pg-meta',
      ref,
      'query?key=database-extensions'
    )
    await dialog.getByRole('button', { name: 'Enable extension' }).click()
    await enableWait
    await refetchWait

    await expect(
      page.getByText(`Extension "${EXTENSION_NAME}" is now enabled`),
      'Success toast should appear after enabling in public schema'
    ).toBeVisible({ timeout: 15000 })

    await expect(
      row.getByRole('switch'),
      'Extension switch should be checked after enabling in public schema'
    ).toBeChecked()

    // Cleanup
    await query(`DROP EXTENSION IF EXISTS ${EXTENSION_NAME} CASCADE;`)
  })

  test('can enable an extension in a new schema', async ({ page, ref }) => {
    await query(`DROP EXTENSION IF EXISTS ${EXTENSION_NAME} CASCADE;`)

    const extensionsWait = createApiResponseWaiter(
      page,
      'pg-meta',
      ref,
      'query?key=database-extensions'
    )
    await page.goto(toUrl(`/project/${env.PROJECT_REF}/database/extensions`))
    await extensionsWait

    await page.getByPlaceholder('Search for an extension').fill(EXTENSION_NAME)

    const row = page.getByRole('row').filter({ hasText: EXTENSION_NAME }).first()
    await expect(row, 'Extension row should be visible').toBeVisible()
    await row.getByRole('switch').click()

    const dialog = page.getByRole('dialog')
    await expect(dialog, 'Enable extension dialog should be visible').toBeVisible()

    // Select 'Create a new schema pgtap'
    await dialog.getByRole('combobox').click()
    await page.getByRole('option', { name: /Create a new schema/ }).click()

    const enableWait = createApiResponseWaiter(page, 'pg-meta', ref, 'query?key=extension-create')
    const refetchWait = createApiResponseWaiter(
      page,
      'pg-meta',
      ref,
      'query?key=database-extensions'
    )
    await dialog.getByRole('button', { name: 'Enable extension' }).click()
    await enableWait
    await refetchWait

    await expect(
      page.getByText(`Extension "${EXTENSION_NAME}" is now enabled`),
      'Success toast should appear after enabling in new schema'
    ).toBeVisible({ timeout: 15000 })

    await expect(
      row.getByRole('switch'),
      'Extension switch should be checked after enabling in new schema'
    ).toBeChecked()

    // Note: the created schema is owned by supabase_admin and cannot be dropped
    // by the test query helper (runs as postgres). The schema is left empty after
    // the extension is dropped and will be reused on subsequent runs via
    // CREATE SCHEMA IF NOT EXISTS in the enable SQL.
    await query(`DROP EXTENSION IF EXISTS ${EXTENSION_NAME} CASCADE;`)
  })

  test('cannot change the schema for extensions with a fixed default schema', async ({
    page,
    ref,
  }) => {
    const FIXED_SCHEMA_EXTENSION = 'pgmq'
    const FIXED_SCHEMA = 'pgmq'

    await query(`DROP EXTENSION IF EXISTS ${FIXED_SCHEMA_EXTENSION} CASCADE;`)

    const extensionsWait = createApiResponseWaiter(
      page,
      'pg-meta',
      ref,
      'query?key=database-extensions'
    )
    await page.goto(toUrl(`/project/${env.PROJECT_REF}/database/extensions`))
    await extensionsWait

    await page.getByPlaceholder('Search for an extension').fill(FIXED_SCHEMA_EXTENSION)

    const row = page.getByRole('row').filter({ hasText: FIXED_SCHEMA_EXTENSION }).first()
    await expect(row, 'Extension row should be visible').toBeVisible()
    await row.getByRole('switch').click()

    const dialog = page.getByRole('dialog')
    await expect(dialog, 'Enable extension dialog should be visible').toBeVisible()

    // Schema selector (combobox) should NOT be present for fixed-schema extensions
    await expect(
      dialog.getByRole('combobox'),
      'Schema selector should not be present for extensions with a fixed default schema'
    ).not.toBeVisible()

    // A disabled input showing the fixed schema should be present instead
    const schemaInput = dialog.getByRole('textbox')
    await expect(schemaInput, 'Fixed schema input should be visible').toBeVisible()
    await expect(schemaInput, 'Fixed schema input should be disabled').toBeDisabled()
    await expect(
      schemaInput,
      'Fixed schema input should display the required schema name'
    ).toHaveValue(FIXED_SCHEMA)

    // Helper text confirming the schema is required
    await expect(
      dialog.getByText(`Extension must be installed in the "${FIXED_SCHEMA}" schema.`),
      'Helper text should indicate the schema is required'
    ).toBeVisible()

    // Cancel without enabling
    await dialog.getByRole('button', { name: 'Cancel' }).click()
    await expect(dialog, 'Dialog should be closed after canceling').not.toBeVisible()
  })
})

test.describe('Database Enumerated Types', () => {
  test('actions works as expected', async ({ page, ref }) => {
    await page.goto(toUrl(`/project/${env.PROJECT_REF}/database/types?schema=public`))

    // Wait for database enumerated types to be populated
    // await waitForApiResponse(page, 'pg-meta', ref, 'query?key=schemas')
    await page.waitForLoadState('networkidle')

    // create new type button exists in public schema
    await expect(page.getByRole('button', { name: 'Create type' })).toBeVisible()

    // filter by schema
    await page.getByTestId('schema-selector').click()
    await page.getByPlaceholder('Find schema...').fill('auth')
    await page.getByRole('option', { name: 'auth' }).click()

    await expect(page.getByText('factor_type')).toBeVisible()
    await expect(page.getByText('code_challenge_method')).toBeVisible()
    // create new type button does not exist in other schemas
    await expect(page.getByRole('button', { name: 'Create type' })).not.toBeVisible()

    // filter by querying
    await page.getByRole('textbox', { name: 'Search for a type' }).fill('code')
    await expect(page.getByText('factor_type')).not.toBeVisible()
    await expect(page.getByText('code_challenge_method')).toBeVisible()
  })

  test('CRUD operations works as expected', async ({ page, ref }) => {
    const databaseEnumName = 'pw_database_enum'
    const databaseEnumValue1Name = 'pw_database_value1'
    const databaseEnumValue2Name = 'pw_database_value2'
    const databaseEnumValue3Name = 'pw_database_value3'
    const quotedEnumName = 'pw_database_enum_"quoted"'
    const updatedQuotedEnumName = 'pw_database_enum_"updated"'
    const quotedEnumValue1Name = 'pw_database_value_"double"'
    const quotedEnumValue2Name = `pw_database_value's_apostrophe`
    const quotedEnumValue3Name = `pw_database_value_"combo"'s`
    const quotedEnumTypes = [quotedEnumName, updatedQuotedEnumName].map(
      (name) => `public."${name.replaceAll('"', '""')}"`
    )

    await using _ = await withSetupCleanup(
      async () => {
        for (const typeName of quotedEnumTypes) {
          await query(`drop type if exists ${typeName};`)
        }
      },
      async () => {
        for (const typeName of quotedEnumTypes) {
          await query(`drop type if exists ${typeName};`)
        }
      }
    )

    await page.goto(toUrl(`/project/${env.PROJECT_REF}/database/types?schema=public`))

    await page.waitForLoadState('networkidle')

    // if enum exists, delete it.
    if ((await page.getByRole('cell', { name: databaseEnumName, exact: true }).count()) > 0) {
      await page
        .getByRole('row', { name: `public ${databaseEnumName}` })
        .getByRole('button')
        .click()
      await page.getByRole('menuitem', { name: 'Delete type' }).click()
      await page.getByRole('heading', { name: 'Confirm to delete enumerated' }).click()
      await page.getByRole('button', { name: 'Confirm delete' }).click()
      await expect(page.getByText(`Successfully deleted type "${databaseEnumName}"`)).toBeVisible()
    }

    // create a new enum
    await page.getByRole('button', { name: 'Create type' }).click()
    await page.getByRole('textbox', { name: 'Name' }).fill(databaseEnumName)
    await page.getByRole('button', { name: 'Create type' }).click()
    await page.locator('input[name="values.0.value"]').fill(databaseEnumValue1Name)
    await page.getByRole('button', { name: 'Add value' }).click()
    await page.locator('input[name="values.1.value"]').fill(databaseEnumValue2Name)
    const enumCreateWait = createApiResponseWaiter(page, 'pg-meta', ref, 'types')
    await page.getByRole('button', { name: 'Create type' }).click()

    // Wait for enum response to be completed and validate it
    await enumCreateWait
    const enumRow = page.getByRole('row', { name: `${databaseEnumName}` })
    await expect(enumRow).toContainText(databaseEnumName)
    await expect(enumRow).toContainText(`${databaseEnumValue1Name}, ${databaseEnumValue2Name}`)

    // update enum
    await enumRow.getByRole('button').click()
    await page.getByRole('menuitem', { name: 'Update type' }).click()
    await page.getByRole('button', { name: 'Add value' }).click()
    await page.locator('input[name="values.2.updatedValue"]').fill(databaseEnumValue3Name)
    await page.getByRole('button', { name: 'Update type' }).click()
    const updatedEnumRow = page.getByRole('row', { name: `${databaseEnumName}` })
    await expect(updatedEnumRow).toContainText(
      `${databaseEnumValue1Name}, ${databaseEnumValue2Name}, ${databaseEnumValue3Name}`
    )

    // delete enum
    await updatedEnumRow.getByRole('button').click()
    await page.getByRole('menuitem', { name: 'Delete type' }).click()
    await page.getByRole('heading', { name: 'Confirm to delete enumerated' }).click()
    await page.getByRole('button', { name: 'Confirm delete' }).click()
    await expect(page.getByText(`Successfully deleted type "${databaseEnumName}"`)).toBeVisible({
      timeout: 50000,
    })

    await page.getByRole('button', { name: 'Create type' }).click()
    await page.getByRole('textbox', { name: 'Name' }).fill(quotedEnumName)
    await page.locator('input[name="values.0.value"]').fill(quotedEnumValue1Name)
    await page.getByRole('button', { name: 'Add value' }).click()
    await page.locator('input[name="values.1.value"]').fill(quotedEnumValue2Name)
    const quotedEnumCreateWait = createApiResponseWaiter(page, 'pg-meta', ref, 'types')
    await page.getByRole('button', { name: 'Create type' }).click()

    await quotedEnumCreateWait
    const quotedEnumRow = page.getByRole('row', { name: `${quotedEnumName}` })
    await expect(quotedEnumRow).toContainText(quotedEnumName)
    await expect(quotedEnumRow).toContainText(`${quotedEnumValue1Name}, ${quotedEnumValue2Name}`)

    await quotedEnumRow.getByRole('button').click()
    await page.getByRole('menuitem', { name: 'Update type' }).click()
    await page.getByRole('textbox', { name: 'Name' }).fill(updatedQuotedEnumName)
    await page.getByRole('button', { name: 'Add value' }).click()
    await page.locator('input[name="values.2.updatedValue"]').fill(quotedEnumValue3Name)
    await page.getByRole('button', { name: 'Update type' }).click()
    const updatedQuotedEnumRow = page.getByRole('row', { name: `${updatedQuotedEnumName}` })
    await expect(updatedQuotedEnumRow).toContainText(updatedQuotedEnumName)
    await expect(updatedQuotedEnumRow).toContainText(
      `${quotedEnumValue1Name}, ${quotedEnumValue2Name}, ${quotedEnumValue3Name}`
    )

    await updatedQuotedEnumRow.getByRole('button').click()
    await page.getByRole('menuitem', { name: 'Delete type' }).click()
    await page.getByRole('heading', { name: 'Confirm to delete enumerated' }).click()
    await page.getByRole('button', { name: 'Confirm delete' }).click()
    await expect(
      page.getByText(`Successfully deleted type "${updatedQuotedEnumName}"`)
    ).toBeVisible({
      timeout: 50000,
    })
  })
})

test.describe('Database Functions', () => {
  test('actions works as expected', async ({ page, ref }) => {
    await page.goto(toUrl(`/project/${env.PROJECT_REF}/database/functions?schema=public`))

    // Wait for database functions to be populated
    await page.waitForLoadState('networkidle')

    // create a new function button exists in public schema
    await expect(page.getByRole('button', { name: 'Create a new function' })).toBeVisible()

    // change schema -> auth
    await page.getByTestId('schema-selector').click()
    await page.getByPlaceholder('Find schema...').fill('auth')
    await page.getByRole('option', { name: 'auth' }).click()
    await expect(page.getByText('email')).toBeVisible()
    await expect(page.getByText('jwt')).toBeVisible()
    // create a new function button does not exist in other schemas
    await expect(page.getByRole('button', { name: 'Create a new function' })).not.toBeVisible()

    // filter by querying
    await page.getByRole('textbox', { name: 'Search for a function' }).fill('email')
    await expect(page.getByText('email')).toBeVisible()
    await expect(page.getByText('jwt')).not.toBeVisible()
  })

  test('CRUD operations works as expected', async ({ page, ref }) => {
    const databaseFunctionName = 'pw_database_function'
    const databaseFunctionNameUpdated = 'pw_database_function_updated'

    await using _ = await withSetupCleanup(
      async () => {
        // Nothing
      },
      async () => {
        await query(`drop function if exists ${databaseFunctionName}`)
        await query(`drop function if exists ${databaseFunctionNameUpdated}`)
      }
    )

    await page.goto(toUrl(`/project/${env.PROJECT_REF}/database/functions?schema=public`))

    // Wait for database functions to be populated
    await page.waitForLoadState('networkidle')

    // create new function
    await page.getByRole('button', { name: 'Create a new function' }).click()
    await page.getByRole('textbox', { name: 'Name of function' }).fill(databaseFunctionName)
    const editor = page.getByRole('presentation')
    await editor.click()
    await page.keyboard.type(`BEGIN\nEND;`)
    await expect(page.getByRole('presentation')).toHaveText(`BEGINEND;`)
    const functionCreateWait = createApiResponseWaiter(
      page,
      'pg-meta',
      ref,
      'query?key=functions-create'
    )
    const functionCreateRefreshWait = createApiResponseWaiter(
      page,
      'pg-meta',
      ref,
      'query?key=database-functions'
    )
    await page.getByRole('button', { name: 'Create function' }).click()

    // validate function creation
    await functionCreateWait
    await functionCreateRefreshWait
    await expect(
      page.getByText(`Successfully created function`),
      'Trigger creation confirmation toast should be visible'
    ).toBeVisible({
      timeout: 50000,
    })
    const functionRow = page.getByRole('row', { name: databaseFunctionName })
    await expect(functionRow).toContainText(databaseFunctionName)

    // update function
    await functionRow.getByRole('button', { name: 'More options' }).click()
    await page.getByRole('menuitem', { name: 'Edit function', exact: true }).click()
    await page.getByRole('textbox', { name: 'Name of function' }).fill(databaseFunctionNameUpdated)
    const functionUpdateWait = createApiResponseWaiter(
      page,
      'pg-meta',
      ref,
      'query?key=functions-update'
    )
    await page.getByRole('button', { name: 'Save function' }).click()

    // validate function update
    await functionUpdateWait
    await expect(
      page.getByText(`Successfully updated function ${databaseFunctionNameUpdated}`),
      'Function updated confirmation toast should be visible'
    ).toBeVisible({
      timeout: 50000,
    })
    const updatedFunctionRow = page.getByRole('row', { name: databaseFunctionNameUpdated })
    await expect(updatedFunctionRow).toContainText(databaseFunctionNameUpdated)

    // delete function
    await updatedFunctionRow.getByRole('button', { name: 'More options' }).click()
    await page.getByRole('menuitem', { name: 'Delete function' }).click()
    await page.getByPlaceholder('Type in name of function').fill(databaseFunctionNameUpdated)
    const functionDeleteWait = createApiResponseWaiter(
      page,
      'pg-meta',
      ref,
      'query?key=functions-delete'
    )
    await page
      .getByRole('button', { name: `Delete function ${databaseFunctionNameUpdated}` })
      .click()
    await functionDeleteWait
    await expect(
      page.getByText(`Successfully removed function ${databaseFunctionNameUpdated}`),
      'Delete confirmation toast should be visible'
    ).toBeVisible({
      timeout: 50000,
    })
  })
})
