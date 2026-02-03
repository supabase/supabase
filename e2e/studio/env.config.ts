import dotenv from 'dotenv'
import path from 'path'

// Load .env.local before reading process.env
dotenv.config({
  path: path.resolve(import.meta.dirname, '.env.local'),
  override: true,
})

const toBoolean = (value?: string) => {
  if (value == null) return false
  const normalized = value.trim().toLowerCase()
  return normalized === 'true'
}

export const env = {
  STUDIO_URL: process.env.STUDIO_URL || 'http://localhost:8082',
  API_URL: process.env.API_URL || 'https://localhost:8080',

  IS_PLATFORM: toBoolean(process.env.IS_PLATFORM || 'false'),
  EMAIL: process.env.EMAIL,
  PASSWORD: process.env.PASSWORD,
  PROJECT_REF: process.env.PROJECT_REF || undefined,

  GITHUB_USER: process.env.GITHUB_USER,
  GITHUB_PASS: process.env.GITHUB_PASS,
  GITHUB_TOTP: process.env.GITHUB_TOTP,

  VERCEL_AUTOMATION_BYPASS_SELFHOSTED_STUDIO:
    process.env.VERCEL_AUTOMATION_BYPASS_SELFHOSTED_STUDIO || 'false',
  ORG_SLUG: process.env.ORG_SLUG || 'default',
  SUPA_REGION: process.env.SUPA_REGION || 'us-east-1',
  SUPA_PAT: process.env.SUPA_PAT || 'test',

  BRANCH_NAME: process.env.BRANCH_NAME || `e2e-test-local`,

  AUTHENTICATION:
    Boolean(process.env.EMAIL && process.env.PASSWORD) ||
    Boolean(process.env.GITHUB_USER && process.env.GITHUB_PASS && process.env.GITHUB_TOTP),

  IS_APP_RUNNING_ON_LOCALHOST:
    process.env.STUDIO_URL?.includes('localhost') || process.env.STUDIO_URL?.includes('127.0.0.1'),
}

export const STORAGE_STATE_PATH = path.join(import.meta.dirname, './playwright/.auth/user.json')
