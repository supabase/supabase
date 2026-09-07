import { expect, Page } from '@playwright/test'
import { STORAGE_STATE_PATH } from '../../env.config.js'

/**
 * Authenticate user and save storage state
 */
export async function loginWithEmail(
  page: Page,
  studioUrl: string,
  credentials: { email: string; password: string }
) {
  const signInUrl = `${studioUrl}/sign-in`
  console.log(`\n 🔑 Navigating to sign in page: ${signInUrl}`)

  // Mock HCaptcha via init script
  await page.addInitScript(() => {
    ;(window as any).hcaptcha = {
      execute: async (options?: any) => {
        console.log('HCaptcha execute called (init script)', options)
        // Return HCaptcha's official test token
        return { response: '10000000-aaaa-bbbb-cccc-000000000001', key: 'mock' }
      },
      render: (container: any, options: any) => {
        console.log('HCaptcha render called (init script)', container, options)
        return 'mock-widget-id'
      },
      reset: (widgetId?: any) => {
        console.log('HCaptcha reset called (init script)', widgetId)
      },
      remove: (widgetId?: any) => {
        console.log('HCaptcha remove called (init script)', widgetId)
      },
      getResponse: (widgetId?: any) => {
        console.log('HCaptcha getResponse called (init script)', widgetId)
        return '10000000-aaaa-bbbb-cccc-000000000001'
      },
    }
  })

  // Mock HCaptcha to bypass captcha verification in automated tests
  // HCaptcha detects automated browsers and will block Playwright
  // Also fixes CORS issues with custom Vercel headers being sent to hcaptcha.com
  await page.route('**/*hcaptcha.com/**', async (route) => {
    const url = route.request().url()
    console.log(`\n 🔒 Intercepting HCaptcha request: ${url}`)

    // Mock the main hcaptcha script with a stub that auto-resolves
    if (url.includes('api.js') || url.includes('hcaptcha.js')) {
      console.log(`\n ✅ Mocking HCaptcha script`)
      await route.fulfill({
        status: 200,
        contentType: 'application/javascript',
        body: `
          console.log('HCaptcha mock loaded from route');
          window.hcaptcha = window.hcaptcha || {
            execute: async (options) => {
              console.log('HCaptcha execute called', options);
              return { response: '10000000-aaaa-bbbb-cccc-000000000001', key: 'mock' };
            },
            render: (container, options) => {
              console.log('HCaptcha render called', container, options);
              return 'mock-widget-id';
            },
            reset: (widgetId) => {
              console.log('HCaptcha reset called', widgetId);
            },
            remove: (widgetId) => {
              console.log('HCaptcha remove called', widgetId);
            },
            getResponse: (widgetId) => {
              console.log('HCaptcha getResponse called', widgetId);
              return '10000000-aaaa-bbbb-cccc-000000000001';
            }
          };
        `,
      })
    } else {
      // For other hcaptcha requests, return success
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      })
    }
  })

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

  expect(credentials.email).toBeDefined()
  expect(credentials.password).toBeDefined()

  // Wait for form elements with increased timeout
  const emailInput = page.getByLabel('Email')
  const passwordInput = page.locator('input[type="password"]')
  const signInButton = page.getByRole('button', { name: 'Sign In' })

  // if found click opt out on telemetry
  const optOutButton = page.getByRole('button', { name: 'Opt out' })
  if ((await optOutButton.count()) > 0) {
    await optOutButton.click()
  }

  // Debug element states
  console.log('\n 🔍 Checking form elements:')
  console.log(`Email input exists: ${(await emailInput.count()) > 0}`)
  console.log(`Password input exists: ${(await passwordInput.count()) > 0}`)
  console.log(`Sign in button exists: ${(await signInButton.count()) > 0}`)

  await emailInput.waitFor({ state: 'visible', timeout: 15000 })
  await passwordInput.waitFor({ state: 'visible', timeout: 15000 })
  await signInButton.waitFor({ state: 'visible', timeout: 15000 })

  // Listen for console messages to debug issues
  page.on('console', (msg) => {
    const type = msg.type()
    if (type === 'error' || type === 'warning') {
      console.log(`\n 🔍 Browser ${type}: ${msg.text()}`)
    }
  })

  // Track network requests to see what's happening
  const authRequests: string[] = []
  page.on('request', (request) => {
    const url = request.url()
    if (url.includes('auth') || url.includes('sign-in') || url.includes('password')) {
      authRequests.push(`${request.method()} ${url}`)
      console.log(`\n 📡 Auth request: ${request.method()} ${url}`)
    }
  })

  page.on('response', async (response) => {
    const url = response.url()
    if (url.includes('auth') || url.includes('sign-in') || url.includes('password')) {
      const status = response.status()
      console.log(`\n 📨 Auth response: ${status} ${url}`)
      if (status >= 400) {
        try {
          const body = await response.text()
          console.log(`\n ❌ Error response body: ${body}`)
        } catch (e) {
          // ignore
        }
      }
    }
  })

  await emailInput.fill(credentials.email)
  await passwordInput.fill(credentials.password)

  console.log(`\n 🔐 Submitting sign-in form...`)
  await signInButton.click()

  // Wait for successful sign-in by checking we've navigated away from sign-in page
  // Could redirect to /organizations, /org/[slug], /new, or /project/default depending on configuration
  try {
    await page.waitForURL((url) => !url.pathname.includes('/sign-in'), {
      timeout: 30_000,
    })
    console.log(`\n ✅ Successfully signed in, redirected to: ${page.url()}`)
  } catch (error) {
    console.log(`\n ❌ Sign-in timeout. Current URL: ${page.url()}`)
    console.log(`\n 📡 Auth requests made: ${authRequests.join(', ')}`)

    // Take a screenshot for debugging
    await page.screenshot({ path: 'test-results/sign-in-failure.png', fullPage: true })
    console.log(`\n 📸 Screenshot saved to test-results/sign-in-failure.png`)

    throw error
  }

  await page.context().storageState({ path: STORAGE_STATE_PATH })
}
