import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager'

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

type EnvConstants = {
  AWS_SECRETS_NAME: string
  AWS_SECRETS_REGION: string
  LF_LOGS_COUNT_ENDPOINT: string
  MW_READ_ONLY: string
}

type NODE_ENV = 'prod' | 'staging' | 'local'

const envConstants: Record<NODE_ENV, EnvConstants> = {
  prod: {
    AWS_SECRETS_NAME: 'prod/tests/integration/infra',
    AWS_SECRETS_REGION: 'ap-southeast-1',
    LF_LOGS_COUNT_ENDPOINT:
      'https://api.logflare.app/api/endpoints/query/4211e392-18a3-4f47-97e6-5e0407ccf3d9',
    MW_READ_ONLY: 'https://readonly.supabase.io',
  },
  staging: {
    AWS_SECRETS_NAME: 'staging/tests/integration/infra',
    AWS_SECRETS_REGION: 'ap-southeast-2',
    LF_LOGS_COUNT_ENDPOINT:
      'https://api.logflare.app/api/endpoints/query/16c4e428-4929-4652-8230-eb0fca70a30a',
    MW_READ_ONLY: 'https://alt.supabase.green',
  },
  local: {
    AWS_SECRETS_NAME: 'local/tests/integration/infra',
    AWS_SECRETS_REGION: 'ap-southeast-2',
    LF_LOGS_COUNT_ENDPOINT:
      'https://api.logflare.app/api/endpoints/query/b38a10f4-3db4-4441-8130-acbac9976a1c',
    MW_READ_ONLY: 'http://localhost:8000',
  },
}

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
  ...envConstants[getOrDefault('NODE_ENV', 'local') as NODE_ENV],
}

type Secrets = {
  MW_READ_ONLY_KEY: string
  MW_ENCRYPTION_KEY: string
  LOGFLARE_ACCESS_TOKEN: string
}

let SECRETS: null | Secrets = null

const initSecrets = async (): Promise<Record<string, string | undefined>> => {
  if (!CONFIG.MW_ENABLED) {
    return {}
  }
  if (!CONFIG.AWS_SECRETS_NAME || !CONFIG.AWS_SECRETS_REGION)
    throw new Error('missing AWS_SECRETS_NAME or AWS_SECRETS_REGION')

  const client = new SecretsManagerClient({ region: CONFIG.AWS_SECRETS_REGION })
  const secret = await client.send(new GetSecretValueCommand({ SecretId: CONFIG.AWS_SECRETS_NAME }))

  return JSON.parse(secret.SecretString ?? '{}')
}

export const SECRET = async (): Promise<Secrets> => {
  if (!SECRETS) {
    const retrievedSecrets = await initSecrets()
    SECRETS = {
      MW_READ_ONLY_KEY: retrievedSecrets.MW_READ_ONLY_KEY ?? 'not-found',
      MW_ENCRYPTION_KEY: retrievedSecrets.MW_ENCRYPTION_KEY ?? 'not-found',
      LOGFLARE_ACCESS_TOKEN: retrievedSecrets.LOGFLARE_ACCESS_TOKEN ?? 'not-found',
    }
  }
  return SECRETS
}
