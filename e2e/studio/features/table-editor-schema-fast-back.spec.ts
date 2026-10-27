import { expect, type Page } from '@playwright/test'

import { dropTable } from '../utils/db/index.js'
import { createTable } from '../utils/db/queries.js'
import { test, withSetupCleanup } from '../utils/test.js'
import { toUrl } from '../utils/to-url.js'
import { waitForTableToLoad } from '../utils/wait-for-response.js'

const tableName = 'pw_schema_fast_back'

const schemaFromUrl = (page: Page) => new URL(page.url()).searchParams.get('schema')

const expectDropdownMatchesUrl = async (page: Page) => {
  await expect
    .poll(
      async () => {
        const schema = schemaFromUrl(page)
        const aria = await page.getByTestId('schema-selector').getAttribute('aria-label')
        return aria === `Schema ${schema}`
      },
      {
        timeout: 4000,
        message: 'schema dropdown aria-label should match the schema query in the url',
      }
    )
    .toBe(true)
}

const openTableOnPublic = async (page: Page, ref: string) => {
  const load = waitForTableToLoad(page, ref, 'public')
  await page.goto(toUrl(`/project/${ref}/editor?schema=public`))
  await load
  await page.getByRole('button', { name: `View ${tableName}`, exact: true }).click()
  await page.waitForURL(/\/editor\/\d+\?schema=public/)
  await expect(page.getByRole('combobox', { name: 'Schema public' })).toBeVisible()
}

const switchSchema = async (page: Page, ref: string, schema: string) => {
  await page.getByTestId('schema-selector').click()
  await page.getByPlaceholder('Find schema...').fill(schema)
  const load = waitForTableToLoad(page, ref, schema)
  await page.getByRole('option', { name: schema, exact: true }).click()
  await load
  await page.waitForURL(new RegExp(`[?&]schema=${schema}(?:&|$)`))
  await expect(page.getByRole('combobox', { name: `Schema ${schema}` })).toBeVisible()
}

// Keeps the pages router's replace promise pending so Back lands inside the
// window where nuqs still holds its update mutex. Returns false on TanStack.
const holdInFlightSchemaReplace = async (page: Page, holdMs: number) => {
  return page.evaluate((delayMs: number) => {
    const host = window as Window & {
      next?: { router?: { replace: (...args: unknown[]) => Promise<unknown> } }
    }
    const router = host.next?.router

    if (!router) {
      return false
    }

    const originalReplace = router.replace.bind(router)
    router.replace = (...args: unknown[]) => {
      const pending = originalReplace(...args)
      return pending.then(
        (value) => new Promise((resolve) => setTimeout(() => resolve(value), delayMs))
      )
    }
    return true
  }, holdMs)
}

// Press Back in the same click that picks the schema option. The listener must
// outlive the clicks that open the dropdown and type into it, so it removes
// itself only once the matching option is clicked.
const armSameTurnBack = async (page: Page, schema: string) => {
  await page.evaluate((schemaName: string) => {
    const onClick = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Element)) {
        return
      }

      const option = target.closest('[role="option"]')
      const label = option?.textContent?.trim()
      if (label !== schemaName) {
        return
      }

      document.removeEventListener('click', onClick)
      history.back()
    }

    document.addEventListener('click', onClick)
  }, schema)
}

test.describe('table editor schema stays in sync on a fast back', () => {
  test.describe.configure({ mode: 'serial' })

  test('same-turn back keeps the dropdown on the url schema', async ({ page, ref }) => {
    await using _cleanup = await withSetupCleanup(
      () => createTable(tableName, 'name'),
      async () => {
        await dropTable(tableName)
      }
    )

    await openTableOnPublic(page, ref)
    await switchSchema(page, ref, 'auth')
    await armSameTurnBack(page, 'extensions')

    await page.getByTestId('schema-selector').click()
    await page.getByPlaceholder('Find schema...').fill('extensions')
    await page.getByRole('option', { name: 'extensions', exact: true }).click()

    await expectDropdownMatchesUrl(page)
  })

  test('back after the schema change settles still matches, and forward does too', async ({
    page,
    ref,
  }) => {
    await using _cleanup = await withSetupCleanup(
      () => createTable(tableName, 'name'),
      async () => {
        await dropTable(tableName)
      }
    )

    await openTableOnPublic(page, ref)
    await switchSchema(page, ref, 'auth')
    await page.waitForTimeout(1000)

    const schemaBeforeBack = schemaFromUrl(page)
    await page.evaluate(() => history.back())
    await expect.poll(() => schemaFromUrl(page)).not.toBe(schemaBeforeBack)
    await expectDropdownMatchesUrl(page)

    await page.evaluate(() => history.forward())
    await expectDropdownMatchesUrl(page)
  })

  test('back while the schema replace is still in flight keeps the dropdown on the url', async ({
    page,
    ref,
  }) => {
    await using _cleanup = await withSetupCleanup(
      () => createTable(tableName, 'name'),
      async () => {
        await dropTable(tableName)
      }
    )

    await openTableOnPublic(page, ref)
    await switchSchema(page, ref, 'auth')

    const held = await holdInFlightSchemaReplace(page, 2000)
    test.skip(!held, 'pages router replace only exists on the Next runtime')

    await page.getByTestId('schema-selector').click()
    await page.getByPlaceholder('Find schema...').fill('extensions')
    await page.getByRole('option', { name: 'extensions', exact: true }).click()
    await page.waitForURL(/[?&]schema=extensions(?:&|$)/)

    await page.evaluate(() => history.back())
    await expectDropdownMatchesUrl(page)

    // Still matched after the held replace resolves and releases the nuqs mutex.
    await page.waitForTimeout(2500)
    await expectDropdownMatchesUrl(page)
  })
})
