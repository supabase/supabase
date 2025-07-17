import { expect, Page } from '@playwright/test'
import { env } from '../env.config'
import { test } from '../utils/test'
import { toUrl } from '../utils/to-url'

const databaseTableName = 'pw_database_table'
const databaseTableNameNew = 'pw_database_table_new'
const databaseTableNameUpdated = 'pw_database_table_updated'
const databaseTableNameDuplicate = 'pw_database_table_duplicate'
const databaseColumnName = 'pw_database_column'
const databaseIndexName = 'pw_database_index'
const databaseEnumName = 'pw_database_enum'
const databaseEnumValue1Name = 'pw_database_value1'
const databaseEnumValue2Name = 'pw_database_value2'
const databaseEnumValue3Name = 'pw_database_value3'
const databaseTriggerName = 'pw_database_trigger'
const databaseTriggerNameUpdated = 'pw_database_trigger_updated'
const databaseFunctionName = 'pw_database_function'
const databaseFunctionNameUpdated = 'pw_database_function_updated'

const createTable = async (page: Page, tableName: string, newColumnName: string) => {
  await page.getByRole('button', { name: 'New table', exact: true }).click()
  await page.getByTestId('table-name-input').fill(tableName)
  await page.getByTestId('created_at-extra-options').click()
  await page.getByText('Is Nullable').click()
  await page.getByTestId('created_at-extra-options').click({ force: true })

  await page.getByRole('button', { name: 'Add column' }).click()
  await page.getByRole('textbox', { name: 'column_name' }).fill(newColumnName)
  await page.getByText('Choose a column type...').click()
  await page.getByRole('option', { name: 'text Variable-length' }).click()

  await page.getByRole('button', { name: 'Save' }).click()

  await expect(
    page.getByText(`Table ${tableName} is good to go!`),
    'Success toast should be visible after table creation'
  ).toBeVisible({
    timeout: 50000,
  })

  await expect(
    page.getByRole('button', { name: `View ${tableName}`, exact: true }),
    'Table should be visible after creation'
  ).toBeVisible()
}

test.describe('Database', () => {
  let page: Page

  test.beforeAll(async ({ browser, ref }) => {
    page = await browser.newPage()
    await page.goto(toUrl(`/project/${ref}/editor`))
    await page.waitForTimeout(2000)

    // delete table name if it exists
    const exists =
      (await page.getByRole('button', { name: `View ${databaseTableName}`, exact: true }).count()) >
      0

    if (exists) {
      await page.getByLabel(`View ${databaseTableName}`, { exact: true }).click()
      await page
        .getByLabel(`View ${databaseTableName}`, { exact: true })
        .getByRole('button')
        .nth(1)
        .click()
      await page.getByText('Delete table').click()
      await page.getByRole('checkbox', { name: 'Drop table with cascade?' }).click()
      await page.getByRole('button', { name: 'Delete' }).click()
      await expect(
        page.getByText(`Successfully deleted table "${databaseTableName}"`),
        'Delete confirmation toast should be visible'
      ).toBeVisible()
    }

    // create database table for indexes
    await createTable(page, databaseTableName, databaseColumnName)
  })

  test.afterAll(async ({ ref }) => {
    await page.goto(toUrl(`/project/${ref}/editor`))
    await page.waitForTimeout(1000)

    // delete table name
    const exists =
      (await page.getByRole('button', { name: `View ${databaseTableName}`, exact: true }).count()) >
      0

    if (exists) {
      await page.getByLabel(`View ${databaseTableName}`, { exact: true }).click()
      await page
        .getByLabel(`View ${databaseTableName}`, { exact: true })
        .getByRole('button')
        .nth(1)
        .click()
      await page.getByText('Delete table').click()
      await page.getByRole('checkbox', { name: 'Drop table with cascade?' }).click()
      await page.getByRole('button', { name: 'Delete' }).click()
      await expect(
        page.getByText(`Successfully deleted table "${databaseTableName}"`),
        'Delete confirmation toast should be visible'
      ).toBeVisible()
    }
  })

  test.describe('Roles', () => {
    test('actions works as expected', async ({ page, ref }) => {
      await page.goto(toUrl(`/project/${env.PROJECT_REF}/database/roles`))

      // Wait for database roles list to be populated
      await page.waitForResponse(
        (response) =>
          response.url().includes(`pg-meta/${ref}/query?key=database-roles`) ||
          response.url().includes('pg-meta/default/query?key=database-roles')
      )

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
      const testRoleName = 'pw_test_role'
      await page.goto(toUrl(`/project/${env.PROJECT_REF}/database/roles`))

      // Wait for database roles list to be populated
      await page.waitForResponse(
        (response) =>
          response.url().includes(`pg-meta/${ref}/query?key=database-roles`) ||
          response.url().includes('pg-meta/default/query?key=database-roles')
      )

      // delete pw_test_role if exists
      const exists = (await page.getByRole('button', { name: testRoleName }).count()) > 0
      if (exists) {
        await page.getByRole('button', { name: testRoleName }).getByRole('button').click()
        await page.getByRole('menuitem', { name: 'Delete' }).click()
        await page.getByRole('button', { name: 'Confirm' }).click()
        await expect(
          page.getByText(`Successfully deleted role: ${testRoleName}`),
          'Delete confirmation toast should be visible'
        ).toBeVisible({
          timeout: 50000,
        })
      }

      // create new role
      await page.getByRole('button', { name: 'Add role' }).click()
      await page.getByRole('textbox', { name: 'Name' }).fill(testRoleName)
      await page.getByRole('switch').nth(0).click()
      await page.getByRole('switch').nth(1).click()
      await page.getByRole('switch').nth(2).click()
      await page.getByRole('button', { name: 'Save' }).click()
      await expect(
        page.getByText(`Successfully created new role: ${testRoleName}`),
        'Create confirmation toast should be visible'
      ).toBeVisible({
        timeout: 50000,
      })

      // delete a role
      await page.getByRole('button', { name: testRoleName }).getByRole('button').click()
      await page.getByRole('menuitem', { name: 'Delete' }).click()
      await page.getByRole('button', { name: 'Confirm' }).click()
      await page.waitForResponse(
        (response) =>
          response.url().includes(`pg-meta/${ref}/query?key=roles-delete`) ||
          response.url().includes('pg-meta/default/query?key=roles-delete')
      )
      await expect(
        page.getByText(`Successfully deleted role: ${testRoleName}`),
        'Delete confirmation toast should be visible'
      ).toBeVisible({
        timeout: 50000,
      })
    })
  })

  test.describe('Indexes', () => {
    test('actions works as expected', async ({ page, ref }) => {
      await page.goto(toUrl(`/project/${env.PROJECT_REF}/database/indexes?schema=public`))

      // Wait for database roles list to be populated
      await page.waitForResponse(
        (response) =>
          response.url().includes(`pg-meta/${ref}/query?key=indexes-public`) ||
          response.url().includes('pg-meta/default/query?key=indexes-public')
      )

      // create index appears on public schema
      await expect(page.getByRole('button', { name: 'Create index' })).toBeVisible()

      // filter by schema
      await page.getByTestId('schema-selector').click()
      await page.getByPlaceholder('Find schema...').fill('auth')
      await page.getByRole('option', { name: 'auth' }).click()
      await page.waitForResponse(
        (response) =>
          response.url().includes(`pg-meta/${ref}/query?key=indexes-auth`) ||
          response.url().includes('pg-meta/default/query?key=indexes-auth')
      )
      expect(page.getByText('sso_providers_pkey')).toBeVisible()
      expect(page.getByText('confirmation_token_idx')).toBeVisible()
      expect(page.getByRole('button', { name: 'Create index' })).not.toBeVisible()

      // filter by querying
      await page.getByRole('textbox', { name: 'Search for an index' }).fill('users')
      await page.waitForTimeout(500)
      expect(page.getByText('sso_providers_pkey')).not.toBeVisible()
      expect(page.getByText('confirmation_token_idx')).toBeVisible()

      // check index definition
      await page.getByRole('row', { name: 'confirmation_token_idx' }).getByRole('button').click()
      await page.getByText('Index:confirmation_token_idx')
      await page.waitForTimeout(500) // wait for text content to be visible
      expect(await page.getByRole('presentation').textContent()).toBe(
        `CREATE UNIQUE INDEX confirmation_token_idx ON auth.users USING btree (confirmation_token) WHERE ((confirmation_token)::text !~ '^[0-9 ]*$'::text)`
      )
    })

    test('CRUD operations works as expected', async ({ page, ref }) => {
      await page.goto(toUrl(`/project/${env.PROJECT_REF}/database/indexes?schema=public`))

      // Wait for database indexs list to be populated
      await page.waitForResponse(
        (response) =>
          response.url().includes(`pg-meta/${ref}/query?key=indexes-public`) ||
          response.url().includes('pg-meta/default/query?key=indexes-public')
      )

      // delete pw_test_index if exists
      const exists = (await page.getByRole('button', { name: databaseIndexName }).count()) > 0
      if (exists) {
        await page.getByRole('button', { name: databaseIndexName }).getByRole('button').click()
        await page.getByRole('menuitem', { name: 'Delete' }).click()
        await page.getByRole('button', { name: 'Confirm' }).click()
        await expect(
          page.getByText(`Successfully deleted role: ${databaseIndexName}`),
          'Delete confirmation toast should be visible'
        ).toBeVisible({
          timeout: 50000,
        })
      }

      // create new index on pw_test_table
      await page.getByRole('button', { name: 'Create index' }).click()
      await page.getByRole('button', { name: 'Choose a table' }).click()
      await page.getByRole('option', { name: databaseTableName }).click()
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
      await page.getByRole('button', { name: 'Confirm delete' }).click()
      await page.waitForResponse(
        (response) =>
          response.url().includes(`pg-meta/${ref}/query?key=indexes`) ||
          response.url().includes('pg-meta/default/query?key=indexes')
      )
      await expect(
        page.getByText('Successfully deleted index'),
        'Index deletion confirmation toast should be visible'
      ).toBeVisible({ timeout: 50000 })
    })
  })

  test.describe('Enumerated Types', () => {
    test('actions works as expected', async ({ page, ref }) => {
      await page.goto(toUrl(`/project/${env.PROJECT_REF}/database/types?schema=public`))

      // Wait for database roles list to be populated
      await page.waitForResponse(
        (response) =>
          response.url().includes(`pg-meta/${ref}/query?key=schemas`) ||
          response.url().includes('pg-meta/default/query?key=schemas')
      )

      // create index appears on public schema
      await expect(page.getByRole('button', { name: 'Create type' })).toBeVisible()

      // filter by schema
      await page.getByTestId('schema-selector').click()
      await page.getByPlaceholder('Find schema...').fill('auth')
      await page.getByRole('option', { name: 'auth' }).click()

      expect(page.getByText('factor_type')).toBeVisible()
      expect(page.getByText('code_challenge_method')).toBeVisible()
      expect(page.getByRole('button', { name: 'Create type' })).not.toBeVisible()

      // filter by querying
      await page.getByRole('textbox', { name: 'Search for a type' }).fill('code')
      await page.waitForTimeout(500) // wait for enum types to be loaded
      expect(page.getByText('factor_type')).not.toBeVisible()
      expect(page.getByText('code_challenge_method')).toBeVisible()
    })

    test('CRUD operations works as expected', async ({ page, ref }) => {
      await page.goto(toUrl(`/project/${env.PROJECT_REF}/database/types?schema=public`))

      // Wait for database roles list to be populated
      await page.waitForResponse(
        (response) =>
          response.url().includes(`pg-meta/${ref}/query?key=schemas`) ||
          response.url().includes('pg-meta/default/query?key=schemas')
      )

      // if exists, delete it.
      await page.waitForTimeout(500)
      const exists =
        (await page.getByRole('cell', { name: databaseEnumName, exact: true }).count()) > 0

      if (exists) {
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
      await page.getByRole('button', { name: 'Create type' }).click()

      // Wait for enum response to be completed
      await page.waitForResponse(
        (response) =>
          response.url().includes(`pg-meta/${ref}/types`) ||
          response.url().includes('pg-meta/default/types')
      )

      // verify enum is created
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

  test.describe('Triggers', () => {
    test('actions works as expected', async ({ page, ref }) => {
      await page.goto(toUrl(`/project/${env.PROJECT_REF}/database/triggers?schema=public`))

      // Wait for database roles list to be populated
      await page.waitForResponse(
        (response) =>
          response.url().includes(`pg-meta/${ref}/triggers`) ||
          response.url().includes('pg-meta/default/triggers')
      )

      // create index appears on public schema
      await expect(page.getByRole('button', { name: 'New trigger' })).toBeVisible()

      // filter by schema
      await page.getByTestId('schema-selector').click()
      await page.getByPlaceholder('Find schema...').fill('realtime')
      await page.getByRole('option', { name: 'realtime' }).click()

      await expect(page.getByText('tr_check_filters')).toBeVisible()
      await expect(page.getByRole('button', { name: 'New trigger' })).not.toBeVisible()

      // filter by querying
      await page.getByRole('textbox', { name: 'Search for a trigger' }).fill('abc')
      await page.waitForTimeout(500) // wait for enum types to be loaded
      await expect(page.getByText('tr_check_filters')).not.toBeVisible()
    })

    test('CRUD operations works as expected', async ({ page, ref }) => {
      await page.goto(toUrl(`/project/${env.PROJECT_REF}/database/triggers?schema=public`))

      // Wait for database indexs list to be populated
      await page.waitForResponse(
        (response) =>
          response.url().includes(`pg-meta/${ref}/triggers`) ||
          response.url().includes('pg-meta/default/triggers')
      )

      // delete trigger if exists
      const exists = (await page.getByRole('button', { name: databaseTriggerName }).count()) > 0
      if (exists) {
        const triggerRow = await page.getByRole('row', { name: databaseTriggerName })
        await triggerRow.getByRole('button', { name: 'More options' }).click()
        await page.getByRole('menuitem', { name: 'Delete trigger' }).click()
        await page
          .getByRole('textbox', { name: `Type ${databaseTriggerName} to confirm.` })
          .fill(databaseTriggerName)
        await page.getByRole('button', { name: `Delete trigger ${databaseTriggerName}` }).click()
        await expect(
          page.getByText(`Successfully removed ${databaseTriggerName}`),
          'Delete confirmation toast should be visible'
        ).toBeVisible({
          timeout: 50000,
        })
      }

      // create new index on pw_test_table
      await page.getByRole('button', { name: 'New trigger' }).click()
      await page.getByRole('textbox', { name: 'Name of trigger' }).fill(databaseTriggerName)
      await page.getByRole('combobox').first().click()
      await page.getByRole('option', { name: 'public.pw_database_table' }).click()
      await page.getByRole('checkbox').first().click()
      await page.getByRole('checkbox').nth(1).click()
      await page.getByRole('checkbox').nth(2).click()
      await page.getByRole('button', { name: 'Choose a function to trigger' }).click()
      await page.getByRole('paragraph').filter({ hasText: 'subscription_check_filters' }).click()
      await page.getByRole('button', { name: 'Create trigger' }).click()

      // validate trigger creation
      await page.waitForResponse(
        (response) =>
          response.url().includes(`pg-meta/${ref}/query?key=trigger-create`) ||
          response.url().includes('pg-meta/default/query?key=trigger-create')
      )
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
      await page.getByRole('button', { name: 'Create trigger' }).click()

      // validate trigger update
      await page.waitForResponse(
        (response) =>
          response.url().includes(`pg-meta/${ref}/query?key=trigger-update`) ||
          response.url().includes('pg-meta/default/query?key=trigger-update')
      )
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
      await page
        .getByRole('textbox', { name: `Type ${databaseTriggerNameUpdated} to confirm.` })
        .fill(databaseTriggerNameUpdated)
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

  test.describe('Functions', () => {
    test('actions works as expected', async ({ page, ref }) => {
      await page.goto(toUrl(`/project/${env.PROJECT_REF}/database/functions?schema=public`))

      // Wait for database roles list to be populated
      await page.waitForResponse(
        (response) =>
          response.url().includes(`pg-meta/${ref}/query?key=database-functions`) ||
          response.url().includes('pg-meta/default/query?key=database-functions')
      )

      // create index appears on public schema
      await expect(page.getByRole('button', { name: 'Create a new function' })).toBeVisible()

      // filter by schema
      await page.getByTestId('schema-selector').click()
      await page.getByPlaceholder('Find schema...').fill('auth')
      await page.getByRole('option', { name: 'auth' }).click()
      await expect(page.getByText('email')).toBeVisible()
      await expect(page.getByText('jwt')).toBeVisible()
      await expect(page.getByRole('button', { name: 'Create a new function' })).not.toBeVisible()

      // filter by querying
      await page.getByRole('textbox', { name: 'Search for a function' }).fill('email')
      await page.waitForTimeout(500) // wait for enum types to be loaded
      await expect(page.getByText('email')).toBeVisible()
      await expect(page.getByText('jwt')).not.toBeVisible()
    })

    test('CRUD operations works as expected', async ({ page, ref }) => {
      await page.goto(toUrl(`/project/${env.PROJECT_REF}/database/functions?schema=public`))

      // Wait for database indexs list to be populated
      await page.waitForResponse(
        (response) =>
          response.url().includes(`pg-meta/${ref}/query?key=database-functions`) ||
          response.url().includes('pg-meta/default/query?key=database-functions')
      )

      // delete function if exists
      const exists = (await page.getByRole('button', { name: databaseFunctionName }).count()) > 0
      if (exists) {
        const functionRow = await page.getByRole('row', { name: databaseFunctionName })
        await functionRow.getByRole('button', { name: 'More options' }).click()
        await page.getByRole('menuitem', { name: 'Delete function' }).click()
        await page
          .getByRole('textbox', { name: `Type ${databaseFunctionName} to confirm.` })
          .fill(databaseFunctionName)
        await page.getByRole('button', { name: `Delete function ${databaseFunctionName}` }).click()
        await expect(
          page.getByText(`Successfully removed ${databaseFunctionName}`),
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
      await page.getByRole('button', { name: 'Confirm' }).click()

      // validate function creation
      await page.waitForResponse(
        (response) =>
          response.url().includes(`pg-meta/${ref}/query?key=functions-create`) ||
          response.url().includes('pg-meta/default/query?key=functions-create')
      )
      await page.waitForResponse(
        (response) =>
          response.url().includes(`pg-meta/${ref}/query?key=database-functions`) ||
          response.url().includes('pg-meta/default/query?key=database-functions')
      )
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
      await page
        .getByRole('textbox', { name: 'Name of function' })
        .fill(databaseFunctionNameUpdated)
      await page.getByRole('button', { name: 'Confirm' }).click()

      // validate function update
      await page.waitForResponse(
        (response) =>
          response.url().includes(`pg-meta/${ref}/query?key=functions-update`) ||
          response.url().includes('pg-meta/default/query?key=functions-update')
      )
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
      await page
        .getByRole('textbox', { name: `Type ${databaseFunctionNameUpdated} to confirm.` })
        .fill(databaseFunctionNameUpdated)
      await page
        .getByRole('button', { name: `Delete function ${databaseFunctionNameUpdated}` })
        .click()
      await page.waitForResponse(
        (response) =>
          response.url().includes(`pg-meta/${ref}/query?key=functions-delete`) ||
          response.url().includes('pg-meta/default/query?key=functions-delete')
      )
      await expect(
        page.getByText(`Successfully removed function ${databaseFunctionNameUpdated}`),
        'Delete confirmation toast should be visible'
      ).toBeVisible({
        timeout: 50000,
      })
    })
  })

  test.describe('Tables', () => {
    test('actions works as expected', async ({ page, ref }) => {
      await page.goto(toUrl(`/project/${env.PROJECT_REF}/database/tables?schema=public`))

      // Wait for database roles list to be populated
      await page.waitForResponse(
        (response) =>
          response
            .url()
            .includes(`pg-meta/${ref}/tables?include_columns=true&included_schemas=public`) ||
          response
            .url()
            .includes('pg-meta/default/tables?include_columns=true&included_schemas=public')
      )

      // create index appears on public schema
      await expect(page.getByRole('button', { name: 'New table' })).toBeVisible()
      const tableRow = await page.getByRole('row', { name: databaseTableName })
      await expect(tableRow).toContainText(databaseTableName)
      await expect(tableRow).toContainText('3 columns')

      // filter by schema
      await page.getByTestId('schema-selector').click()
      await page.getByPlaceholder('Find schema...').fill('auth')
      await page.getByRole('option', { name: 'auth' }).click()
      await page.waitForResponse(
        (response) =>
          response
            .url()
            .includes(`pg-meta/${ref}/tables?include_columns=true&included_schemas=auth`) ||
          response
            .url()
            .includes('pg-meta/default/tables?include_columns=true&included_schemas=auth')
      )
      await expect(page.getByText('sso_providers')).toBeVisible()
      await expect(page.getByRole('button', { name: 'New table' })).not.toBeVisible()

      // filter by querying
      await page.getByRole('textbox', { name: 'Search for a table' }).fill('mfa')
      await page.waitForTimeout(500)
      await expect(page.getByText('sso_providers')).not.toBeVisible()
      await expect(page.getByText('mfa_factors')).toBeVisible()
    })

    test.only('CRUD operations and copy works as expected', async ({ page, ref }) => {
      await page.goto(toUrl(`/project/${env.PROJECT_REF}/database/tables?schema=public`))

      // Wait for database roles list to be populated
      await page.waitForResponse(
        (response) =>
          response
            .url()
            .includes(`pg-meta/${ref}/tables?include_columns=true&included_schemas=public`) ||
          response
            .url()
            .includes('pg-meta/default/tables?include_columns=true&included_schemas=public')
      )

      if ((await page.getByText(databaseTableNameNew, { exact: true }).count()) > 0) {
        await page.getByRole('row', { name: databaseTableNameNew }).getByRole('button').click()
        await page.getByRole('menuitem', { name: 'Delete table' }).click()
        await page.getByRole('checkbox', { name: 'Drop table with cascade?' }).check()
        await page.getByRole('button', { name: 'Delete' }).click()
        await page.waitForResponse(
          (response) =>
            response.url().includes(`pg-meta/${ref}/query?key=table-delete`) ||
            response.url().includes('pg-meta/default/query?key=table-delete')
        )
      }

      if ((await page.getByText(databaseTableNameUpdated, { exact: true }).count()) > 0) {
        await page.getByRole('row', { name: databaseTableNameUpdated }).getByRole('button').click()
        await page.getByRole('menuitem', { name: 'Delete table' }).click()
        await page.getByRole('checkbox', { name: 'Drop table with cascade?' }).check()
        await page.getByRole('button', { name: 'Delete' }).click()
        await page.waitForResponse(
          (response) =>
            response.url().includes(`pg-meta/${ref}/query?key=table-delete`) ||
            response.url().includes('pg-meta/default/query?key=table-delete')
        )
      }

      if ((await page.getByText(databaseTableNameDuplicate, { exact: true }).count()) > 0) {
        await page
          .getByRole('row', { name: databaseTableNameDuplicate })
          .getByRole('button')
          .click()
        await page.getByRole('menuitem', { name: 'Delete table' }).click()
        await page.getByRole('checkbox', { name: 'Drop table with cascade?' }).check()
        await page.getByRole('button', { name: 'Delete' }).click()
        await page.waitForResponse(
          (response) =>
            response.url().includes(`pg-meta/${ref}/query?key=table-delete`) ||
            response.url().includes('pg-meta/default/query?key=table-delete')
        )
      }

      // create a new table
      await page.getByRole('button', { name: 'New table' }).click()
      await page.getByTestId('table-name-input').fill(databaseTableNameNew)
      await page.getByRole('button', { name: 'Save' }).click()

      // validate table creation
      await page.waitForResponse(
        (response) =>
          response.url().includes(`pg-meta/${ref}/query?key=table-create`) ||
          response.url().includes('pg-meta/default/query?key=table-create')
      )
      await page.waitForResponse(
        (response) =>
          response
            .url()
            .includes(`pg-meta/${ref}/tables?include_columns=true&included_schemas=public`) ||
          response
            .url()
            .includes('pg-meta/default/tables?include_columns=true&included_schemas=public')
      )
      await expect(page.getByText(databaseTableNameNew, { exact: true })).toBeVisible()

      // edit a new table
      await page.getByRole('row', { name: databaseTableNameNew }).getByRole('button').click()
      await page.getByRole('menuitem', { name: 'Edit table' }).click()
      await page.getByTestId('table-name-input').fill(databaseTableNameUpdated)
      await page.getByRole('button', { name: 'Save' }).click()

      // validate table update
      await page.waitForResponse(
        (response) =>
          response.url().includes(`pg-meta/${ref}/query?key=table-update`) ||
          response.url().includes('pg-meta/default/query?key=table-update')
      )
      await page.waitForResponse(
        (response) =>
          response
            .url()
            .includes(`pg-meta/${ref}/tables?include_columns=true&included_schemas=public`) ||
          response
            .url()
            .includes('pg-meta/default/tables?include_columns=true&included_schemas=public')
      )
      await expect(page.getByText(databaseTableNameUpdated, { exact: true })).toBeVisible()

      // duplicate table
      await page.getByRole('row', { name: databaseTableNameUpdated }).getByRole('button').click()
      await page.getByRole('menuitem', { name: 'Duplicate Table' }).click()
      await page.getByTestId('table-name-input').fill(databaseTableNameDuplicate)
      await page.getByRole('textbox', { name: 'Optional' }).fill('')
      await page.getByRole('button', { name: 'Save' }).click()

      // validate table duplicate
      await page.waitForResponse(
        (response) =>
          response.url().includes(`pg-meta/${ref}/query?key=`) ||
          response.url().includes('pg-meta/default/query?key=')
      )
      await page.waitForResponse(
        (response) =>
          response
            .url()
            .includes(`pg-meta/${ref}/tables?include_columns=true&included_schemas=public`) ||
          response
            .url()
            .includes('pg-meta/default/tables?include_columns=true&included_schemas=public')
      )
      await expect(page.getByText(databaseTableNameDuplicate, { exact: true })).toBeVisible()

      // delete tables
      await page
        .getByRole('row', { name: `${databaseTableNameDuplicate}` })
        .getByRole('button')
        .click()
      await page.getByRole('menuitem', { name: 'Delete table' }).click()
      await page.getByRole('checkbox', { name: 'Drop table with cascade?' }).check()
      await page.getByRole('button', { name: 'Delete' }).click()
      await page.waitForResponse(
        (response) =>
          response.url().includes(`pg-meta/${ref}/query?key=table-delete`) ||
          response.url().includes('pg-meta/default/query?key=table-delete')
      )

      await page
        .getByRole('row', { name: `${databaseTableNameUpdated}` })
        .getByRole('button')
        .click()
      await page.getByRole('menuitem', { name: 'Delete table' }).click()
      await page.getByRole('checkbox', { name: 'Drop table with cascade?' }).check()
      await page.getByRole('button', { name: 'Delete' }).click()
      await page.waitForResponse(
        (response) =>
          response.url().includes(`pg-meta/${ref}/query?key=table-delete`) ||
          response.url().includes('pg-meta/default/query?key=table-delete')
      )

      await page.getByRole('row', { name: databaseTableName }).getByRole('button').click()
      await page.getByRole('menuitem', { name: 'View in Table Editor' }).click()
      await page.waitForTimeout(1000) // wait for the table editor to be loaded
      expect(page.url().includes('editor')).toBe(true)
    })
  })

  test.describe('Tables columns', () => {
    test('actions works as expected', async ({ page, ref }) => {
      await page.goto(toUrl(`/project/${env.PROJECT_REF}/database/tables?schema=public`))

      // Wait for database roles list to be populated
      await page.waitForResponse(
        (response) =>
          response
            .url()
            .includes(`pg-meta/${ref}/tables?include_columns=true&included_schemas=public`) ||
          response
            .url()
            .includes('pg-meta/default/tables?include_columns=true&included_schemas=public')
      )

      // create index appears on public schema
      await expect(page.getByRole('button', { name: 'New table' })).toBeVisible()
      const tableRow = await page.getByRole('row', { name: databaseTableName })
      await expect(tableRow).toContainText(databaseTableName)
      await expect(tableRow).toContainText('3 columns')

      // filter by schema
      await page.getByTestId('schema-selector').click()
      await page.getByPlaceholder('Find schema...').fill('auth')
      await page.getByRole('option', { name: 'auth' }).click()
      await page.waitForResponse(
        (response) =>
          response
            .url()
            .includes(`pg-meta/${ref}/tables?include_columns=true&included_schemas=auth`) ||
          response
            .url()
            .includes('pg-meta/default/tables?include_columns=true&included_schemas=auth')
      )
      await expect(page.getByText('sso_providers')).toBeVisible()
      await expect(page.getByRole('button', { name: 'New table' })).not.toBeVisible()

      // filter by querying
      await page.getByRole('textbox', { name: 'Search for a table' }).fill('mfa')
      await page.waitForTimeout(500)
      await expect(page.getByText('sso_providers')).not.toBeVisible()
      await expect(page.getByText('mfa_factors')).toBeVisible()
    })

    test('CRUD operations and copy works as expected', async ({ page, ref }) => {
      await page.goto(toUrl(`/project/${env.PROJECT_REF}/database/tables?schema=public`))

      // Wait for database roles list to be populated
      await page.waitForResponse(
        (response) =>
          response
            .url()
            .includes(`pg-meta/${ref}/tables?include_columns=true&included_schemas=public`) ||
          response
            .url()
            .includes('pg-meta/default/tables?include_columns=true&included_schemas=public')
      )

      // create a new table

      // edit a new table

      // duplicate table

      // delete duplicated table

      // navigate to table editor
    })
  })
})
