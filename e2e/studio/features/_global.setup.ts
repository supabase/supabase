import { expect, test as setup } from '@playwright/test'
import dotenv from 'dotenv'
import path from 'path'
import { Env, ENV, getApiUrl, getStudioUrl, STORAGE_STATE_PATH } from '../env.config'

/**
 * Run any setup tasks for the tests.
 * Catch errors and show useful messages.
 */

dotenv.config({
  path: path.resolve(__dirname, '..', '.env.local'),
  override: true,
})

const IS_PLATFORM = process.env.IS_PLATFORM

const ENVS_WITH_AUTH: Env[] = ['staging', 'production', 'dev-hosted', 'ci']

const AUTH_ENV = {
  'dev-hosted': {
    email: process.env.DEV_HOSTED_EMAIL,
    password: process.env.DEV_HOSTED_PASSWORD,
    projectRef: process.env.DEV_HOSTED_PROJECT_REF,
  },
  staging: {
    email: process.env.STAGING_EMAIL,
    password: process.env.STAGING_PASSWORD,
    projectRef: process.env.STAGING_PROJECT_REF,
  },
  production: {
    email: process.env.PRODUCTION_EMAIL,
    password: process.env.PRODUCTION_PASSWORD,
    projectRef: process.env.PRODUCTION_PROJECT_REF,
  },
  ci: {
    email: process.env.CI_EMAIL,
    password: process.env.CI_PASSWORD,
    projectRef: process.env.CI_PROJECT_REF,
  },
} as const

const envHasAuth = ENVS_WITH_AUTH.includes(ENV)

setup('Global Setup', async ({ page }) => {
  console.log(`\n 🧪 Setting up test environment.
    - Environment: ${ENV}
    - Studio URL: ${getStudioUrl()}
    - API URL: ${getApiUrl()}
    - Auth: ${envHasAuth ? 'enabled' : 'disabled'}
    - Is Platform: ${IS_PLATFORM}
    `)

  /**
   * Studio Check
   */

  const studioUrl = getStudioUrl()
  const apiUrl = getApiUrl()

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
   * Only run authentication if the environment requires it
   */
  if (!ENVS_WITH_AUTH.includes(ENV)) {
    console.log(`\n 🔑 Skipping authentication for ${ENV}`)
    return
  } else {
    const env = AUTH_ENV[ENV]
    if (!env.email || !env.password || !env.projectRef) {
      console.error(`Missing environment variables. Check README.md for more information.`)
      throw new Error('Missing environment variables')
    }
  }

  const signInUrl = `${studioUrl}/sign-in`
  console.log(`\n 🔑 Navigating to sign in page: ${signInUrl}`)

  await page.goto(signInUrl, { waitUntil: 'networkidle' })
  await page.waitForLoadState('domcontentloaded')
  await page.waitForLoadState('networkidle')

  // Check if we're still on the sign-in page
  const currentUrl = page.url()
  console.log(`\n 📍 Current URL: ${currentUrl}`)

  if (!currentUrl.includes('/sign-in')) {
    console.log('\n ⚠️ Redirected away from sign-in page. Checking if already authenticated...')

    // Check if we're already on the projects page
    if (currentUrl.includes('/projects')) {
      console.log('\n ✅ Already authenticated, proceeding with tests')
      await page.context().storageState({ path: STORAGE_STATE_PATH })
      return
    }

    // If we're redirected somewhere else, try to navigate back to sign-in
    console.log('\n 🔄 Attempting to navigate back to sign-in page')
    await page.goto(signInUrl, { waitUntil: 'networkidle' })
    await page.waitForLoadState('domcontentloaded')
    await page.waitForLoadState('networkidle')

    // Check URL again after second attempt
    const secondAttemptUrl = page.url()
    if (!secondAttemptUrl.includes('/sign-in')) {
      throw new Error(`Failed to reach sign-in page. Current URL: ${secondAttemptUrl}`)
    }
  }

  const auth = AUTH_ENV[ENV]

  expect(auth).toBeDefined()
  expect(auth.email).toBeDefined()
  expect(auth.password).toBeDefined()
  expect(auth.projectRef).toBeDefined()

  // Wait for form elements with increased timeout
  const emailInput = page.getByLabel('Email')
  const passwordInput = page.getByLabel('Password')
  const signInButton = page.getByRole('button', { name: 'Sign In' })

  // Debug element states
  console.log('\n 🔍 Checking form elements:')
  console.log(`Email input exists: ${(await emailInput.count()) > 0}`)
  console.log(`Password input exists: ${(await passwordInput.count()) > 0}`)
  console.log(`Sign in button exists: ${(await signInButton.count()) > 0}`)

  await emailInput.waitFor({ state: 'visible', timeout: 15000 })
  await passwordInput.waitFor({ state: 'visible', timeout: 15000 })
  await signInButton.waitFor({ state: 'visible', timeout: 15000 })

  await emailInput.fill(auth.email ?? '')
  await passwordInput.fill(auth.password ?? '')
  await signInButton.click()

  await page.waitForURL('**/organizations')

  await page.context().storageState({ path: STORAGE_STATE_PATH })
})
