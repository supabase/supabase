import { expect, Page } from '@playwright/test'
import { toUrl } from './to-url.js'

export async function navigateToRealtimeInspector(page: Page, ref: string) {
  await page.goto(toUrl(`/project/${ref}/realtime/inspector`))
  await expect(page.locator('text=Join a channel')).toBeVisible({ timeout: 30000 })
}

export async function joinChannel(page: Page, channelName: string) {
  await page.getByRole('button', { name: /Join a channel|Channel:/ }).click()
  await expect(page.getByPlaceholder('Enter a channel name')).toBeVisible({ timeout: 5000 })
  await page.getByPlaceholder('Enter a channel name').fill(channelName)
  await page.getByRole('button', { name: 'Listen to channel' }).click()
  await expect(page.getByText('Listening', { exact: true })).toBeVisible({ timeout: 10000 })
}

export async function leaveChannel(page: Page) {
  await page.getByRole('button', { name: /Channel:/ }).click()
  await expect(page.getByRole('button', { name: 'Leave channel' })).toBeVisible({ timeout: 5000 })
  await page.getByRole('button', { name: 'Leave channel' }).click()
  await expect(page.getByRole('button', { name: 'Join a channel' })).toBeVisible({ timeout: 5000 })
}

export async function startListening(page: Page) {
  const listenButton = page.getByRole('button', { name: 'Start listening' })
  await expect(listenButton).toBeVisible({ timeout: 5000 })
  await listenButton.click()
  await expect(page.getByText('Listening', { exact: true })).toBeVisible({ timeout: 10000 })
}

export async function stopListening(page: Page) {
  const stopButton = page.getByRole('button', { name: 'Stop listening' })
  await expect(stopButton).toBeVisible({ timeout: 5000 })
  await stopButton.click()
  await expect(page.getByRole('button', { name: 'Start listening' })).toBeVisible({ timeout: 5000 })
}

export async function openBroadcastModal(page: Page) {
  const broadcastButton = page.getByRole('button', { name: 'Broadcast a message' })
  await expect(broadcastButton).toBeVisible({ timeout: 5000 })
  await broadcastButton.click()
  await expect(page.getByText('Broadcast a message to all clients')).toBeVisible({ timeout: 5000 })
}

export async function waitForRealtimeMessage(page: Page, options?: { timeout?: number }) {
  const timeout = options?.timeout ?? 30000
  const gridRow = page.getByRole('row').filter({ hasText: /^\d{4}-\d{2}-\d{2}/ }).first()
  await expect(gridRow).toBeVisible({ timeout })
  return gridRow
}

export async function getMessageCount(page: Page): Promise<number> {
  const countText = page.locator('text=/Found \\d+ messages/')
  if ((await countText.count()) === 0) {
    const noMessages = page.locator('text=No message found yet')
    if ((await noMessages.count()) > 0) {
      return 0
    }
    const maxMessages = page.locator('text=/showing only the latest 100/')
    if ((await maxMessages.count()) > 0) {
      return 100
    }
    return 0
  }

  const text = await countText.textContent()
  const match = text?.match(/Found (\d+) messages/)
  return match ? parseInt(match[1], 10) : 0
}
