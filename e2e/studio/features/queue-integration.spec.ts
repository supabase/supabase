import { expect, Page } from '@playwright/test'

import { query } from '../utils/db/client.js'
import { releaseFileOnceCleanup, withFileOnceSetup } from '../utils/once-per-file.js'
import { test, withSetupCleanup } from '../utils/test.js'
import { toUrl } from '../utils/to-url.js'

const navigateToQueuesPage = async (page: Page, ref: string) => {
  await page.goto(toUrl(`/project/${ref}/integrations/queues/queues`))
  await expect(page.getByRole('grid')).toBeVisible({ timeout: 30000 })
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
    await page.waitForURL(/.*\/integrations\/queues\/queues\/pw_queue_create/)
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
    await page.waitForURL(
      new RegExp(`.*\\/integrations\\/queues\\/queues\\/${queueName}`)
    )
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
