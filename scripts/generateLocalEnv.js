const fs = require('fs')
const generatedEnv = require('../keys.json')

/**
 * This script takes the API keys from the local environment, merges them with some predefined variables and saves them
 * to a env.test file in the studio app. This is needed to prepare the studio so that it can be run with the local
 * environment as the backend.
 */

const defaultEnv = {
  // NEXT_ANALYTICS_BACKEND_PROVIDER: 'postgres',
  // SUPABASE_REST_URL: 'http://127.0.0.1:54321/rest/v1/',
  // NEXT_PUBLIC_ENABLE_LOGS: 'false',
  // NEXT_PUBLIC_IS_PLATFORM: 'false',
  PG_META_CRYPTO_KEY: 'SAMPLE_KEY',
  POSTGRES_PASSWORD: 'postgres',
  POSTGRES_HOST: 'db',
  POSTGRES_DB: 'postgres',
  POSTGRES_PORT: '5432',
  SUPABASE_ANON_KEY: '$ANON_KEY',
  SUPABASE_SERVICE_KEY: '$SERVICE_ROLE_KEY',
  SUPABASE_URL: '$API_URL',
  STUDIO_PG_META_URL: '$API_URL/pg',
  SUPABASE_PUBLIC_URL: '$API_URL',
  SENTRY_IGNORE_API_RESOLUTION_ERROR: '1',
  LOGFLARE_URL: 'http://127.0.0.1:54327',
  LOGFLARE_PRIVATE_ACCESS_TOKEN: 'api-key',
  LOGFLARE_API_KEY: 'api-key',
  NEXT_PUBLIC_SITE_URL: 'http://localhost:8082',
  NEXT_PUBLIC_GOTRUE_URL: '$SUPABASE_PUBLIC_URL/auth/v1',
  NEXT_PUBLIC_HCAPTCHA_SITE_KEY: '10000000-ffff-ffff-ffff-000000000001',
  NEXT_PUBLIC_NODE_ENV: 'test',
  SNIPPETS_MANAGEMENT_FOLDER: '../../supabase/snippets',
  EDGE_FUNCTIONS_MANAGEMENT_FOLDER: '../../supabase/functions' // path relative to studio project
}

const environment = { ...generatedEnv, ...defaultEnv }

fs.writeFileSync(
  './apps/studio/.env.test',
  Object.keys(environment)
    .map((key) => `${key}=${environment[key]}`)
    .join('\n')
)

const STUDIO_URL = environment.NEXT_PUBLIC_SITE_URL
const WEB_SERVER_PORT = new URL(STUDIO_URL).port ?? undefined
const API_URL = environment.API_URL

const e2eTestEnv = {
  STUDIO_URL,
  API_URL,
  WEB_SERVER_PORT,
  IS_PLATFORM: 'false',
}

fs.writeFileSync(
  './e2e/studio/.env.local',
  Object.keys(e2eTestEnv)
    .map((key) => `${key}=${e2eTestEnv[key]}`)
    .join('\n')
)
