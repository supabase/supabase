const fs = require('fs')
const generatedEnv = require('./keys.json')

const defaultEnv = {
  // POSTGRES_PASSWORD: 'postgres',
  // NEXT_ANALYTICS_BACKEND_PROVIDER: 'postgres',
  // SUPABASE_REST_URL: 'http://127.0.0.1:54321/rest/v1/',
  // NEXT_PUBLIC_ENABLE_LOGS: 'false',
  // NEXT_PUBLIC_IS_PLATFORM: 'false',
  SUPABASE_ANON_KEY: '$ANON_KEY',
  SUPABASE_SERVICE_KEY: '$SERVICE_ROLE_KEY',
  SUPABASE_URL: '$API_URL',
  STUDIO_PG_META_URL: '$API_URL/pg',
  SUPABASE_PUBLIC_URL: '$API_URL',
  SENTRY_IGNORE_API_RESOLUTION_ERROR: '1',
  LOGFLARE_URL: 'http://localhost:54329',
  LOGFLARE_API_KEY: 'api-key',
  NEXT_PUBLIC_SITE_URL: 'http://localhost:3000',
  NEXT_PUBLIC_GOTRUE_URL: '$SUPABASE_PUBLIC_URL/auth/v1',
  NEXT_PUBLIC_HCAPTCHA_SITE_KEY: '10000000-ffff-ffff-ffff-000000000001',
  NEXT_PUBLIC_NODE_ENV: 'test',
}

const environment = { ...generatedEnv, ...defaultEnv }

fs.writeFileSync(
  '../apps/studio/.env.test',
  Object.keys(environment)
    .map((key) => `${key}=${environment[key]}`)
    .join('\n')
)
