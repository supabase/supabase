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
    email: process.env.STAGING_EMAIL,
    password: process.env.STAGING_PASSWORD,
    projectRef: process.env.STAGING_PROJECT_REF,
  },
} as const

const envHasAuth = ENVS_WITH_AUTH.includes(ENV)

setup('Global Setup', async ({ page }) => {
  console.log(`\n 🧪 Setting up test environment.
    - Environment: ${ENV}
    - Studio URL: ${getStudioUrl()}
    - API URL: ${getApiUrl()}
    - Auth: ${envHasAuth ? 'enabled' : 'disabled'}
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
   * TODO:
   * Check if user is running hosted or selfhosted
   * If user is running wrong studio for tests, stop and show error
   * Not sure how to check this. - Jordi
   */

  /**
   * Only run authentication if the environment requires it
   */
  if (!ENVS_WITH_AUTH.includes(ENV)) {
    console.log(`\n 🔑 Skipping authentication for ${ENV}`)
    return
  } else {
    if (
      !process.env.STAGING_EMAIL ||
      !process.env.STAGING_PASSWORD ||
      !process.env.STAGING_PROJECT_REF
    ) {
      console.error(`Missing environment variables. Check README.md for more information.`)
      throw new Error('Missing environment variables')
    }
  }

  await page.goto('./sign-in')

  const auth = AUTH_ENV[ENV]

  expect(auth).toBeDefined()
  expect(auth.email).toBeDefined()
  expect(auth.password).toBeDefined()
  expect(auth.projectRef).toBeDefined()

  await expect(page.getByLabel('Email')).toBeVisible()
  await expect(page.getByLabel('Password')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible()

  await page.getByLabel('Email').fill(auth.email ?? '')
  await page.getByLabel('Password').fill(auth.password ?? '')
  await page.getByRole('button', { name: 'Sign In' }).click()

  await page.waitForURL('./projects')
  await page.context().storageState({ path: STORAGE_STATE_PATH })
})
