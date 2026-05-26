import { expect } from '@playwright/test'
import { test } from '../utils/test.js'
import { toUrl } from '../utils/to-url.js'
import { env } from '../env.config.js'

const LOG_DRAIN_OPTIONS = [
  {
    name: 'Custom Endpoint',
    buttonText: 'Custom Endpoint Forward logs',
  },
  {
    name: 'Datadog',
    buttonText: 'Datadog Datadog is a',
  },
  {
    name: 'Loki',
    buttonText: 'Loki Loki is an open-source',
  },
]

test.describe('Log Drains Settings', () => {
  test.skip(env.IS_PLATFORM, 'Log drains are not supported on platform')

  test.beforeEach(async ({ page, ref }) => {
    // Navigate to the log drains settings page
    await page.goto(toUrl(`/project/${ref}/settings/log-drains`))

    // Wait for the page to load
    await expect(page.getByRole('heading', { name: 'Log Drains', level: 1 }), {
      message: 'Log Drains heading should be visible',
    }).toBeVisible()
  })

  for (const option of LOG_DRAIN_OPTIONS) {
    test(`Opens ${option.name} panel when clicked`, async ({ page }) => {
      // Click on the log drain option button
      const optionButton = page.getByRole('button', { name: option.buttonText })
      await expect(optionButton, {
        message: `${option.name} button should be visible`,
      }).toBeVisible()

      await optionButton.click()

      // Verify that the "Add destination" dialog opens
      const dialog = page.getByRole('dialog', { name: 'Add destination' })
      await expect(dialog, {
        message: `Add destination dialog should be visible for ${option.name}`,
      }).toBeVisible()

      // Verify the dialog heading
      await expect(dialog.getByRole('heading', { name: 'Add destination', level: 2 }), {
        message: 'Dialog heading should be visible',
      }).toBeVisible()

      // Verify that the Type field shows the correct option
      const typeCombobox = dialog.getByRole('combobox').first()
      await expect(typeCombobox, {
        message: `Type combobox should contain ${option.name}`,
      }).toContainText(option.name)

      // Close the dialog by pressing Escape
      await page.keyboard.press('Escape')

      // Verify the dialog is closed
      await expect(dialog, {
        message: 'Dialog should be hidden after pressing Escape',
      }).not.toBeVisible()
    })
  }

  test('All log drain options are visible on the page', async ({ page }) => {
    // Verify all three options are displayed
    for (const option of LOG_DRAIN_OPTIONS) {
      const optionButton = page.getByRole('button', { name: option.buttonText })
      await expect(optionButton, {
        message: `${option.name} option should be visible`,
      }).toBeVisible()
    }
  })
})
