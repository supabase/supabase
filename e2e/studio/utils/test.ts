import { test as base } from '@playwright/test'
import { env } from '../env.config'

export interface TestOptions {
  env: string
  ref: string
  apiUrl: string
}

export const test = base.extend<TestOptions>({
  env: env.STUDIO_URL,
  ref: env.PROJECT_REF,
  apiUrl: env.API_URL,
})
