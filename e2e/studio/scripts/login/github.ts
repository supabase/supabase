import { faker } from '@faker-js/faker'
import * as OTPAuth from 'otpauth'

import { chromium, Page } from '@playwright/test'

export interface GitHubAuthentication {
  page: Page
  githubTotp: string
  githubUser: string
  githubPass: string
  supaDashboard: string
}

// a bit too complicated to do auth with github via API, so we do authorization with GUI
const getAccessToken = async ({
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

    console.log('Waiting for organization projects to load...')
    const orgResponse = page.waitForResponse(
      (response) =>
        response.url().includes('/platform/organizations/') && response.url().includes('/projects'),
      { timeout: 30000 }
    )

    // reauthorize supabase if needed (only if we're on GitHub authorization page)
    if (page.url().includes('github.com')) {
      console.log('On GitHub authorization page, looking for Authorize button...')
      const reauthorizeButton = page.getByRole('button', { name: 'Authorize supabase' })

      try {
        await reauthorizeButton.waitFor({ state: 'visible', timeout: 10000 })
        console.log('Reauthorize button visible, clicking...')
        await reauthorizeButton.click()
        console.log('Clicked reauthorize button')
      } catch (e) {
        console.log('Reauthorize button not found or not needed:', e)
      }
    } else {
      console.log('Already redirected to Supabase, no reauthorization needed')
    }

    console.log('Redirected to:', page.url())
    console.log('Waiting for organization projects to load...')
    await orgResponse
    console.log('Organization page loaded successfully')
  } catch (e) {
    console.log(e)
  }
}

async function authenticateWithGitHub(
  { page, githubTotp, githubUser, githubPass, supaDashboard }: GitHubAuthentication,
  retries = 3
) {
  const signInUrl = `${supaDashboard}/sign-in`

  for (let i = 0; i < retries; i++) {
    await tryAuthenticate({
      page,
      githubTotp,
      githubUser,
      githubPass,
      supaDashboard: signInUrl,
    })
  }
  console.log('could not authenticate')
  throw new Error('could not authenticate')
}

async function tryAuthenticate({
  page,
  githubTotp,
  githubUser,
  githubPass,
  supaDashboard,
}: GitHubAuthentication) {
  try {
    await getAccessToken({
      page,
      githubTotp,
      githubUser,
      githubPass,
      supaDashboard,
    })
  } catch (e) {
    console.log(e)
  }
}

export { getAccessToken, authenticateWithGitHub }
