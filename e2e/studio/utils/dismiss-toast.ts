import { Page } from '@playwright/test'

export const dismissToast = async (page: Page) => {
  await page
    .locator('li.toast')
    .getByRole('button', { name: 'Opt out' })
    .waitFor({ state: 'visible' })
  await page.locator('li.toast').getByRole('button', { name: 'Opt out' }).click()
}

export const toKebabCase = (str: string) => str.replace(/([A-Z])/g, '-$1').toLowerCase()
