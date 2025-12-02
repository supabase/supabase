import path from 'path'
import fs from 'fs'
import { env } from '../env.config.js'
import { PlatformClient } from './common/platform.js'
import { createProject, getProjectRef } from './helpers/project.js'

function appendToEnvFile(key: string, value: string) {
  const envFile = path.join(import.meta.dirname, '../.env.local')
  const envFileContent = fs.readFileSync(envFile, 'utf8')
  const envFileLines = envFileContent.split('\n')
  envFileLines.push(`${key}=${value}`)
  fs.writeFileSync(envFile, envFileLines.join('\n'))
}

async function main() {
  const isPlatform = env.IS_PLATFORM === 'true'
  if (!isPlatform) {
    console.log('Not running on platform, skipping project creation')
    return
  }

  // Will default to e2e-test-<timestamp> if not set
  const projectName = env.BRANCH_NAME

  // Validate required environment variables
  const orgSlug = env.ORG_SLUG
  const supaRegion = env.SUPA_REGION
  const apiUrl = env.API_URL
  const supaPat = env.SUPA_PAT
  if (!orgSlug) throw new Error('ORG_SLUG environment variable is required')
  if (!supaRegion) throw new Error('SUPA_REGION environment variable is required')
  if (!apiUrl) throw new Error('API_URL environment variable is required')
  if (!supaPat) throw new Error('SUPA_PAT environment variable is required')

  const platformClient = new PlatformClient({
    url: apiUrl,
    accessToken: supaPat,
  })

  const existingProjectRef = await getProjectRef({
    platformClient,
    orgSlug,
    supaRegion,
    projectName,
  })
  if (existingProjectRef) {
    console.log(`\n ✅ Project found: ${existingProjectRef}, settings as environment variables`)
    appendToEnvFile('PROJECT_REF', existingProjectRef)
    return
  }

  const ref = await createProject({
    platformClient,
    orgSlug,
    supaRegion,
    projectName,
  })

  console.log(`\n ✅ Project created: ${ref}, settings as environment variables`)
  appendToEnvFile('PROJECT_REF', ref)
}

main()
