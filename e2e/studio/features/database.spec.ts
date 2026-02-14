import { expect, Page } from '@playwright/test'

import { env } from '../env.config.js'
import { dropTable, query } from '../utils/db/index.js'
import { test } from '../utils/test.js'
import { toUrl } from '../utils/to-url.js'
import {
  createApiResponseWaiter,
  waitForApiResponse,
  waitForDatabaseToLoad,
} from '../utils/wait-for-response.js'

const databaseTableName = 'pw_database_table'
const databaseTableNameNew = 'pw_database_table_new'
const databaseTableNameUpdated = 'pw_database_table_updated'
const databaseTableNameDuplicate = 'pw_database_table_duplicate'
const databaseColumnName = 'pw_database_column'
const databaseColumnName2 = 'pw_database_column_2'
const databaseColumnName3 = 'pw_database_column_3'
const databaseIndexName = 'pw_database_index'
const databaseEnumName = 'pw_database_enum'
const databaseEnumValue1Name = 'pw_database_value1'
const databaseEnumValue2Name = 'pw_database_value2'
const databaseEnumValue3Name = 'pw_database_value3'
const databaseTriggerName = 'pw_database_trigger'
const databaseTriggerNameUpdated = 'pw_database_trigger_updated'
const databaseFunctionName = 'pw_database_function'
const databaseFunctionNameUpdated = 'pw_database_function_updated'
const databaseRoleName = 'pw_database_role'

test.describe.serial('Database', () => {
  let page: Page

  test.beforeAll(async ({ browser, ref }) => {
    // Create the shared test table via API
    await dropTable(databaseTableName) // Clean up if exists
    await query(`
      CREATE TABLE IF NOT EXISTS ${databaseTableName} (
        id bigint generated always as identity not null primary key,
        created_at timestamptz default now(),
        ${databaseColumnName} text
      )
    `)

    page = await browser.newPage()
    const wait = createApiResponseWaiter(page, 'pg-meta', ref, 'query?key=entity-types-public-0')
    await page.goto(toUrl(`/project/${ref}/editor`))
    await wait
  })

  test.afterAll(async () => {
    // Clean up via API
    await dropTable(databaseTableName)
    await page.close()
  })

  test.describe('Schema Visualizer', () => {
    test('actions works as expected', async ({ page, ref }) => {
      const wait = createApiResponseWaiter(
        page,
        'pg-meta',
        ref,
        'tables?include_columns=true&included_schemas=public'
      )
      await page.goto(toUrl(`/project/${env.PROJECT_REF}/database/schemas?schema=public`))
      await wait

      // validates table and column exists
      await page.waitForTimeout(500)
      await expect(page.getByText(databaseTableName, { exact: true })).toBeVisible()
      await expect(page.getByText(databaseColumnName)).toBeVisible()

      // copies schema definition to clipboard
      await page.getByRole('button', { name: 'Copy as SQL' }).click()
      await page.waitForTimeout(500)
      const clipboardText = await page.evaluate(() => navigator.clipboard.readText())
      expect(clipboardText).toContain(`CREATE TABLE public.pw_database_table (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  pw_database_column text,
  CONSTRAINT pw_database_table_pkey PRIMARY KEY (id)
);`)

      // downloads schema diagram when export is triggered
      const downloadPromise = page.waitForEvent('download')
      await page.getByRole('button', { name: 'Download Schema' }).click()
      await page.getByRole('menuitem', { name: 'Download as PNG' }).click()
      const download = await downloadPromise
      await expect(download.suggestedFilename()).toContain('.png')

      // changing schema -> auth
      await page.getByTestId('schema-selector').click()
      await page.getByRole('option', { name: 'auth' }).click()
      await waitForDatabaseToLoad(page, ref, 'auth')
      await expect(page.getByText('users')).toBeVisible()
      await expect(page.getByText('sso_providers')).toBeVisible()
      await expect(page.getByText('saml_providers')).toBeVisible()

      // navigate to table editor when icon is clicked
      const samlProvidersHeader = await page.getByText('saml_providers')
      await samlProvidersHeader.locator('..').getByRole('link').click()
      await page.waitForURL(/.*\/editor\/\d+/)
      await page.getByRole('button', { name: 'View saml_providers', exact: true }).click()
    })
  })

  test.describe.serial('Tables', () => {
    test('actions works as expected', async ({ page, ref }) => {
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
      const tableRow = await page.getByRole('row', {
        name: `${databaseTableName} No description`,
      })
      await expect(tableRow).toContainText(databaseTableName)
      await expect(tableRow).toContainText('3 columns')

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
      await page.waitForTimeout(500)
      await expect(page.getByText('sso_providers')).not.toBeVisible()
      await expect(page.getByText('mfa_factors')).toBeVisible()
    })

    test('CRUD operations and copy works as expected', async ({ page, ref }) => {
      await page.goto(toUrl(`/project/${env.PROJECT_REF}/database/tables?schema=public`))

      // Wait for database tables to be populated
      await waitForDatabaseToLoad(page, ref)

      // drop database tables if exists
      if ((await page.getByText(databaseTableNameNew, { exact: true }).count()) > 0) {
        await page
          .getByRole('row', { name: databaseTableNameNew })
          .getByRole('button')
          .last()
          .click()
        await page.getByRole('menuitem', { name: 'Delete table' }).click()
        await page.getByRole('checkbox', { name: 'Drop table with cascade?' }).check()
        const cleanupNewWait = createApiResponseWaiter(
          page,
          'pg-meta',
          ref,
          'query?key=table-delete'
        )
        await page.getByRole('button', { name: 'Delete' }).click()
        await cleanupNewWait
      }

      if ((await page.getByText(databaseTableNameUpdated, { exact: true }).count()) > 0) {
        await page
          .getByRole('row', { name: databaseTableNameUpdated })
          .getByRole('button')
          .last()
          .click()
        await page.getByRole('menuitem', { name: 'Delete table' }).click()
        await page.getByRole('checkbox', { name: 'Drop table with cascade?' }).check()
        const cleanupUpdatedWait = createApiResponseWaiter(
          page,
          'pg-meta',
          ref,
          'query?key=table-delete'
        )
        await page.getByRole('button', { name: 'Delete' }).click()
        await cleanupUpdatedWait
      }

      if ((await page.getByText(databaseTableNameDuplicate, { exact: true }).count()) > 0) {
        await page
          .getByRole('row', { name: databaseTableNameDuplicate })
          .getByRole('button')
          .last()
          .click()
        await page.getByRole('menuitem', { name: 'Delete table' }).click()
        await page.getByRole('checkbox', { name: 'Drop table with cascade?' }).check()
        const cleanupDuplicateWait = createApiResponseWaiter(
          page,
          'pg-meta',
          ref,
          'query?key=table-delete'
        )
        await page.getByRole('button', { name: 'Delete' }).click()
        await cleanupDuplicateWait
      }

      // create a new table
      await page.getByRole('button', { name: 'New table' }).click()
      await page.getByTestId('table-name-input').fill(databaseTableNameNew)
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
      await page.getByTestId('table-name-input').fill(databaseTableNameDuplicate)
      await page.getByRole('textbox', { name: 'Optional' }).fill('')
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
      await page.waitForTimeout(1000) // wait for the table editor to be loaded
      expect(page.url().includes('editor')).toBe(true)
    })
  })

  test.describe('Tables columns', () => {
    test('can view, create, update, delete, and filter table columns', async ({ page, ref }) => {
      await page.goto(toUrl(`/project/${env.PROJECT_REF}/database/tables?schema=public`))

      // Wait for database tables to be populated
      await waitForDatabaseToLoad(page, ref)

      // navigate to table columns
      const databaseRow = page.getByRole('row', { name: databaseTableName })
      await databaseRow.getByRole('link', { name: '3 columns' }).click()
      await page.waitForURL(/.*\/database\/tables\/\d+/)

      // validate and display everything correctly
      const columnDatabaseRow = page.getByRole('row', { name: databaseColumnName })
      await expect(columnDatabaseRow).toContainText(databaseColumnName)
      await expect(columnDatabaseRow).toContainText('text')

      // create a new table column
      await page.getByRole('button', { name: 'New column' }).click()
      await page
        .getByRole('textbox', { name: 'column_name', exact: true })
        .fill('pw_database_column_2')
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
      await columnDatabase2Row.getByRole('button').click()
      await page.getByRole('button', { name: 'Edit column' }).click()
      await page.getByRole('textbox', { name: 'column_name' }).fill(databaseColumnName3)
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
      await columnDatabase3Row.getByRole('button').click()
      await page.getByRole('button', { name: 'Delete column' }).click()
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

  test.describe.serial('Triggers', () => {
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
      await page.waitForTimeout(500) // wait for enum types to be loaded
      await expect(page.getByText('tr_check_filters')).not.toBeVisible()
    })

    test('CRUD operations works as expected', async ({ page, ref }) => {
      await page.goto(toUrl(`/project/${env.PROJECT_REF}/database/triggers?schema=public`))

      // Wait for database triggers to be populated
      await waitForApiResponse(page, 'pg-meta', ref, 'triggers')

      // delete trigger if exists
      if ((await page.getByRole('button', { name: databaseTriggerName }).count()) > 0) {
        const triggerRow = await page.getByRole('row', { name: databaseTriggerName })
        await triggerRow.getByRole('button', { name: 'More options' }).click()
        await page.getByRole('menuitem', { name: 'Delete trigger' }).click()
        await page.getByPlaceholder('Type in name of trigger').fill(databaseTriggerName)
        await page.getByRole('button', { name: `Delete trigger ${databaseTriggerName}` }).click()
        await expect(
          page.getByText(`Successfully removed ${databaseTriggerName}`),
          'Delete confirmation toast should be visible'
        ).toBeVisible({ timeout: 50000 })
      }

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
      const triggerRow = await page.getByRole('row', { name: databaseTriggerName })
      expect(triggerRow).toContainText('subscription_check_filters')
      expect(triggerRow).toContainText(databaseTriggerName)

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

      expect(ssoProvidersPkeyRow).toBeVisible()
      expect(confirmationTokenIdxRow).toBeVisible()
      // create new index button does not exist in other schemas
      expect(createIndexButton).not.toBeVisible()

      // filter by querying
      await page.getByRole('textbox', { name: 'Search for an index' }).fill('users')
      await page.waitForTimeout(2000)

      expect(page.getByText('sso_providers_pkey')).not.toBeVisible()
      expect(page.getByText('confirmation_token_idx')).toBeVisible()

      // check index definition
      await page
        .getByRole('row', { name: 'confirmation_token_idx' })
        .getByRole('button')
        .last()
        .click()
      await page.getByText('Index:confirmation_token_idx')
      await page.waitForTimeout(2000) // wait for text content to be visible
      expect(await page.getByRole('presentation').textContent()).toBe(
        `CREATE UNIQUE INDEX confirmation_token_idx ON auth.users USING btree (confirmation_token) WHERE ((confirmation_token)::text !~ '^[0-9 ]*$'::text)`
      )
    })

    test('CRUD operations works as expected', async ({ page, ref }) => {
      await page.goto(toUrl(`/project/${env.PROJECT_REF}/database/indexes?schema=public`))

      // Wait for database indexes to be populated
      await waitForApiResponse(page, 'pg-meta', ref, 'query?key=indexes-public')

      // delete index if exist
      const exists = (await page.getByRole('button', { name: databaseIndexName }).count()) > 0
      if (exists) {
        await page.getByRole('button', { name: databaseIndexName }).getByRole('button').click()
        await page.getByRole('menuitem', { name: 'Delete' }).click()
        await page.getByRole('button', { name: 'Confirm' }).click()
        await expect(
          page.getByText(`Successfully deleted role: ${databaseIndexName}`),
          'Delete confirmation toast should be visible'
        ).toBeVisible({ timeout: 50000 })
      }

      // create new index
      await page.getByRole('button', { name: 'Create index' }).click()
      await page.getByRole('button', { name: 'Choose a table' }).click()
      await page.getByRole('option', { name: databaseTableName, exact: true }).click()
      await page.getByText('Choose which columns to create an index on').click()
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
      const newIndexRow = await page.getByRole('row', {
        name: `${databaseTableName}_${databaseColumnName}_idx`,
      })
      await newIndexRow.getByRole('button', { name: 'View definition' }).click()
      await page.waitForTimeout(500) // wait for text content to be visible
      expect(await page.getByRole('presentation').textContent()).toBe(
        `CREATE INDEX ${databaseTableName}_${databaseColumnName}_idx ON public.${databaseTableName} USING btree (${databaseColumnName})`
      )
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
      await page.goto(toUrl(`/project/${env.PROJECT_REF}/database/roles`))

      // Wait for database roles to be populated
      await waitForApiResponse(page, 'pg-meta', ref, 'query?key=database-roles')

      // delete role if exists
      const exists = (await page.getByRole('button', { name: databaseRoleName }).count()) > 0
      if (exists) {
        await page.getByRole('button', { name: databaseRoleName }).getByRole('button').click()
        await page.getByRole('menuitem', { name: 'Delete' }).click()
        await page.getByRole('button', { name: 'Confirm' }).click()
        await expect(
          page.getByText(`Successfully deleted role: ${databaseRoleName}`),
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
      await page.getByRole('button', { name: databaseRoleName }).getByRole('button').click()
      await page.getByRole('menuitem', { name: 'Delete' }).click()
      const roleDeleteWait = createApiResponseWaiter(page, 'pg-meta', ref, 'query?key=roles-delete')
      await page.getByRole('button', { name: 'Confirm' }).click()
      await roleDeleteWait
      await expect(
        page.getByText(`Successfully deleted role: ${databaseRoleName}`),
        'Delete confirmation toast should be visible'
      ).toBeVisible({ timeout: 50000 })
    })
  })
})

test.describe.serial('Database Enumerated Types', () => {
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
    await page.waitForTimeout(1000) // wait for enum types to be loaded
    await expect(page.getByText('factor_type')).not.toBeVisible()
    await expect(page.getByText('code_challenge_method')).toBeVisible()
  })

  test('CRUD operations works as expected', async ({ page, ref }) => {
    const wait = createApiResponseWaiter(page, 'pg-meta', ref, 'query?key=schemas')
    await page.goto(toUrl(`/project/${env.PROJECT_REF}/database/types?schema=public`))

    // Wait for database roles list to be populated
    await wait
    // await page.waitForLoadState('networkidle')

    // if enum exists, delete it.
    await page.waitForTimeout(500)
    if ((await page.getByRole('cell', { name: databaseEnumName, exact: true }).count()) > 0) {
      await page
        .getByRole('row', { name: `public ${databaseEnumName}` })
        .getByRole('button')
        .click()
      await page.getByRole('menuitem', { name: 'Delete type' }).click()
      await page.getByRole('heading', { name: 'Confirm to delete enumerated' }).click()
      await page.getByRole('button', { name: 'Confirm delete' }).click()
      await expect(page.getByText(`Successfully deleted "${databaseEnumName}"`)).toBeVisible()
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
    await expect(page.getByText(`Successfully deleted "${databaseEnumName}"`)).toBeVisible({
      timeout: 50000,
    })
  })
})

test.describe.serial('Database Functions', () => {
  test('actions works as expected', async ({ page, ref }) => {
    await page.goto(toUrl(`/project/${env.PROJECT_REF}/database/functions?schema=public`))

    // Wait for database functions to be populated
    await page.waitForLoadState('networkidle')
    // await waitForApiResponse(page, 'pg-meta', ref, 'query?key=database-functions')

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
    await page.waitForTimeout(500) // wait for enum types to be loaded
    await expect(page.getByText('email')).toBeVisible()
    await expect(page.getByText('jwt')).not.toBeVisible()
  })

  test('CRUD operations works as expected', async ({ page, ref }) => {
    await page.goto(toUrl(`/project/${env.PROJECT_REF}/database/functions?schema=public`))

    // Wait for database functions to be populated
    // await waitForApiResponse(page, 'pg-meta', ref, 'query?key=database-functions')
    await page.waitForLoadState('networkidle')

    // delete function if exists
    if ((await page.getByRole('button', { name: databaseFunctionName }).count()) > 0) {
      const functionRow = await page.getByRole('row', { name: databaseFunctionName })
      await functionRow.getByRole('button', { name: 'More options' }).click()
      await page.getByRole('menuitem', { name: 'Delete function' }).click()
      await page
        .getByRole('textbox', { name: `Type ${databaseFunctionName} to confirm.` })
        .fill(databaseFunctionName)
      await page.getByRole('button', { name: `Delete function ${databaseFunctionName}` }).click()
      await expect(
        page.getByText(`Successfully removed function ${databaseFunctionName}`),
        'Delete confirmation toast should be visible'
      ).toBeVisible({
        timeout: 50000,
      })
    }

    // create new function
    await page.getByRole('button', { name: 'Create a new function' }).click()
    await page.getByRole('textbox', { name: 'Name of function' }).fill(databaseFunctionName)
    const editor = await page.getByRole('presentation')
    await editor.click()
    await page.keyboard.type(`BEGIN
END;`)
    await page.waitForTimeout(500) // wait for text content to be visible
    expect(await page.getByRole('presentation').textContent()).toBe(`BEGINEND;`)
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
    const functionRow = await page.getByRole('row', { name: databaseFunctionName })
    expect(functionRow).toContainText(databaseFunctionName)

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
