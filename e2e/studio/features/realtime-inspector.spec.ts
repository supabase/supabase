import { expect } from '@playwright/test'

import {
  getMessageCount,
  joinChannel,
  leaveChannel,
  navigateToRealtimeInspector,
  openBroadcastModal,
  startListening,
  stopListening,
  waitForRealtimeMessage,
} from '../utils/realtime-helpers.js'
import { test } from '../utils/test.js'

test.describe('Realtime Inspector', () => {
  test.beforeEach(async ({ page, ref }) => {
    // `navigateToRealtimeInspector` already waits for "Join a channel" to be
    // visible, which only renders once the project settings have loaded. A
    // separate `waitForResponse(/settings/)` registered here is both redundant
    // and racy: settings is a one-shot, non-refetching request, so under the
    // faster TanStack render it resolves before this listener attaches and the
    // wait hangs until the test timeout. The UI assertion is the real gate.
    await navigateToRealtimeInspector(page, ref)
  })

  test.describe('Basic Inspector UI', () => {
    test('inspector page loads correctly with empty state', async ({ page }) => {
      await expect(page.getByRole('button', { name: 'Join a channel' })).toBeVisible()

      const startButton = page.getByRole('button', { name: 'Start listening' })
      await expect(startButton).toBeVisible()
      await expect(startButton).toBeDisabled()

      await expect(page.getByText('Create realtime experiences')).toBeVisible()
    })

    test('channel selection popover opens and works', async ({ page }) => {
      await page.getByRole('button', { name: 'Join a channel' }).click()

      await expect(page.getByPlaceholder('Enter a channel name')).toBeVisible({ timeout: 5000 })
      await expect(page.getByRole('button', { name: 'Listen to channel' })).toBeVisible()
      await expect(page.getByText('Is channel private?')).toBeVisible()

      await page.keyboard.press('Escape')
    })

    test('can join and leave a channel', async ({ page }) => {
      const testChannelName = 'pw_realtime_test_channel_join_leave'
      await joinChannel(page, testChannelName)

      await expect(page.getByText('Listening', { exact: true })).toBeVisible({ timeout: 10000 })
      await expect(page.getByRole('button', { name: `Channel: ${testChannelName}` })).toBeVisible()

      await leaveChannel(page)

      await expect(page.getByRole('button', { name: 'Join a channel' })).toBeVisible()
    })

    test('start/stop listening button works', async ({ page }) => {
      const testChannelName = 'pw_realtime_test_channel_listening'
      await joinChannel(page, testChannelName)

      await expect(page.getByText('Listening', { exact: true })).toBeVisible({ timeout: 10000 })
      await expect(page.getByRole('button', { name: 'Stop listening' })).toBeVisible()

      await stopListening(page)

      await expect(page.getByRole('button', { name: 'Start listening' })).toBeVisible()
      await expect(page.getByText('Listening', { exact: true })).not.toBeVisible()

      await startListening(page)

      await expect(page.getByText('Listening', { exact: true })).toBeVisible({ timeout: 10000 })

      await leaveChannel(page)
    })
  })

  test.describe('Broadcast Messages', () => {
    test('broadcast messages appear in the UI when listening', async ({ page }) => {
      const testChannelName = 'pw_realtime_test_channel_broadcast_ui'
      await joinChannel(page, testChannelName)

      await expect(page.getByText('Listening', { exact: true })).toBeVisible({ timeout: 10000 })

      await openBroadcastModal(page)
      await page.getByRole('button', { name: 'Confirm' }).click()

      await expect(page.getByText('Successfully broadcasted message')).toBeVisible({
        timeout: 10000,
      })

      const messageRow = await waitForRealtimeMessage(page, { timeout: 30000 })
      await expect(messageRow).toBeVisible()

      const count = await getMessageCount(page)
      expect(count).toBeGreaterThanOrEqual(1)

      await leaveChannel(page)
    })

    test('clicking broadcast message shows detail panel', async ({ page }) => {
      const testChannelName = 'pw_realtime_test_channel_broadcast_details'
      await joinChannel(page, testChannelName)

      await openBroadcastModal(page)
      await page.getByRole('button', { name: 'Confirm' }).click()
      await expect(page.getByText('Successfully broadcasted message')).toBeVisible()
      await expect(page.getByText('Broadcast a message to all clients')).not.toBeVisible()
      await waitForRealtimeMessage(page, { timeout: 30000 })

      const messageRow = page.getByRole('row').filter({ hasText: 'broadcast' }).first()
      await expect(messageRow).toBeVisible()
      // The message cell renders the full (untruncated) JSON, so the data-grid
      // row is far wider than its column and its geometric center sits under the
      // always-present detail panel — a default center-click is intercepted by
      // that panel. Click the timestamp text instead: it's at the row's left,
      // always inside the visible grid viewport, and still triggers the row's
      // onClick that opens the detail panel.
      await messageRow
        .getByText(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
        .first()
        .click()

      await expect(page.getByText('Timestamp')).toBeVisible()

      await leaveChannel(page)
    })

    test('broadcast modal validates JSON payload', async ({ page }) => {
      const testChannelName = 'pw_realtime_test_channel_broadcast_json'
      await joinChannel(page, testChannelName)

      await openBroadcastModal(page)

      await page.getByRole('textbox', { name: /Editor content/i }).focus()
      await page.keyboard.press('ControlOrMeta+KeyA')
      await page.keyboard.type('{ invalid json }')

      await page.getByRole('button', { name: 'Confirm' }).click()

      await expect(page.getByText('Please provide a valid JSON')).toBeVisible({ timeout: 5000 })

      await page.getByRole('button', { name: 'Cancel' }).click()

      await leaveChannel(page)
    })
  })

  test.describe('Message Display', () => {
    test('messages counter shows correct count', async ({ page }) => {
      await joinChannel(page, `pw_realtime_test_channel_counter`)

      const initialCount = await getMessageCount(page)

      await openBroadcastModal(page)
      await page.getByRole('button', { name: 'Confirm' }).click()
      await expect(page.getByText('Successfully broadcasted message')).toBeVisible({
        timeout: 10000,
      })

      await waitForRealtimeMessage(page, { timeout: 30000 })

      const newCount = await getMessageCount(page)
      expect(newCount).toBeGreaterThan(initialCount)

      await leaveChannel(page)
    })
  })
})
