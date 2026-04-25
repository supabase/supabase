import { faker } from '@faker-js/faker'
import * as OTPAuth from 'otpauth'

import { chromium, Page } from '@playwright/test'
import { STORAGE_STATE_PATH } from '../../env.config.js'

export interface GitHubAuthentication {
  page: Page
  githubTotp: string
  githubUser: string
  githubPass: string
  supaDashboard: string
}

const loginWithGithub = async ({
  page,
  githubTotp,
  githubUser,
  githubPass,
  supaDashboard,
}: GitHubAuthentication) => {
  // GH auth always uses 2FA and it is not possible to disable it so we use TOTP
  let totp = new OTPAuth.TOTP({
    label: 'Github',
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: githubTotp,
  })

  try {
    // Mock the auth.supabase.io user endpoint that causes CORS errors
    // This allows the page to load properly and show the login buttons
    await page.route('**/auth.supabase.io/auth/v1/user', (route) => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Unauthorized' }),
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': '*',
        },
      })
    })

    // Handle CORS preflight requests
    await page.route('**/auth.supabase.io/**', (route, request) => {
      if (request.method() === 'OPTIONS') {
        route.fulfill({
          status: 204,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': '*',
          },
        })
      } else {
        route.continue()
      }
    })

    await page.goto(supaDashboard)

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle')

    try {
      console.log('Looking for "Continue with GitHub" button...')
      const button = page.locator('button:has-text("Continue with GitHub")').first()
      await button.waitFor({ state: 'visible', timeout: 10000 })
      console.log('Found button, clicking...')
      await button.click({ timeout: 5000 })
      console.log('Clicked, waiting for GitHub redirect...')
      // Wait for navigation to GitHub
      await page.waitForURL('**/github.com/**', { timeout: 10000 })
      console.log('Navigated to GitHub!')
    } catch (e) {
      console.log('Failed to find/click "Continue with GitHub", trying "Sign In with GitHub"...', e)
      const button = page.locator('button:has-text("Sign In with GitHub")').first()
      await button.waitFor({ state: 'visible', timeout: 10000 })
      await button.click({ timeout: 5000 })
      // Wait for navigation to GitHub
      await page.waitForURL('**/github.com/**', { timeout: 10000 })
    }

    console.log('Filling GitHub login form...')
    // Redirected to GitHub: interact with login form
    await page.fill('input[name="login"]', githubUser)
    await page.fill('input[name="password"]', githubPass)
    await page.click('input[name="commit"]')
    console.log('Submitted credentials, filling 2FA...')

    // Pass 2FA
    await page.fill('input[name="app_otp"]', totp.generate())
    // In case verification has not started automatically on code submission
    try {
      if (
        (await page.locator('button[type="submit"]').isVisible()) &&
        (await page.locator('button[type="submit"]').isEnabled())
      ) {
        await page.click('button[type="submit"]')
      }
    } catch (e) {
      // that may be cause by auto submit and redirect
      console.log('2FA auto-submitted or error:', e)
    }

    // Wait for redirect after 2FA - either to authorization page or directly to Supabase
    console.log('Waiting for redirect after 2FA...')
    await page.waitForURL(
      (url) => {
        const href = url.href
        // Either GitHub authorization page or redirect to Supabase
        return (
          href.includes('github.com/login/oauth/authorize') ||
          href.includes('supabase.com') ||
          href.includes('supabase.io') ||
          href.includes('supabase.green') ||
          href.includes('supabase.red')
        )
      },
      { timeout: 30000 }
    )

    // Check if we landed on GitHub authorization page by looking for the Authorize button
    console.log('Current URL after 2FA:', page.url())
    const reauthorizeButton = page.getByRole('button', { name: 'Authorize supabase' })

    // Give a short window to check if the authorize button exists
    // Use waitFor with a short timeout and catch the error if it doesn't appear
    const needsAuthorization = await reauthorizeButton
      .waitFor({ state: 'visible', timeout: 3000 })
      .then(() => true)
      .catch(() => false)

    if (needsAuthorization) {
      console.log('Authorization required, clicking Authorize button...')
      await reauthorizeButton.click()
      console.log('Clicked Authorize button, waiting for redirect to Supabase...')

      // Wait for redirect to Supabase after clicking authorize
      await page.waitForURL(
        (url) =>
          url.href.includes('supabase.com') ||
          url.href.includes('supabase.io') ||
          url.href.includes('supabase.green') ||
          url.href.includes('supabase.red'),
        { timeout: 30000 }
      )
    } else {
      console.log('No authorization needed, already on Supabase')
    }

    console.log('Redirected to:', page.url())

    // Wait for dashboard to fully load
    await Promise.race([
      page.waitForSelector('text=Organizations', { timeout: 30000 }),
      page.waitForSelector('[data-testid="project-card"]', { timeout: 30000 }),
    ]).catch(() => {
      console.log('Dashboard load indicator not found, but continuing...')
    })

    console.log('Organization page loaded successfully')

    await page.context().storageState({ path: STORAGE_STATE_PATH })
  } catch (e) {
    console.error('Authentication failed:', e)
    throw e
  }
}

export async function loginWithGithubWithRetry(
  { page, githubTotp, githubUser, githubPass, supaDashboard }: GitHubAuthentication,
  retries = 3
) {
  const signInUrl = `${supaDashboard}/sign-in`

  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Authentication attempt ${i + 1} of ${retries}...`)
      await loginWithGithub({
        page,
        githubTotp,
        githubUser,
        githubPass,
        supaDashboard: signInUrl,
      })
      console.log('Authentication successful!')
      return
    } catch (e) {
      console.log(`Attempt ${i + 1} failed:`, e)
      if (i === retries - 1) throw e
      // Optional: add a small delay before retry
      await page.waitForTimeout(2000)
    }
  }
}
