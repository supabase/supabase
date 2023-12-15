import { config } from 'dotenv'
import { statSync } from 'fs'

// Use studio .env.local for now
const envPath = '../../apps/studio/.env.local'

statSync(envPath)
config({ path: envPath })
