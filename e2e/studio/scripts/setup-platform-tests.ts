import { env } from '../env.config.js'
import { PlatformClient } from './common/platform.js'
import { createProject, getProjectRef } from './helpers/project.js'

export async function setupProjectForTests() {
  if (!env.IS_PLATFORM) {
    console.log('Not running on platform, skipping project creation')
    return 'default'
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
    return existingProjectRef
  } else {
    console.log(`\n 🔑 Project not found, creating new project...`)
  }

  const ref = await createProject({
    platformClient,
    orgSlug,
    supaRegion,
    projectName,
  })

  console.log(`\n ✅ Project created: ${ref}, settings as environment variables`)
  return ref
}
