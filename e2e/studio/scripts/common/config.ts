const getOrThrow = (key: string): string => {
  const value = process.env[key]
  if (!value) {
    throw new Error(`missing env var: ${key}`)
  }
  return value
}

const getOrDefault = (key: string, defaultValue: string): string => {
  const value = process.env[key]
  return value || defaultValue
}

const getOrDefaultBoolean = (key: string, defaultValue: boolean): boolean => {
  const value = process.env[key]
  return value ? value === 'true' : defaultValue
}

type NODE_ENV = 'prod' | 'staging' | 'local'

export const CONFIG = {
  SUPA_PLATFORM_URI: getOrThrow('SUPA_PLATFORM_URI'),
  SUPA_V0_KEY: getOrThrow('SUPA_V0_KEY'),
  SUPA_PLATFORM_URI_V1: getOrThrow('SUPA_PLATFORM_URI_V1'),
  SUPA_V1_KEY: getOrThrow('SUPA_V1_KEY'),
  PROJECT_JSON: getOrDefault('PROJECT_JSON', 'project.json'),
  ORG_SLUG: getOrDefault('ORG_SLUG', 'xxxxxxxx'),
  PLATFORM_THROTTLE_SKIP: getOrDefault('PLATFORM_THROTTLE_SKIP', ''),
  MW_ENABLED: getOrDefaultBoolean('MW_ENABLED', false),
  SUPABASE_PROJECT_ENDPOINT: getOrDefault('SUPABASE_URL', 'vfdkvfdvkdfvmdvklfvgrgr.supabase.red'),
  SUPABASE_PROJECT_ADMINAPI_KEY: getOrDefault('SUPABASE_ADMIN_KEY', 'xyz'),
  SUPABASE_PROJECT_MEMBER_EMAIL: getOrDefault('PRIMARY_EMAIL', ''),
}
