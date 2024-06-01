import { config } from 'dotenv'
import { statSync } from 'fs'

if (!process.env.CI) {
  // Use keys from studio .env.local for local tests
  const envPath = '../../apps/studio/.env.local'

  statSync(envPath)
  config({ path: envPath })
}
