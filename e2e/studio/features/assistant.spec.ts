import { expect } from '@playwright/test'
import { test } from '../utils/test.js'
import { toUrl } from '../utils/to-url.js'

test.describe('AI Assistant', async () => {
  test('Can send a message to the assistant and receive a response', async ({ page, ref }) => {
    // Skip the test if the OPENAI_API_KEY is not set
    test.skip(!process.env.OPENAI_API_KEY, 'OPENAI_API_KEY is not set')

    await page.goto(toUrl(`/project/${ref}`))

    // Wait for the page to load
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    // Click the assistant button to open the assistant panel
    await page.locator('#assistant-trigger').click()

    // Wait for the assistant panel to be visible
    await expect(page.getByRole('heading', { name: 'How can I assist you?' })).toBeVisible()

    // Type "hello" in the chat input
    const chatInput = page.getByRole('textbox', { name: 'Chat to Postgres...' })
    await chatInput.fill('hello')

    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes('/api/ai/sql/generate-v4') &&
        response.request().method() === 'POST',
      { timeout: 60000 }
    )

    // Click the send message button
    const sendButton = page.getByRole('button', { name: 'Send message' })
    await sendButton.click()

    // Wait for the API request to complete
    const response = await responsePromise

    // Verify the response was successful
    expect(response.status()).toBe(200)

    // AI response has values
    const body = await response.text()
    expect(body).toContain('data')
  })
})
