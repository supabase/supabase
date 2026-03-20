import { expect, type Page } from '@playwright/test'

export const expectClipboardValue = ({
  page,
  value,
  timeout = 2000,
}: {
  page: Page
  value: string
  timeout?: number
}) =>
  expect(async () => {
    const handle = await page.evaluateHandle(() => navigator.clipboard.readText())
    expect(await handle.jsonValue()).toContain(value)
    await handle.dispose()
  }).toPass({ timeout })
