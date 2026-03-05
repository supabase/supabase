import path from 'path'
import { test as base } from '@playwright/test'
import dotenv from 'dotenv'

import { env } from '../env.config.js'

dotenv.config({
  path: path.resolve(import.meta.dirname, '../.env.local'),
  override: true,
})

export interface TestOptions {
  env: string
  ref: string
  apiUrl: string
}

export const test = base.extend<TestOptions>({
  env: env.STUDIO_URL,
  ref: env.PROJECT_REF ?? 'default',
  apiUrl: env.API_URL,
  page: async ({ page }, use) => {
    const ref = env.PROJECT_REF ?? 'default'
    await page.addInitScript((ref) => {
      localStorage.setItem(`table-editor-new-filter-banner-dismissed-${ref}`, JSON.stringify(true))
    }, ref)
    await use(page)
  },
})
