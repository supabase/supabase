import crypto from 'node:crypto'
import { expect, Page } from '@playwright/test'

import { query } from '../utils/db/index.js'
import { dropTable } from '../utils/db/queries.js'
import { test } from '../utils/test.js'
import { toUrl } from '../utils/to-url.js'
import { createApiResponseWaiter } from '../utils/wait-for-response.js'

const uniqueSuffix = () => crypto.randomBytes(4).toString('hex')

/**
 * Parent partitioned table (RLS off) with two flat partitions.
 */
const setupFlatFixture = async () => {
  const suffix = uniqueSuffix()
  const parent = `pw_part_flat_${suffix}`
  const childA = `${parent}_a`
  const childB = `${parent}_b`
  await query(`create table public.${parent} (id int not null, note text) partition by range (id)`)
  await query(
    `create table public.${childA} partition of public.${parent} for values from (0) to (100)`
  )
  await query(
    `create table public.${childB} partition of public.${parent} for values from (100) to (200)`
  )
  return {
    parent,
    childA,
    childB,
    async [Symbol.asyncDispose]() {
      await dropTable(`public.${parent}`)
    },
  }
}

/**
 * Parent -> child (itself partitioned) -> grandchild, plus a sibling leaf.
 */
const setupNestedFixture = async () => {
  const suffix = uniqueSuffix()
  const parent = `pw_part_nested_${suffix}`
  const child = `${parent}_mid`
  const grandchild = `${parent}_leaf`
  const sibling = `${parent}_sibling`
  await query(`create table public.${parent} (id int not null, note text) partition by range (id)`)
  await query(
    `create table public.${child} partition of public.${parent} for values from (0) to (100) partition by range (id)`
  )
  await query(
    `create table public.${grandchild} partition of public.${child} for values from (0) to (50)`
  )
  await query(
    `create table public.${sibling} partition of public.${parent} for values from (100) to (200)`
  )
  return {
    parent,
    child,
    grandchild,
    sibling,
    async [Symbol.asyncDispose]() {
      await dropTable(`public.${parent}`)
    },
  }
}

const goToTableEditor = async (page: Page, ref: string) => {
  const tableLoadWait = createApiResponseWaiter(
    page,
    'pg-meta',
    ref,
    'query?key=entity-types-public-'
  )
  await page.goto(toUrl(`/project/${ref}/editor?schema=public`))
  await tableLoadWait
}

const entityRow = (page: Page, name: string) =>
  page.getByRole('button', { name: `View ${name}`, exact: true })

test.describe('table editor partitions', () => {
  test('only the parent is listed, and its partitions open in a second-level list', async ({
    page,
    ref,
  }) => {
    await using fixture = await setupFlatFixture()
    await goToTableEditor(page, ref)

    await expect(
      entityRow(page, fixture.parent),
      'Parent partitioned table should be listed'
    ).toBeVisible({ timeout: 30000 })
    await expect(
      entityRow(page, fixture.childA),
      'Child partitions should not be listed alongside regular tables'
    ).toHaveCount(0)

    // Parent has RLS disabled, so it should be flagged as unrestricted
    await expect(
      entityRow(page, fixture.parent).getByText('Unrestricted'),
      'Parent without RLS should show the Unrestricted badge'
    ).toBeVisible()

    await entityRow(page, fixture.parent).getByRole('button', { name: 'View 2 partitions' }).click()

    await expect(
      page.getByTestId('partitions-list'),
      'Partitions list should open after clicking the partition count'
    ).toBeVisible({ timeout: 30000 })
    await expect(entityRow(page, fixture.childA)).toBeVisible()
    await expect(entityRow(page, fixture.childB)).toBeVisible()

    // Search narrows the partitions
    await page.getByPlaceholder('Search partitions...').fill(fixture.childB)
    await expect(entityRow(page, fixture.childB)).toBeVisible()
    await expect(entityRow(page, fixture.childA)).toHaveCount(0)

    // Back returns to the full table list
    await page.getByRole('button', { name: 'Back to all tables' }).click()
    await expect(entityRow(page, fixture.parent)).toBeVisible()
    await expect(entityRow(page, fixture.childA)).toHaveCount(0)
  })

  test('nested partitions navigate down and back up one level at a time', async ({ page, ref }) => {
    await using fixture = await setupNestedFixture()
    await goToTableEditor(page, ref)

    await entityRow(page, fixture.parent)
      .getByRole('button', { name: /View \d+ partitions?/ })
      .click()
    await expect(entityRow(page, fixture.child)).toBeVisible({ timeout: 30000 })
    await expect(entityRow(page, fixture.sibling)).toBeVisible()
    await expect(
      entityRow(page, fixture.grandchild),
      'Only direct children should be listed at the first level'
    ).toHaveCount(0)

    // Drill into the sub-partitioned child
    await entityRow(page, fixture.child)
      .getByRole('button', { name: /View \d+ partitions?/ })
      .click()
    await expect(entityRow(page, fixture.grandchild)).toBeVisible({ timeout: 30000 })
    await expect(entityRow(page, fixture.sibling)).toHaveCount(0)

    // Back goes to the parent's partitions, not all the way out
    await page.getByRole('button', { name: 'Back to parent partitions' }).click()
    await expect(entityRow(page, fixture.child)).toBeVisible()
    await expect(entityRow(page, fixture.sibling)).toBeVisible()

    await page.getByRole('button', { name: 'Back to all tables' }).click()
    await expect(entityRow(page, fixture.parent)).toBeVisible()
  })
})
