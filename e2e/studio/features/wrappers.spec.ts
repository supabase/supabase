import { expect } from '@playwright/test'

import { env } from '../env.config.js'
import { query } from '../utils/db/client.js'
import { test, withSetupCleanup } from '../utils/test.js'
import { toUrl } from '../utils/to-url.js'

const testRunner = env.IS_PLATFORM ? test.describe.serial : test.describe
testRunner('Stripe', () => {
  test('can create a stripe wrapper with schema', async ({ page, ref }) => {
    const wrapperName = 'stripe_schema'
    const schemaName = 'stripe'

    await using _ = await withSetupCleanup(
      async () => {
        await query(`
          create schema if not exists extensions;

          create extension if not exists wrappers
            schema extensions
            version '0.5.7'
            cascade;
        `)
      },
      async () => {
        // Make the request in the page context so that the it can delete wrappers that belongs to supabase_admin
        await page.request.post(toUrl(`/api/platform/pg-meta/${ref}/query`), {
          failOnStatusCode: true,
          data: {
            query: `
              drop foreign data wrapper if exists ${wrapperName} cascade;
              delete from vault.secrets where name = '${wrapperName}_api_key_id';
              drop schema ${schemaName} cascade;`,
          },
        })
      }
    )
    await page.goto(toUrl(`/project/${ref}/integrations/stripe_wrapper/overview`))
    await page.getByRole('button', { name: 'Add new wrapper' }).click()

    await page.getByRole('textbox', { name: 'Wrapper Name' }).fill(wrapperName)
    await page.getByRole('textbox', { name: 'Stripe Secret Key' }).fill('my secret')
    await page.getByRole('radio', { name: 'Schema' }).click()
    await page
      .getByRole('textbox', { name: 'Specify a new schema to create all wrapper tables in' })
      .fill(schemaName)
    await page.getByRole('button', { name: 'Create wrapper' }).click()
    await expect(page.getByText('Successfully created Stripe foreign data wrapper')).toBeVisible()
  })

  test('can create a stripe wrapper with tables', async ({ page, ref }) => {
    const wrapperName = 'stripe_tables'
    const tableName = 'stripe_accounts'

    await using _ = await withSetupCleanup(
      async () => {
        await query(`
          create schema if not exists extensions;

          create extension if not exists wrappers
            schema extensions
            version '0.5.7'
            cascade;
        `)
      },
      async () => {
        // Make the request in the page context so that the it can delete wrappers that belongs to supabase_admin
        await page.request.post(toUrl(`/api/platform/pg-meta/${ref}/query`), {
          failOnStatusCode: true,
          data: {
            query: `
              drop foreign data wrapper if exists ${wrapperName} cascade;
              delete from vault.secrets where name = '${wrapperName}_api_key_id';
              drop table if exists public.${tableName};`,
          },
        })
      }
    )
    await page.goto(toUrl(`/project/${ref}/integrations/stripe_wrapper/overview`))
    await page.getByRole('button', { name: 'Add new wrapper' }).click()

    await page.getByRole('textbox', { name: 'Wrapper Name' }).fill(wrapperName)
    await page.getByRole('textbox', { name: 'Stripe Secret Key' }).fill('my secret')
    await page.getByRole('button', { name: 'Add foreign table' }).click()
    await page.getByRole('combobox').click()
    await page.getByRole('option', { name: 'Accounts List of accounts on' }).click()
    await page.getByRole('textbox', { name: 'Table name' }).fill(tableName)
    await page.getByRole('button', { name: 'Save' }).click()
    await page.getByRole('button', { name: 'Create wrapper' }).click()
    await expect(page.getByText('Successfully created Stripe foreign data wrapper')).toBeVisible()
  })
})

testRunner('S3 Wrapper', () => {
  test('can create an S3 wrapper', async ({ page, ref }) => {
    const wrapperName = 'test_s3_wrapper'
    const tableName = 'test_s3_wrapper_table'
    await using _ = await withSetupCleanup(
      async () => {
        await query(`
          create schema if not exists extensions;

          create extension if not exists wrappers
            schema extensions
            version '0.5.7'
            cascade;
        `)
      },
      async () => {
        // Make the request in the page context so that the it can delete wrappers that belongs to supabase_admin
        await page.request.post(toUrl(`/api/platform/pg-meta/${ref}/query`), {
          failOnStatusCode: true,
          data: {
            query: `
              drop foreign data wrapper if exists ${wrapperName} cascade;
              delete from vault.secrets where name = '${wrapperName}_vault_access_key_id';
              delete from vault.secrets where name = '${wrapperName}_vault_secret_access_key';
              drop table if exists public.${tableName};`,
          },
        })
      }
    )
    await page.goto(toUrl(`/project/${ref}/integrations/s3_wrapper/overview`))
    await page.getByRole('button', { name: 'Add new wrapper' }).click()

    await page.getByRole('textbox', { name: 'Wrapper Name' }).fill(wrapperName)
    await page.getByRole('textbox', { name: 'Access Key ID' }).fill('s3 access id')
    await page.getByRole('textbox', { name: 'Access Key Secret' }).fill('s3 access secret')
    await page.getByRole('button', { name: 'Add foreign table' }).click()
    await page.getByRole('combobox').click()
    await page.getByRole('option', { name: 'S3 File' }).click()
    await page.getByRole('textbox', { name: 'Table name' }).fill(tableName)
    await page.getByRole('textbox', { name: 'URI' }).fill('s3://bucket/s3_table.csv')
    await page.getByRole('button', { name: 'Add column' }).click()
    // FIXME: Necessary because this component is somehow remounted
    await page.waitForTimeout(500)
    await page.getByRole('textbox', { name: 'Name', exact: true }).fill('s3_column')
    await page.getByRole('button', { name: 'Save' }).click()
    await page.getByRole('button', { name: 'Create wrapper' }).click()
    await expect(page.getByText('Successfully created S3 foreign data wrapper')).toBeVisible()
  })
})
