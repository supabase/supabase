import { expect, type Page } from '@playwright/test'

export const expectClipboardValue = ({
  page,
  value,
  exact = false,
  timeout = 2000,
}: {
  page: Page
  value: string
  exact?: boolean
  timeout?: number
}) =>
  expect(async () => {
    await using handle = await page.evaluateHandle(() => navigator.clipboard.readText())
    if (exact) {
      expect(await handle.jsonValue()).toEqual(value)
    } else {
      expect(await handle.jsonValue()).toContain(value)
    }
  }).toPass({ timeout })
