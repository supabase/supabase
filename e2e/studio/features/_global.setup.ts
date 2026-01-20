import { test as setup } from '@playwright/test'
import dotenv from 'dotenv'
import path from 'path'
import { env } from '../env.config.js'
import { setupProjectForTests } from '../scripts/setup-platform-tests.js'
import { loginWithEmail } from '../scripts/login/email.js'
import { loginWithGithubWithRetry } from '../scripts/login/github.js'

/**
 * Run any setup tasks for the tests.
 * Catch errors and show useful messages.
 */

dotenv.config({
  path: path.resolve(import.meta.dirname, '..', '.env.local'),
  override: true,
})

const IS_PLATFORM = process.env.IS_PLATFORM
const doAuthentication = env.AUTHENTICATION

setup('Global Setup', async ({ page }) => {
  console.log(`\n 🧪 Setting up test environment.
    - Studio URL: ${env.STUDIO_URL}
    - API URL: ${env.API_URL}
    - Auth: ${doAuthentication ? 'enabled' : 'disabled'}
    - Is Platform: ${IS_PLATFORM}
    `)

  /**
   * Studio Check
   */

  const studioUrl = env.STUDIO_URL
  const apiUrl = env.API_URL

  await page.goto(studioUrl).catch((err) => {
    console.error(
      `\n 🚨 Setup Error 
Studio is not available at: ${studioUrl}

Please ensure:
  1. Studio is running in the expected URL
  2. You have proper network access
`
    )
    throw err
  })

  console.log(`\n ✅ Studio is running at ${studioUrl}`)

  /**
   * API Check
   */

  await fetch(apiUrl).catch((err) => {
    console.error(`\n 🚨 Setup Error
API is not available at: ${apiUrl}

Please ensure:
  1. API is running in the expected URL
  2. You have proper network access

To start API locally, run:
  npm run dev:api`)
    throw new Error('API is not available')
  })

  console.log(`\n ✅ API is running at ${apiUrl}`)

  /**
   * Setup Project for tests
   */
  const projectRef = await setupProjectForTests()
  process.env.PROJECT_REF = projectRef
  env.PROJECT_REF = projectRef

  /**
   * Only run authentication if the environment requires it
   */
  if (!doAuthentication) {
    console.log(`\n 🔑 Skipping authentication for ${env.STUDIO_URL}`)
    return
  }

  const { EMAIL, PASSWORD } = env
  if (EMAIL && PASSWORD) {
    console.log(`\n 🔑 Authenticating user with email and password`)

    try {
      await loginWithEmail(page, studioUrl, {
        email: EMAIL,
        password: PASSWORD,
      })
      console.log(`\n ✅ Successfully authenticated with email`)
      return
    } catch (err) {
      console.error(`\n 🚨 Authentication failed with email/password`)
      throw err
    }
  }

  const { GITHUB_USER, GITHUB_PASS, GITHUB_TOTP } = env
  if (GITHUB_USER && GITHUB_PASS && GITHUB_TOTP) {
    console.log(`\n 🔑 Authenticating user with GitHub`)
    try {
      await loginWithGithubWithRetry({
        page,
        githubTotp: GITHUB_TOTP,
        githubUser: GITHUB_USER,
        githubPass: GITHUB_PASS,
        supaDashboard: studioUrl,
      })
      console.log(`\n ✅ Successfully authenticated with GitHub`)
      return
    } catch (err) {
      console.error(`\n 🚨 Authentication failed with GitHub`)
      throw err
    }
  }
})
