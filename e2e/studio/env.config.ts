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

// Default service role key for local development
const DEFAULT_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"

export const env = {
  STUDIO_URL: process.env.STUDIO_URL || 'http://localhost:8082',
  API_URL: process.env.API_URL || 'http://127.0.0.1:54321',

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

  
  SERVICE_ROLE_KEY: process.env.SERVICE_ROLE_KEY || DEFAULT_SERVICE_ROLE_KEY,
}

export const STORAGE_STATE_PATH = path.join(import.meta.dirname, './playwright/.auth/user.json')
