import path from 'path'

export type Env =
  | 'production' // Supabase.com
  | 'staging' // Supabase.green
  | 'selfhosted' // Supabase CLI Studio
  | 'ci' // CI
  | 'dev-hosted' // Local Development for Hosted
  | 'dev-selfhosted' // Local Development for Self-Hosted

export const ENV: Env = (process.env.TEST_ENV as Env) || 'dev-hosted'

export const ENV_WITH_AUTH: Env[] = ['production', 'staging', 'dev-hosted']

export const ENV_URLS: Record<Env, string> = {
  production: 'https://supabase.com',
  staging: 'https://supabase.green',
  selfhosted: 'http://localhost:54323',
  'dev-hosted': 'http://localhost:8082',
  'dev-selfhosted': 'http://localhost:8082',
  ci: process.env.BASE_URL,
}

export const API_URLS: Record<Env, string> = {
  production: 'https://api.supabase.com',
  staging: 'https://api.supabase.green',
  selfhosted: 'http://localhost:54323/api',
  'dev-hosted': 'http://localhost:8080/api',
  'dev-selfhosted': 'http://localhost:8082/api',
  ci: process.env.API_BASE_URL || 'https://api.supabase.green',
}

export const PROJECT_REFS: Record<Env, string> = {
  production: process.env.PRODUCTION_PROJECT_REF,
  staging: process.env.STAGING_PROJECT_REF,
  'dev-hosted': process.env.DEV_HOSTED_PROJECT_REF,
  selfhosted: 'default',
  'dev-selfhosted': 'default',
  ci: process.env.PREVIEW_PROJECT_REF,
}

export const STORAGE_STATE_PATH = path.join(__dirname, './playwright/.auth/user.json')

export const getStudioUrl = (env?: Env): string => {
  return env ? ENV_URLS[env] : ENV_URLS[ENV]
}

export const isEnv = (target: Env | Env[]): boolean => {
  return Array.isArray(target) ? target.includes(ENV) : ENV === target
}

export const getApiUrl = (env?: Env): string => {
  return env ? API_URLS[env] : API_URLS[ENV]
}

export const getProjectRef = (env?: Env): string => {
  return env ? PROJECT_REFS[env] : PROJECT_REFS[ENV]
}

export const isEnvWithAuth = (env?: Env): boolean => {
  return env ? ENV_WITH_AUTH.includes(env) : ENV_WITH_AUTH.includes(ENV)
}
