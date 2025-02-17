import { test as base } from '@playwright/test'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({
  path: path.resolve(__dirname, process.env.ENV === 'staging' ? '../.env.staging' : ''),
  override: true,
})

export interface TestOptions {
  env: string
  ref: string
  apiUrl: string
}

export const test = base.extend<TestOptions>({
  env: process.env.ENV,
  ref: process.env.PROJECT_REF,
  apiUrl:
    process.env.ENV === 'local'
      ? 'http://localhost:8082/api'
      : process.env.ENV === 'staging'
        ? 'https://api.supabase.green'
        : '',
})
