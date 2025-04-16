import { test as base } from '@playwright/test'
import dotenv from 'dotenv'
import path from 'path'
import { ENV, getApiUrl, getProjectRef } from '../env.config'

dotenv.config({
  path: path.resolve(__dirname, '../.env.local'),
  override: true,
})

export interface TestOptions {
  env: string
  ref: string
  apiUrl: string
}

export const test = base.extend<TestOptions>({
  env: ENV,
  ref: getProjectRef(ENV),
  apiUrl: getApiUrl(ENV),
})
