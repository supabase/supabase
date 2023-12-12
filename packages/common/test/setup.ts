import { config } from 'dotenv'
import { statSync } from 'fs'

// Use studio .env for now
const envPath = '../../apps/studio/.env.local'

statSync(envPath)
config({ path: '../../apps/studio/.env.local' })
