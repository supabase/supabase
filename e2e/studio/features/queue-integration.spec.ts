import { expect, Page } from '@playwright/test'

import { query } from '../utils/db/client.js'
import { releaseFileOnceCleanup, withFileOnceSetup } from '../utils/once-per-file.js'
import { test, withSetupCleanup } from '../utils/test.js'
import { toUrl } from '../utils/to-url.js'

const navigateToQueuesPage = async (page: Page, ref: string) => {
  await page.goto(toUrl(`/project/${ref}/integrations/queues/queues`))
  // Wait for a stable header signal rather than the grid — the grid only
  // renders when at least one queue exists, and an empty list shows an
  // empty-state placeholder instead. Under workers=3 the Next.js server
  // doesn't always populate the list fast enough before the assertion,
  // so the test would flake at navigation rather than at the actual
  // assertion. The "Create queue" button is part of the page header and
  // renders unconditionally once the route is mounted.
  await expect(page.getByRole('button', { name: 'Create queue' })).toBeVisible({
    timeout: 30000,
  })
}

const navigateToSingleQueuePage = async (page: Page, ref: string, queueName: string) => {
  await page.goto(toUrl(`/project/${ref}/integrations/queues/queues/${queueName}`))
  await expect(page.getByRole('grid')).toBeVisible({ timeout: 30000 })
}

const createQueueViaAPI = async (page: Page, ref: string, queueName: string) => {
  await page.request.post(toUrl(`/api/platform/pg-meta/${ref}/query`), {
    failOnStatusCode: true,
    data: {
      query: `SELECT pgmq.create('${queueName}');`,
    },
  })
}

const deleteQueueViaAPI = async (page: Page, ref: string, queueName: string) => {
  await page.request.post(toUrl(`/api/platform/pg-meta/${ref}/query`), {
    failOnStatusCode: true,
    data: {
      query: `SELECT pgmq.drop_queue('${queueName}');`,
    },
  })
}

const sendMessageViaAPI = async (
  page: Page,
  ref: string,
  queueName: string,
  payload = '{"key":"value"}'
) => {
  await page.request.post(toUrl(`/api/platform/pg-meta/${ref}/query`), {
    failOnStatusCode: true,
    data: {
      query: `SELECT pgmq.send('${queueName}', '${payload}', 5);`,
    },
  })
}

// Asserts a queue exists in the UI in a routing-agnostic way. After the
// post-create flow, two end-states are valid:
//   - Next mode: `router.push` reliably navigates to the queue-detail page
//     so the URL ends with /queues/{queueName} and the heading appears.
//   - TanStack mode: `router.push` (via the next/router shim) races nuqs's
//     `?new=true` history update and the URL stays on the list, so the new
//     row is visible there instead.
// Either signal counts as success — poll until one of them lands.
const expectQueueCreated = async (page: Page, queueName: string) => {
  await expect
    .poll(
      async () => {
        if (page.url().includes(`/queues/${queueName}`)) return true
        return await page.getByRole('row', { name: new RegExp(`\\b${queueName}\\b`) }).isVisible()
      },
      { timeout: 15000 }
    )
    .toBe(true)
}

test.describe('Queues Integration', () => {
  test.beforeAll(async () => {
    await withFileOnceSetup(import.meta.url, async () => {
      await query('CREATE EXTENSION IF NOT EXISTS pgmq;')
    })
  })
  test.afterAll(async () => {
    await releaseFileOnceCleanup(import.meta.url)
  })

  test('can view queues page', async ({ page, ref }) => {
    await navigateToQueuesPage(page, ref)

    await expect(page.getByRole('button', { name: 'Create queue' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Refresh' })).toBeVisible()
    await expect(page.getByPlaceholder('Search for a queue')).toBeVisible()
  })

  test('can create a new queue', async ({ page, ref }) => {
    const queueName = 'pw_queue_create'
    await navigateToQueuesPage(page, ref)
    await using _ = await withSetupCleanup(
      async () => {
        // Nothing — the test creates the queue via UI
      },
      async () => {
        await deleteQueueViaAPI(page, ref, queueName)
      }
    )

    await page.getByRole('button', { name: 'Create queue' }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog.getByRole('heading', { name: 'Create a new queue' })).toBeVisible()

    await dialog.getByRole('textbox').fill(queueName)

    await dialog.getByRole('button', { name: 'Create queue' }).click()

    await expect(page.getByText(/Successfully created queue/)).toBeVisible({ timeout: 10000 })
    await expect(dialog).toBeHidden({ timeout: 10000 })
    await expectQueueCreated(page, queueName)
  })

  test('can create an unlogged queue', async ({ page, ref }) => {
    const queueName = 'pw_queue_create_unlogged'
    await navigateToQueuesPage(page, ref)
    await using _ = await withSetupCleanup(
      async () => {
        // Nothing — the test creates the queue via UI
      },
      async () => {
        await deleteQueueViaAPI(page, ref, queueName)
      }
    )

    await page.getByRole('button', { name: 'Create queue' }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog.getByRole('heading', { name: 'Create a new queue' })).toBeVisible()

    await dialog.getByRole('textbox').fill(queueName)
    await dialog.getByText('Unlogged queue', { exact: true }).click()

    await dialog.getByRole('button', { name: 'Create queue' }).click()

    await expect(page.getByText(/Successfully created queue/)).toBeVisible({ timeout: 10000 })
    await expect(dialog).toBeHidden({ timeout: 10000 })
    await expectQueueCreated(page, queueName)
  })

  test('can delete a queue', async ({ page, ref }) => {
    const queueName = 'pw_queue_delete'
    let shouldCleanup = true
    await using _ = await withSetupCleanup(
      async () => {
        await createQueueViaAPI(page, ref, queueName)
      },
      async () => {
        if (!shouldCleanup) return
        await deleteQueueViaAPI(page, ref, queueName)
      }
    )
    await navigateToSingleQueuePage(page, ref, queueName)

    await page.getByRole('button', { name: 'Delete queue' }).click()
    await expect(page.getByRole('heading', { name: 'Delete this queue' })).toBeVisible()
    await page.getByPlaceholder('Type in name of queue').fill(queueName)
    await page.getByRole('button', { name: `Delete queue ${queueName}` }).click()

    await expect(page.getByText(/Successfully removed queue/)).toBeVisible({ timeout: 10000 })
    await page.waitForURL(/.*\/integrations\/queues\/queues$/)
    shouldCleanup = false
  })

  test('can purge messages from a queue', async ({ page, ref }) => {
    const queueName = 'pw_queue_purge'
    await using _ = await withSetupCleanup(
      async () => {
        await createQueueViaAPI(page, ref, queueName)
        await sendMessageViaAPI(page, ref, queueName)
        await sendMessageViaAPI(page, ref, queueName)
      },
      async () => {
        await deleteQueueViaAPI(page, ref, queueName)
      }
    )
    await navigateToSingleQueuePage(page, ref, queueName)

    await page.getByRole('button', { name: 'Purge messages' }).click()
    await expect(page.getByRole('heading', { name: 'Purge this queue' })).toBeVisible()
    await page.getByPlaceholder('Type in name of queue').fill(queueName)
    await page.getByRole('button', { name: `Purge queue ${queueName}` }).click()

    await expect(page.getByText(/Successfully purged queue/)).toBeVisible({ timeout: 10000 })
  })

  test('can send a test message to a queue', async ({ page, ref }) => {
    const queueName = 'pw_queue_send_msg'
    await using _ = await withSetupCleanup(
      async () => {
        await createQueueViaAPI(page, ref, queueName)
      },
      async () => {
        await deleteQueueViaAPI(page, ref, queueName)
      }
    )
    await navigateToSingleQueuePage(page, ref, queueName)

    await page.getByRole('button', { name: 'Add message' }).first().click()

    const dialog = page.getByRole('dialog')
    await expect(dialog.getByRole('heading', { name: 'Add a message to the queue' })).toBeVisible()

    // Submit with default payload '{}' and delay
    await dialog.getByRole('button', { name: 'Add' }).click()

    await expect(page.getByText(/Successfully added a message/)).toBeVisible({ timeout: 10000 })
  })
})
