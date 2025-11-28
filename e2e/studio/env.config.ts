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
  API_URL: process.env.API_URL || 'https://api.supabase.green',
  AUTHENTICATION: toBoolean(process.env.AUTHENTICATION),
  EMAIL: process.env.EMAIL,
  PASSWORD: process.env.PASSWORD,
  PROJECT_REF: process.env.PROJECT_REF || undefined,
  IS_PLATFORM: process.env.IS_PLATFORM || 'false',
  VERCEL_AUTOMATION_BYPASS_SELFHOSTED_STUDIO:
    process.env.VERCEL_AUTOMATION_BYPASS_SELFHOSTED_STUDIO || 'false',
  ORG_SLUG: process.env.ORG_SLUG || 'default',
  SUPA_REGION: process.env.SUPA_REGION || 'us-east-1',
  SUPA_V0_KEY: process.env.SUPA_V0_KEY || 'test',
}

export const STORAGE_STATE_PATH = path.join(import.meta.dirname, './playwright/.auth/user.json')
