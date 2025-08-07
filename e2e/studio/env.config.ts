import path from 'path'
import dotenv from 'dotenv'

dotenv.config({
  path: path.resolve(__dirname, '.env.local'),
  override: true,
})

export const env = {
  STUDIO_URL: process.env.STUDIO_URL || 'http://localhost:8082/',
  API_URL: process.env.API_URL || 'http://localhost:8082/api',
  AUTHENTICATION: process.env.AUTHENTICATION || 'false',
  EMAIL: process.env.EMAIL,
  PASSWORD: process.env.PASSWORD,
  PROJECT_REF: process.env.PROJECT_REF || 'default',
  IS_PLATFORM: process.env.IS_PLATFORM || false,
}

export const STORAGE_STATE_PATH =
  env.AUTHENTICATION === `true` ? path.join(__dirname, './playwright/.auth/user.json') : undefined
