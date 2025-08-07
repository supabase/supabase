import path from 'path'

export const env = {
  STUDIO_URL: process.env.STUDIO_URL,
  API_URL: process.env.API_URL || 'https://api.supabase.green',
  AUTHENTICATION: process.env.AUTHENTICATION,
  EMAIL: process.env.EMAIL,
  PASSWORD: process.env.PASSWORD,
  PROJECT_REF: process.env.PROJECT_REF || 'default',
}

export const STORAGE_STATE_PATH = path.join(__dirname, './playwright/.auth/user.json')
