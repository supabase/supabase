import path from 'path'

const toBoolean = (value?: string) => {
  if (value == null) return false
  const normalized = value.trim().toLowerCase()
  return normalized === 'true'
}

export const env = {
  STUDIO_URL: process.env.STUDIO_URL,
  API_URL: process.env.API_URL || 'https://api.supabase.green',
  AUTHENTICATION: toBoolean(process.env.AUTHENTICATION),
  EMAIL: process.env.EMAIL,
  PASSWORD: process.env.PASSWORD,
  PROJECT_REF: process.env.PROJECT_REF || 'default',
  IS_PLATFORM: process.env.IS_PLATFORM || 'false',
  VERCEL_AUTOMATION_BYPASS_SELFHOSTED_STUDIO:
    process.env.VERCEL_AUTOMATION_BYPASS_SELFHOSTED_STUDIO || 'false',
}

export const STORAGE_STATE_PATH = path.join(__dirname, './playwright/.auth/user.json')
